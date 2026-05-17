# Studio

Personal YouTube content studio for a Director of Paid Media (e-commerce). Generates de-duped video ideas, runs a per-video micro-interview to capture real opinions, builds a self-contained slide deck, and exposes channel analytics — all behind a single password.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind v4
- Anthropic Claude Sonnet 4.6 for ideation, interview questions, and deck generation
- Vercel KV (Upstash Redis) for storage
- YouTube Data API v3 + YouTube Analytics API via Google OAuth

## Local dev

```bash
cp .env.example .env.local
# fill in ANTHROPIC_API_KEY, APP_PASSWORD, AUTH_SECRET
npm install
npm run dev
```

Without `KV_*` and Google OAuth env vars set, the storage and YouTube features won't work locally — easiest path is to deploy first and use Vercel's preview URL.

## First Deploy (Vercel)

1. `npx vercel link` from this directory.
2. In the Vercel dashboard for the project, **Storage → Marketplace → Upstash → Redis** (or "Vercel KV") → create database → connect to project. This auto-injects `KV_*` env vars.
3. Set the remaining env vars (project settings → Environment Variables):
   - `ANTHROPIC_API_KEY` — your Anthropic key.
   - `APP_PASSWORD` — the password you'll use to sign in.
   - `AUTH_SECRET` — generate one: `openssl rand -hex 32`.
   - `NEXT_PUBLIC_APP_URL` — once you know the prod URL.
4. Run `npx vercel --prod`. Note the production URL.
5. Set up Google OAuth (see below). Add `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` env vars.
6. Run `npx vercel --prod` again so the new env vars take effect.

## Google OAuth setup (one-time, ~5 minutes)

1. Go to https://console.cloud.google.com — create a new project ("YouTube Studio" or similar).
2. **APIs & Services → Library** — enable **YouTube Data API v3** and **YouTube Analytics API**.
3. **APIs & Services → OAuth consent screen** → External → fill in name + email → Save.
4. On the consent screen, add yourself as a **Test user** (so you don't need verification).
5. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → Web application.
   - Authorized redirect URI: `https://<your-vercel-domain>/api/youtube/auth/callback`
6. Copy the **Client ID** and **Client Secret** into Vercel env vars.

## First run

1. Visit the production URL → enter your password.
2. Walk through the 7-question onboarding so the app knows your voice.
3. Settings → Connect YouTube.
4. Ideas → "Create a video" → answer the interview → record from the slide viewer.

## Routes / layout

- `/` — Ideas pipeline.
- `/chat` — Claude chatbot with tool access.
- `/channel` — Channel analytics overview.
- `/settings` — YouTube connection + profile.
- `/onboarding` — One-time profile interview.
- `/interview/[id]` — Per-video micro-interview.
- `/v/[id]` — Full-screen slide viewer (Space → next, Esc → exit, N → toggle notes).

## Keyboard shortcuts in the slide viewer

| Key | Action |
|---|---|
| Space / → / ↓ | Next slide |
| ← / ↑ | Previous slide |
| N | Toggle speaker notes |
| Esc | Exit to Ideas |
