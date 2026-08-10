<div align="center">

<img src="https://img.shields.io/badge/RISE_Research-HR_Portal-D4AF37?style=for-the-badge&labelColor=002366" alt="RISE HR Portal" />

# 🏛️ RISE Research — HR Portal

**A premium internal HR portal for modern research teams**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-rise--portal--eta.vercel.app-D4AF37?style=for-the-badge&labelColor=002366)](https://rise-portal-eta.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vercel](https://img.shields.io/badge/Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)

---

*Consolidating leave management, team announcements, shared calendar, and team directory into one beautiful portal — replacing ad-hoc emails forever.*

</div>

---

## ✨ Features

### 🗓️ Leave Management
- **5 Leave Types** — PTO, WFH, Comp-off, Sick, Casual
- **Half-day support** with AM/PM selection
- **Smart business-day calculator** — Sundays: 0 days, Saturdays: 0.5 days, Holidays: skipped
- **Live balance preview** before submission
- **Auto balance deduction** via PostgreSQL triggers on approval

### ✅ Admin Approvals Dashboard
- Chronological pending request queue with expandable reason cards
- One-click Approve / Reject with mandatory rejection reason
- Department filter for large teams
- Full review history table

### 📅 Shared Calendar
- Monthly mini-calendar on dashboard with colour-coded events
- Gold = PTO | Blue = WFH | Green = Holiday | Pink = Birthday
- Today highlighted with a gold pill

### 📢 Announcements Feed
- **Admin-only posting** with rich text body + media attachments (images/video)
- Pin important announcements to the top
- **Reactions** — 💡 Knowledge & ❤️ Love
- **Threaded replies** (single-level) with live post
- 24-hour edit window for authors

### 👥 Team Directory
- Responsive card grid — sort A–Z or by tenure
- Filter by department
- Profile modal with self-edit (Slack handle + Bio)
- Google avatar sync on login

### 📊 Admin Insights (Admin only)
- Per-employee PTO / WFH used vs. remaining with inline mini bar charts
- Summary stat cards — team size, out today, total leaves this year
- Monthly leave trend bar chart (last 6 months)
- "Out Today" panel with avatars

### 🔒 Security & Audit
- **Row Level Security (RLS)** on every table in Supabase
- Members can only see their own leave requests
- **Immutable audit log** — no UPDATE/DELETE policies on `audit_log`
- Role is sourced from DB — cannot be changed from the app

### 🤖 Automation
- **Daily 9 AM IST digest** to Slack via Supabase Edge Function + pg_cron
- Skips Sundays and national holidays automatically
- Slack Block Kit message with @mentions using Slack handles
- Nightly **Airtable → Supabase sync** Edge Function

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) + TypeScript Strict |
| **Styling** | Vanilla CSS with RISE design tokens (no Tailwind runtime) |
| **Database** | Supabase (PostgreSQL 15) |
| **Auth** | Supabase Auth + Google OAuth 2.0 (SSO) |
| **Storage** | Supabase Storage (announcement media) |
| **Edge Functions** | Supabase Deno Edge Functions |
| **Scheduling** | pg_cron (inside Supabase) |
| **Data Sync** | Airtable REST API → Supabase upsert |
| **Notifications** | Slack Incoming Webhooks |
| **Deployment** | Vercel (Serverless + Edge) |
| **Icons** | Lucide React |
| **Fonts** | Playfair Display (headings) + Inter (body) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Next.js App Router (SSR)               │   │
│  │                                                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │   │
│  │  │  /login  │  │/dashboard│  │ /leave        │  │   │
│  │  │          │  │/calendar │  │ /approvals    │  │   │
│  │  │ Google   │  │          │  │ /announcements│  │   │
│  │  │  SSO     │  │ Server   │  │ /directory    │  │   │
│  │  │          │  │Components│  │ /admin        │  │   │
│  │  └──────────┘  └──────────┘  └───────────────┘  │   │
│  │                                                   │   │
│  │  middleware.ts → Auth guard on all /portal routes │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │      Supabase       │
              │                     │
              │  ┌───────────────┐  │
              │  │  PostgreSQL   │  │
              │  │  + RLS        │  │
              │  │  + Triggers   │  │
              │  │  + pg_cron    │  │
              │  └───────────────┘  │
              │  ┌───────────────┐  │
              │  │  Auth (Google)│  │
              │  └───────────────┘  │
              │  ┌───────────────┐  │
              │  │  Storage      │  │
              │  │  (media)      │  │
              │  └───────────────┘  │
              │  ┌───────────────┐  │
              │  │ Edge Functions│  │
              │  │ daily-digest  │◄─┼──── pg_cron 9AM IST
              │  │ airtable-sync │◄─┼──── pg_cron midnight
              │  └───────────────┘  │
              └──────┬──────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
  ┌──────▼──────┐       ┌───────▼──────┐
  │   Slack     │       │   Airtable   │
  │  #general   │       │  Team Table  │
  │  Webhook    │       │  (source of  │
  │  Daily OOO  │       │   truth)     │
  └─────────────┘       └─────────────┘
```

### Key Architectural Decisions

- **Server Components First** — Data fetching happens on the server (no client waterfalls, no exposed keys)
- **RLS as the security layer** — Not just API-level guards; DB enforces access at row level
- **Trigger-based balance deduction** — Leave balance updates happen atomically in PostgreSQL, not in application code
- **Saturday = 0.5 day** — Business logic runs server-side in `lib/leave-calculator.ts`, never trusted from client
- **Role from DB** — `is_admin()` is a PostgreSQL function that reads from `team_members.role`, not from JWT claims

---

## 🗄️ Database Schema

```
team_members          ← Synced from Airtable (or manual insert)
  ├── id, name, email, role (member|admin)
  ├── department, designation, avatar_url
  ├── slack_handle, bio (self-editable)
  └── join_date, birthday, airtable_id

leave_requests        ← All leave applications
  ├── user_id → team_members
  ├── type (pto|wfh|comp_off|sick|casual)
  ├── start_date, end_date, half_day_period
  ├── total_days (computed server-side)
  └── status (pending|approved|rejected)

leave_balances        ← Auto-updated by trigger on approval
  └── pto_total/used, wfh_total/used, comp_off_balance

national_holidays     ← Pre-seeded Indian gazetted holidays
announcements         ← Admin-only posts with media
announcement_reactions← knowledge 💡 | love ❤️
announcement_replies  ← Single-level threaded replies
audit_log             ← Immutable (no DELETE/UPDATE policy)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- Google Cloud project with OAuth 2.0 credentials
- (Optional) Slack Incoming Webhook URL

### 1. Clone & Install

```bash
git clone https://github.com/Mjsharma1234/rise-portal.git
cd rise-portal
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Airtable (optional — for team sync)
AIRTABLE_API_KEY=patyour_key
AIRTABLE_BASE_ID=appyour_base_id
AIRTABLE_TABLE_NAME=Team

# Slack (optional — for daily digest)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run the Database Migration

In Supabase → SQL Editor, paste and run:

```bash
# File is at:
supabase/migrations/001_initial_schema.sql
```

This creates all tables, RLS policies, triggers, and seeds Indian national holidays.

### 4. Enable Google OAuth

1. Supabase → Authentication → Providers → Google → Enable
2. Copy the Redirect URL: `https://your-project.supabase.co/auth/v1/callback`
3. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
4. Paste Client ID + Secret back into Supabase

### 5. Seed your first Admin

```sql
INSERT INTO team_members (name, email, role, department, designation)
VALUES ('Your Name', 'you@company.com', 'admin', 'Leadership', 'CEO');
```

### 6. Run Locally

```bash
npm run dev
# → http://localhost:3000
```

---

## ☁️ Deployment (Vercel)

```bash
npx vercel --prod
```

Add all environment variables in **Vercel → Project Settings → Environment Variables**.

---

## ⚙️ Supabase Edge Functions

```bash
supabase functions deploy daily-digest
supabase functions deploy airtable-sync

supabase secrets set SLACK_WEBHOOK_URL=your_webhook
supabase secrets set AIRTABLE_API_KEY=your_key
supabase secrets set AIRTABLE_BASE_ID=your_base_id
```

Schedule via pg_cron:

```sql
-- Daily 9:00 AM IST (3:30 AM UTC), Mon–Sat
SELECT cron.schedule('daily-digest', '30 3 * * 1-6',
  $$SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/daily-digest',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  )$$
);

-- Nightly Airtable sync at midnight IST
SELECT cron.schedule('airtable-sync', '30 18 * * *',
  $$SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/airtable-sync',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  )$$
);
```

---

## 📁 Project Structure

```
rise-portal/
├── app/
│   ├── (portal)/           # Protected routes (all require auth)
│   │   ├── layout.tsx      # Server: fetches user profile
│   │   ├── layout-client   # Sidebar, nav, mobile menu
│   │   ├── dashboard/      # Mini calendar + stats
│   │   ├── leave/          # Apply + history
│   │   ├── approvals/      # Admin: pending queue
│   │   ├── announcements/  # Feed + reactions + replies
│   │   ├── directory/      # Team grid + profile modal
│   │   └── admin/          # Insights + audit log
│   ├── login/              # Google SSO page
│   └── auth/callback/      # OAuth exchange handler
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Browser client
│   │   ├── server.ts       # Server + service role clients
│   │   └── types.ts        # Full TypeScript DB types
│   ├── leave-calculator.ts # Saturday 0.5-day rule
│   └── utils.ts            # cn(), formatDate(), getInitials()
├── middleware.ts            # Auth route protection
└── supabase/
    ├── migrations/
    │   └── 001_initial_schema.sql
    └── functions/
        ├── daily-digest/   # 9AM IST Slack OOO message
        └── airtable-sync/  # Nightly team data sync
```

---

## 🎨 Design System

| Token | Value |
|---|---|
| Primary Gold | `#D4AF37` |
| Deep Blue | `#002366` |
| Background | `#060912` |
| Card Surface | `#111827` |
| Heading Font | Playfair Display (serif) |
| Body Font | Inter (sans-serif) |

Dark mode only. Every component uses CSS custom properties — no Tailwind runtime overhead.

---

## 🔐 Role Permissions

| Feature | Member | Admin |
|---|---|---|
| View dashboard & calendar | ✅ | ✅ |
| Apply for own leave | ✅ | ✅ |
| View own leave history | ✅ | ✅ |
| View team directory | ✅ | ✅ |
| View announcements | ✅ | ✅ |
| Post announcements | ❌ | ✅ |
| Approve / reject leave | ❌ | ✅ |
| View admin insights | ❌ | ✅ |
| Manage holidays | ❌ | ✅ |
| View audit log | ❌ | ✅ |

> Role is read from `team_members.role` in PostgreSQL on every request. It cannot be elevated from within the app.

---

## 📄 License

**Private & Confidential** — © 2026 RISE Research. Internal use only.

---

<div align="center">

**Built with ❤️ for the RISE Research team**

[![Open Portal](https://img.shields.io/badge/🌐_Open_Portal-rise--portal--eta.vercel.app-D4AF37?style=for-the-badge&labelColor=002366)](https://rise-portal-eta.vercel.app)

</div>
