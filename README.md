# Backlog — The Ultimate Feature Prioritizer

A production-quality SaaS application for prioritizing feature requests using the RICE framework, built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🎯 **RICE Scoring** — Objectively prioritize features with Reach, Impact, Confidence, Effort scores
- 🗳️ **Team Voting** — Let your team upvote features they care about
- 📋 **Kanban Board** — Drag and drop feature requests between Now/Next/Later/Backlog
- 📊 **Insights & Analytics** — Bar, pie, and line charts for your feature backlog
- 💬 **Real-time Collaboration** — Comments and vote counts update live via Supabase Realtime
- 🔐 **Auth** — Email/password + Google OAuth with Supabase Auth
- 🌙 **Dark Mode** — System-aware theme with toggle
- 📱 **Responsive** — Mobile-friendly with hamburger menu

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database & Auth**: Supabase (PostgreSQL + Row Level Security)
- **Real-time**: Supabase Realtime
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Drag & Drop**: @dnd-kit/core
- **Charts**: Recharts
- **Notifications**: Sonner
- **Deployment**: Vercel

## Getting Started

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd feature-prioritizer
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy your Project URL and anon key
3. Enable **Google OAuth**: Go to **Authentication → Providers → Google**, enter your Google OAuth credentials
4. Set the **Site URL** in **Authentication → URL Configuration** to your app URL (e.g., `http://localhost:3000`)
5. Add `http://localhost:3000/auth/callback` to **Redirect URLs**

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Only needed for admin operations
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run Supabase Migrations

Option A — Supabase Dashboard:
1. Go to **SQL Editor** in your Supabase project
2. Copy and paste the contents of `supabase/migrations/20240101000000_initial_schema.sql`
3. Click **Run**

Option B — Supabase CLI:
```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/app
  /layout.tsx              # Root layout with providers
  /page.tsx                # Landing page
  /login/page.tsx          # Login with email + Google
  /signup/page.tsx         # Signup with password strength
  /forgot-password/page.tsx
  /verify-email/page.tsx
  /dashboard/page.tsx      # Workspace list + creation
  /workspace/[slug]/
    layout.tsx             # Server auth check
    WorkspaceLayoutClient.tsx  # Sidebar + topbar + context
    page.tsx               # Redirects to /backlog
    /backlog/page.tsx      # Table view with filters + sort
    /board/page.tsx        # Kanban drag-and-drop
    /insights/page.tsx     # Charts and analytics
    /settings/page.tsx     # Workspace settings + members
  /auth/
    /callback/route.ts     # OAuth callback handler
    /reset-password/page.tsx

/components
  /ui/                     # shadcn/ui components
  /providers/
    ThemeProvider.tsx      # next-themes wrapper
    QueryProvider.tsx      # TanStack Query wrapper
  /features/
    /auth/
      LoginForm.tsx
      SignupForm.tsx
      GoogleButton.tsx
    /requests/
      RequestModal.tsx     # New feature request dialog
      RequestSlideOver.tsx # Detail panel with comments
      RICEForm.tsx         # RICE scoring sliders
    /workspace/
      WorkspaceSidebar.tsx # Nav + user menu

/lib
  /supabase/
    client.ts              # Browser Supabase client
    server.ts              # Server Supabase client
  /utils/
    rice.ts                # RICE score calculation, status config
    cn.ts                  # Tailwind class merging

/types
  database.types.ts        # Supabase table types

/supabase
  /migrations/
    20240101000000_initial_schema.sql  # All tables + RLS + triggers

/middleware.ts             # Route protection
```

## Deployment on Vercel

1. Push your code to GitHub
2. Import the repository on [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Set `NEXT_PUBLIC_SITE_URL` to your Vercel deployment URL
5. Update Supabase redirect URLs to include your Vercel URL
6. Deploy!

## Database Schema

See `supabase/migrations/20240101000000_initial_schema.sql` for the full schema including:

- `profiles` — User profiles synced from Supabase Auth
- `workspaces` — Team workspaces
- `workspace_members` — Many-to-many with roles (admin/member)
- `feature_requests` — Core table with RICE scores (auto-calculated as stored column)
- `votes` — One vote per user per request
- `comments` — Nested comments on requests

All tables have Row Level Security (RLS) enabled.

## Google OAuth Setup

1. Create a project on [Google Cloud Console](https://console.cloud.google.com)
2. Enable the **Google+ API**
3. Create OAuth 2.0 credentials (Web application)
4. Add your Supabase OAuth callback URL as an authorized redirect URI:
   `https://your-project.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret to Supabase **Authentication → Providers → Google**
