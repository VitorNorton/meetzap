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
  ArrowLeft, // Adicionado ícone da seta
} from "lucide-react";
import { useState } from "react";
import PropTypes from "prop-types";

export default function EmailRegister({ onComplete, onBack }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLogin, setIsLogin] = useState(false);

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
    localStorage.setItem(
      "meetzap_user_name",
      data.user.user_metadata?.display_name || ""
    );

    setStep("success");
    setTimeout(() => {
      onComplete(data.user.email);
    }, 2000);
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      setIsLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signUp({
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

    setStep("success");
    setTimeout(() => {
      onComplete(email);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl relative"
      >
        {/* SETA BRANCA DE VOLTAR */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
              <Mail className="text-white w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isLogin ? "Bem-vindo de volta" : "Criar sua conta"}
            </h2>
            <p className="text-white/40 text-sm mt-1">
              {isLogin
                ? "Entre para continuar no MeetZap"
                : "Junte-se a milhares de pessoas agora"}
            </p>
          </div>

          {step === "email" && (
            <>
              <div className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label className="text-white/60 ml-1">
                      Nome de exibição
                    </Label>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 h-5 w-5 text-white/20" />
                      <Input
                        placeholder="Como quer ser chamado?"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="bg-white/5 border-white/10 text-white pl-12 h-12 rounded-xl focus:ring-purple-500"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-white/60 ml-1">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-white/20" />
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white/5 border-white/10 text-white pl-12 h-12 rounded-xl focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/60 ml-1">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-white/20" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white/5 border-white/10 text-white pl-12 pr-12 h-12 rounded-xl focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-white/20 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label className="text-white/60 ml-1">
                      Confirmar Senha
                    </Label>
                    <Input
                      type="password"
                      placeholder="Repita sua senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-purple-500"
                    />
                  </div>
                )}
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center font-medium bg-red-400/10 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <Button
                onClick={isLogin ? handleLogin : handleRegister}
                disabled={isLoading || !email || !password}
                className="w-full h-14 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
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
                className="w-full text-white/40 text-sm hover:text-white transition-colors"
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
};
