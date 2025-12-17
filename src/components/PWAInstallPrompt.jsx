import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Show iOS instructions after 3 seconds
      setTimeout(() => setShowPrompt(true), 3000);
    } else {
      // Listen for beforeinstallprompt on Android/Desktop
      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setTimeout(() => setShowPrompt(true), 3000);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80"
      >
        <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 text-white/40 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold">Instalar MeetZap</h3>
              <p className="text-white/60 text-sm mt-1">
                {isIOS 
                  ? 'Toque em "Compartilhar" e depois "Adicionar à Tela Inicial"'
                  : 'Instale o app para uma experiência melhor!'
                }
              </p>
            </div>
          </div>

          {!isIOS && deferredPrompt && (
            <Button
              onClick={handleInstall}
              className="w-full mt-4 h-11 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Instalar Agora
            </Button>
          )}

          {isIOS && (
            <div className="mt-4 p-3 bg-white/5 rounded-xl">
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <span>1. Toque em</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L12 14M12 2L8 6M12 2L16 6M4 12V20H20V12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-white/80 text-sm mt-1">2. "Adicionar à Tela Início"</p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}