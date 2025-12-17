import { supabase } from "@/lib/supabaseClient";

export const MatchmakingService = {
  async joinQueue(userData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const sessionData = {
      user_id: user?.id || null,
      country: userData.country,
      city: userData.city,
      gender: userData.gender, // "Homem" ou "Mulher"
      looking_for: userData.looking_for, // "Homens", "Mulheres" ou "Todos"
      age: userData.age,
      min_age: userData.min_age,
      max_age: userData.max_age,
      expand_search: userData.expand_search, //
      status: "waiting",
      partner_id: null,
      last_active: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("usersession")
      .insert([sessionData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async findCompatiblePartner(mySession) {
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();

    // 1. BUSCA POR CANDIDATOS ATIVOS
    const { data: candidates } = await supabase
      .from("usersession")
      .select("*")
      .eq("status", "waiting")
      .is("partner_id", null)
      .neq("id", mySession.id)
      .gt("last_active", oneMinuteAgo);

    if (!candidates || candidates.length === 0) return null;

    // 2. TENTATIVA DE MATCH RIGOROSO (Cidade + Gênero + Idade Mútua)
    const strictMatches = candidates.filter((u) => {
      const samePlace =
        u.country === mySession.country && u.city === mySession.city;

      // Verifica compatibilidade de gênero
      const genderOk =
        mySession.looking_for === "Todos" ||
        mySession.looking_for.includes(u.gender);
      const theyWantMe =
        u.looking_for === "Todos" || u.looking_for.includes(mySession.gender);

      // Verifica compatibilidade de idade mútua
      const ageOk = mySession.age >= u.min_age && mySession.age <= u.max_age;
      const theirAgeOk =
        u.age >= mySession.min_age && u.age <= mySession.max_age;

      return samePlace && genderOk && theyWantMe && ageOk && theirAgeOk;
    });

    if (strictMatches.length > 0) return strictMatches[0];

    // 3. LÓGICA DE EXPANSÃO TOTAL (O "Qualquer Um")
    if (mySession.expand_search) {
      console.log(
        "Expansão Total: Conectando ao primeiro usuário disponível..."
      );

      const expandedMatches = candidates.filter((u) => {
        // Na expansão, verificamos se o gênero do outro nos agrada
        const iWantTheirGender =
          mySession.looking_for === "Todos" ||
          mySession.looking_for.includes(u.gender);

        // Verificamos se a idade deles está no nosso range
        const theirAgeIsOkForMe =
          u.age >= mySession.min_age && u.age <= mySession.max_age;

        // Ignoramos a localização e se a nossa idade agrada a eles para destravar o match
        return iWantTheirGender && theirAgeIsOkForMe;
      });

      return expandedMatches.length > 0 ? expandedMatches[0] : null;
    }

    return null;
  },

  async connectUsers(mySession, partnerSession) {
    const now = new Date().toISOString();

    // Atualiza a minha sessão
    const updateMe = supabase
      .from("usersession")
      .update({
        status: "chatting",
        partner_id: partnerSession.id,
        last_active: now,
      })
      .eq("id", mySession.id);

    // Atualiza a sessão do parceiro
    const updatePartner = supabase
      .from("usersession")
      .update({
        status: "chatting",
        partner_id: mySession.id,
        last_active: now,
      })
      .eq("id", partnerSession.id);

    await Promise.all([updateMe, updatePartner]);
    return true;
  },

  async updateHeartbeat(sessionId) {
    await supabase
      .from("usersession")
      .update({ last_active: new Date().toISOString() })
      .eq("id", sessionId);
  },

  async leaveQueue(sessionId) {
    await supabase
      .from("usersession")
      .update({ status: "inactive", partner_id: null })
      .eq("id", sessionId);
  },

  async checkIfMatched(sessionId) {
    const { data } = await supabase
      .from("usersession")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (data?.status === "chatting" && data?.partner_id) {
      const { data: partner } = await supabase
        .from("usersession")
        .select("*")
        .eq("id", data.partner_id)
        .single();
      return partner;
    }
    return null;
  },

  async skipAndFindNext(sessionId) {
    const { data } = await supabase
      .from("usersession")
      .update({
        status: "waiting",
        partner_id: null,
        last_active: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .select()
      .single();
    return data;
  },
};
