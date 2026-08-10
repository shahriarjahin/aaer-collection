import { User } from "@supabase/supabase-js";
import { requireSupabase } from "./supabase";

export function getUserDisplayName(user: User): string {
  const metadataName = user.user_metadata?.full_name || user.user_metadata?.name;
  return String(metadataName || user.email || "Authenticated user");
}

export async function signInWithPassword(email: string, password: string) {
  return requireSupabase().auth.signInWithPassword({ email, password });
}

export async function signUpWithPassword(email: string, password: string, fullName: string) {
  return requireSupabase().auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
}

export interface UserApproval {
  userId: string;
  email: string;
  fullName: string;
  approved: boolean;
  isAdmin: boolean;
  createdAt: string;
}

export async function getCurrentUserApproval(userId: string): Promise<UserApproval | null> {
  const { data, error } = await requireSupabase()
    .from("approved_users")
    .select("user_id, email, full_name, approved, is_admin, created_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return {
    userId: data.user_id,
    email: data.email || "",
    fullName: data.full_name || "",
    approved: Boolean(data.approved),
    isAdmin: Boolean(data.is_admin),
    createdAt: data.created_at,
  };
}

export async function isApprovedUser(userId: string): Promise<boolean> {
  const approval = await getCurrentUserApproval(userId);
  return Boolean(approval?.approved);
}

export async function getAdministratorUsers(): Promise<UserApproval[]> {
  const { data, error } = await requireSupabase()
    .from("approved_users")
    .select("user_id, email, full_name, approved, is_admin, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((user) => ({
    userId: user.user_id,
    email: user.email || "",
    fullName: user.full_name || "",
    approved: Boolean(user.approved),
    isAdmin: Boolean(user.is_admin),
    createdAt: user.created_at,
  }));
}

export async function updateUserApproval(userId: string, approved: boolean, fullName: string, isAdmin: boolean): Promise<void> {
  const { error } = await requireSupabase()
    .from("approved_users")
    .update({ approved, full_name: fullName.trim(), is_admin: isAdmin })
    .eq("user_id", userId);
  if (error) throw error;
}

export async function signOutUser(): Promise<void> {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw error;
}