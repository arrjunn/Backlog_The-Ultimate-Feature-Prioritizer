# Backlog — The Ultimate Feature Prioritizer

A production-quality SaaS for teams to collect, score, and ship the right features. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

**Live Demo**: [backlog-the-ultimate-feature-priori.vercel.app](https://backlog-the-ultimate-feature-priori.vercel.app/)

---

## What It Does

Backlog replaces messy spreadsheets and gut-feel prioritization with a structured system. Teams submit feature requests, score them with proven frameworks, vote on what matters, and visualize their roadmap — all in real time.

---

## Features

### Prioritization Frameworks (7 built-in)
- **RICE** — Reach, Impact, Confidence, Effort
- **MoSCoW** — Must, Should, Could, Won't
- **JTBD** — Jobs To Be Done scoring
- **Kano** — Customer satisfaction model
- **ICE** — Impact, Confidence, Ease
- **WSJF** — Weighted Shortest Job First
- **Value vs Effort** — Simple 2-axis scoring

### Core Features
- **Backlog Table** — Sortable, filterable table with tag system and framework score badges
- **Kanban Board** — Drag-and-drop cards between Now / Next / Later / Backlog columns
- **Team Voting** — One vote per user per request, real-time count updates
- **Comments** — Threaded discussions on each feature request
- **Insights Dashboard** — Bar, pie, and line charts for backlog analytics
- **Command Palette** — `Cmd+K` to quickly search and navigate
- **Activity Feed** — Live feed of recent workspace activity
- **Online Presence** — See who's currently viewing the workspace

### UX Details
- **Dark/Light Mode** — Auto-detects time of day (6am-6pm = light), manual toggle override
- **Lofi Player** — Built-in music player (SomaFM stations) + ambient sounds (rain, wind, cafe, waves)
- **Hero Cipher Effect** — Typewriter + scramble/decode animation on the landing page
- **Smooth Sidebar** — Hover-to-expand with 350ms cubic-bezier transitions
- **Responsive** — Mobile-friendly with adaptive layouts
- **Brutalist Design** — Editorial typography with monospace + serif fonts, grain texture, custom cursor

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui + custom CSS design system |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth (Email/Password + Google OAuth) |
| Real-time | Supabase Realtime (presence + broadcasts) |
| State | TanStack Query (React Query) |
| Forms | React Hook Form + Zod validation |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Charts | Recharts |
| Animations | Custom hooks (scroll reveal, parallax, 3D tilt, magnetic buttons) |
| Notifications | Sonner toast |
| Deployment | Vercel |

---

## Project Structure

```
app/
  page.tsx                          # Landing page (hero, demo board, framework picker)
  layout.tsx                        # Root layout with ThemeProvider, QueryProvider
  dashboard/page.tsx                # Workspace list + creation
  login/page.tsx                    # Email + Google sign in
  signup/page.tsx                   # Sign up with password strength meter
  forgot-password/page.tsx          # Password reset request
  verify-email/page.tsx             # Email verification prompt
  auth/
    callback/route.ts               # OAuth callback handler
    reset-password/page.tsx         # Set new password
  workspace/[slug]/
    layout.tsx                      # Server-side auth guard
    WorkspaceLayoutClient.tsx       # Sidebar + command bar + context provider
    page.tsx                        # Redirects to /backlog
    backlog/page.tsx                # Table view — sort, filter, search, tag filter
    board/page.tsx                  # Kanban — drag cards, confetti on ship
    insights/page.tsx               # Charts — status breakdown, trends, top requests
    frameworks/page.tsx             # Framework comparison + guide
    settings/page.tsx               # Workspace name, members, roles, integrations
  api/
    ai-suggest/route.ts             # AI-powered feature suggestions
    digest/route.ts                 # Email digest generation
    notify/route.ts                 # Notification dispatch
    integrations/
      jira/route.ts                 # Jira sync
      linear/route.ts               # Linear sync
      notion/route.ts               # Notion sync

components/
  ui/                               # shadcn/ui primitives (button, input, dialog, etc.)
  providers/
    ThemeProvider.tsx                # next-themes wrapper
    QueryProvider.tsx                # TanStack Query wrapper
    AnimationProvider.tsx            # Page transitions + cursor
  features/
    auth/
      LoginForm.tsx                 # Email/password login form
      SignupForm.tsx                 # Signup with strength indicator
      GoogleButton.tsx              # Google OAuth button
    requests/
      RequestModal.tsx              # Create/edit feature request
      RequestSlideOver.tsx          # Detail panel with comments + scoring
      RICEForm.tsx                  # RICE scoring sliders
    workspace/
      WorkspaceSidebar.tsx          # Collapsible icon rail + expanded nav
      CommandPalette.tsx            # Cmd+K search overlay
      ActivityFeed.tsx              # Recent activity stream
      OnlinePresenceAvatars.tsx     # Live user presence dots
      LofiPlayer.tsx                # Music + ambiance player
      WorkspaceAvatar.tsx           # Deterministic workspace icon
    frameworks/
      FrameworkSwitcher.tsx         # Switch active scoring framework
      FrameworkGuide.tsx            # Framework explanations

hooks/
  useAnimations.ts                  # Scroll reveal, parallax, 3D tilt, magnetic, glass nav
  useAutoTheme.ts                   # Time-based auto dark/light with manual override
  useWorkspacePresence.ts           # Supabase Realtime presence tracking

lib/
  supabase/
    client.ts                       # Browser Supabase client (typed)
    server.ts                       # Server Supabase client
    untyped-client.ts               # Raw client for admin operations
    api-auth.ts                     # API route auth helpers
  utils/
    rice.ts                         # Score calculation, status config, slug generation
    cn.ts                           # Tailwind class merging (clsx + twMerge)
    shared.ts                       # Shared utilities (getInitials, etc.)

types/
  database.types.ts                 # Supabase-generated table types

supabase/migrations/
  20240101000000_initial_schema.sql         # Core tables + RLS + triggers
  20240102000000_fix_workspace_rls.sql      # RLS policy fixes
  20240103000000_fix_rls_recursion.sql      # Recursive RLS fix
  20260221000000_add_frameworks.sql         # Multi-framework support
  20260228000000_add_viewer_role.sql        # Viewer role for members
  20260228000001_workspace_integrations.sql # Integration settings table
  20260308000000_add_performance_indexes.sql # Query performance indexes

middleware.ts                       # Route protection (redirect unauthenticated users)
vercel.json                         # Vercel deployment config
```

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/arrjunn/Backlog_The-Ultimate-Feature-Prioritizer.git
cd Backlog_The-Ultimate-Feature-Prioritizer
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings > API** — copy your Project URL and anon key
3. Enable **Google OAuth**: **Authentication > Providers > Google** with your Google Cloud credentials
4. Set **Site URL** in **Authentication > URL Configuration** to `http://localhost:3000`
5. Add `http://localhost:3000/auth/callback` to **Redirect URLs**

### 3. Environment Variables

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run Migrations

**Option A** — Supabase Dashboard:
1. Go to **SQL Editor** in your Supabase project
2. Run each migration file in `supabase/migrations/` in order

**Option B** — Supabase CLI:
```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (synced from Supabase Auth via trigger) |
| `workspaces` | Team workspaces with slug, name, active framework |
| `workspace_members` | Many-to-many with roles: `admin`, `member`, `viewer` |
| `feature_requests` | Core table — title, description, status, RICE scores, tags, framework scores |
| `votes` | One vote per user per request (unique constraint) |
| `comments` | Threaded comments on feature requests |
| `workspace_integrations` | Jira/Linear/Notion integration settings |

All tables have **Row Level Security (RLS)** enabled. Members can only access data within their workspaces.

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Add environment variables
4. Set `NEXT_PUBLIC_SITE_URL` to your Vercel URL
5. Update Supabase redirect URLs to include your Vercel domain
6. Deploy

---

## Google OAuth Setup

1. Create a project on [Google Cloud Console](https://console.cloud.google.com)
2. Enable the **Google+ API**
3. Create **OAuth 2.0 credentials** (Web application type)
4. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
5. Copy Client ID + Secret to Supabase **Authentication > Providers > Google**

---

## Author

**Arjun Varshney**

- [GitHub](https://github.com/arrjunn)
- [LinkedIn](https://www.linkedin.com/in/arjun-varshney-/)
- [Portfolio](https://determined-burst-7ca.notion.site/Personal-Portfolio-021b6fec0d0049819cf42ecdd8126de4)

---

## License

MIT
