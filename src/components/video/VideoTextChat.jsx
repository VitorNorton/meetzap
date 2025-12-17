import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, X, ChevronDown } from "lucide-react";

export default function VideoTextChat({
  sessionId,
  partnerName,
  myName,
  myId,
  setIsOpen,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Escutar mensagens em tempo real
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ChatMessage",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setMessages((prev) => {
            // Evita duplicados se a mensagem for do próprio usuário
            if (prev.find((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    // Carregar histórico inicial
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("ChatMessage")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };

    fetchMessages();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !sessionId) return;

    const messageData = {
      session_id: sessionId,
      sender_id: myId,
      sender_name: myName,
      text: newMessage.trim(),
    };

    setNewMessage(""); // Limpa o input imediatamente

    const { error } = await supabase.from("ChatMessage").insert([messageData]);
    if (error) console.error("Erro ao enviar mensagem:", error);
  };

  return (
    <div className="flex flex-col h-full bg-black/60 backdrop-blur-xl border-l border-white/10 text-white overflow-hidden rounded-t-3xl md:rounded-none">
      {/* Header do Chat */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div>
          <h3 className="font-bold text-sm">
            Chat com {partnerName || "Parceiro"}
          </h3>
          <p className="text-[10px] text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />{" "}
            Ao vivo
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/10 rounded-full"
        >
          <ChevronDown className="md:hidden" />
          <X className="hidden md:block w-4 h-4" />
        </Button>
      </div>

      {/* Lista de Mensagens */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        {messages.map((msg, index) => {
          const isMe = msg.sender_id === myId;
          return (
            <div
              key={msg.id || index}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <span className="text-[10px] text-white/40 mb-1 px-1">
                {isMe ? "Você" : msg.sender_name || "Parceiro"}
              </span>
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  isMe
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-tr-none"
                    : "bg-white/10 text-white rounded-tl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input de Mensagem */}
      <form
        onSubmit={sendMessage}
        className="p-4 bg-white/5 border-t border-white/10 flex gap-2"
      >
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite algo..."
          className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-11 rounded-xl focus-visible:ring-purple-500"
        />
        <Button
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-purple-500 hover:bg-purple-600 h-11 w-11 p-0 rounded-xl shrink-0 transition-transform active:scale-90"
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
}

VideoTextChat.propTypes = {
  sessionId: PropTypes.string.isRequired,
  partnerName: PropTypes.string,
  myName: PropTypes.string,
  myId: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
};
