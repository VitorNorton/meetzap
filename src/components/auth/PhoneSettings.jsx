import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";

export default function PhoneSettings({ onClose, onPhoneChange }) {
  const [phone, setPhone] = useState("");
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && user.phone) {
        setPhone(user.phone);
        // Tenta buscar o nome do perfil do usuário se disponível
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("display_name")
          .eq("id", user.id)
          .single();

        if (profile) setUserName(profile.display_name);
      } else {
        setPhone(localStorage.getItem("meetzap_verified_phone") || "");
        setUserName(localStorage.getItem("meetzap_user_name") || "Usuário");
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Adicionado: Função de formatação que estava faltando
  const formatPhoneDisplay = (phoneNumber) => {
    if (!phoneNumber) return "";
    const numbers = phoneNumber.replace(/\D/g, "");
    if (numbers.length >= 11) {
      return `(${numbers.slice(2, 4)}) ${numbers.slice(4, 9)}-${numbers.slice(
        9
      )}`;
    }
    return phoneNumber;
  };

  const handleRemovePhone = async () => {
    setIsRemoving(true);
    try {
      localStorage.removeItem("meetzap_verified_phone");
      setPhone("");
      onPhoneChange?.("remove");
      onClose();
    } catch (error) {
      console.error("Erro ao remover:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  // Adicionado: Função para lidar com a adição de telefone
  const handleAddPhone = () => {
    onPhoneChange?.("add");
    onClose();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 rounded-3xl border border-white/10 overflow-hidden"
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Gerenciar Telefone</h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white"
            >
              ✕
            </Button>
          </div>
        </div>

        <div className="p-6">
          {phone ? (
            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{userName}</p>
                    <p className="text-white/60 text-sm">
                      {formatPhoneDisplay(phone)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-green-400 text-xs">
                    <CheckCircle className="w-4 h-4" />
                    Verificado
                  </div>
                </div>
              </div>

              {!showConfirm ? (
                <Button
                  onClick={() => setShowConfirm(true)}
                  variant="outline"
                  className="w-full h-12 rounded-xl bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover número
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-400 font-medium">Tem certeza?</p>
                        <p className="text-red-400/80 text-sm mt-1">
                          Ao remover seu número, você perderá acesso aos seus
                          dados e pagamentos.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowConfirm(false)}
                      variant="outline"
                      className="flex-1 h-12 rounded-xl bg-white/5 border-white/20 text-white"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleRemovePhone}
                      disabled={isRemoving}
                      className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white"
                    >
                      {isRemoving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Confirmar"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                <Phone className="w-8 h-8 text-white/40" />
              </div>
              <h3 className="text-white font-medium mb-2">
                Nenhum telefone cadastrado
              </h3>
              <p className="text-white/60 text-sm mb-6">
                Adicione um número para realizar pagamentos
              </p>
              <Button
                onClick={handleAddPhone}
                className="h-12 px-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar número
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

PhoneSettings.propTypes = {
  onClose: PropTypes.func.isRequired,
  onPhoneChange: PropTypes.func,
};
