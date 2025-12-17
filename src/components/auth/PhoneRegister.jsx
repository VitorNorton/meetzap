import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { CheckCircle, Loader2, Phone } from "lucide-react";
import { useState } from "react";
import PropTypes from "prop-types"; // 1. Importar PropTypes

export default function PhoneRegister({ onComplete }) {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
      7,
      11
    )}`;
  };

  const handlePhoneChange = (e) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSendCode = async () => {
    setError("");
    const phoneNumbers = phone.replace(/\D/g, "");

    if (phoneNumbers.length < 10) {
      setError("Digite um número de telefone válido");
      return;
    }

    setIsLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        phone: `+55${phoneNumbers}`,
      });

      if (authError) throw authError;

      setIsLoading(false);
      setStep("code");
    } catch (err) {
      console.error("Erro ao enviar código:", err);
      setError(
        "Erro ao enviar SMS. Verifique se o provedor de SMS está configurado no Supabase."
      );
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setError("");
    setIsLoading(true);
    const phoneNumbers = phone.replace(/\D/g, "");

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: `+55${phoneNumbers}`,
        token: code,
        type: "sms",
      });

      if (verifyError) throw verifyError;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("id", data.user.id)
        .single();

      if (profile?.display_name) {
        setUserName(profile.display_name);
        handleFinalize(data.user.id, profile.display_name, phoneNumbers);
      } else {
        setStep("name");
      }
    } catch {
      // 2. Removido 'err' não utilizado
      setError("Código incorreto ou expirado.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalize = (userId, name, phoneNumber) => {
    localStorage.setItem("meetzap_user_id", userId);
    localStorage.setItem("meetzap_user_name", name);
    localStorage.setItem("meetzap_verified_phone", phoneNumber);

    setStep("success");
    setTimeout(() => onComplete(phoneNumber), 1500);
  };

  const handleSaveName = async () => {
    if (userName.trim().length < 2) {
      setError("Digite um nome válido");
      return;
    }

    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const phoneNumber = phone.replace(/\D/g, "");

      await supabase.from("user_profiles").upsert({
        id: user.id,
        display_name: userName.trim(),
        is_verified: true,
      });

      handleFinalize(user.id, userName.trim(), phoneNumber);
    } catch {
      // 3. Removido 'err' não utilizado
      setError("Erro ao salvar perfil.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-sm bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Phone className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {step === "phone" && "Verificar Telefone"}
            {step === "code" && "Validar Código"}
            {step === "name" && "Seu Nome"}
            {step === "success" && "Bem-vindo!"}
          </h2>
        </div>

        {step === "phone" && (
          <div className="space-y-4">
            <Input
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(00) 00000-0000"
              className="bg-white/10 border-white/20 text-white h-12 text-center text-lg"
            />
            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
            )}
            <Button
              onClick={handleSendCode}
              disabled={isLoading}
              className="w-full h-12 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Enviar SMS"}
            </Button>
          </div>
        )}

        {step === "code" && (
          <div className="space-y-4">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              className="bg-white/10 border-white/20 text-white h-12 text-center text-2xl tracking-widest"
            />
            <Button
              onClick={handleVerifyCode}
              className="w-full h-12 bg-green-600"
            >
              Verificar
            </Button>
          </div>
        )}

        {step === "name" && (
          <div className="space-y-4">
            <Input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Como quer ser chamado?"
              className="bg-white/10 border-white/20 text-white h-12"
            />
            <Button
              onClick={handleSaveName}
              className="w-full h-12 bg-purple-600"
            >
              Finalizar
            </Button>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-white/60">Acessando...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// 4. Adicionar validação de Props
PhoneRegister.propTypes = {
  onComplete: PropTypes.func.isRequired,
};
