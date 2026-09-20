# Breathe AI by Noconi

An AI-powered anti-smoking companion app. It combines behavioural-science methods (CBT, ACT, motivational interviewing, mindfulness and habit replacement) with offline-first tracking, analytics and a Bluetooth smart-inhaler integration.

## Features

- **AI coach** — a Gemini-powered CBT/MI coach with function calling, so it can log cravings, inhaler uses and missions for the user.
- **Five quit methods** — CBT thought journals, ACT urge surfing, mindfulness sessions, MI reduction tracking and habit-loop mapping.
- **Craving logging** — intensity, trigger, mood and outcome, with milestone unlocks.
- **Analytics** — craving trends, peak hours, trigger breakdown and a behavioural health index.
- **Smart inhaler** — Bluetooth/volume-button triggered logging, plus usage recommendations.
- **Bilingual UI** — Indonesian and English.
- **Offline-first** — all data is written locally to IndexedDB and synced to Supabase in the background.

## Tech stack

| Layer | Technology |
| --- | --- |
| UI | React 19, TypeScript, Tailwind CSS v4, Motion, Recharts |
| Build | Vite 6, `vite-plugin-pwa` |
| Local storage | Dexie (IndexedDB) |
| Auth + cloud sync | Supabase |
| AI | Google Gemini via `@google/genai`, proxied through the server |
| Mobile | Capacitor (Android) |
| Server | Express (dev middleware + production static host) |

## Prerequisites

- Node.js 20+
- A Gemini API key — required for the AI coach and daily insights
- A Supabase project — optional, only needed for accounts and cloud sync

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables. Copy `.env.example` to `.env` and fill it in — see
   [Environment variables](#environment-variables) below.

3. *(Optional, for accounts and sync)* Run `supabase-schema.sql` in your Supabase project's
   SQL editor to create the tables and row-level security policies.

4. Start the dev server:

   ```bash
   npm run dev
   ```

   The app is served at <http://localhost:3000>.

## Environment variables

| Variable | Scope | Required | Purpose |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Server | Yes, for AI features | Used by `/api/chat` and `/api/insight`. Never sent to the browser. |
| `VITE_GEMINI_API_KEY` | Server | No | Accepted as a fallback for `GEMINI_API_KEY`. |
| `VITE_SUPABASE_URL` | Client | For sync | Supabase project URL. |
| `VITE_SUPABASE_ANON_KEY` | Client | For sync | Supabase anonymous key. |

Notes:

- The `VITE_`-prefixed variables are inlined into the client bundle by Vite, so only ever put
  public values there. The anon key is designed to be public and is protected by row-level
  security.
- `GEMINI_API_KEY` is read from the server process environment only, so it is not exposed to
  clients.
- If `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are unset, `src/lib/supabase.ts` exports
  `null` and the app falls back to offline guest mode. Auth and sync are skipped entirely.
- `server.ts` currently reads the environment directly and does **not** load `.env` itself, so
  for local development export the variable in your shell:

  ```bash
  GEMINI_API_KEY=your-key npm run dev
  ```

  On a hosting platform (e.g. Vercel), set it as a project environment variable instead.
- `APP_URL` still appears in `.env.example` but is not referenced anywhere in the code.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Express + Vite dev server on port 3000. |
| `npm run build` | Build the client to `dist/` and bundle the server to `dist/server.cjs`. |
| `npm start` | Run the production server (requires `npm run build` first). |
| `npm run lint` | Type-check the project with `tsc --noEmit`. |
| `npm run clean` | Delete the `dist/` directory. |

There is no test runner configured yet.

## Architecture

The app is offline-first. Every write goes to IndexedDB first, then is pushed to Supabase:

- `src/lib/db.ts` — Dexie schema and table definitions.
- `src/store/AppContext.tsx` — the app state layer. Reads via `useLiveQuery`, and every mutation
  writes locally and then calls `pushToSupabase`.
- `src/lib/sync.ts` — the Supabase sync layer. Failed pushes are queued in the `sync_queue`
  table and retried when the browser comes back online.
- `src/contexts/AuthContext.tsx` — restores the Supabase session and exposes the current user.
- `server.ts` — hosts the client and proxies Gemini behind `/api/chat` and `/api/insight`, so
  the API key stays on the server.

Records use UUID primary keys so local and remote row ids match, which keeps sync idempotent.

## Deployment

**Vercel** — `vercel.json` routes `/api/*` to `server.ts` and everything else to the static
build in `dist/`. Set `GEMINI_API_KEY` (and the `VITE_SUPABASE_*` variables) as project
environment variables.

**Android (Capacitor)** — `capacitor.config.ts` points `webDir` at `dist`, so run
`npm run build` before any Capacitor command:

```bash
npm run build
npx cap sync android
npx cap open android
```
