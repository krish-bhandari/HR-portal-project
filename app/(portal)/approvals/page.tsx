// app/(portal)/approvals/page.tsx — Admin approvals server page
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ApprovalsClient from "./approvals-client";

export const metadata = { title: "Approvals — RISE HR Portal" };

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase.from("team_members").select("role").eq("email", user.email).single();
  if (member?.role !== "admin") redirect("/dashboard");

  const [pendingRes, historyRes] = await Promise.all([
    supabase.from("leave_requests")
      .select("*, team_member:team_members!leave_requests_user_id_fkey(name, email, avatar_url, department, designation)")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase.from("leave_requests")
      .select("*, team_member:team_members!leave_requests_user_id_fkey(name, avatar_url, department), reviewer:team_members!leave_requests_reviewed_by_fkey(name)")
      .in("status", ["approved", "rejected"])
      .order("reviewed_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <ApprovalsClient
      pending={pendingRes.data ?? []}
      history={historyRes.data ?? []}
      adminId={member ? (await supabase.from("team_members").select("id").eq("email", user.email).single()).data?.id : ""}
    />
  );
}
