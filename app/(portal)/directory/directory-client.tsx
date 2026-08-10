"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { getInitials, getDepartmentColor, formatDate } from "@/lib/utils";
import { Search, SortAsc, Filter, X, Edit3, ExternalLink, Calendar, Briefcase, Mail } from "lucide-react";

interface Props {
  currentMember: any;
  team: any[];
}

export default function DirectoryClient({ currentMember, team }: Props) {
  const supabase = createClient();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"name" | "tenure">("name");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editSlack, setEditSlack] = useState("");
  const [saving, setSaving] = useState(false);

  const departments = ["All", ...Array.from(new Set(team.map((m: any) => m.department).filter(Boolean))).sort()];

  const filtered = team
    .filter((m: any) => {
      const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        m.designation?.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === "All" || m.department === deptFilter;
      return matchSearch && matchDept;
    })
    .sort((a: any, b: any) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return new Date(a.join_date ?? 0).getTime() - new Date(b.join_date ?? 0).getTime();
    });

  function openProfile(member: any) {
    setSelectedMember(member);
    setEditBio(member.bio ?? "");
    setEditSlack(member.slack_handle ?? "");
    setEditing(false);
  }

  const canEdit = selectedMember?.id === currentMember?.id || currentMember?.role === "admin";

  async function saveProfile() {
    if (!selectedMember) return;
    setSaving(true);
    const { error } = await supabase.from("team_members").update({
      bio: editBio.trim() || null,
      slack_handle: editSlack.trim() || null,
    }).eq("id", selectedMember.id);

    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("Profile updated!");
      setSelectedMember({ ...selectedMember, bio: editBio.trim() || null, slack_handle: editSlack.trim() || null });
      setEditing(false);
    }
    setSaving(false);
  }

  const tenure = (joinDate: string | null) => {
    if (!joinDate) return null;
    const months = Math.floor((Date.now() - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (months < 12) return `${months}m`;
    return `${Math.floor(months / 12)}y ${months % 12}m`;
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div className="page-header">
        <h1 className="page-title">Team Directory</h1>
        <p className="page-subtitle">{team.length} team members across {departments.length - 1} departments</p>
      </div>

      {/* Search & Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, role..."
            className="form-input"
            style={{ paddingLeft: 38 }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
              <X size={14} />
            </button>
          )}
        </div>

        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="form-input" style={{ width: "auto", paddingLeft: "0.75rem" }}>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="form-input" style={{ width: "auto", paddingLeft: "0.75rem" }}>
          <option value="name">Sort: A–Z</option>
          <option value="tenure">Sort: Tenure</option>
        </select>
      </div>

      {/* Team Grid */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Search className="empty-state-icon" color="var(--text-muted)" />
            <div className="empty-state-title">No members found</div>
            <div className="empty-state-text">Try adjusting your search or filters</div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
          {filtered.map((member: any) => (
            <div
              key={member.id}
              className="card"
              style={{ cursor: "pointer", transition: "all 0.2s ease" }}
              onClick={() => openProfile(member)}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(212,175,55,0.4)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = ""; (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}
            >
              {/* Avatar */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1rem" }}>
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt={member.name} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--bg-border)" }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(212,175,55,0.15)", color: "var(--rise-gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", fontWeight: 700, border: "2px solid rgba(212,175,55,0.3)" }}>
                    {getInitials(member.name)}
                  </div>
                )}
                <div style={{ marginTop: "0.75rem", textAlign: "center" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>{member.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>{member.designation}</div>
                </div>
              </div>

              {/* Tags */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span className={`badge ${getDepartmentColor(member.department)}`} style={{ fontSize: "0.7rem", justifyContent: "center" }}>
                  {member.department}
                </span>
                {member.role === "admin" && (
                  <span className="badge badge-admin" style={{ fontSize: "0.65rem", justifyContent: "center" }}>Admin</span>
                )}
              </div>

              {/* Tenure */}
              {member.join_date && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.875rem", justifyContent: "center" }}>
                  <Calendar size={11} color="var(--text-muted)" />
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    {tenure(member.join_date)} at RISE
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Profile Modal */}
      {selectedMember && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedMember(null)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            {/* Close */}
            <button onClick={() => setSelectedMember(null)} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
              <X size={20} />
            </button>

            {/* Profile header */}
            <div style={{ display: "flex", gap: "1.25rem", marginBottom: "1.5rem", alignItems: "flex-start" }}>
              {selectedMember.avatar_url ? (
                <img src={selectedMember.avatar_url} alt={selectedMember.name} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--bg-border)", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(212,175,55,0.15)", color: "var(--rise-gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 700, flexShrink: 0 }}>
                  {getInitials(selectedMember.name)}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                  {selectedMember.name}
                </h2>
                <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{selectedMember.designation}</div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                  <span className={`badge ${getDepartmentColor(selectedMember.department)}`} style={{ fontSize: "0.7rem" }}>{selectedMember.department}</span>
                  {selectedMember.role === "admin" && <span className="badge badge-admin" style={{ fontSize: "0.65rem" }}>Admin</span>}
                </div>
              </div>
              {canEdit && !editing && (
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
                  <Edit3 size={14} />
                  Edit
                </button>
              )}
            </div>

            <div className="divider" />

            {/* Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginBottom: "1.25rem" }}>
              <ProfileRow icon={<Mail size={15} color="var(--text-muted)" />} label="Email">
                <a href={`mailto:${selectedMember.email}`} style={{ color: "var(--rise-gold)", textDecoration: "none", fontSize: "0.875rem" }}>{selectedMember.email}</a>
              </ProfileRow>
              {selectedMember.join_date && (
                <ProfileRow icon={<Calendar size={15} color="var(--text-muted)" />} label="Joined">
                  <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{formatDate(selectedMember.join_date)} ({tenure(selectedMember.join_date)} at RISE)</span>
                </ProfileRow>
              )}
              {selectedMember.birthday && (
                <ProfileRow icon={<span style={{ fontSize: "15px" }}>🎂</span>} label="Birthday">
                  <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    {new Date(selectedMember.birthday).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
                  </span>
                </ProfileRow>
              )}

              {/* Slack */}
              {editing ? (
                <div className="form-group">
                  <label className="form-label">Slack Handle</label>
                  <input type="text" value={editSlack} onChange={(e) => setEditSlack(e.target.value)} placeholder="@handle" className="form-input" />
                </div>
              ) : selectedMember.slack_handle ? (
                <ProfileRow icon={<ExternalLink size={15} color="var(--text-muted)" />} label="Slack">
                  <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{selectedMember.slack_handle}</span>
                </ProfileRow>
              ) : null}

              {/* Bio */}
              {editing ? (
                <div className="form-group">
                  <label className="form-label">Bio</label>
                  <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Tell the team about yourself..." className="form-input" rows={3} style={{ resize: "vertical" }} />
                </div>
              ) : selectedMember.bio ? (
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Bio</div>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{selectedMember.bio}</p>
                </div>
              ) : canEdit ? (
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)} style={{ width: "fit-content" }}>
                  <Edit3 size={12} />
                  Add bio
                </button>
              ) : null}
            </div>

            {editing && (
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
      <div style={{ marginTop: "0.1rem", flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.125rem" }}>{label}</div>
        {children}
      </div>
    </div>
  );
}
