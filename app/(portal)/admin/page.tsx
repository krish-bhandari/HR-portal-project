// app/(portal)/admin/page.tsx — Admin Insights
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminClient from "./admin-client";

export const metadata = { title: "Admin Insights — RISE HR Portal" };

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase.from("team_members").select("role").eq("email", user.email).single();
  if (member?.role !== "admin") redirect("/dashboard");

  const year = new Date().getFullYear();
  const todayStr = new Date().toISOString().split("T")[0];

  const [teamRes, balancesRes, leavesRes, pendingRes] = await Promise.all([
    supabase.from("team_members").select("*").order("name"),
    supabase.from("leave_balances").select("*").eq("year", year),
    supabase.from("leave_requests")
      .select("*, team_member:team_members!leave_requests_user_id_fkey(name, department)")
      .eq("status", "approved")
      .eq("year_part", year) // using a view or computed field
      .order("start_date", { ascending: false }),
    supabase.from("leave_requests")
      .select("*, team_member:team_members!leave_requests_user_id_fkey(name, avatar_url)")
      .eq("status", "approved")
      .lte("start_date", todayStr)
      .gte("end_date", todayStr),
  ]);

  return (
    <AdminClient
      team={teamRes.data ?? []}
      balances={balancesRes.data ?? []}
      approvedLeaves={leavesRes.data ?? []}
      outToday={pendingRes.data ?? []}
    />
  );
}
