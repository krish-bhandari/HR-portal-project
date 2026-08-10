"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardCheck,
  Megaphone,
  Users,
  BarChart3,
  FileText,
  LogOut,
  Menu,
  X,
  Bell,
} from "lucide-react";
import { TeamMember } from "@/lib/supabase/types";
import { getInitials } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leave", label: "Apply Leave", icon: CalendarDays },
  { href: "/approvals", label: "Approvals", icon: ClipboardCheck, adminOnly: true },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/directory", label: "Directory", icon: Users },
];

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Insights", icon: BarChart3 },
  { href: "/admin/audit", label: "Audit Log", icon: FileText },
];

interface PortalLayoutClientProps {
  children: React.ReactNode;
  member: TeamMember;
}

export default function PortalLayoutClient({ children, member }: PortalLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const isAdmin = member.role === "admin";

  useEffect(() => {
    if (isAdmin) {
      fetchPendingCount();
    }
  }, [isAdmin]);

  async function fetchPendingCount() {
    const { count } = await supabase
      .from("leave_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    setPendingCount(count ?? 0);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/login");
  }

  const navItems = isAdmin
    ? NAV_ITEMS
    : NAV_ITEMS.filter((i) => !i.adminOnly);

  return (
    <div className="portal-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 45,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* Sidebar */}
      <aside className={`portal-sidebar ${sidebarOpen ? "open" : ""}`}>
        {/* Logo */}
        <div className="nav-logo">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: 38,
                height: 38,
                background: "linear-gradient(135deg, var(--rise-gold) 0%, var(--rise-gold-dark) 100%)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "#000",
                flexShrink: 0,
              }}
            >
              R
            </div>
            <div>
              <div className="nav-logo-text">RISE</div>
              <div className="nav-logo-sub">Research Portal</div>
            </div>
          </div>
        </div>

        {/* Main Nav */}
        <div className="nav-section" style={{ flex: 1 }}>
          <div className="nav-section-title">Navigation</div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href || pathname.startsWith(item.href + "/") ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="nav-icon" />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.href === "/approvals" && pendingCount > 0 && (
                <span
                  style={{
                    background: "var(--rise-gold)",
                    color: "#000",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    borderRadius: "999px",
                    padding: "0 6px",
                    minWidth: 18,
                    height: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className="nav-section-title" style={{ marginTop: "1.5rem" }}>Admin</div>
              {ADMIN_NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${pathname === item.href ? "active" : ""}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="nav-icon" />
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </div>

        {/* User Profile at bottom */}
        <div
          style={{
            padding: "1rem",
            borderTop: "1px solid var(--bg-border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem",
              borderRadius: 10,
              background: "var(--bg-card)",
              border: "1px solid var(--bg-border)",
              marginBottom: "0.5rem",
            }}
          >
            {member.avatar_url ? (
              <img
                src={member.avatar_url}
                alt={member.name}
                className="avatar avatar-sm"
                style={{ borderRadius: "50%" }}
              />
            ) : (
              <div
                className="avatar avatar-sm"
                style={{
                  background: "rgba(212,175,55,0.2)",
                  color: "var(--rise-gold)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {getInitials(member.name)}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {member.name}
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {member.designation}
              </div>
            </div>
            {isAdmin && (
              <span className="badge badge-admin" style={{ fontSize: "0.6rem" }}>Admin</span>
            )}
          </div>

          <button
            onClick={handleSignOut}
            className="nav-item"
            style={{ width: "100%", color: "#ef4444", marginBottom: 0 }}
          >
            <LogOut className="nav-icon" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="portal-main">
        {/* Top header */}
        <header className="portal-header">
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              display: "none",
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "0.25rem",
              marginRight: "1rem",
            }}
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div style={{ flex: 1 }} />

          {/* Header actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {isAdmin && pendingCount > 0 && (
              <Link href="/approvals" style={{ position: "relative", display: "flex" }}>
                <Bell size={20} color="var(--text-secondary)" />
                <span
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    background: "var(--rise-gold)",
                    color: "#000",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    borderRadius: "999px",
                    padding: "0 4px",
                    minWidth: 16,
                    height: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {pendingCount}
                </span>
              </Link>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
              }}
            >
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.name}
                  className="avatar avatar-sm"
                  style={{ borderRadius: "50%" }}
                />
              ) : (
                <div
                  className="avatar avatar-sm"
                  style={{
                    background: "rgba(212,175,55,0.2)",
                    color: "var(--rise-gold)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  {getInitials(member.name)}
                </div>
              )}
              <span style={{ display: "none" }}>{member.name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="portal-content">
          {children}
        </main>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
