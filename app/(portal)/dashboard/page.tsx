// app/(portal)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";

export const metadata = {
  title: "Dashboard — RISE HR Portal",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).toISOString().split("T")[0];
  const lastDay = new Date(year, month + 1, 0).toISOString().split("T")[0];

  const [memberRes, balanceRes, approvedRes, pendingRes, holidaysRes, birthdaysRes] = await Promise.all([
    supabase.from("team_members").select("*").eq("email", user.email).single(),
    supabase.from("leave_balances").select("*").eq("user_id", (await supabase.from("team_members").select("id").eq("email", user.email).single()).data?.id).eq("year", year).single(),
    supabase.from("leave_requests").select("*, team_member:team_members(name, avatar_url, department)").eq("status", "approved").gte("start_date", firstDay).lte("end_date", lastDay),
    supabase.from("leave_requests").select("*, team_member:team_members(name, avatar_url)").eq("status", "pending").order("created_at", { ascending: false }),
    supabase.from("national_holidays").select("*").eq("year", year).order("date"),
    supabase.from("team_members").select("name, avatar_url, birthday, department"),
  ]);

  const member = memberRes.data;
  const balance = balanceRes.data;
  const approvedLeaves = approvedRes.data ?? [];
  const pendingLeaves = pendingRes.data ?? [];
  const holidays = holidaysRes.data ?? [];
  const allMembers = birthdaysRes.data ?? [];

  // Who's out today
  const todayStr = today.toISOString().split("T")[0];
  const outToday = approvedLeaves.filter(
    (l: any) => l.start_date <= todayStr && l.end_date >= todayStr
  );

  // Upcoming birthdays (next 30 days)
  const upcomingBirthdays = allMembers.filter((m: any) => {
    if (!m.birthday) return false;
    const bday = new Date(m.birthday);
    const thisYearBday = new Date(year, bday.getMonth(), bday.getDate());
    const diff = (thisYearBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  });

  // Upcoming holidays
  const upcomingHolidays = holidays.filter((h: any) => h.date >= todayStr).slice(0, 3);

  return (
    <DashboardClient
      member={member}
      balance={balance}
      approvedLeaves={approvedLeaves}
      outToday={outToday}
      pendingLeaves={pendingLeaves}
      upcomingBirthdays={upcomingBirthdays}
      upcomingHolidays={upcomingHolidays}
      holidays={holidays}
    />
  );
}
