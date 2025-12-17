import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types"; // 1. Importar PropTypes

export default function VideoTextChat({
  sessionId,
  myId,
  myName,
  isOpen,
  setIsOpen,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;

    const fetchMessages = async () => {
      const { data: msgs, error } = await supabase
        .from("ChatMessage")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_date", { ascending: true })
        .limit(50);

      if (error) {
        console.error("Erro ao buscar mensagens:", error);
        return;
      }

      // 2. Correção da lógica de unreadCount usando o estado anterior (prev)
      // Isso remove a necessidade de 'messages' como dependência do useEffect
      setMessages((prevMessages) => {
        if (!isOpen && msgs.length > prevMessages.length) {
          const newMsgsCount = msgs.filter(
            (m) =>
              m.sender_id !== myId && !prevMessages.find((pm) => pm.id === m.id)
          ).length;
          if (newMsgsCount > 0) setUnreadCount((count) => count + newMsgsCount);
        }
        return msgs;
      });
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [sessionId, isOpen, myId]); // Removido messages.length para evitar avisos e loops

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !sessionId) return;

    const { error } = await supabase.from("ChatMessage").insert([
      {
        session_id: sessionId,
        sender_id: myId,
        sender_name: myName || "Anônimo",
        message: newMessage.trim(),
        created_date: new Date().toISOString(),
      },
    ]);

    if (!error) setNewMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="absolute bottom-32 left-4 right-4 md:left-4 md:right-auto md:w-80 h-80 bg-black/70 backdrop-blur-xl rounded-2xl border border-white/20 flex flex-col overflow-hidden z-30"
        >
          <div className="flex items-center justify-between p-3 border-b border-white/10">
            <span className="text-white font-medium text-sm">
              Chat {unreadCount > 0 && `(${unreadCount})`}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <div className="text-center text-white/40 text-sm py-8">
                Envie uma mensagem para começar
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2",
                  msg.sender_id === myId
                    ? "ml-auto bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                    : "bg-white/10 text-white"
                )}
              >
                {msg.sender_id !== myId && (
                  <p className="text-xs text-white/60 mb-1">
                    {msg.sender_name}
                  </p>
                )}
                <p className="text-sm break-words">{msg.message}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-white/10">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite algo..."
                className="flex-1 h-10 bg-white/10 border-white/20 text-white rounded-xl text-sm"
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                size="icon"
                className="h-10 w-10 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 3. Adicionar as validações de Props
VideoTextChat.propTypes = {
  sessionId: PropTypes.string,
  myId: PropTypes.string.isRequired,
  myName: PropTypes.string,
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
};
