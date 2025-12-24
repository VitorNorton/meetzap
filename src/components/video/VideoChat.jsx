import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import {
  MessageSquare,
  Mic,
  MicOff,
  SkipForward,
  Video as VideoIcon,
  VideoOff,
  X,
} from "lucide-react";
import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
import VideoTextChat from "./VideoTextChat";

export default function VideoChat({
  sessionId,
  partnerInfo,
  myName,
  onSkip,
  onEnd,
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const peerConnection = useRef(null);
  const localStreamRef = useRef(null);
  const iceQueue = useRef([]);

  const hasSentOffer = useRef(false);
  const hasSentAnswer = useRef(false);

  const realtimeChannelRef = useRef(null);

  const parseData = useCallback((raw) => {
    try {
      if (typeof raw === "string") return JSON.parse(raw);
      return raw;
    } catch (e) {
      console.error("❌ Erro JSON:", raw, e);
      return null;
    }
  }, []);

  // ============================================================
  // ENVIAR SINAL
  // ============================================================
  const sendSignal = useCallback(
    async (type, data) => {
      if (!sessionId || !partnerInfo?.session_id) return;

      await supabase.from("VideoSignal").insert({
        from_session_id: sessionId,
        to_session_id: partnerInfo.session_id,
        type,
        data: JSON.stringify(data),
      });
    },
    [sessionId, partnerInfo?.session_id]
  );

  // ============================================================
  // RECEBER SINAL
  // ============================================================
  const handleSignal = useCallback(
    async (signal) => {
      if (!peerConnection.current) return;
      if (signal.from_session_id === sessionId) return;

      const signalData = parseData(signal.data);

      // OFFER
      if (signal.type === "offer" && !hasSentAnswer.current) {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(signalData)
        );

        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        sendSignal("answer", answer);
        hasSentAnswer.current = true;

        while (iceQueue.current.length > 0) {
          await peerConnection.current.addIceCandidate(
            iceQueue.current.shift()
          );
        }
      }

      // ANSWER
      if (signal.type === "answer") {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(signalData)
        );

        while (iceQueue.current.length > 0) {
          await peerConnection.current.addIceCandidate(
            iceQueue.current.shift()
          );
        }
      }

      // ICE
      if (signal.type === "ice") {
        const candidate = new RTCIceCandidate(signalData);

        if (peerConnection.current.remoteDescription) {
          await peerConnection.current.addIceCandidate(candidate);
        } else {
          iceQueue.current.push(candidate);
        }
      }
    },
    [parseData, sendSignal, sessionId]
  );

  // ============================================================
  // INICIAR WEBRTC
  // ============================================================
  useEffect(() => {
    if (!sessionId || !partnerInfo?.session_id) return;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        localStreamRef.current = stream;
        localVideoRef.current.srcObject = stream;

        peerConnection.current = new RTCPeerConnection(RTC_CONFIG);

        stream.getTracks().forEach((t) => {
          peerConnection.current.addTrack(t, stream);
        });

        peerConnection.current.ontrack = (event) => {
          remoteVideoRef.current.srcObject = event.streams[0];
        };

        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            sendSignal("ice", event.candidate);
          }
        };

        const channel = supabase
          .channel(`videosignal:${sessionId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "VideoSignal",
              filter: `to_session_id=eq.${sessionId}`,
            },
            (payload) => handleSignal(payload.new)
          )
          .subscribe();

        realtimeChannelRef.current = channel;

        const amCaller =
          String(sessionId).localeCompare(String(partnerInfo.session_id)) < 0;

        if (amCaller && !hasSentOffer.current) {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          sendSignal("offer", offer);
          hasSentOffer.current = true;
        }
      } catch (err) {
        console.error("❌ Erro WebRTC:", err);
      }
    };

    init();

    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerConnection.current?.close();
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [sessionId, partnerInfo?.session_id, handleSignal, sendSignal]);

  // ============================================================
  // CONTROLES
  // ============================================================
  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    track.enabled = !track.enabled;
    setIsVideoOff(!track.enabled);
  };

  if (!partnerInfo || !sessionId) return null;

  // ============================================================
  // UI
  // ============================================================
  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
        {/* REMOTE VIDEO */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* LOCAL VIDEO */}
        <div className="absolute top-6 right-6 w-32 md:w-56 aspect-video rounded-xl overflow-hidden shadow-xl border border-white/20 bg-black">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isVideoOff && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <VideoOff className="w-10 h-10 text-white/40" />
            </div>
          )}
        </div>

        {/* TEXT CHAT */}
        {showChat && (
          <div className="absolute bottom-28 left-6 z-40 w-80 max-h-[400px]">
            <VideoTextChat
              sessionId={sessionId}
              partnerSessionId={partnerInfo.session_id}
              partnerName={partnerInfo.display_name}
              myName={myName}
              setIsOpen={setShowChat}
            />
          </div>
        )}

        {/* CONTROLS */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 px-8 py-5 bg-black/40 rounded-3xl shadow-xl backdrop-blur-xl border border-white/10">
          <Button
            onClick={toggleAudio}
            size="icon"
            className={`h-12 w-12 rounded-full ${
              isMuted ? "bg-red-500" : "bg-white/10"
            }`}
          >
            {isMuted ? <MicOff /> : <Mic />}
          </Button>

          <Button
            onClick={toggleVideo}
            size="icon"
            className={`h-12 w-12 rounded-full ${
              isVideoOff ? "bg-red-500" : "bg-white/10"
            }`}
          >
            {isVideoOff ? <VideoOff /> : <VideoIcon />}
          </Button>

          <Button
            onClick={onSkip}
            className="h-14 px-10 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-lg font-bold"
          >
            <SkipForward className="mr-2" /> PRÓXIMO
          </Button>

          <Button
            size="icon"
            onClick={() => setShowChat(!showChat)}
            className={`h-12 w-12 rounded-full ${
              showChat ? "bg-purple-500" : "bg-white/10"
            }`}
          >
            <MessageSquare />
          </Button>

          <Button
            size="icon"
            variant="destructive"
            onClick={onEnd}
            className="h-12 w-12 rounded-full"
          >
            <X />
          </Button>
        </div>
      </div>
    </div>
  );
}

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

VideoChat.propTypes = {
  sessionId: PropTypes.string.isRequired,
  partnerInfo: PropTypes.object.isRequired,
  myName: PropTypes.string,
  onSkip: PropTypes.func.isRequired,
  onEnd: PropTypes.func.isRequired,
};
