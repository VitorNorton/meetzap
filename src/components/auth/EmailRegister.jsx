import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
  ArrowLeft,
} from "lucide-react";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";

export default function EmailRegister({
  onComplete,
  onBack,
  initialMode = "signup",
}) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [isLogin, setIsLogin] = useState(initialMode === "login");

  useEffect(() => {
    setIsLogin(initialMode === "login");
  }, [initialMode]);

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password,
    });

    if (authError) {
      setError("E-mail ou senha incorretos.");
      setIsLoading(false);
      return;
    }

    localStorage.setItem("meetzap_user_id", data.user.id);
    localStorage.setItem("meetzap_verified_email", data.user.email);

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name")
      .eq("id", data.user.id)
      .single();

    if (profile?.display_name) {
      localStorage.setItem("meetzap_user_name", profile.display_name);
    }

    setStep("success");
    setTimeout(() => onComplete(data.user.email), 1500);
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (!userName.trim()) {
      setError("Por favor, insira um nome.");
      return;
    }

    setIsLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password: password,
      options: {
        data: {
          display_name: userName,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }

    await supabase
      .from("user_profiles")
      .upsert([{ id: data.user.id, display_name: userName }]);

    localStorage.setItem("meetzap_user_id", data.user.id);
    localStorage.setItem("meetzap_verified_email", data.user.email);
    localStorage.setItem("meetzap_user_name", userName);

    setStep("success");
    setTimeout(() => onComplete(data.user.email), 1500);
  };

  return (
    // Fundo degradê idêntico ao da Home para manter a consistência visual
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#1a0b2e]/80 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          <button
            onClick={onBack}
            className="mb-4 text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {step === "email" && (
            <>
              {/* Ícone de Email no topo (como no seu print) */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Mail className="w-8 h-8 text-white" />
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {isLogin ? "Bem-vindo de volta" : "Criar sua conta"}
                </h2>
                <p className="text-white/40">
                  {isLogin
                    ? "Entre para continuar no MeetZap"
                    : "Junte-se a milhares de pessoas agora"}
                </p>
              </div>

              <div className="space-y-4 mb-6">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label className="text-white font-semibold ml-1">
                      Nome de exibição
                    </Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                      <Input
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Como quer ser chamado?"
                        className="h-14 pl-12 bg-white/5 border-white/10 text-white rounded-xl focus:ring-purple-500"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-white font-semibold ml-1">
                    E-mail
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="h-14 pl-12 bg-white/5 border-white/10 text-white rounded-xl focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white font-semibold ml-1">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-14 pl-12 pr-12 bg-white/5 border-white/10 text-white rounded-xl focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label className="text-white font-semibold ml-1">
                      Confirmar Senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita sua senha"
                        className="h-14 pl-12 bg-white/5 border-white/10 text-white rounded-xl focus:ring-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center mb-4 bg-red-400/10 py-2 rounded-lg border border-red-400/20">
                  {error}
                </p>
              )}

              <Button
                onClick={isLogin ? handleLogin : handleRegister}
                disabled={isLoading || !email || !password}
                className="w-full h-14 bg-purple-600/80 hover:bg-purple-600 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : isLogin ? (
                  "Entrar"
                ) : (
                  "Criar Conta"
                )}
              </Button>

              <button
                onClick={() => setIsLogin(!isLogin)}
                className="w-full mt-8 text-white/40 text-sm hover:text-white transition-colors"
              >
                {isLogin
                  ? "Não tem conta? Cadastre-se"
                  : "Já tem uma conta? Entre aqui"}
              </button>
            </>
          )}

          {step === "success" && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
              <h3 className="text-white text-xl font-bold">Sucesso!</h3>
              <p className="text-white/60">Bem-vindo ao MeetZap!</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

EmailRegister.propTypes = {
  onComplete: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  initialMode: PropTypes.oneOf(["login", "signup"]),
};
