// supabase/functions/daily-digest/index.ts
// Supabase Edge Function — sends daily 9AM IST digest to Slack
// Schedule via pg_cron: SELECT cron.schedule('daily-digest', '30 3 * * 1-6', $$SELECT net.http_post(...)$$);

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SLACK_WEBHOOK_URL = Deno.env.get("SLACK_WEBHOOK_URL")!;

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const todayIST = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
    const todayStr = todayIST.toISOString().split("T")[0];

    // Check if today is a Sunday
    if (todayIST.getDay() === 0) {
      return new Response(JSON.stringify({ skipped: "Sunday" }), { headers: { "Content-Type": "application/json" } });
    }

    // Check if today is a national holiday
    const { data: holiday } = await supabase.from("national_holidays").select("name").eq("date", todayStr).single();
    if (holiday) {
      return new Response(JSON.stringify({ skipped: `Holiday: ${holiday.name}` }), { headers: { "Content-Type": "application/json" } });
    }

    // Get approved leaves for today
    const { data: leaves } = await supabase
      .from("leave_requests")
      .select("type, total_days, half_day_period, team_member:team_members!leave_requests_user_id_fkey(name, slack_handle)")
      .eq("status", "approved")
      .lte("start_date", todayStr)
      .gte("end_date", todayStr);

    const dateFormatted = todayIST.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
    const typeEmoji: Record<string, string> = { pto: "🌴", wfh: "🏠", comp_off: "🔄", sick: "🤒", casual: "🎯" };

    let blocks: any[];

    if (!leaves || leaves.length === 0) {
      blocks = [
        { type: "header", text: { type: "plain_text", text: `📋 Daily Digest — ${dateFormatted}`, emoji: true } },
        { type: "section", text: { type: "mrkdwn", text: "✅ *Everyone's in today!* Full team attendance." } },
      ];
    } else {
      const outList = leaves.map((l: any) => {
        const member = l.team_member;
        const mention = member?.slack_handle ? `<@${member.slack_handle}>` : `*${member?.name}*`;
        const typeLabel = l.type === "wfh" ? "WFH 🏠" : `on leave ${typeEmoji[l.type] ?? "📅"}`;
        const halfDay = l.half_day_period ? ` (${l.half_day_period} only)` : "";
        return `• ${mention} — ${typeLabel}${halfDay}`;
      }).join("\n");

      blocks = [
        { type: "header", text: { type: "plain_text", text: `📋 Daily Digest — ${dateFormatted}`, emoji: true } },
        { type: "section", text: { type: "mrkdwn", text: `*${leaves.length} team member${leaves.length > 1 ? "s" : ""} out/WFH today:*\n\n${outList}` } },
        { type: "divider" },
        { type: "context", elements: [{ type: "mrkdwn", text: "RISE Research HR Portal • _Automated daily digest_" }] },
      ];
    }

    const slackRes = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });

    if (!slackRes.ok) {
      throw new Error(`Slack webhook error: ${slackRes.status}`);
    }

    console.log(`✅ Daily digest sent for ${todayStr} — ${leaves?.length ?? 0} people out`);

    return new Response(JSON.stringify({ sent: true, date: todayStr, count: leaves?.length ?? 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Daily digest error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
