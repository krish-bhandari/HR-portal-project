// app/(portal)/directory/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DirectoryClient from "./directory-client";

export const metadata = { title: "Team Directory — RISE HR Portal" };

export default async function DirectoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [memberRes, teamRes] = await Promise.all([
    supabase.from("team_members").select("*").eq("email", user.email).single(),
    supabase.from("team_members").select("*").order("name"),
  ]);

  return (
    <DirectoryClient
      currentMember={memberRes.data}
      team={teamRes.data ?? []}
    />
  );
}
