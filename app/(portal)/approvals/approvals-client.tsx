"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatDate, getInitials, cn } from "@/lib/utils";
import { CheckCircle, XCircle, Clock, ChevronDown, X, Filter } from "lucide-react";

interface Props {
  pending: any[];
  history: any[];
  adminId: string;
}

export default function ApprovalsClient({ pending, history, adminId }: Props) {
  const supabase = createClient();
  const [pendingList, setPendingList] = useState(pending);
  const [historyList, setHistoryList] = useState(history);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [filterDept, setFilterDept] = useState("All");

  const departments = ["All", ...Array.from(new Set(pending.map((p: any) => p.team_member?.department).filter(Boolean)))];

  const filteredPending = filterDept === "All"
    ? pendingList
    : pendingList.filter((p: any) => p.team_member?.department === filterDept);

  async function handleApprove(leaveId: string) {
    setProcessing(leaveId);
    const { error } = await supabase.from("leave_requests").update({
      status: "approved",
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    }).eq("id", leaveId);

    if (error) {
      toast.error("Failed to approve: " + error.message);
    } else {
      toast.success("Leave request approved ✓");
      const approved = pendingList.find((p: any) => p.id === leaveId);
      setPendingList((prev: any[]) => prev.filter((p: any) => p.id !== leaveId));
      if (approved) setHistoryList((prev: any[]) => [{ ...approved, status: "approved" }, ...prev]);
    }
    setProcessing(null);
  }

  async function handleReject(leaveId: string) {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setProcessing(leaveId);
    const { error } = await supabase.from("leave_requests").update({
      status: "rejected",
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: rejectionReason.trim(),
    }).eq("id", leaveId);

    if (error) {
      toast.error("Failed to reject: " + error.message);
    } else {
      toast.success("Leave request rejected");
      const rejected = pendingList.find((p: any) => p.id === leaveId);
      setPendingList((prev: any[]) => prev.filter((p: any) => p.id !== leaveId));
      if (rejected) setHistoryList((prev: any[]) => [{ ...rejected, status: "rejected", rejection_reason: rejectionReason }, ...prev]);
      setRejectModal(null);
      setRejectionReason("");
    }
    setProcessing(null);
  }

  const typeLabel = (t: string) => ({ pto: "PTO", wfh: "WFH", comp_off: "Comp-off", sick: "Sick", casual: "Casual" }[t] ?? t.toUpperCase());

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div className="page-header">
        <h1 className="page-title">Leave Approvals</h1>
        <p className="page-subtitle">Review and act on pending leave requests from the team</p>
      </div>

      {/* Pending section */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>
              Pending Requests
            </h2>
            {filteredPending.length > 0 && (
              <span style={{ background: "var(--rise-gold)", color: "#000", fontSize: "0.7rem", fontWeight: 700, borderRadius: 999, padding: "0 8px", height: 20, display: "flex", alignItems: "center" }}>
                {filteredPending.length}
              </span>
            )}
          </div>

          {/* Department filter */}
          {departments.length > 2 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Filter size={14} color="var(--text-muted)" />
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="form-input"
                style={{ padding: "0.375rem 0.75rem", width: "auto", fontSize: "0.8rem" }}
              >
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}
        </div>

        {filteredPending.length === 0 ? (
          <div className="card">
            <div className="empty-state" style={{ padding: "2.5rem" }}>
              <CheckCircle color="var(--text-muted)" className="empty-state-icon" />
              <div className="empty-state-title">All caught up!</div>
              <div className="empty-state-text">No pending leave requests at this time.</div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filteredPending.map((leave: any) => (
              <LeaveCard
                key={leave.id}
                leave={leave}
                onApprove={() => handleApprove(leave.id)}
                onReject={() => setRejectModal({ id: leave.id, name: leave.team_member?.name })}
                processing={processing === leave.id}
                typeLabel={typeLabel}
              />
            ))}
          </div>
        )}
      </div>

      {/* History section */}
      <div>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1rem" }}>
          Recent History
        </h2>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {historyList.length === 0 ? (
            <div className="empty-state" style={{ padding: "2rem" }}>
              <div className="empty-state-text">No reviewed requests yet.</div>
            </div>
          ) : (
            <div className="table-wrap" style={{ border: "none" }}>
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Period</th>
                    <th>Days</th>
                    <th>Status</th>
                    <th>Reviewed</th>
                  </tr>
                </thead>
                <tbody>
                  {historyList.map((l: any) => (
                    <tr key={l.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(212,175,55,0.15)", color: "var(--rise-gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0 }}>
                            {getInitials(l.team_member?.name ?? "?")}
                          </div>
                          <div>
                            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{l.team_member?.name}</div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{l.team_member?.department}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`badge leave-chip-${l.type}`} style={{ fontSize: "0.7rem" }}>{typeLabel(l.type)}</span></td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{formatDate(l.start_date)} → {formatDate(l.end_date)}</td>
                      <td style={{ fontWeight: 600 }}>{l.total_days}</td>
                      <td><span className={`badge badge-${l.status}`}>{l.status}</span></td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{l.reviewed_at ? formatDate(l.reviewed_at) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setRejectModal(null)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h2 className="modal-title" style={{ marginBottom: 0, color: "#ef4444" }}>Reject Request</h2>
              <button onClick={() => setRejectModal(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              You're rejecting <strong style={{ color: "var(--text-primary)" }}>{rejectModal.name}'s</strong> leave request. Please provide a reason.
            </p>
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label">Rejection Reason *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Insufficient notice period, critical project deadline..."
                className="form-input"
                rows={3}
                autoFocus
              />
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleReject(rejectModal.id)} disabled={processing === rejectModal.id}>
                {processing === rejectModal.id ? "Rejecting..." : "Reject Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LeaveCard({ leave, onApprove, onReject, processing, typeLabel }: any) {
  const [expanded, setExpanded] = useState(false);
  const member = leave.team_member;
  const daysSince = Math.floor((Date.now() - new Date(leave.created_at).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Avatar */}
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(212,175,55,0.15)", color: "var(--rise-gold)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>
          {getInitials(member?.name ?? "?")}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>{member?.name}</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{member?.designation}</span>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>·</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{member?.department}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.375rem", flexWrap: "wrap" }}>
            <span className={`badge leave-chip-${leave.type}`} style={{ fontSize: "0.7rem" }}>{typeLabel(leave.type)}</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              {formatDate(leave.start_date)} → {formatDate(leave.end_date)}
            </span>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>
              {leave.total_days} day{leave.total_days !== 1 ? "s" : ""}
            </span>
            {leave.half_day_period && (
              <span className="badge badge-member" style={{ fontSize: "0.65rem" }}>Half-day {leave.half_day_period}</span>
            )}
            <span style={{ fontSize: "0.75rem", color: daysSince > 2 ? "#f59e0b" : "var(--text-muted)" }}>
              <Clock size={11} style={{ display: "inline", marginRight: 3 }} />
              {daysSince === 0 ? "today" : `${daysSince}d ago`}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0, alignItems: "center" }}>
          <button onClick={onApprove} disabled={processing} className="btn btn-success btn-sm">
            <CheckCircle size={14} />
            Approve
          </button>
          <button onClick={onReject} disabled={processing} className="btn btn-danger btn-sm">
            <XCircle size={14} />
            Reject
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.25rem" }}
          >
            <ChevronDown size={18} style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: "0.875rem", paddingTop: "0.875rem", borderTop: "1px solid var(--bg-border)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem", textTransform: "uppercase", fontWeight: 600 }}>Reason</div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{leave.reason}</p>
        </div>
      )}
    </div>
  );
}
