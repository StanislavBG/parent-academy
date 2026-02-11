# Parent Academy

## Overview

Parent Academy is a multi-agent AI coaching platform for parents. It connects parents with specialized child development "expert agents" (behavior, sleep, nutrition, emotions, milestones, safety) that provide actionable parenting guidance. The platform offers a 30-day coaching plan system with onboarding assessments, daily tracking, weekly check-ins, and real-time chat with AI experts. It features a safety/escalation system that detects high-risk situations (self-harm, abuse, medical emergencies) and routes to crisis resources.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

- **Framework**: React 18 with TypeScript, built with Vite
- **Routing**: Wouter (lightweight client-side router) — NOT react-router
- **State Management**: TanStack React Query for server state; local React state for UI
- **UI Components**: shadcn/ui (new-york style) with Radix UI primitives, Tailwind CSS
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Icons**: Lucide React
- **Fonts**: Outfit (display/headings) and Plus Jakarta Sans (body text), loaded via CSS variables `--font-display` and `--font-body`
- **Session Management**: Token-based sessions stored in localStorage (`pa-session-token`), sent via `x-session-token` header on all API requests. No traditional auth — anonymous session tokens via UUID.

**Key pages**: Home (landing), Onboarding (baseline assessment wizard), Experts (agent selection grid), Chat (per-agent conversation with chat/roleplay modes), Dashboard (30-day coaching plan view), Tracking (daily entry + check-ins), Settings (child profile editing)

**Path aliases**:
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`
- `@assets` → `./attached_assets/`

### Backend

- **Framework**: Express.js on Node.js with TypeScript
- **Runtime**: tsx for development, esbuild for production bundling
- **HTTP Server**: Node `http.createServer` wrapping Express
- **API Pattern**: REST API under `/api/*` prefix. Route definitions are shared between client and server via `shared/routes.ts` which defines both Zod validation schemas and the API contract object.
- **Agent System**: Multi-agent architecture using `bilko-flow` (a GitHub-hosted workflow engine). Each agent type (behavior, milestones, sleep, nutrition, emotions, safety) is modeled as a workflow. The system has a safety layer that runs regex-based pattern matching on all messages before agent processing, with crisis resource escalation.
- **Build**: Custom build script (`script/build.ts`) that runs Vite for client + esbuild for server. Server deps are selectively bundled via an allowlist to reduce cold start times.

### Shared Layer (`shared/`)

- `schema.ts` — Drizzle ORM table definitions (PostgreSQL) and TypeScript types
- `routes.ts` — Zod validation schemas and API route contract used by both client and server

### Database

- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Connection**: `pg` Pool via `DATABASE_URL` environment variable
- **Schema push**: `drizzle-kit push` (no migration files workflow — direct push)
- **Tables**: `parents`, `child_profiles`, `baselines`, `coaching_plans`, `tracking_entries`, `check_ins`, `conversations`, `messages`
- **Storage abstraction**: `server/storage.ts` defines an `IStorage` interface with implementations. Falls back to in-memory storage when `DATABASE_URL` is not set.
- **No PII**: Schema deliberately avoids storing names or birth dates — uses session tokens and age-in-months only.

### Key Data Models

- **Parent**: Anonymous session-based identity with session token
- **ChildProfile**: Age in months, challenges array, routine/behavioral notes
- **Baseline**: Initial assessment (goals, challenges, triggers, intensity)
- **CoachingPlan**: 30-day plan with weekly goals, daily actions, scripts, if-then guidance rules
- **TrackingEntry**: Daily metrics (tantrum count, intensity, confidence, etc.)
- **CheckIn**: Periodic AI-analyzed progress reviews
- **Conversation/Message**: Chat history per agent type with mode support (chat, roleplay-parent, roleplay-child)

### Agent Architecture

The agent system in `server/agents/` consists of:
- `types.ts` — Agent type definitions, profiles, context interfaces
- `engine.ts` — Orchestration layer that initializes bilko-flow and processes conversations/plans/check-ins
- `workflows.ts` — Bilko-flow workflow definitions for each agent type
- `bilko-adapter.ts` — Adapter that dynamically imports bilko-flow (ships as TS source, not compiled)
- `safety.ts` — Regex-based high-risk pattern detection with crisis resource routing (suicide, child abuse, domestic violence, medical emergencies, postpartum distress)

### Development vs Production

- **Dev**: Vite dev server with HMR proxied through Express, `tsx` for server
- **Prod**: Vite builds static client to `dist/public`, esbuild bundles server to `dist/index.cjs`, Express serves static files with SPA fallback

## External Dependencies

- **PostgreSQL**: Primary database, connected via `DATABASE_URL` environment variable
- **bilko-flow**: GitHub-hosted workflow engine (`github:StanislavBG/bilko-flow`) for agent orchestration. Ships as TypeScript source, dynamically imported at runtime. System gracefully degrades if unavailable.
- **AI/LLM**: The build script bundles `@google/generative-ai` and `openai`, suggesting the agent engine calls external AI APIs for generating responses, coaching plans, and check-in analyses. API keys would be needed as environment variables.
- **Stripe**: Listed in build allowlist — likely planned or implemented for payment processing
- **Nodemailer**: Listed in build allowlist — likely planned for email notifications
- **shadcn/ui component library**: Radix UI primitives with Tailwind CSS styling (new-york theme variant)
- **Google Fonts**: Outfit and Plus Jakarta Sans loaded via external CDN