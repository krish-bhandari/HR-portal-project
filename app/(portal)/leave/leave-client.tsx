"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { calculateLeaveDays } from "@/lib/leave-calculator";
import { formatDate } from "@/lib/utils";
import { CalendarDays, Home, Clock, Heart, Briefcase, ChevronRight, X, AlertCircle } from "lucide-react";

const LEAVE_TYPES = [
  { value: "pto", label: "Paid Time Off", icon: Umbrella, color: "var(--rise-gold)", desc: "Annual paid leave" },
  { value: "wfh", label: "Work From Home", icon: HomeIcon, color: "#60a5fa", desc: "Remote work day" },
  { value: "comp_off", label: "Compensatory Off", icon: Clock, color: "#a78bfa", desc: "Lieu of extra work" },
  { value: "sick", label: "Sick Leave", icon: Heart, color: "#f87171", desc: "Medical / unwell" },
  { value: "casual", label: "Casual Leave", icon: Briefcase, color: "#4ade80", desc: "Personal errand" },
];

function Umbrella({ size = 16, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 12a11.05 11.05 0 0 0-22 0zm-5 7a3 3 0 0 1-6 0v-7"/></svg>;
}
function HomeIcon({ size = 16, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}

interface Props {
  member: any;
  balance: any;
  myLeaves: any[];
  holidays: any[];
}

export default function LeaveClient({ member, balance, myLeaves, holidays }: Props) {
  const supabase = createClient();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [leaveType, setLeaveType] = useState("pto");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<"AM" | "PM">("AM");
  const [reason, setReason] = useState("");

  const ptoRemaining = (balance?.pto_total ?? 18) - (balance?.pto_used ?? 0);
  const wfhRemaining = (balance?.wfh_total ?? 12) - (balance?.wfh_used ?? 0);

  // Calculate preview days
  const preview = startDate && endDate
    ? calculateLeaveDays(startDate, endDate, holidays, isHalfDay ? halfDayPeriod : null)
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (endDate < startDate) {
      toast.error("End date cannot be before start date");
      return;
    }

    const totalDays = preview?.totalDays ?? 0;

    // Balance check
    if (leaveType === "pto" && totalDays > ptoRemaining) {
      toast.error(`Insufficient PTO balance. You have ${ptoRemaining} days remaining.`);
      return;
    }
    if (leaveType === "wfh" && totalDays > wfhRemaining) {
      toast.error(`Insufficient WFH balance. You have ${wfhRemaining} days remaining.`);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("leave_requests").insert({
      user_id: member.id,
      type: leaveType,
      start_date: startDate,
      end_date: endDate,
      half_day_period: isHalfDay ? halfDayPeriod : null,
      total_days: totalDays,
      reason: reason.trim(),
      status: "pending",
    });

    if (error) {
      toast.error("Failed to submit: " + error.message);
    } else {
      toast.success("Leave request submitted! Awaiting admin approval.");
      setShowForm(false);
      setStartDate(""); setEndDate(""); setReason(""); setIsHalfDay(false);
      window.location.reload();
    }
    setSubmitting(false);
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { pending: "badge-pending", approved: "badge-approved", rejected: "badge-rejected" };
    return `badge ${map[status] ?? "badge-member"}`;
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">Apply, track, and manage your leave requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <CalendarDays size={16} />
          Apply for Leave
        </button>
      </div>

      {/* Balance Cards */}
      <div className="stats-grid" style={{ marginBottom: "2rem" }}>
        {[
          { label: "PTO Remaining", value: ptoRemaining, total: balance?.pto_total ?? 18, color: "var(--rise-gold)", used: balance?.pto_used ?? 0 },
          { label: "WFH Remaining", value: wfhRemaining, total: balance?.wfh_total ?? 12, color: "#60a5fa", used: balance?.wfh_used ?? 0 },
          { label: "Comp-off Balance", value: balance?.comp_off_balance ?? 0, total: null, color: "#a78bfa", used: null },
        ].map((b) => (
          <div key={b.label} className="card-stat">
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>{b.label}</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: b.color, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>{b.value}</div>
            {b.total && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>of {b.total} days · {b.used} used</div>}
            {b.total && (
              <div style={{ height: 4, background: "var(--bg-border)", borderRadius: 2, marginTop: "0.75rem", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, Math.round(((b.used ?? 0) / b.total) * 100))}%`, background: b.color, borderRadius: 2 }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Leave History Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--bg-border)" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>My Leave History</h2>
        </div>
        {myLeaves.length === 0 ? (
          <div className="empty-state">
            <CalendarDays className="empty-state-icon" color="var(--text-muted)" />
            <div className="empty-state-title">No leave requests yet</div>
            <div className="empty-state-text">Click "Apply for Leave" to submit your first request</div>
          </div>
        ) : (
          <div className="table-wrap" style={{ border: "none" }}>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Applied On</th>
                </tr>
              </thead>
              <tbody>
                {myLeaves.map((l: any) => (
                  <tr key={l.id}>
                    <td>
                      <span className={`badge leave-chip-${l.type}`} style={{ fontSize: "0.7rem" }}>
                        {l.type === "pto" ? "PTO" : l.type === "wfh" ? "WFH" : l.type === "comp_off" ? "Comp-off" : l.type === "sick" ? "Sick" : "Casual"}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{formatDate(l.start_date)}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{formatDate(l.end_date)}</td>
                    <td style={{ fontWeight: 600 }}>{l.total_days}{l.half_day_period ? ` (${l.half_day_period})` : ""}</td>
                    <td style={{ color: "var(--text-secondary)", maxWidth: "200px" }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.reason}</span>
                    </td>
                    <td><span className={statusBadge(l.status)}>{l.status}</span></td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{formatDate(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 600 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h2 className="modal-title" style={{ marginBottom: 0 }}>Apply for Leave</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Leave Type */}
              <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                <label className="form-label">Leave Type *</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                  {LEAVE_TYPES.map((lt) => (
                    <button
                      key={lt.value}
                      type="button"
                      onClick={() => setLeaveType(lt.value)}
                      style={{
                        padding: "0.75rem 0.5rem",
                        borderRadius: 8,
                        border: `1px solid ${leaveType === lt.value ? lt.color : "var(--bg-border)"}`,
                        background: leaveType === lt.value ? `${lt.color}18` : "var(--bg-elevated)",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.375rem",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <lt.icon size={18} color={leaveType === lt.value ? lt.color : "var(--text-muted)"} />
                      <span style={{ fontSize: "0.7rem", fontWeight: 600, color: leaveType === lt.value ? lt.color : "var(--text-secondary)" }}>
                        {lt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); if (!endDate) setEndDate(e.target.value); }}
                    className="form-input"
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="form-input"
                    min={startDate || new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </div>

              {/* Half Day */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", padding: "0.75rem 1rem", background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--bg-border)" }}>
                <input
                  type="checkbox"
                  id="halfday"
                  checked={isHalfDay}
                  onChange={(e) => setIsHalfDay(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "var(--rise-gold)", cursor: "pointer" }}
                />
                <label htmlFor="halfday" style={{ fontSize: "0.875rem", color: "var(--text-primary)", cursor: "pointer", flex: 1 }}>
                  Half-day leave
                </label>
                {isHalfDay && (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {(["AM", "PM"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setHalfDayPeriod(p)}
                        style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: 6,
                          border: `1px solid ${halfDayPeriod === p ? "var(--rise-gold)" : "var(--bg-border)"}`,
                          background: halfDayPeriod === p ? "rgba(212,175,55,0.15)" : "transparent",
                          color: halfDayPeriod === p ? "var(--rise-gold)" : "var(--text-muted)",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Day preview */}
              {preview && (
                <div style={{
                  padding: "0.875rem 1rem",
                  background: "rgba(212,175,55,0.08)",
                  border: "1px solid rgba(212,175,55,0.25)",
                  borderRadius: 8,
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}>
                  <AlertCircle size={16} color="var(--rise-gold)" />
                  <span style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>
                    This leave request will deduct{" "}
                    <strong style={{ color: "var(--rise-gold)" }}>{preview.totalDays} day{preview.totalDays !== 1 ? "s" : ""}</strong>
                    {preview.breakdown.saturdays > 0 && (
                      <span style={{ color: "var(--text-muted)" }}> (incl. {preview.breakdown.saturdays} Saturday{preview.breakdown.saturdays > 1 ? "s" : ""} @ 0.5d each)</span>
                    )}
                  </span>
                </div>
              )}

              {/* Reason */}
              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label className="form-label">Reason *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Brief reason for your leave..."
                  className="form-input"
                  rows={3}
                  style={{ resize: "vertical" }}
                  required
                />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Request"}
                  {!submitting && <ChevronRight size={16} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
