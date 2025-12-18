import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { X, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import PropTypes from "prop-types"; // 1. Adicionado import de PropTypes

export default function TermsOfUse({ onAccept, onDecline }) {
  const [canAccept, setCanAccept] = useState(false);
  const scrollRef = useRef(null);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Permite aceitar quando rolar até 90% do conteúdo
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setCanAccept(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 rounded-3xl border border-white/10 overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 shrink-0">
          <h2 className="text-xl font-bold text-white text-center">
            Termos de Uso – MeetZap
          </h2>
          <p className="text-white/60 text-sm text-center mt-2">
            Arraste para baixo para ler e aceitar
          </p>
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {/* Aviso Importante */}
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4">
            <h3 className="text-yellow-400 font-bold mb-2">
              ⚠️ Aviso Importante
            </h3>
            <p className="text-yellow-400/90 text-sm">
              Ao criar conta, você recebe{" "}
              <strong>48 horas de teste gratuito</strong>.
            </p>
            <p className="text-yellow-400/90 text-sm mt-2">
              Após esse período, a assinatura mensal será cobrada
              automaticamente, salvo cancelamento antes do fim do teste.
            </p>
          </div>

          {/* 1. Uso de Câmera */}
          <div>
            <h3 className="text-white font-semibold mb-2">
              1. Uso de Câmera, Microfone e Imagem
            </h3>
            <ul className="text-white/70 text-sm space-y-2">
              <li>• O app pode acessar sua câmera e microfone.</li>
              <li>
                • Fotos, vídeos e áudios enviados podem ser armazenados e
                processados internamente.
              </li>
              <li>
                • Sua imagem não será usada para fins comerciais sem
                autorização.
              </li>
            </ul>
          </div>

          {/* 2. Dados Pessoais */}
          <div>
            <h3 className="text-white font-semibold mb-2">2. Dados Pessoais</h3>
            <ul className="text-white/70 text-sm space-y-2">
              <li>
                • Coletamos dados como nome, e-mail, uso do app e arquivos
                enviados.
              </li>
              <li>
                • Os dados são tratados conforme a LGPD e usados apenas para
                funcionamento do serviço.
              </li>
              <li>
                •{" "}
                <strong className="text-white">Não vendemos seus dados.</strong>
              </li>
            </ul>
          </div>

          {/* 3. Assinatura */}
          <div>
            <h3 className="text-white font-semibold mb-2">3. Assinatura</h3>
            <ul className="text-white/70 text-sm space-y-2">
              <li>
                • A assinatura é mensal e renova automaticamente até ser
                cancelada.
              </li>
              <li>
                • Cancelamento pode ser feito pelo app ou pela loja de
                aplicativos.
              </li>
            </ul>
          </div>

          {/* 4. Condutas */}
          <div>
            <h3 className="text-white font-semibold mb-2">
              4. Condutas do Usuário
            </h3>
            <p className="text-white/70 text-sm">
              Você deve usar o app de forma legal, manter seus dados corretos e
              proteger sua senha.
            </p>
          </div>

          {/* Scroll indicator */}
          {!canAccept && (
            <div className="flex flex-col items-center pt-4 animate-bounce">
              <ChevronDown className="w-6 h-6 text-white/40" />
              <span className="text-white/40 text-xs">Continue rolando</span>
            </div>
          )}
        </div>

        {/* Footer with buttons */}
        <div className="p-6 border-t border-white/10 shrink-0 space-y-3">
          <Button
            onClick={onAccept}
            disabled={!canAccept}
            className="w-full h-14 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {canAccept ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Aceito os Termos de Uso
              </>
            ) : (
              "Role até o final para aceitar"
            )}
          </Button>

          <Button
            onClick={onDecline}
            variant="ghost"
            className="w-full h-12 rounded-xl text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// 2. Adicionada validação de props para corrigir o erro do ESLint
TermsOfUse.propTypes = {
  onAccept: PropTypes.func.isRequired,
  onDecline: PropTypes.func.isRequired,
};
