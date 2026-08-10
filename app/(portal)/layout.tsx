// app/(portal)/layout.tsx — Server layout: fetches current user and their team_member profile
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PortalLayoutClient from "./layout-client";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch team member profile
  const { data: member, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("email", user.email)
    .single();

  // If not found in team_members, create a basic entry (first login)
  if (error || !member) {
    const { data: newMember } = await supabase
      .from("team_members")
      .insert({
        name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Team Member",
        email: user.email!,
        role: "member",
        department: "General",
        designation: "Team Member",
        avatar_url: user.user_metadata?.avatar_url ?? null,
      })
      .select()
      .single();

    if (newMember) {
      return (
        <PortalLayoutClient member={newMember}>
          {children}
        </PortalLayoutClient>
      );
    }

    redirect("/login");
  }

  return (
    <PortalLayoutClient member={member}>
      {children}
    </PortalLayoutClient>
  );
}
