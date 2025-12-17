import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Adicionado
import { Label } from "@/components/ui/label"; // Adicionado
import { supabase } from "@/lib/supabaseClient";
import {
  Camera,
  Loader2,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react"; // Adicionados ícones faltando
import { useState } from "react";
import { motion } from "framer-motion"; // Adicionado
import PropTypes from "prop-types"; // Adicionado para validação

export default function DocumentVerification({
  onComplete,
  formData,
  setFormData,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(""); // Adicionado estado que faltava

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(""); // Limpa erro anterior
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage // Removido 'data' não utilizado
        .from("documents")
        .upload(fileName, file);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, rg_photo_url: publicUrl }));
    } catch {
      // Removido 'err' não utilizado
      setUploadError("Erro ao carregar documento.");
    } finally {
      setIsUploading(false);
    }
  };

  const formatRG = (value) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 9) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, "$1.$2.$3-$4");
    }
    return numbers
      .slice(0, 9)
      .replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, "$1.$2.$3-$4");
  };

  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return numbers
      .slice(0, 11)
      .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const isValid =
    formData.full_legal_name?.length >= 5 &&
    formData.rg_number?.replace(/\D/g, "").length >= 7 &&
    formData.rg_photo_url;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">
          Verificação de Identidade
        </h2>
        <p className="text-white/60 mt-2">
          Para sua segurança, precisamos verificar seu documento
        </p>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-200 text-sm font-medium">
              Documento obrigatório
            </p>
            <p className="text-amber-200/70 text-xs mt-1">
              Seus dados são protegidos e usados apenas para verificação de
              identidade.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-white/80">Nome completo (como no RG)</Label>
          <Input
            value={formData.full_legal_name || ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                full_legal_name: e.target.value,
              }))
            }
            placeholder="Nome completo conforme documento"
            className="h-14 bg-white/10 border-white/20 text-white rounded-xl"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-white/80">Número do RG</Label>
            <Input
              value={formData.rg_number || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  rg_number: formatRG(e.target.value),
                }))
              }
              placeholder="00.000.000-0"
              className="h-14 bg-white/10 border-white/20 text-white rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">Órgão emissor</Label>
            <Input
              value={formData.rg_issuer || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  rg_issuer: e.target.value.toUpperCase(),
                }))
              }
              placeholder="SSP/SP"
              className="h-14 bg-white/10 border-white/20 text-white rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-white/80">CPF (opcional)</Label>
          <Input
            value={formData.cpf || ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                cpf: formatCPF(e.target.value),
              }))
            }
            placeholder="000.000.000-00"
            className="h-14 bg-white/10 border-white/20 text-white rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white/80">Foto do documento (frente)</Label>
          <div className="relative">
            {formData.rg_photo_url ? (
              <div className="relative rounded-xl overflow-hidden border-2 border-green-500/50">
                <img
                  src={formData.rg_photo_url}
                  alt="Documento"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="text-white text-sm">Trocar foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleDocumentUpload}
                  />
                </label>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer transition-all">
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-10 h-10 text-white/40 mb-3" />
                    <span className="text-white/60 text-sm">
                      Clique para enviar foto do RG
                    </span>
                    <span className="text-white/40 text-xs mt-1">
                      JPG, PNG até 10MB
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleDocumentUpload}
                />
              </label>
            )}
            {uploadError && (
              <p className="text-red-400 text-sm mt-2">{uploadError}</p>
            )}
          </div>
        </div>
      </div>

      <Button
        onClick={onComplete}
        disabled={!isValid}
        className="w-full h-14 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50"
      >
        Continuar
      </Button>
    </motion.div>
  );
}

DocumentVerification.propTypes = {
  onComplete: PropTypes.func.isRequired,
  setFormData: PropTypes.func.isRequired,
  formData: PropTypes.shape({
    full_legal_name: PropTypes.string,
    rg_number: PropTypes.string,
    rg_issuer: PropTypes.string,
    cpf: PropTypes.string,
    rg_photo_url: PropTypes.string,
  }).isRequired,
};
