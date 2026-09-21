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
- An AI provider key — required for the AI coach and daily insights

No backend is required. The MVP stores everything in the browser; see
[Cloud sync](#cloud-sync-optional) if you later want accounts.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables. Copy `.env.example` to `.env` and fill it in — you need an
   AI provider key, and optionally the Supabase values. See
   [Environment variables](#environment-variables) below.

3. Optional, and only needed later: to enable accounts and cloud sync, follow
   [Cloud sync](#cloud-sync-optional).

4. Start the dev server:

   ```bash
   npm run dev
   ```

   The app is served at <http://localhost:3000>.

## Environment variables

| Variable | Scope | Required | Purpose |
| --- | --- | --- | --- |
| `AI_PROVIDER` | Server | No | `openai` or `gemini`. Defaults to `openai` when `OPENAI_API_KEY` is set, otherwise `gemini`. |
| `GEMINI_API_KEY` | Server | For Gemini | Used by `/api/chat` and `/api/insight`. Never sent to the browser. |
| `VITE_GEMINI_API_KEY` | Server | No | Accepted as a fallback for `GEMINI_API_KEY`. |
| `GEMINI_MODEL` | Server | No | Overrides the Gemini model, default `gemini-3.5-flash`. |
| `OPENAI_API_KEY` | Server | For OpenAI | Key for the OpenAI-compatible provider. |
| `OPENAI_BASE_URL` | Server | No | Base URL of the endpoint, default `https://api.openai.com/v1`. Set this for third-party gateways. |
| `OPENAI_MODEL` | Server | No | Model name, default `gpt-4o-mini`. |
| `AI_TIMEOUT_MS` | Server | No | Per-request AI timeout, default `25000`. |
| `VITE_ENABLE_CLOUD_SYNC` | Client | No | Off unless exactly `true`. Turns on Supabase auth and sync. |
| `VITE_SUPABASE_URL` | Client | With sync | Supabase project URL. |
| `VITE_SUPABASE_ANON_KEY` | Client | With sync | Supabase anonymous key. |

Notes:

- The `VITE_`-prefixed variables are inlined into the client bundle by Vite, so only ever put
  public values there. The anon key is designed to be public and is protected by row-level
  security.
- Your AI provider key is read from the server process environment only, so it is never exposed
  to clients.
- Supabase is off unless `VITE_ENABLE_CLOUD_SYNC=true`. While it is off, `src/lib/supabase.ts`
  exports `null`, which makes every helper in `sync.ts` a no-op and keeps the app in local guest
  mode — no network calls, no login screen.
- `server.ts` loads `.env` at startup, so putting your AI key there is enough for local
  development. `dotenv` does not overwrite variables that are already set, so an exported shell
  variable still takes precedence. Restart the server after editing `.env` — a running process
  keeps the values it started with.
- On a hosting platform (e.g. Vercel), set the AI key as a project environment variable.
- `APP_URL` still appears in `.env.example` but is not referenced anywhere in the code.

## The AI coach

The coach is a smoking cessation coach that adapts its guidance to whichever of the five methods
the user picked during onboarding (CBT, ACT, mindfulness, motivational interviewing, or habit
replacement). Each request carries the user's active method, recent method-specific activity,
craving stats, triggers, detected emotion and quit day, so the advice matches where they
actually are.

The browser never talks to the model directly. `POST /api/chat` proxies it and keeps the API key
server-side.

### Choosing a provider

Two providers are supported. Pick one:

**Gemini** (default when no `OPENAI_API_KEY` is present):

```bash
GEMINI_API_KEY=your-key
```

**Any OpenAI-compatible endpoint** — OpenAI itself, or a gateway such as OpenRouter, Together,
Groq, or any other service exposing `/chat/completions`:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=your-key
OPENAI_BASE_URL=https://your-provider.example/v1
OPENAI_MODEL=your-model-name
```

`AI_PROVIDER` is inferred automatically: set it explicitly if you need to override the detection.
The key you use must belong to the provider in `OPENAI_BASE_URL` — a gateway key will be rejected
by `api.openai.com` with a 401, and vice versa.

Tool use runs as a real loop for both providers: the model can ask to log a craving or inhaler
use, create a mission, or open a tab in the app; the client runs that against the local database
and sends the result back so the model can phrase its own follow-up rather than showing a canned
string. The loop is capped at 3 rounds.

### Checking the setup

```bash
curl http://localhost:3000/api/health
```

Example replies:

```json
{ "ok": true, "aiConfigured": true, "provider": "gemini", "model": "gemini-3.5-flash" }
{ "ok": true, "aiConfigured": true, "provider": "openai", "model": "gpt-4o-mini", "baseUrl": "https://api.openai.com/v1" }
```

The endpoints fail with a clear code rather than a generic error:

| Code | HTTP | Meaning |
| --- | --- | --- |
| `AI_NOT_CONFIGURED` | 503 | No API key on the server. |
| `AI_KEY_INVALID` | 502 | The key was rejected by the provider. |
| `AI_TIMEOUT` | 504 | The model took too long. |
| `AI_ERROR` | 502 | Anything else. |

Requests are also rate limited in memory (20 per minute per IP) and capped at 2000 characters per
message. On serverless hosting that limit is per instance and therefore best-effort; put a real
limiter in front of it if you expect hostile traffic.

### Model deprecation

Google retires model ids for existing keys without warning, which silently breaks the coach. As a
countermeasure the Gemini path keeps a fallback chain (`GEMINI_MODEL`, then `gemini-flash-latest`,
then a pinned known-good id) and moves to the next candidate when a model id comes back as
retired. For the OpenAI-compatible path, set `OPENAI_MODEL` explicitly and check your provider's
deprecation notes.

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

The app is local-first. Every write goes to IndexedDB and that is the source of truth, so it
works with no backend and no account:

- `src/lib/db.ts` — Dexie schema and table definitions.
- `src/store/AppContext.tsx` — the app state layer. Reads via `useLiveQuery` and writes to Dexie.
  If cloud sync is enabled, each mutation also calls `pushToSupabase`.
- `src/contexts/AuthContext.tsx` — in local mode this sits in guest mode; with sync enabled it
  restores the Supabase session.
- `server.ts` — hosts the client and proxies the AI provider behind `/api/chat` and
  `/api/insight`, so the API key stays on the server.

Records use UUID primary keys so that, when sync is on later, local and remote row ids match and
pulls stay idempotent.

## Cloud sync (optional)

**This is off by default and the MVP does not need it.** Everything below describes the opt-in
path for when you outgrow a single device.

1. Create a Supabase project.
2. Run `supabase-schema.sql` in its SQL editor to create the tables and row-level security
   policies.
3. Put the project URL and anon key in `.env`, and set `VITE_ENABLE_CLOUD_SYNC=true`.
4. Rebuild or restart — these values are read at build time.

Once enabled, signing in restores that user's data on any device. Failed writes are queued in
the `sync_queue` table and retried when the browser comes back online.

Two things to know before relying on it:

- Signing in on a device that already holds guest data merges the two sets rather than replacing
  them, because the local and remote profiles have different ids. Decide on a product rule
  (merge or replace) before shipping it.
- `clearData` wipes local data only; it does not delete the remote rows.

## Deployment

**Vercel** — `vercel.json` routes `/api/*` to `server.ts` and everything else to the static
build in `dist/`. Set your AI provider key as a project environment variable. Add the
`VITE_*` values too if you have enabled cloud sync.

**Android (Capacitor)** — `capacitor.config.ts` points `webDir` at `dist`, so run
`npm run build` before any Capacitor command:

```bash
npm run build
npx cap sync android
npx cap open android
```
