"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, profile: null, loading: true });
  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    return data as Profile | null;
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setState({ user: null, profile: null, loading: false }); return; }
      const profile = await fetchProfile(user.id);
      setState({ user, profile, loading: false });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      const user = session?.user ?? null;
      if (!user) { setState({ user: null, profile: null, loading: false }); return; }
      const profile = await fetchProfile(user.id);
      setState({ user, profile, loading: false });
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  return { ...state, signOut };
}
