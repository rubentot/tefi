"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase-client";

export interface UserSession {
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    socialNumber: string;
  };
  accessToken: string;
  loginTime: number;
}

export function useSession() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabaseClient.auth.getSession();
      if (data.session) {
        const s = data.session;
        setSession({
          role: s.user.user_metadata.role,
          user: {
            id: s.user.id,
            name: s.user.user_metadata.name || s.user.email?.split("@")[0],
            email: s.user.email || "",
            phone: s.user.user_metadata.phone || "",
            socialNumber: s.user.user_metadata.socialNumber || "",
          },
          accessToken: s.access_token,
          loginTime: Date.now(),
        });
      }
      setLoading(false);
    };
    fetchSession();
  }, []);

  return { session, loading };
}
