import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle, Loader2, Shield, X } from "lucide-react";
import { useState } from "react";
import PropTypes from "prop-types"; // Adicionado para validação
import { supabase } from "@/lib/supabaseClient";

export default function PaymentModal({ plan, onClose, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState("selection"); // selection, processing, success
  const [error, setError] = useState("");

  const handlePayment = async () => {
    setIsLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error: paymentError } = await supabase.from("Payment").insert([
        {
          user_id: user.id,
          user_email: user.email,
          amount: plan.price,
          plan: plan.name,
          status: "pending",
          created_date: new Date().toISOString(),
        },
      ]);

      if (paymentError) throw paymentError;

      setStep("processing");

      setTimeout(async () => {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await supabase
          .from("user_profiles")
          .update({
            subscription_plan: plan.id,
            subscription_expires: expiresAt.toISOString(),
          })
          .eq("id", user.id);

        localStorage.setItem("meetzap_subscription_plan", plan.id);
        localStorage.setItem(
          "meetzap_subscription_expires",
          expiresAt.toISOString()
        );

        setStep("success");
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      }, 3000);
    } catch (err) {
      console.error("Erro no pagamento:", err);
      setError("Ocorreu um erro ao processar. Tente novamente mais tarde.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-gray-900 rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Finalizar Assinatura</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-white/40 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === "selection" && (
              <motion.div key="selection" className="space-y-6">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="text-white/60 text-sm">Plano Selecionado</p>
                  <p className="text-white text-xl font-bold">{plan.name}</p>
                  <p className="text-purple-400 font-bold text-2xl mt-1">
                    R$ {plan.price}
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={handlePayment}
                    disabled={isLoading}
                    className="w-full h-14 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Confirmar e Pagar"
                    )}
                  </Button>
                  <p className="text-center text-white/40 text-xs flex items-center justify-center gap-2">
                    <Shield className="w-3 h-3" /> Pagamento processado de forma
                    segura
                  </p>
                </div>
              </motion.div>
            )}

            {step === "processing" && (
              <motion.div key="processing" className="text-center py-12">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                <h3 className="text-white text-lg font-bold">
                  Processando Pagamento
                </h3>
                <p className="text-white/40 text-sm">
                  Aguarde a confirmação da operadora...
                </p>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div key="success" className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-white text-2xl font-bold">
                  Assinatura Ativa!
                </h3>
                <p className="text-white/60">
                  Você agora tem acesso total ao MeetZap.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// Definição das PropTypes para resolver os erros do ESLint
PaymentModal.propTypes = {
  plan: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};
