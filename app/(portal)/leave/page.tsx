// app/(portal)/leave/page.tsx — Server page
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LeaveClient from "./leave-client";

export const metadata = { title: "Apply Leave — RISE HR Portal" };

export default async function LeavePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const year = new Date().getFullYear();

  const [memberRes, balanceRes, myLeavesRes, holidaysRes] = await Promise.all([
    supabase.from("team_members").select("*").eq("email", user.email).single(),
    supabase.from("leave_balances").select("*").eq("user_id", (await supabase.from("team_members").select("id").eq("email", user.email).single()).data?.id ?? "").eq("year", year).single(),
    supabase.from("leave_requests").select("*").eq("user_id", (await supabase.from("team_members").select("id").eq("email", user.email).single()).data?.id ?? "").order("created_at", { ascending: false }),
    supabase.from("national_holidays").select("*").eq("year", year).order("date"),
  ]);

  return (
    <LeaveClient
      member={memberRes.data}
      balance={balanceRes.data}
      myLeaves={myLeavesRes.data ?? []}
      holidays={holidaysRes.data ?? []}
    />
  );
}
