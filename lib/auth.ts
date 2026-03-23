"use client";

import { createSupabaseBrowser } from "./supabase-browser";
import type { User } from "@supabase/supabase-js";

export async function getUser(): Promise<User | null> {
  const { data } = await createSupabaseBrowser().auth.getUser();
  return data.user;
}

export async function signInWithKakao() {
  const { error } = await createSupabaseBrowser().auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await createSupabaseBrowser().auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
}

export async function signUpWithEmail(email: string, password: string) {
  const { error } = await createSupabaseBrowser().auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await createSupabaseBrowser().auth.signOut();
  if (error) throw error;
}
