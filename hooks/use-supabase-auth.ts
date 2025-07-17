import { useState } from 'react';
import { supabaseClient } from '@/lib/supabase-client';
// Use supabaseClient for auth.getSession(), signIn, etc.

export function useSupabaseAuth() {
  const [error, setError] = useState<string | null>(null);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { role: 'broker' } }, // Metadata
    });
    if (error) {
      setError(error.message);
      return null;
    }
    // Insert profile row
    if (data.user) {
      await supabaseClient.from('profiles').insert({
        user_id: data.user.id,
        role: 'broker',
        name: email.split('@')[0], // Default name
      });
    }
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      return null;
    }
    if (data.user?.user_metadata.role !== 'broker') {
      setError('Not a broker account');
      return null;
    }
    // Fetch profile for extra data
    const { data: profile } = await supabaseClient.from('profiles').select('*').eq('user_id', data.user.id).single();
    return { ...data, profile };
  };

  return { signUp, signIn, error };
}