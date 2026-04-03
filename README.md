# Backlog — The Ultimate Feature Prioritizer

A production-quality SaaS for teams to collect, score, and ship the right features. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

**Live Demo**: [backlog-the-ultimate-feature-priori.vercel.app](https://backlog-the-ultimate-feature-priori.vercel.app/)

---

## What It Does

Backlog replaces messy spreadsheets and gut-feel prioritization with a structured system. Teams submit feature requests, score them with proven frameworks, vote on what matters, auto-discover themes with AI-powered clustering, ask natural language questions about their backlog, and visualize their roadmap — all in real time.

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

### AI & Smart Features
- **Ask AI (RAG Q&A)** — Natural language Q&A over your backlog powered by Groq (Llama 3.3 70B). Retrieves relevant requests via vector similarity search, synthesizes answers grounded in actual data. Sources are displayed with clickable references
- **Auto-Triage** — Multi-step AI chain that automatically classifies new requests: Step 1 classifies type (bug/feature/improvement/question), Step 2 assigns priority (high/medium/low) with reasoning, Step 3 suggests relevant tags. Runs automatically after embedding generation
- **Auto-Clustering** — K-means++ on 3072-dim embeddings to auto-discover themes across feature requests. Adjustable cluster count (2-10), auto-generated cluster names from keyword frequency, click-through to request details
- **Semantic Search** — Vector similarity search powered by Google Gemini embeddings and pgvector. Find related requests by meaning, not just keywords
- **AI Framework Suggestions** — Rule-based engine that analyzes request titles and descriptions to suggest RICE, ICE, MoSCoW, and other framework scores
- **Weekly AI Digest** — Automated email digest with stats (new requests, votes, comments, shipped) and AI-generated summary via Langflow. Sent to workspace admins on a cron schedule
- **Email Notifications** — Status changes, new comments, new requests, and vote milestones trigger styled email notifications via Resend

### Integrations
- **Jira** — Push feature requests to Jira with framework scores and metadata
- **Linear** — Create Linear issues with RICE-to-priority mapping
- **Notion** — Export requests to Notion databases with properties

### UX Details
- **Dark/Light Mode** — Auto-detects time of day (6am-6pm = light), manual toggle override
- **Lofi Player** — Built-in music player (SomaFM stations) + procedural ambient sounds (rain, wind, cafe, waves) generated with the Web Audio API
- **Hero Cipher Effect** — Typewriter + scramble/decode animation on the landing page
- **Smooth Sidebar** — Hover-to-expand with 350ms cubic-bezier transitions
- **Responsive** — Mobile-friendly with adaptive layouts
- **Brutalist Design** — Editorial typography with monospace + serif fonts, grain texture, custom cursor

### Testing & CI
- **49 Unit Tests** — Vitest tests covering escapeHtml, RICE/ICE/WSJF scoring, slug generation, K-means clustering algorithm (edge cases, mutation safety, correct grouping)
- **GitHub Actions CI** — Automated lint, test, and build on every push and pull request

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui + custom CSS design system |
| Database | Supabase (PostgreSQL + Row Level Security + pgvector) |
| Auth | Supabase Auth (Email/Password + Google OAuth) |
| Real-time | Supabase Realtime (presence + broadcasts) |
| Embeddings | Google Gemini (`gemini-embedding-001`, 3072 dimensions) |
| LLM (Q&A) | Groq (Llama 3.3 70B Versatile) |
| LLM (Triage) | Groq (Llama 3.3 70B Versatile) — 3-step chain |
| AI Summary | Langflow / DataStax |
| Email | Resend API + custom SMTP |
| State | TanStack Query (React Query) |
| Forms | React Hook Form + Zod validation |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Charts | Recharts |
| Audio | Web Audio API (procedural noise generation) |
| Animations | Custom hooks (scroll reveal, parallax, 3D tilt, magnetic buttons) |
| Testing | Vitest (49 unit tests) |
| CI/CD | GitHub Actions (lint + test + build) + Vercel auto-deploy |
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
  not-found.tsx                     # Branded 404 page
  error.tsx                         # Error boundary with reset
  workspace/[slug]/
    layout.tsx                      # Server-side auth guard
    WorkspaceLayoutClient.tsx       # Sidebar + command bar + context provider
    page.tsx                        # Redirects to /backlog
    backlog/page.tsx                # Table view — sort, filter, search, tag filter, triage badges
    board/page.tsx                  # Kanban — drag cards, confetti on ship
    clusters/page.tsx               # Auto-clustered themes with adjustable k
    insights/page.tsx               # Charts — status breakdown, trends, top requests
    frameworks/page.tsx             # Framework comparison + guide
    settings/page.tsx               # Workspace name, members, roles, integrations
  api/
    ai-suggest/route.ts             # AI-powered framework score suggestions
    ask/route.ts                    # Natural language Q&A (RAG: embed → retrieve → Groq synthesis)
    backfill-embeddings/route.ts    # Batch generate embeddings for existing requests
    clusters/route.ts               # K-means clustering on embeddings (server-side)
    digest/route.ts                 # Weekly email digest with AI summary
    embed/route.ts                  # Generate embedding + trigger auto-triage
    notify/route.ts                 # Notification dispatch (status, comments, votes)
    search/route.ts                 # Semantic vector similarity search
    triage/route.ts                 # Auto-triage: 3-step Groq chain (classify → prioritize → tag)
    integrations/
      jira/route.ts                 # Push to Jira (Zod validated)
      linear/route.ts               # Push to Linear (Zod validated)
      notion/route.ts               # Push to Notion (Zod validated)

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
      WorkspaceSidebar.tsx          # Collapsible icon rail + expanded nav + Ask AI button
      AskAI.tsx                     # Natural language Q&A dialog with source citations
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
    shared.ts                       # Shared utilities (getInitials, escapeHtml, etc.)
    kmeans.ts                       # K-means++ with cosine similarity (3072-dim)
    cluster-naming.ts               # Auto-generate cluster names from title keywords
    __tests__/
      shared.test.ts                # escapeHtml, getInitials, getErrorMessage tests
      rice.test.ts                  # RICE/ICE/WSJF scoring + generateSlug tests
      kmeans.test.ts                # K-means clustering algorithm tests

types/
  database.types.ts                 # Supabase-generated table types
  ask.types.ts                      # Ask AI response types (MatchedRequest, AskResponse)

supabase/migrations/
  20240101000000_initial_schema.sql         # Core tables + RLS + triggers
  20240102000000_fix_workspace_rls.sql      # RLS policy fixes
  20240103000000_fix_rls_recursion.sql      # Recursive RLS fix
  20260221000000_add_frameworks.sql         # Multi-framework support
  20260228000000_add_viewer_role.sql        # Viewer role for members
  20260228000001_workspace_integrations.sql # Integration settings table
  20260308000000_add_performance_indexes.sql # Query performance indexes
  20260327000000_add_embeddings.sql         # pgvector + embedding column + match_requests RPC
  20260328000000_fix_integrations_trigger.sql # updated_at trigger
  20260328000001_add_missing_indexes.sql    # Workspace member, votes, embedding indexes
  20260329000000_add_triage_columns.sql     # Auto-triage: category, priority, triage_reason

.github/workflows/
  ci.yml                            # GitHub Actions: lint + test + build on push/PR

middleware.ts                       # Route protection (redirect unauthenticated users)
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
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Embeddings & Search
GOOGLE_API_KEY=your-google-ai-key

# LLM — Ask AI & Auto-Triage (Groq)
GROQ_API_KEY=your-groq-key

# Email (Resend)
RESEND_API_KEY=your-resend-key
EMAIL_FROM=Backlog <onboarding@resend.dev>

# Weekly Digest
CRON_SECRET=your-cron-secret
LANGFLOW_TOKEN=your-langflow-token
LANGFLOW_ORG_ID=your-langflow-org-id
LANGFLOW_FLOW_URL=https://your-langflow-url
```

### 4. Run Migrations

**Option A** — Supabase Dashboard:
1. Go to **SQL Editor** in your Supabase project
2. Run each migration file in `supabase/migrations/` in order
3. Run `NOTIFY pgrst, 'reload schema';` after all migrations

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

### 6. Run Tests

```bash
npm test           # Run all 49 tests
npm run test:watch # Watch mode
```

---

## AI Architecture

### Ask AI (RAG Pipeline)
```
User question
  → POST /api/ask
  → Google Gemini embeds question (3072-dim vector)
  → match_requests RPC retrieves 12 similar requests via pgvector
  → Context + question sent to Groq (Llama 3.3 70B)
  → Synthesized answer + source citations returned
```

### Auto-Triage (Multi-Step Chain)
```
New request created
  → POST /api/embed generates embedding
  → Triggers POST /api/triage (3 sequential Groq calls):
      Step 1: Classify → bug / feature / improvement / question
      Step 2: Prioritize → high / medium / low + reasoning
      Step 3: Suggest tags → merged with user-provided tags
  → Request updated with category, priority, reason, and tags
```

### Semantic Search
```
Search query
  → POST /api/search
  → Google Gemini embeds query
  → match_requests RPC (pgvector cosine similarity, threshold 0.35)
  → Returns ranked results with similarity scores
```

### Auto-Clustering
```
POST /api/clusters
  → Fetch all embedded requests for workspace
  → K-means++ with cosine similarity (lib/utils/kmeans.ts)
  → Auto-name clusters from keyword frequency
  → Return grouped requests with vote counts
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (synced from Supabase Auth via trigger) |
| `workspaces` | Team workspaces with slug, name, active framework |
| `workspace_members` | Many-to-many with roles: `admin`, `member`, `viewer` |
| `feature_requests` | Core table — title, description, status, RICE scores, tags, framework scores, `embedding vector(3072)`, `category`, `priority`, `triage_reason` |
| `votes` | One vote per user per request (unique constraint) |
| `comments` | Threaded comments on feature requests |
| `workspace_integrations` | Jira/Linear/Notion integration settings |

**RPC Functions**: `match_requests()` — vector similarity search for semantic matching.

All tables have **Row Level Security (RLS)** enabled. Members can only access data within their workspaces.

---

## Security

- **Row Level Security** on all tables — workspace-scoped access
- **UUID validation** on all API route inputs
- **Zod schema validation** on integration routes (Jira, Linear, Notion)
- **Content-Security-Policy** header with strict directives
- **Prompt injection hardening** — Ask AI sanitizes user input and uses strict system prompts
- **XSS prevention** — `escapeHtml()` on all email template data, React auto-escaping on UI
- **Auth on every route** — `authenticateApiRoute()` + workspace membership verification
- **CRON_SECRET** protection on admin endpoints (digest, backfill, triage)
- **Security headers** — HSTS, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Add **all** environment variables from `.env.local.example` (including `GROQ_API_KEY`)
4. Set `NEXT_PUBLIC_SITE_URL` to your Vercel URL
5. Update Supabase redirect URLs to include your Vercel domain
6. Run all migrations in Supabase SQL Editor
7. Run `NOTIFY pgrst, 'reload schema';` in SQL Editor
8. Deploy — GitHub Actions CI will run lint + test + build automatically

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
