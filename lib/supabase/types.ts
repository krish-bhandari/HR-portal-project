// lib/supabase/types.ts — Database type definitions
export type UserRole = "member" | "admin";
export type LeaveType = "pto" | "wfh" | "comp_off" | "sick" | "casual";
export type LeaveStatus = "pending" | "approved" | "rejected";
export type HalfDayPeriod = "AM" | "PM";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation: string;
  avatar_url: string | null;
  slack_handle: string | null;
  bio: string | null;
  join_date: string;
  birthday: string | null;
  airtable_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  type: LeaveType;
  start_date: string;
  end_date: string;
  half_day_period: HalfDayPeriod | null;
  total_days: number;
  reason: string;
  status: LeaveStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  team_member?: TeamMember;
  reviewer?: TeamMember;
}

export interface LeaveBalance {
  id: string;
  user_id: string;
  year: number;
  pto_total: number;
  pto_used: number;
  wfh_total: number;
  wfh_used: number;
  comp_off_balance: number;
  created_at: string;
  updated_at: string;
}

export interface NationalHoliday {
  id: string;
  date: string;
  name: string;
  year: number;
  created_at: string;
}

export interface Announcement {
  id: string;
  author_id: string;
  title: string;
  body_json: Record<string, unknown>;
  body_html: string;
  media_urls: string[];
  is_pinned: boolean;
  edited_at: string | null;
  created_at: string;
  author?: TeamMember;
  reactions?: AnnouncementReaction[];
  reply_count?: number;
}

export interface AnnouncementReaction {
  id: string;
  post_id: string;
  user_id: string;
  type: "knowledge" | "love";
  created_at: string;
}

export interface AnnouncementReply {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  mentions: string[];
  created_at: string;
  author?: TeamMember;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
  actor?: TeamMember;
}
