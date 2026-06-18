# Deployment Runbook

## Scope

This runbook covers the first production deploy of the current service stack:

- **Hosting:** Next.js app as a container on **Google Cloud Run** (free tier)
- **Database:** **Neon** (free serverless PostgreSQL) — accessed via Prisma driver adapter (`@prisma/adapter-pg`), no query-engine binary
- **DNS:** **Cloudflare** for `takeaseat.co.kr`
- **Ads:** Google AdSense (`AdBanner` already implemented)
- Prisma migrations + seed import for the default store data

> Vercel was evaluated and **rejected**: Hobby tier forbids ads / commercial use. Cloud Run + Neon + Cloudflare keeps cost at ~0 with no commercial restriction.

## Build Artifacts (in repo)

- `Dockerfile` (repo root) — multi-stage build producing a Next.js **standalone** image. Build context is the **repo root** because the app imports `../server` and the Prisma client.
- `.dockerignore` (repo root) — excludes `node_modules`, `.next`, secrets (`.env*`), docs.
- `client/next.config.mjs` — `output: 'standalone'`, `outputFileTracingRoot` = repo root, and `outputFileTracingIncludes` forcing the pnpm-symlinked Prisma runtime (`@prisma/client`, `@prisma/adapter-pg`, `pg`, `@prisma/driver-adapter-utils`) into the trace.
- `client/public/ads.txt` — AdSense publisher verification (placeholder; fill in real `pub-` ID before AdSense submission).

### Local container validation (do this before first deploy)

The standalone layout + Prisma tracing was verified by booting `client/.next/standalone/client/server.js` directly (login page → HTTP 200; an API route reached Prisma and returned `P1010` against a dummy DB, proving the adapter is bundled). **The full `docker build` has not been run in CI** — validate it locally once:

```bash
# from repo root
docker build -t tas:local .
docker run --rm -p 8080:8080 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e AUTH_SECRET="$AUTH_SECRET" \
  -e AUTH_URL="http://localhost:8080" \
  tas:local
# then: open http://localhost:8080/login → 200, providers render
```

## Required Environment Variables

Application (set on the Cloud Run service):

- `DATABASE_URL` — Neon pooled connection string (`...-pooler.../db?sslmode=require`)
- `AUTH_SECRET` — production-only value (`openssl rand -base64 32`)
- `AUTH_URL` — `https://takeaseat.co.kr`
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- `AUTH_KAKAO_ID`, `AUTH_KAKAO_SECRET`
- `AUTH_NAVER_ID`, `AUTH_NAVER_SECRET`

Ads (public — baked at build, so set as build env if changed):

- `NEXT_PUBLIC_ADSENSE_CLIENT` — `ca-pub-XXXXXXXXXXXXXXXX`
- `NEXT_PUBLIC_ADSENSE_AUTH_SLOT` — login/onboarding/consent shared slot

Seed bootstrap (only when running seed):

- `SEED_OWNER_EMAIL`, `SEED_OWNER_NAME`

Optional:

- `NEXT_DEV_ALLOWED_ORIGINS`

## Pre-Deploy Checklist

1. **Neon:** create a project + database. Copy the **pooled** connection string into `DATABASE_URL`.
2. **OAuth:** register production callback URLs for each provider (below). Rotate every secret currently in local files; never reuse dev secrets.
3. `AUTH_SECRET` — generate a fresh production-only value.
4. Decide the final domain (`takeaseat.co.kr`) and set `AUTH_URL` to it.
5. Confirm a staging/preview login succeeds before pointing DNS at production.

Provider callback URLs (replace `<domain>` with `takeaseat.co.kr`):

- Google: `https://<domain>/api/auth/callback/google`
- Kakao: `https://<domain>/api/auth/callback/kakao`
- Naver: `https://<domain>/api/auth/callback/naver`

Also keep the existing Gmail-connect callback registered (see auth-rollout):
`https://<domain>/api/gmail/oauth-callback`

## Cloud Run Deploy

```bash
# from repo root — Cloud Build builds the Dockerfile, pushes, and deploys.
gcloud run deploy tas \
  --source . \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --port 8080 \
  --min-instances 0 \
  --set-env-vars "AUTH_URL=https://takeaseat.co.kr,NEXT_TELEMETRY_DISABLED=1"

# Set secrets separately (or via Secret Manager):
gcloud run services update tas --region asia-northeast3 \
  --update-env-vars "DATABASE_URL=...,AUTH_SECRET=...,AUTH_GOOGLE_ID=...,..."
```

Notes:

- `--min-instances 0` keeps it in free tier (cold starts acceptable for launch).
- `NEXT_PUBLIC_*` values are baked at build time. If they change, redeploy (rebuild). For first deploy set them as build substitutions or rebuild after AdSense approval.
- The container listens on `$PORT` (8080) and `HOSTNAME=0.0.0.0` (set in the image).

## Database Migration

Checked-in migrations live at `server/prisma/migrations/`. Run against Neon after `DATABASE_URL` is available (from `client/`, locally or in a one-off job):

```bash
cd client
pnpm prisma:deploy        # validate + migrate status + migrate deploy
```

## First Data Import

After migrations succeed:

```bash
cd client
pnpm prisma:seed
pnpm prisma:verify-seed
# or, single first-run command:
pnpm prisma:bootstrap
```

## Cloudflare DNS

1. Add `takeaseat.co.kr` to Cloudflare; update the registrar's nameservers.
2. In Cloud Run, map the custom domain (`gcloud run domain-mappings create --service tas --domain takeaseat.co.kr --region asia-northeast3`) and add the CNAME/records Cloud Run returns to Cloudflare.
3. Proxy status: start **DNS-only (grey cloud)** until the cert is issued, then optionally enable proxy.
4. `blog.takeaseat.co.kr` → Cloudflare Pages (separate); `clipnote.co.kr` is an independent app.

## AdSense

1. After the site is live at `takeaseat.co.kr`, submit it to AdSense.
2. Once approved, fill `client/public/ads.txt` with the real `pub-` line (uncomment it).
3. Set `NEXT_PUBLIC_ADSENSE_CLIENT` / `NEXT_PUBLIC_ADSENSE_AUTH_SLOT` and rebuild/redeploy.

## Post-Deploy Smoke Checks

1. Open `/login` — enabled providers render.
2. Login redirects into the app.
3. Authenticated users without membership are blocked safely.
4. Seeded owner can access admin pages.
5. Customer / designer / service / reservation counts look correct.
6. `/ads.txt` is reachable (returns the file).

## Rollback Notes

If the first production import is incorrect:

1. Roll back Cloud Run to the previous revision (`gcloud run services update-traffic tas --to-revisions PREV=100`).
2. Restore the Neon database from a branch/snapshot taken before import.
3. Fix the seed data or seed logic; re-run migration + seed checks against a Neon branch first.

## Current Known Risks

- **Docker build not yet CI-validated** — run `docker build` locally once before first deploy (see above).
- `NEXT_PUBLIC_*` are build-time — changing AdSense IDs requires a rebuild, not just an env update.
- `next-auth@5.0.0-beta.x` with `next@16.x` had development-time module-resolution noise around `next/server`.
- Kakao profile parsing required a defensive override in `client/auth.ts`.
- Prisma driver adapter (`@prisma/adapter-pg`) talks to Neon over `pg`; ensure the **pooled** connection string + `sslmode=require`.
