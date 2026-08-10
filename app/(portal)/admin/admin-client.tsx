"use client";

import { getInitials, formatDate } from "@/lib/utils";
import { Users, UserCheck, Clock, TrendingUp } from "lucide-react";

interface Props {
  team: any[];
  balances: any[];
  approvedLeaves: any[];
  outToday: any[];
}

export default function AdminClient({ team, balances, approvedLeaves, outToday }: Props) {
  const totalMembers = team.length;
  const pendingCount = approvedLeaves.filter((l: any) => l.status === "pending").length;

  // Per-employee data
  const employeeData = team.map((member: any) => {
    const balance = balances.find((b: any) => b.user_id === member.id);
    return {
      ...member,
      ptoUsed: balance?.pto_used ?? 0,
      ptoTotal: balance?.pto_total ?? 18,
      ptoRemaining: (balance?.pto_total ?? 18) - (balance?.pto_used ?? 0),
      wfhUsed: balance?.wfh_used ?? 0,
      wfhTotal: balance?.wfh_total ?? 12,
      wfhRemaining: (balance?.wfh_total ?? 12) - (balance?.wfh_used ?? 0),
    };
  });

  // Monthly trend data (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const count = approvedLeaves.filter((l: any) => l.start_date?.startsWith(monthStr)).length;
    return {
      month: d.toLocaleString("en-IN", { month: "short" }),
      count,
    };
  });

  const maxCount = Math.max(...monthlyData.map((m) => m.count), 1);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div className="page-header">
        <h1 className="page-title">Admin Insights</h1>
        <p className="page-subtitle">Overview of team attendance, leave usage, and trends</p>
      </div>

      {/* Summary stats */}
      <div className="stats-grid" style={{ marginBottom: "2rem" }}>
        <div className="card-stat gold-border">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <Users size={16} color="var(--rise-gold)" />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Team Size</span>
          </div>
          <div className="stat-value">{totalMembers}</div>
          <div className="stat-label">active members</div>
        </div>

        <div className="card-stat">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <UserCheck size={16} color="#a78bfa" />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Out Today</span>
          </div>
          <div className="stat-value" style={{ color: "#a78bfa" }}>{outToday.length}</div>
          <div className="stat-label">on approved leave</div>
        </div>

        <div className="card-stat">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <Clock size={16} color="#f59e0b" />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Total PTO Used</span>
          </div>
          <div className="stat-value" style={{ color: "#f59e0b" }}>
            {employeeData.reduce((sum: number, e: any) => sum + e.ptoUsed, 0)}
          </div>
          <div className="stat-label">days this year</div>
        </div>

        <div className="card-stat">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <TrendingUp size={16} color="#4ade80" />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Approved Leaves</span>
          </div>
          <div className="stat-value" style={{ color: "#4ade80" }}>{approvedLeaves.length}</div>
          <div className="stat-label">this year</div>
        </div>
      </div>

      {/* Charts + Table row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Employee table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--bg-border)" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>Employee Leave Summary</h2>
          </div>
          <div className="table-wrap" style={{ border: "none" }}>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Dept</th>
                  <th>PTO Used</th>
                  <th>PTO Left</th>
                  <th>WFH Used</th>
                  <th>WFH Left</th>
                </tr>
              </thead>
              <tbody>
                {employeeData.map((emp: any) => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(212,175,55,0.15)", color: "var(--rise-gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, flexShrink: 0 }}>
                          {getInitials(emp.name)}
                        </div>
                        <div>
                          <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{emp.name}</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{emp.designation}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{emp.department}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: 50, height: 6, background: "var(--bg-border)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(100, (emp.ptoUsed / emp.ptoTotal) * 100)}%`, background: "var(--rise-gold)", borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{emp.ptoUsed}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: emp.ptoRemaining < 3 ? "#ef4444" : emp.ptoRemaining < 6 ? "#f59e0b" : "#4ade80" }}>
                        {emp.ptoRemaining}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{emp.wfhUsed}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: emp.wfhRemaining < 2 ? "#ef4444" : "var(--text-secondary)" }}>
                        {emp.wfhRemaining}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly trend bar chart */}
        <div className="card">
          <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.5rem" }}>
            Leaves / Month
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {monthlyData.map((m) => (
              <div key={m.month} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: 32, fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "right", flexShrink: 0 }}>{m.month}</div>
                <div style={{ flex: 1, height: 20, background: "var(--bg-border)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${(m.count / maxCount) * 100}%`,
                    background: "linear-gradient(90deg, var(--rise-gold) 0%, var(--rise-gold-light) 100%)",
                    borderRadius: 4,
                    transition: "width 0.5s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingRight: 6,
                  }}>
                    {m.count > 0 && <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#000" }}>{m.count}</span>}
                  </div>
                </div>
                <div style={{ width: 20, fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "left" }}>{m.count === 0 ? "0" : ""}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Out today */}
      {outToday.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
            Out Today ({outToday.length})
          </h3>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {outToday.map((l: any) => (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.875rem", background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--bg-border)" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(212,175,55,0.15)", color: "var(--rise-gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700 }}>
                  {getInitials(l.team_member?.name ?? "?")}
                </div>
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>{l.team_member?.name}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{l.type?.toUpperCase()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
