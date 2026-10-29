// Sign-in state shared by every route. Email + 6-digit code through Supabase Auth; the
// member row says which shop the person belongs to and what they can open.
import React from 'react';
import { supabase, SHOP_ID } from './supabase.js';

export const STAFF = ['tech', 'advisor', 'owner'];

export function useAuth() {
  const [state, set] = React.useState({ loading: !!supabase, session: null, member: null });
  React.useEffect(() => {
    if (!supabase) return;
    let alive = true;
    const cacheKey = (s) => 'revyn.member.' + s.user.id;
    const load = async (session) => {
      if (!session) return alive && set({ loading: false, session: null, member: null });
      let cached = null; try { cached = JSON.parse(localStorage.getItem(cacheKey(session)) || 'null'); } catch (e) {}
      if (cached && alive) set({ loading: false, session, member: cached }); // paint now, confirm below
      const { data } = await supabase.from('shop_members').select('shop_id, role, name').eq('shop_id', SHOP_ID).maybeSingle();
      try { if (data) localStorage.setItem(cacheKey(session), JSON.stringify(data)); } catch (e) {}
      if (alive) set({ loading: false, session, member: data || null });
    };
    supabase.auth.getSession().then(({ data }) => load(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => load(session));
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return state;
}

export const signInPassword = (email, password) => supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
export const signUpPassword = (email, password, name) => supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: { name } } });
export const resetPassword = (email) => supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: window.location.origin + '/reset' });
export const updatePassword = (password) => supabase.auth.updateUser({ password });
export const sendCode = (email) => supabase.auth.signInWithOtp({ email: email.trim().toLowerCase() });
export const verifyCode = (email, token) => supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token, type: 'email' });
export const signOut = () => supabase.auth.signOut();
