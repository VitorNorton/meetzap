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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const iceCandidatesQueue = useRef([]);

  const rtcConfig = useMemo(
    () => ({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ],
    }),
    []
  );

  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    }
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoOff(!track.enabled);
    }
  };

  const sendSignal = useCallback(
    async (type, data) => {
      if (!sessionId || !partnerInfo?.id) return;
      await supabase.from("VideoSignal").insert({
        from_session_id: sessionId,
        to_session_id: partnerInfo.id,
        type,
        data,
      });
    },
    [sessionId, partnerInfo?.id]
  );

  const handleIncomingSignal = useCallback(
    async (signal) => {
      if (!peerConnection.current) return;
      if (signal.from_session_id === sessionId) return;

      const { type, data } = signal;

      try {
        if (type === "offer") {
          if (peerConnection.current.signalingState !== "stable") return;

          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(data)
          );

          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          sendSignal("answer", answer);

          while (iceCandidatesQueue.current.length) {
            await peerConnection.current.addIceCandidate(
              iceCandidatesQueue.current.shift()
            );
          }
        } else if (type === "answer") {
          if (peerConnection.current.signalingState === "have-local-offer") {
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(data)
            );

            while (iceCandidatesQueue.current.length) {
              await peerConnection.current.addIceCandidate(
                iceCandidatesQueue.current.shift()
              );
            }
          }
        } else if (type === "ice") {
          const candidate = new RTCIceCandidate({
            candidate: data.candidate,
            sdpMid: data.sdpMid,
            sdpMLineIndex: data.sdpMLineIndex,
          });

          if (peerConnection.current.remoteDescription) {
            await peerConnection.current.addIceCandidate(candidate);
          } else {
            iceCandidatesQueue.current.push(candidate);
          }
        }
      } catch (err) {
        console.error("Erro no signaling:", err);
      }
    },
    [sendSignal, sessionId]
  );

  useEffect(() => {
    if (!sessionId || !partnerInfo?.id) return;

    let channel;

    const initWebRTC = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      peerConnection.current = new RTCPeerConnection(rtcConfig);

      stream
        .getTracks()
        .forEach((track) => peerConnection.current.addTrack(track, stream));

      peerConnection.current.ontrack = (e) => {
        if (remoteVideoRef.current)
          remoteVideoRef.current.srcObject = e.streams[0];
      };

      peerConnection.current.onicecandidate = (e) => {
        if (e.candidate) sendSignal("ice", e.candidate);
      };

      channel = supabase
        .channel(`signals:${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "VideoSignal",
            filter: `to_session_id=eq.${sessionId}`,
          },
          (payload) => handleIncomingSignal(payload.new)
        )
        .subscribe();

      const isCaller = sessionId.localeCompare(partnerInfo.id) < 0;

      if (isCaller) {
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        sendSignal("offer", offer);
      }
    };

    initWebRTC();

    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (channel) supabase.removeChannel(channel);
      peerConnection.current?.close();
    };
  }, [sessionId, partnerInfo, rtcConfig, sendSignal, handleIncomingSignal]);

  if (!partnerInfo || !sessionId) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
        {/* VÍDEO REMOTO (TELA TODA) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* VÍDEO LOCAL (FLUTUANTE) */}
        <div className="absolute top-6 right-6 w-32 md:w-56 aspect-video bg-black rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl z-20">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isVideoOff && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="text-white/40 w-10 h-10" />
            </div>
          )}
        </div>

        {/* CHAT FLUTUANTE */}
        {showChat && (
          <div className="absolute bottom-28 left-6 z-40 w-80 max-h-[400px] shadow-2xl">
            <VideoTextChat
              sessionId={sessionId}
              partnerName={partnerInfo?.display_name || "Parceiro"}
              myName={myName}
              myId={sessionId}
              isOpen={showChat}
              setIsOpen={setShowChat}
            />
          </div>
        )}

        {/* CONTROLES */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 px-8 py-5 bg-black/40 backdrop-blur-3xl rounded-3xl border border-white/10 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleAudio}
            className={`rounded-full h-12 w-12 ${
              isMuted ? "bg-red-500" : "bg-white/10 hover:bg-white/20"
            }`}
          >
            {isMuted ? <MicOff /> : <Mic />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleVideo}
            className={`rounded-full h-12 w-12 ${
              isVideoOff ? "bg-red-500" : "bg-white/10 hover:bg-white/20"
            }`}
          >
            {isVideoOff ? <VideoOff /> : <VideoIcon />}
          </Button>

          <Button
            onClick={onSkip}
            className="h-14 px-10 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold text-white shadow-xl hover:scale-105 transition-all"
          >
            <SkipForward className="mr-2 h-5 w-5" /> PRÓXIMO
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowChat(!showChat)}
            className={`rounded-full h-12 w-12 ${
              showChat ? "bg-purple-500" : "bg-white/10 hover:bg-white/20"
            }`}
          >
            <MessageSquare />
          </Button>

          <Button
            variant="destructive"
            size="icon"
            onClick={onEnd}
            className="rounded-full h-12 w-12 shadow-lg"
          >
            <X />
          </Button>
        </div>
      </div>
    </div>
  );
}

VideoChat.propTypes = {
  sessionId: PropTypes.string.isRequired,
  partnerInfo: PropTypes.shape({
    id: PropTypes.string.isRequired,
    display_name: PropTypes.string,
  }).isRequired,
  myName: PropTypes.string,
  onSkip: PropTypes.func.isRequired,
  onEnd: PropTypes.func.isRequired,
};
