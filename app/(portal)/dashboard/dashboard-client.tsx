"use client";

import { formatDate, getInitials, cn } from "@/lib/utils";
import { CalendarDays, Users, Clock, Gift, Umbrella, Home, Calendar } from "lucide-react";
import Link from "next/link";

interface Props {
  member: any;
  balance: any;
  approvedLeaves: any[];
  outToday: any[];
  pendingLeaves: any[];
  upcomingBirthdays: any[];
  upcomingHolidays: any[];
  holidays: any[];
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function DashboardClient({
  member,
  balance,
  approvedLeaves,
  outToday,
  pendingLeaves,
  upcomingBirthdays,
  upcomingHolidays,
  holidays,
}: Props) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const ptoUsed = balance?.pto_used ?? 0;
  const ptoTotal = balance?.pto_total ?? 18;
  const wfhUsed = balance?.wfh_used ?? 0;
  const wfhTotal = balance?.wfh_total ?? 12;
  const ptoPct = Math.round((ptoUsed / ptoTotal) * 100);
  const wfhPct = Math.round((wfhUsed / wfhTotal) * 100);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Page header */}
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <h1 className="page-title">
          {greeting},{" "}
          <span style={{ color: "var(--rise-gold)" }}>
            {member?.name?.split(" ")[0] ?? "there"}
          </span>{" "}
          👋
        </h1>
        <p className="page-subtitle">
          {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stats Row */}
      <div className="stats-grid" style={{ marginBottom: "2rem" }}>
        {/* PTO Balance */}
        <div className="card-stat gold-border" style={{ position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <Umbrella size={16} color="var(--rise-gold)" />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              PTO Remaining
            </span>
          </div>
          <div className="stat-value">{ptoTotal - ptoUsed}</div>
          <div className="stat-label">of {ptoTotal} days</div>
          <div style={{ marginTop: "0.75rem" }}>
            <div style={{ height: 4, background: "var(--bg-border)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${ptoPct}%`, background: "linear-gradient(90deg, var(--rise-gold) 0%, var(--rise-gold-light) 100%)", borderRadius: 2, transition: "width 0.5s ease" }} />
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 4 }}>{ptoUsed} used</div>
          </div>
        </div>

        {/* WFH Balance */}
        <div className="card-stat">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <Home size={16} color="#60a5fa" />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              WFH Remaining
            </span>
          </div>
          <div className="stat-value" style={{ color: "#60a5fa" }}>{wfhTotal - wfhUsed}</div>
          <div className="stat-label">of {wfhTotal} days</div>
          <div style={{ marginTop: "0.75rem" }}>
            <div style={{ height: 4, background: "var(--bg-border)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${wfhPct}%`, background: "linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)", borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 4 }}>{wfhUsed} used</div>
          </div>
        </div>

        {/* Out Today */}
        <div className="card-stat">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <Users size={16} color="#a78bfa" />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Out Today
            </span>
          </div>
          <div className="stat-value" style={{ color: "#a78bfa" }}>{outToday.length}</div>
          <div className="stat-label">team members</div>
          <div style={{ display: "flex", marginTop: "0.75rem", gap: "0.25rem", flexWrap: "wrap" }}>
            {outToday.slice(0, 5).map((l: any) => (
              <div
                key={l.id}
                title={l.team_member?.name}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "rgba(167,139,250,0.2)",
                  color: "#a78bfa",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(167,139,250,0.3)",
                }}
              >
                {getInitials(l.team_member?.name ?? "?")}
              </div>
            ))}
            {outToday.length > 5 && (
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--bg-border)", color: "var(--text-muted)", fontSize: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                +{outToday.length - 5}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Holiday */}
        <div className="card-stat">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <Calendar size={16} color="#4ade80" />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Next Holiday
            </span>
          </div>
          {upcomingHolidays[0] ? (
            <>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#4ade80", lineHeight: 1.2 }}>
                {upcomingHolidays[0].name}
              </div>
              <div className="stat-label">{formatDate(upcomingHolidays[0].date)}</div>
            </>
          ) : (
            <div className="stat-label">No upcoming holidays</div>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1.5rem" }}>
        {/* Left: Calendar strip + Out today list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Calendar Mini Strip */}
          <CalendarStrip approvedLeaves={approvedLeaves} holidays={holidays} />

          {/* Quick Actions */}
          <div className="card">
            <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Quick Actions</h3>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link href="/leave" className="btn btn-primary btn-sm">
                <CalendarDays size={14} />
                Apply Leave
              </Link>
              <Link href="/leave?type=wfh" className="btn btn-secondary btn-sm">
                <Home size={14} />
                Apply WFH
              </Link>
              <Link href="/directory" className="btn btn-secondary btn-sm">
                <Users size={14} />
                Team Directory
              </Link>
            </div>
          </div>

          {/* Out Today detailed */}
          {outToday.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Out Today ({outToday.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {outToday.map((l: any) => (
                  <div key={l.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div
                      style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "rgba(212,175,55,0.15)",
                        color: "var(--rise-gold)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.75rem", fontWeight: 700, flexShrink: 0,
                      }}
                    >
                      {getInitials(l.team_member?.name ?? "?")}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        {l.team_member?.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {l.team_member?.department}
                      </div>
                    </div>
                    <span className={`badge badge-sm leave-chip-${l.type}`} style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem" }}>
                      {l.type.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Pending My Leave Requests */}
          {pendingLeaves.filter((l: any) => l.team_member?.name === member?.name).length > 0 && (
            <div className="card card-gold">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <Clock size={16} color="var(--rise-gold)" />
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--rise-gold)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  My Pending Requests
                </h3>
              </div>
              {pendingLeaves.filter((l: any) => l.team_member?.name === member?.name).map((l: any) => (
                <div key={l.id} style={{ padding: "0.75rem", background: "var(--bg-elevated)", borderRadius: 8, marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      {l.type.toUpperCase()} — {l.total_days}d
                    </span>
                    <span className="badge badge-pending" style={{ fontSize: "0.65rem" }}>Pending</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {formatDate(l.start_date)} → {formatDate(l.end_date)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming Birthdays */}
          {upcomingBirthdays.length > 0 && (
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <Gift size={16} color="#ec4899" />
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Upcoming Birthdays
                </h3>
              </div>
              {upcomingBirthdays.slice(0, 4).map((m: any, i: number) => {
                const bday = new Date(m.birthday);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(236,72,153,0.15)", color: "#ec4899", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700 }}>
                      {getInitials(m.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{m.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {bday.getDate()} {MONTH_NAMES[bday.getMonth()]}
                      </div>
                    </div>
                    <span style={{ fontSize: "1rem" }}>🎂</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upcoming Holidays */}
          {upcomingHolidays.length > 0 && (
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <Calendar size={16} color="#4ade80" />
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Upcoming Holidays
                </h3>
              </div>
              {upcomingHolidays.map((h: any) => (
                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0", borderBottom: "1px solid var(--bg-border)" }}>
                  <div style={{ textAlign: "center", minWidth: 40 }}>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
                      {new Date(h.date).getDate()}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                      {MONTH_NAMES[new Date(h.date).getMonth()]}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{h.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {new Date(h.date).toLocaleDateString("en-IN", { weekday: "long" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mini Calendar Strip component
function CalendarStrip({ approvedLeaves, holidays }: { approvedLeaves: any[], holidays: any[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
  const todayStr = today.toISOString().split("T")[0];
  const holidayDates = new Set(holidays.map((h: any) => h.date));

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayOfWeek = new Date(year, month, d).getDay();
    const isToday = dateStr === todayStr;
    const isHoliday = holidayDates.has(dateStr);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const leavesOnDay = approvedLeaves.filter((l: any) => l.start_date <= dateStr && l.end_date >= dateStr);
    return { d, dateStr, isToday, isHoliday, isWeekend, leavesOnDay };
  });

  const MONTH_NAMES_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {MONTH_NAMES_FULL[month]} {year}
        </h3>
        <Link href="/dashboard" style={{ fontSize: "0.75rem", color: "var(--rise-gold)", textDecoration: "none" }}>
          Full Calendar →
        </Link>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, padding: "4px 0" }}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {/* Empty cells for offset */}
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map(({ d, dateStr, isToday, isHoliday, isWeekend, leavesOnDay }) => (
          <div
            key={dateStr}
            title={isHoliday ? "Holiday" : leavesOnDay.length > 0 ? `${leavesOnDay.length} out` : ""}
            style={{
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              fontSize: "0.75rem",
              fontWeight: isToday ? 700 : 400,
              position: "relative",
              background: isToday
                ? "linear-gradient(135deg, var(--rise-gold) 0%, var(--rise-gold-dark) 100%)"
                : isHoliday
                ? "rgba(74,222,128,0.12)"
                : leavesOnDay.length > 0
                ? "rgba(212,175,55,0.1)"
                : "transparent",
              color: isToday
                ? "#000"
                : isWeekend
                ? "var(--text-muted)"
                : isHoliday
                ? "#4ade80"
                : leavesOnDay.length > 0
                ? "var(--rise-gold)"
                : "var(--text-secondary)",
              cursor: "default",
            }}
          >
            {d}
            {leavesOnDay.length > 0 && !isToday && (
              <div style={{ position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: "var(--rise-gold)" }} />
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
        {[
          { color: "var(--rise-gold)", label: "Leave" },
          { color: "#4ade80", label: "Holiday" },
          { color: "var(--rise-gold)", label: "Today", square: true },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <div style={{ width: item.square ? 10 : 6, height: item.square ? 10 : 6, borderRadius: item.square ? 2 : "50%", background: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
