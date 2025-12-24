import { supabase } from "@/lib/supabaseClient";

export const MatchmakingService = {
  // ===============================
  // GET OU CRIA SESSÃO
  // ===============================
  async getOrCreateSession(payload) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Usuário não autenticado");

    // 1️⃣ Verifica se já existe sessão ativa
    const { data: existingSession } = await supabase
      .from("usersession")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["waiting", "matched", "chatting"])
      .maybeSingle();

    if (existingSession) {
      return existingSession;
    }

    // 2️⃣ Cria nova sessão
    const { data: newSession, error } = await supabase
      .from("usersession")
      .insert({
        user_id: user.id,
        status: "waiting",
        partner_user_id: null,
        last_active: new Date().toISOString(),
        ...payload,
      })
      .select()
      .single();

    if (error) throw error;

    return newSession;
  },

  // ===============================
  // BUSCA PARCEIRO COMPATÍVEL
  // ===============================
  async findCompatiblePartner(mySession) {
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();

    const { data: candidates, error } = await supabase
      .from("usersession")
      .select("*")
      .eq("status", "waiting")
      .is("partner_user_id", null)
      .neq("user_id", mySession.user_id)
      .gt("last_active", oneMinuteAgo);

    if (error) throw error;
    if (!candidates || candidates.length === 0) return null;

    // 👉 Match simples (pode evoluir depois)
    return candidates[0];
  },

  // ===============================
  // CONECTA DOIS USUÁRIOS
  // ===============================
  async connectUsers(mySession, partnerSession) {
    const now = new Date().toISOString();

    const updateMe = supabase
      .from("usersession")
      .update({
        status: "chatting",
        partner_user_id: partnerSession.user_id,
        last_active: now,
      })
      .eq("id", mySession.id);

    const updatePartner = supabase
      .from("usersession")
      .update({
        status: "chatting",
        partner_user_id: mySession.user_id,
        last_active: now,
      })
      .eq("id", partnerSession.id);

    await Promise.all([updateMe, updatePartner]);
    return true;
  },

  // ===============================
  // HEARTBEAT
  // ===============================
  async updateHeartbeat(sessionId) {
    await supabase
      .from("usersession")
      .update({ last_active: new Date().toISOString() })
      .eq("id", sessionId);
  },

  // ===============================
  // SAIR DA FILA
  // ===============================
  async leaveQueue(sessionId) {
    await supabase
      .from("usersession")
      .update({
        status: "ended",
        partner_user_id: null,
      })
      .eq("id", sessionId);
  },

  // ===============================
  // VERIFICA SE FOI MATCH
  // ===============================
  async checkIfMatched(sessionId) {
    const { data, error } = await supabase
      .from("usersession")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (error) throw error;

    if (data?.status === "chatting" && data?.partner_user_id) {
      return data.partner_user_id; // USER ID do parceiro
    }

    return null;
  },

  // ===============================
  // PULAR / BUSCAR PRÓXIMO
  // ===============================
  async skipAndFindNext(sessionId) {
    const { data, error } = await supabase
      .from("usersession")
      .update({
        status: "waiting",
        partner_user_id: null,
        last_active: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
