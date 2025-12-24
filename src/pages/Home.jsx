import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Globe,
  Shield,
  ArrowRight,
  Crown,
  Calendar,
  Mail,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// Importação de Componentes
import LocationSelector from "@/components/match/LocationSelector";
import GenderSelector from "@/components/match/GenderSelector";
import { MatchmakingService } from "@/components/match/MatchmakingService";
import VideoChat from "@/components/video/VideoChat";
import PricingPlans from "@/components/payment/PricingPlans";
import PaymentModal from "@/components/payment/PaymentModal";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import EmailRegister from "@/components/auth/EmailRegister";
import EmailSettings from "@/components/auth/EmailSettings";
import TermsOfUse from "@/components/auth/TermsOfUse";

export default function Home() {
  const [step, setStep] = useState("welcome");

  // --- ESTADOS DE PREFERÊNCIAS ---
  const [country, setCountry] = useState(
    () => localStorage.getItem("meetzap_pref_country") || ""
  );
  const [city, setCity] = useState(
    () => localStorage.getItem("meetzap_pref_city") || ""
  );
  const [myGender, setMyGender] = useState(
    () => localStorage.getItem("meetzap_pref_gender") || ""
  );
  const [lookingFor, setLookingFor] = useState(
    () => localStorage.getItem("meetzap_pref_looking") || "all"
  );
  const [myAge, setMyAge] = useState(
    () => parseInt(localStorage.getItem("meetzap_pref_age")) || ""
  );
  const [minAge, setMinAge] = useState(
    () => parseInt(localStorage.getItem("meetzap_pref_min_age")) || 18
  );
  const [maxAge, setMaxAge] = useState(
    () => parseInt(localStorage.getItem("meetzap_pref_max_age")) || 99
  );
  const [expandSearch, setExpandSearch] = useState(
    () => localStorage.getItem("meetzap_pref_expand") !== "false"
  );

  // --- ESTADOS DE SESSÃO E MATCH ---
  const [partner, setPartner] = useState(null);
  const [session, setSession] = useState(null);
  const [userEmail, setUserEmail] = useState(
    () => localStorage.getItem("meetzap_verified_email") || ""
  );
  const [userNameLocal, setUserNameLocal] = useState(
    () => localStorage.getItem("meetzap_user_name") || ""
  );
  const [onlineCount, setOnlineCount] = useState(0);
  const [realtimeChannel, setRealtimeChannel] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // --- ESTADOS DE UI ---
  const [showPricing, setShowPricing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [authMode, setAuthMode] = useState("signup");

  // Sincronizar preferências com LocalStorage
  useEffect(() => {
    localStorage.setItem("meetzap_pref_country", country);
    localStorage.setItem("meetzap_pref_city", city);
    localStorage.setItem("meetzap_pref_gender", myGender);
    localStorage.setItem("meetzap_pref_looking", lookingFor);
    if (myAge) localStorage.setItem("meetzap_pref_age", myAge.toString());
    localStorage.setItem("meetzap_pref_min_age", minAge.toString());
    localStorage.setItem("meetzap_pref_max_age", maxAge.toString());
    localStorage.setItem("meetzap_pref_expand", expandSearch.toString());
  }, [
    country,
    city,
    myGender,
    lookingFor,
    myAge,
    minAge,
    maxAge,
    expandSearch,
  ]);

  const fetchUserProfile = useCallback(async (userId) => {
    const { data } = await supabase
      .from("user_profiles")
      .select("display_name")
      .eq("id", userId)
      .single();
    if (data) setUserNameLocal(data.display_name || "");
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session: activeSession },
      } = await supabase.auth.getSession();
      if (activeSession) {
        setUserEmail(activeSession.user.email);
        fetchUserProfile(activeSession.user.id);
      }
    };
    checkUser();

    const fetchOnlineCount = async () => {
      try {
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
        const { count, error } = await supabase
          .from("usersession")
          .select("*", { count: "exact", head: true })
          .gt("last_active", oneMinuteAgo);
        if (!error) setOnlineCount((count || 0) + 53);
      } catch (e) {
        console.error("Erro online count:", e);
      }
    };

    fetchOnlineCount();
    const interval = setInterval(fetchOnlineCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUserProfile]);

  const canProceed = country && city && myGender && lookingFor && myAge >= 18;

  const startSearching = async () => {
    if (isSearching) return;
    setIsSearching(true);

    try {
      setStep("video");
      setPartner(null);

      const newSession = await MatchmakingService.getOrCreateSession({
        country,
        city,
        gender: myGender,
        looking_for: lookingFor,
        age: myAge,
        min_age: minAge,
        max_age: maxAge,
        expand_search: expandSearch,
      });

      setSession(newSession);

      const channel = supabase
        .channel(`match:${newSession.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "usersession",
            filter: `id=eq.${newSession.id}`,
          },
          (payload) => {
            if (
              payload.new.status === "chatting" &&
              payload.new.partner_user_id
            ) {
              setPartner(payload.new.partner_user_id);
              supabase.removeChannel(channel);
              setRealtimeChannel(null);
              setIsSearching(false); // ✅ libera aqui
            }
          }
        )
        .subscribe();

      setRealtimeChannel(channel);

      const partnerFound = await MatchmakingService.findCompatiblePartner(
        newSession
      );

      if (partnerFound) {
        await MatchmakingService.connectUsers(newSession, partnerFound);
        setPartner(partnerFound.user_id);
        supabase.removeChannel(channel);
        setRealtimeChannel(null);
        setIsSearching(false); // ✅ libera aqui também
      }
    } catch (err) {
      console.error("Erro ao buscar match:", err);
      setIsSearching(false); // ✅ garante liberação em erro
    }
  };

  const handleEnd = async () => {
    // Verifique se o canal existe e se o status é 'joined' ou conectando antes de remover
    if (realtimeChannel) {
      await supabase.removeChannel(realtimeChannel);
      setRealtimeChannel(null);
    }

    if (session?.id) {
      // Não precisa esperar (await) isso travar a UI, pode deixar rodar em background se quiser
      MatchmakingService.leaveQueue(session.id).catch(console.error);
    }

    setPartner(null);
    setSession(null);
    setStep("preferences");
    setIsSearching(false); // Garanta que o estado de busca foi resetado
  };

  const handleSkip = async () => {
    if (!session?.id) return;

    const updated = await MatchmakingService.skipAndFindNext(session.id);
    if (!updated) return;

    setSession(updated);
    setPartner(null);

    const partnerFound = await MatchmakingService.findCompatiblePartner(
      updated
    );

    if (partnerFound) {
      await MatchmakingService.connectUsers(updated, partnerFound);
      setPartner(partnerFound.user_id);
    }
  };

  // --- RENDERIZAÇÃO ---

  if (step === "email_register")
    return (
      <EmailRegister
        initialMode={authMode}
        onBack={() => setStep("welcome")}
        onComplete={(email) => {
          setUserEmail(email);
          setStep("welcome");
        }}
      />
    );

  if (step === "video") {
    if (!partner) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative mb-12"
          >
            <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
            <div className="relative w-32 h-32 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
              <Users className="w-12 h-12 text-white animate-pulse" />
            </div>
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Procurando parceiro...
          </h2>
          <Button
            onClick={handleEnd}
            variant="ghost"
            className="text-white/40 border border-white/5 rounded-2xl px-8"
          >
            Cancelar
          </Button>
        </div>
      );
    }
    return (
      <VideoChat
        partnerInfo={{ id: partner, display_name: "Parceiro" }}
        sessionId={session?.id}
        myName={userNameLocal || "Anônimo"}
        onSkip={handleSkip}
        onEnd={handleEnd}
      />
    );
  }

  return (
    <>
      <AnimatePresence>
        {showEmailSettings && (
          <EmailSettings onClose={() => setShowEmailSettings(false)} />
        )}
      </AnimatePresence>

      {showTerms && (
        <TermsOfUse
          onAccept={() => {
            setShowTerms(false);
            setAuthMode("signup");
            setStep("email_register");
          }}
          // CORREÇÃO AQUI: Conectando a função de fechar ao botão Cancelar
          onDecline={() => setShowTerms(false)}
        />
      )}

      {showPricing && (
        <PricingPlans
          currentPlan="free"
          onSelectPlan={setSelectedPlan}
          onClose={() => setShowPricing(false)}
        />
      )}

      {selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onSuccess={() => setShowPricing(false)}
        />
      )}

      <PWAInstallPrompt />

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden flex flex-col items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center">
          {step === "welcome" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full text-center"
            >
              <div className="relative mb-8 w-28 h-28 mx-auto">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-500 via-purple-600 to-blue-500 shadow-2xl" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute left-3 w-10 h-10 rounded-full bg-white/90 shadow-lg" />
                  <div className="absolute right-3 w-10 h-10 rounded-full bg-white/70 shadow-lg" />
                  <Zap className="w-8 h-8 text-yellow-300 z-10 fill-yellow-300" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-4 border-gray-900 animate-pulse" />
              </div>

              <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
                MeetZap
              </h1>
              <p className="text-xs text-white/20 font-mono mb-2">v2.2</p>
              <p className="text-lg text-white/60 mb-12">
                Conheça pessoas incríveis por vídeo
              </p>

              <div className="grid grid-cols-3 gap-4 mb-12 w-full">
                {[
                  { icon: Globe, label: "Global" },
                  { icon: Users, label: "Real" },
                  { icon: Shield, label: "Seguro" },
                ].map((f, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-2">
                      <f.icon className="w-6 h-6 text-white/80" />
                    </div>
                    <span className="text-white text-xs">{f.label}</span>
                  </div>
                ))}
              </div>

              <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full bg-black/20 border border-white/10 text-xs">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-white/80">
                  <span className="font-bold">{onlineCount}</span> online
                </span>
              </div>

              <div className="space-y-4">
                {userEmail ? (
                  <>
                    <p className="text-white/60 text-sm mb-4">
                      Olá,{" "}
                      <span className="text-white font-bold">
                        {userNameLocal || "!"}
                      </span>
                    </p>
                    <Button
                      onClick={() => setShowPricing(true)}
                      className="w-full h-16 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white text-lg font-bold shadow-2xl"
                    >
                      Seja Premium <Crown className="w-5 h-5 ml-2" />
                    </Button>
                    <Button
                      onClick={() => setStep("preferences")}
                      variant="outline"
                      className="w-full h-14 rounded-2xl bg-white/5 border-white/10 text-white font-medium"
                    >
                      Começar grátis <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <Button
                      onClick={() => setShowEmailSettings(true)}
                      variant="outline"
                      className="w-full h-12 rounded-2xl bg-white/80 hover:bg-white border-none text-[#1a0b2e] font-bold flex items-center justify-center gap-2 text-sm shadow-lg"
                    >
                      <Mail className="w-4 h-4 text-[#1a0b2e]" /> Gerenciar
                      conta
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        setShowTerms(true);
                      }}
                      className="w-full h-16 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white text-lg font-bold shadow-2xl"
                    >
                      Começar <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <Button
                      onClick={() => {
                        setAuthMode("login");
                        setStep("email_register");
                      }}
                      variant="outline"
                      className="w-full h-14 rounded-2xl bg-white/10 border-white/20 text-white flex items-center justify-center gap-3"
                    >
                      <Mail className="w-5 h-5" /> Entrar com email
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {step === "preferences" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Configure sua busca
                </h2>
              </div>
              <div className="space-y-6 bg-black/25 p-6 rounded-[2.5rem] border border-white/5 mb-8">
                <LocationSelector
                  country={country}
                  city={city}
                  onCountryChange={setCountry}
                  onCityChange={setCity}
                />
                <GenderSelector
                  myGender={myGender}
                  lookingFor={lookingFor}
                  onMyGenderChange={setMyGender}
                  onLookingForChange={setLookingFor}
                />
                <div className="flex items-center justify-between gap-4 py-2 border-t border-white/5 pt-4">
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">
                      Expandir busca
                    </p>
                    <p className="text-white/40 text-[10px] leading-tight">
                      Mostrar usuários fora das configurações se necessário.
                    </p>
                  </div>
                  <Switch
                    checked={expandSearch}
                    onCheckedChange={setExpandSearch}
                    className="data-[state=checked]:bg-pink-500"
                  />
                </div>
                <div className="space-y-4 border-t border-white/5 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-white font-semibold text-sm">Idade</p>
                  </div>
                  <Input
                    type="number"
                    placeholder="Sua idade"
                    value={myAge}
                    onChange={(e) => setMyAge(parseInt(e.target.value) || "")}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <div className="space-y-3">
                    <Label className="text-white/80 text-xs">
                      Faixa de idade desejada
                    </Label>
                    <Slider
                      value={[minAge, maxAge]}
                      min={18}
                      max={99}
                      step={1}
                      onValueChange={([min, max]) => {
                        setMinAge(min);
                        setMaxAge(max);
                      }}
                    />
                    <div className="flex justify-between text-[10px] text-white/50 px-1 font-mono">
                      <span>Mín: {minAge}</span>
                      <span>Máx: {maxAge}</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={startSearching}
                  disabled={!canProceed}
                  className="w-full h-16 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 font-bold text-lg shadow-xl"
                >
                  Iniciar Vídeo
                </Button>
                <Button
                  onClick={() => setStep("welcome")}
                  variant="ghost"
                  className="w-full text-white/40 text-sm hover:text-white"
                >
                  Voltar
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
