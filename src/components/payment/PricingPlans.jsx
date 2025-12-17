import React from 'react';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { 
  Crown, 
  Sparkles, 
  Check, 
  X, 
  Zap
} from 'lucide-react';
import { cn } from "@/lib/utils";

const plans = [
  {
    id: 'free',
    name: 'Grátis',
    price: 0,
    period: '',
    color: 'from-gray-500 to-gray-600',
    features: [
      { text: 'Acesso a pulos ilimitados', included: false },
      { text: 'Tempo ilimitado', included: false },
      { text: 'Sem anúncios', included: false },
      { text: 'Acesso em todas as plataformas', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 29.90,
    period: '/mês',
    color: 'from-purple-500 to-pink-500',
    popular: true,
    features: [
      { text: 'Acesso a pulos ilimitados', included: true },
      { text: 'Tempo ilimitado', included: true },
      { text: 'Sem anúncios', included: true },
      { text: 'Acesso em todas as plataformas', included: true },
    ],
  },
];



export default function PricingPlans({ currentPlan, onSelectPlan, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 rounded-3xl border border-white/10"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-xl p-6 border-b border-white/10 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-500" />
                Seja Premium
              </h2>
              <p className="text-white/60 mt-1">Desbloqueie recursos exclusivos</p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="rounded-full text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

        </div>

        <div className="p-6">
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "relative rounded-2xl p-6 border transition-all duration-300",
                    plan.popular 
                      ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/50 scale-105" 
                      : "bg-white/5 border-white/10 hover:border-white/20",
                    currentPlan === plan.id && "ring-2 ring-green-500"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold">
                      MAIS POPULAR
                    </div>
                  )}

                  {currentPlan === plan.id && (
                    <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-bold">
                      ATUAL
                    </div>
                  )}

                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-r flex items-center justify-center mb-4",
                    plan.color
                  )}>
                    {plan.id === 'free' && <Zap className="w-6 h-6 text-white" />}
                    {plan.id === 'premium' && <Crown className="w-6 h-6 text-white" />}
                  </div>

                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <div className="mt-2 mb-6">
                    <span className="text-3xl font-bold text-white">
                      {plan.price === 0 ? 'R$ 0' : `R$ ${plan.price.toFixed(2).replace('.', ',')}`}
                    </span>
                    <span className="text-white/60">{plan.period}</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-white/30 flex-shrink-0" />
                        )}
                        <span className={feature.included ? "text-white/90" : "text-white/40"}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => onSelectPlan(plan)}
                    disabled={currentPlan === plan.id}
                    className={cn(
                      "w-full h-12 rounded-xl font-semibold transition-all",
                      plan.id === 'free' 
                        ? "bg-white/10 hover:bg-white/20 text-white"
                        : `bg-gradient-to-r ${plan.color} hover:opacity-90 text-white`
                    )}
                  >
                    {currentPlan === plan.id ? 'Plano Atual' : plan.price === 0 ? 'Usar Grátis' : 'Assinar Agora'}
                  </Button>
                </motion.div>
              ))}
            </div>
        </div>
      </motion.div>
    </div>
  );
}