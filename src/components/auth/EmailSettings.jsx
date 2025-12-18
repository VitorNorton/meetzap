import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import {
  Camera,
  Check,
  Edit2,
  Loader2,
  LogOut,
  Mail,
  Trash2,
  User,
  X,
  AlertTriangle,
} from "lucide-react";
import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";

export default function EmailSettings({ onClose, onEmailChange }) {
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const fetchUserData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("display_name, avatar_url")
          .eq("id", user.id)
          .single();

        if (profile) {
          setUserName(profile.display_name || "");
          setAvatarUrl(profile.avatar_url || "");
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear(); // Limpa as preferências guardadas
      if (onEmailChange) onEmailChange("logout");
      onClose();
      window.location.reload(); // Recarrega para limpar estados globais
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const handleRemoveAccount = async () => {
    setIsDeleting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Remove o perfil da tabela user_profiles
        await supabase.from("user_profiles").delete().eq("id", user.id);

        // Em apps reais, a remoção do Auth precisa de uma Edge Function,
        // mas aqui garantimos que o acesso local é revogado.
        await supabase.auth.signOut();
        localStorage.clear();

        if (onEmailChange) onEmailChange("remove");
        onClose();
        window.location.reload();
      }
    } catch (error) {
      console.error("Erro ao eliminar conta:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveName = async () => {
    setIsSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase
        .from("user_profiles")
        .update({ display_name: userName })
        .eq("id", user.id);
      setIsEditingName(false);
    } catch (error) {
      console.error("Erro ao salvar nome:", error);
    } finally {
      setIsSaving(false);
    }
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
        className="w-full max-w-md bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-purple-500" /> Perfil
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-white/40 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 p-1">
                <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-white/20" />
                  )}
                </div>
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-purple-600 rounded-full text-white shadow-lg hover:bg-purple-700 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full space-y-4">
              <div className="space-y-2">
                <Label className="text-white/40 text-xs uppercase tracking-wider">
                  Email
                </Label>
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/60 flex items-center gap-3">
                  <Mail className="w-4 h-4" /> {userEmail}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/40 text-xs uppercase tracking-wider">
                  Nome de Exibição
                </Label>
                <div className="flex gap-2">
                  {isEditingName ? (
                    <>
                      <Input
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="bg-white/5 border-white/20 text-white h-11"
                        autoFocus
                      />
                      <Button
                        onClick={handleSaveName}
                        disabled={isSaving}
                        className="bg-green-600 h-11 px-3"
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white flex justify-between items-center">
                      <span>{userName || "Convidado"}</span>
                      <Edit2
                        className="w-4 h-4 text-white/20 cursor-pointer hover:text-white"
                        onClick={() => setIsEditingName(true)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            {!showConfirmDelete ? (
              <>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full h-12 rounded-2xl border-white/5 bg-white/5 text-white hover:bg-white/10"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Sair da conta
                </Button>

                <Button
                  onClick={() => setShowConfirmDelete(true)}
                  variant="ghost"
                  className="w-full h-12 text-red-500/60 hover:text-red-500 hover:bg-red-500/5"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar conta
                </Button>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-4"
              >
                <div className="flex items-center gap-2 text-red-500 font-medium text-sm">
                  <AlertTriangle className="w-4 h-4" /> Tem a certeza? Esta ação
                  é irreversível.
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowConfirmDelete(false)}
                    variant="ghost"
                    className="flex-1 text-white hover:bg-white/10"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleRemoveAccount}
                    disabled={isDeleting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Sim, Eliminar"
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

EmailSettings.propTypes = {
  onClose: PropTypes.func.isRequired,
  onEmailChange: PropTypes.func,
};
