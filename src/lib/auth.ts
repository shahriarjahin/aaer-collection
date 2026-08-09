import { User } from "@supabase/supabase-js";
import { requireSupabase } from "./supabase";

export function getUserDisplayName(user: User): string {
  const metadataName = user.user_metadata?.full_name || user.user_metadata?.name;
  return String(metadataName || user.email || "Authenticated user");
}

export async function signInWithPassword(email: string, password: string) {
  return requireSupabase().auth.signInWithPassword({ email, password });
}

export async function isApprovedUser(userId: string): Promise<boolean> {
  const { data, error } = await requireSupabase()
    .from("approved_users")
    .select("approved")
    .eq("user_id", userId)
    .eq("approved", true)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.approved);
}

export async function signOutUser(): Promise<void> {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw error;
}