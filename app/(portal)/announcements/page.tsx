// app/(portal)/announcements/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AnnouncementsClient from "./announcements-client";

export const metadata = { title: "Announcements — RISE HR Portal" };

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [memberRes, postsRes] = await Promise.all([
    supabase.from("team_members").select("*").eq("email", user.email).single(),
    supabase.from("announcements")
      .select(`*, author:team_members!announcements_author_id_fkey(name, avatar_url, designation), reactions:announcement_reactions(user_id, type)`)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return (
    <AnnouncementsClient
      member={memberRes.data}
      initialPosts={postsRes.data ?? []}
    />
  );
}
