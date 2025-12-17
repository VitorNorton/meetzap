import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import PropTypes from "prop-types"; // 1. Importar PropTypes
import { supabase } from "@/lib/supabaseClient";

export default function ProfileSetup({ onComplete, existingProfile }) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: existingProfile?.display_name || "",
    full_legal_name: existingProfile?.full_legal_name || "",
    rg_number: existingProfile?.rg_number || "",
    rg_photo_url: existingProfile?.rg_photo_url || "",
    birth_date: existingProfile?.birth_date || "",
    gender: existingProfile?.gender || "",
    bio: existingProfile?.bio || "",
    avatar_url: existingProfile?.avatar_url || "",
    country: existingProfile?.country || "",
    city: existingProfile?.city || "",
  });

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Utilizador não autenticado no Supabase");
      }

      const { error } = await supabase.from("user_profiles").upsert({
        id: user.id,
        display_name: formData.display_name,
        full_legal_name: formData.full_legal_name,
        rg_number: formData.rg_number,
        rg_photo_url: formData.rg_photo_url,
        birth_date: formData.birth_date,
        gender: formData.gender,
        bio: formData.bio,
        avatar_url: formData.avatar_url,
        country: formData.country,
        city: formData.city,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      localStorage.setItem("meetzap_user_name", formData.display_name);
      onComplete?.();
    } catch (err) {
      console.error("Erro ao salvar perfil no Supabase:", err);
      alert(
        "Erro ao salvar os dados. Verifique se as tabelas existem no seu Supabase."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Configurar Perfil</h2>
            <p className="text-white/40 text-sm">Passo {step} de 6</p>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className={cn(
                  "w-8 h-1.5 rounded-full transition-all",
                  step >= i ? "bg-purple-500" : "bg-white/10"
                )}
              />
            ))}
          </div>
        </div>

        <div className="p-8">
          {step === 1 && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label className="text-white/80">
                  Como as pessoas te verão?
                </Label>
                <Input
                  value={formData.display_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      display_name: e.target.value,
                    }))
                  }
                  placeholder="Seu apelido ou nome"
                  className="bg-white/5 border-white/10 text-white h-14 rounded-xl text-lg focus:ring-purple-500"
                />
              </div>
              <Button
                onClick={nextStep}
                disabled={!formData.display_name}
                className="w-full h-14 rounded-xl bg-purple-600 hover:bg-purple-700"
              >
                Próximo
              </Button>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label className="text-white/80">Sua Bio (Opcional)</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  placeholder="Conte algo sobre você..."
                  className="bg-white/5 border-white/10 text-white rounded-xl min-h-[120px]"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={prevStep}
                  variant="ghost"
                  className="flex-1 h-14 text-white hover:bg-white/10"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 h-14 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 font-bold"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="mr-2" /> Finalizar
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {step > 1 && step < 6 && (
            <div className="text-center">
              <p className="text-white mb-4">Conteúdo do Passo {step}</p>
              <div className="flex gap-2">
                <Button onClick={prevStep} className="flex-1">
                  Voltar
                </Button>
                <Button onClick={nextStep} className="flex-1">
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// 2. Adicionar validação de Props completa
ProfileSetup.propTypes = {
  onComplete: PropTypes.func,
  existingProfile: PropTypes.shape({
    display_name: PropTypes.string,
    full_legal_name: PropTypes.string,
    rg_number: PropTypes.string,
    rg_photo_url: PropTypes.string,
    birth_date: PropTypes.string,
    gender: PropTypes.string,
    bio: PropTypes.string,
    avatar_url: PropTypes.string,
    country: PropTypes.string,
    city: PropTypes.string,
  }),
};
