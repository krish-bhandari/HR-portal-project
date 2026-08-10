// supabase/functions/airtable-sync/index.ts
// Supabase Edge Function — syncs team_members from Airtable daily
// Deploy: supabase functions deploy airtable-sync

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AIRTABLE_API_KEY = Deno.env.get("AIRTABLE_API_KEY")!;
const AIRTABLE_BASE_ID = Deno.env.get("AIRTABLE_BASE_ID")!;
const AIRTABLE_TABLE_NAME = Deno.env.get("AIRTABLE_TABLE_NAME") ?? "Team";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all records from Airtable
    let records: any[] = [];
    let offset: string | undefined;

    do {
      const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`);
      if (offset) url.searchParams.set("offset", offset);
      url.searchParams.set("pageSize", "100");

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      });

      if (!res.ok) {
        throw new Error(`Airtable API error: ${res.status} ${await res.text()}`);
      }

      const json = await res.json();
      records = [...records, ...(json.records ?? [])];
      offset = json.offset;
    } while (offset);

    // Map Airtable records to team_members schema
    const members = records.map((record: any) => ({
      airtable_id: record.id,
      name: record.fields["Name"] ?? record.fields["Full Name"] ?? "",
      email: record.fields["Email"] ?? "",
      role: (record.fields["Role"] ?? "member").toLowerCase() === "admin" ? "admin" : "member",
      department: record.fields["Department"] ?? null,
      designation: record.fields["Designation"] ?? record.fields["Title"] ?? null,
      join_date: record.fields["Join Date"] ?? null,
      birthday: record.fields["Birthday"] ?? null,
      avatar_url: record.fields["Avatar"]?.[0]?.url ?? null,
    })).filter((m: any) => m.email && m.name);

    // Upsert into Supabase (preserve bio and slack_handle from existing rows)
    for (const member of members) {
      await supabase.from("team_members").upsert(member, {
        onConflict: "airtable_id",
        ignoreDuplicates: false,
      });
    }

    console.log(`✅ Synced ${members.length} members from Airtable`);

    return new Response(JSON.stringify({ synced: members.length, ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Airtable sync error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
