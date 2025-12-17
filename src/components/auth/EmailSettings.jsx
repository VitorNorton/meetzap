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
} from "lucide-react";
import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";

export default function EmailSettings({ onClose }) {
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Carregar dados iniciais do perfil
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
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Função para salvar novo nome
  const handleUpdateName = async () => {
    setIsSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("user_profiles")
        .update({ display_name: userName })
        .eq("id", user.id);

      if (error) throw error;
      setIsEditingName(false);
    } catch {
      alert("Erro ao atualizar nome.");
    } finally {
      setIsSaving(false);
    }
  };

  // Função para upload de foto de perfil
  const uploadAvatar = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // 1. Upload para o bucket 'avatars' (certifique-se que o bucket existe no Supabase)
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Pegar URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // 3. Atualizar tabela user_profiles
      await supabase
        .from("user_profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      setAvatarUrl(publicUrl);
    } catch {
      alert("Erro ao carregar imagem!");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#1a1625] rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Configurações</h2>
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
          {/* Foto de Perfil */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-2 border-purple-500/50 overflow-hidden bg-white/5">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    <User className="w-10 h-10" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full cursor-pointer hover:bg-purple-700 transition-colors shadow-lg">
                {uploading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={uploadAvatar}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            {/* Campo de E-mail */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <Mail className="w-5 h-5 text-white/40" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">
                  E-mail
                </p>
                <p className="text-white truncate text-sm">{userEmail}</p>
              </div>
            </div>

            {/* Nome Editável */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-2">
              <Label className="text-white/40 text-[10px] uppercase font-bold tracking-wider">
                Nome de Exibição
              </Label>
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <>
                    <Input
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="bg-white/5 border-purple-500/50 text-white h-10 rounded-xl"
                      autoFocus
                    />
                    <Button
                      onClick={handleUpdateName}
                      disabled={isSaving}
                      size="icon"
                      className="bg-green-600 hover:bg-green-700 h-10 w-10 shrink-0"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-white font-medium flex-1 pl-1">
                      {userName || "Convidado"}
                    </p>
                    <Button
                      onClick={() => setIsEditingName(true)}
                      variant="ghost"
                      size="icon"
                      className="text-white/40 hover:text-white h-10 w-10"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full h-12 rounded-2xl border-white/5 bg-white/5 text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" /> Sair da conta
            </Button>

            <Button
              variant="ghost"
              className="w-full h-12 text-red-500/60 hover:text-red-500 hover:bg-red-500/5"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Eliminar conta
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

EmailSettings.propTypes = {
  onClose: PropTypes.func.isRequired,
};
