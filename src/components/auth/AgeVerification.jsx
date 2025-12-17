import { useState } from "react";
import { Shield, Camera, CheckCircle, Loader2 } from "lucide-react"; // Removidos ícones não utilizados: AlertCircle, ArrowRight
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import PropTypes from "prop-types"; // 1. Importar PropTypes

export default function AgeVerification({ onComplete }) {
  const [step, setStep] = useState("intro");
  // Removido isUploading pois o estado 'step' já controla o fluxo visual
  const [error, setError] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5MB");
      return;
    }

    setStep("processing");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/rg_${Date.now()}.${fileExt}`;

      // 2. Removido 'uploadData' que não estava sendo usado
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          rg_photo_url: publicUrl,
          is_verified: false,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setStep("success");
      setTimeout(() => onComplete?.(), 2000);
    } catch (err) {
      console.error("Erro na verificação:", err);
      setError("Falha ao processar documento. Tente novamente.");
      setStep("intro");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
      <AnimatePresence mode="wait">
        {step === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="text-blue-500 w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Verificação de Idade
            </h2>
            <p className="text-white/60 mb-8 text-sm">
              Para garantir a segurança da comunidade, precisamos confirmar que
              você é maior de 18 anos. Envie uma foto do seu RG ou CNH.
            </p>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <div className="space-y-3">
              <label className="flex items-center justify-center w-full h-14 bg-white/10 hover:bg-white/20 text-white rounded-xl cursor-pointer transition-all border border-dashed border-white/20">
                <Camera className="mr-2 w-5 h-5" />
                Tirar Foto ou Carregar
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </motion.div>
        )}

        {step === "processing" && (
          <motion.div key="processing" className="text-center py-8">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h3 className="text-white text-lg font-medium">
              Enviando Documento...
            </h3>
            <p className="text-white/40 text-sm mt-2">
              Isso pode levar alguns segundos.
            </p>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div key="success" className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-white text-xl font-bold">
              Documento Recebido!
            </h3>
            <p className="text-white/60 text-sm">
              Seu acesso será liberado em instantes.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 3. Adicionar validação de Props
AgeVerification.propTypes = {
  onComplete: PropTypes.func.isRequired,
};
