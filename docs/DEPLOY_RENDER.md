# Deploy on Render (free tier) + Supabase

## 1. Create a Supabase project

1. Go to https://supabase.com → New Project.
2. Region: pick one close to your Render region (e.g. Frankfurt).
3. Copy the **Connection string** (Settings → Database → Connection string → URI).
   - Use the **Transaction pooler** URI (port `6543`) for Render free tier.
   - Format: `postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

## 2. Create a Supabase Storage bucket

1. Storage → New bucket → name `taleorience-assets` → Public (for simple serving) or Private.
2. Settings → S3 / Storage API → generate S3 credentials (`access key id` + `secret`).
3. Note the endpoint: `https://[ref].supabase.co/storage/v1/s3` and region.

## 3. Create the Render Web Service

Option A — Blueprint (recommended): push this repo with `render.yaml` to GitHub,
then Render → New → Blueprint → select the repo. Render will create the service
with the env vars marked `sync: false` left empty for you to fill.

Option B — Manual:
1. Render → New → Web Service → connect the repo.
2. Runtime: Docker, Dockerfile path `./Dockerfile`.
3. Health check path: `/api/v1/health`.
4. Plan: Free.

## 4. Fill environment variables (Render → Service → Environment)

| Key | Value |
|---|---|
| `DATABASE_URL` | Supabase Transaction pooler URI (from step 1) |
| `STORAGE_DRIVER` | `s3` |
| `S3_BUCKET` | `taleorience-assets` |
| `S3_REGION` | Supabase region (e.g. `eu-central-1`) |
| `S3_ENDPOINT` | `https://[ref].supabase.co/storage/v1/s3` |
| `S3_ACCESS_KEY_ID` | Supabase S3 access key |
| `S3_SECRET_ACCESS_KEY` | Supabase S3 secret |
| `S3_FORCE_PATH_STYLE` | `true` |
| `APP_MODE` | `production` |
| `AUTH_MODE` | `none` (or `jwt` later) |
| `LOCALES_ROOT` | `/app/locales` |
| `APP_VERSION` | `0.4.0` |

`PORT` is provided by Render automatically — do not set it.

## 5. (Optional) Persistent disk for SQLite

If you keep `STORAGE_DRIVER=local` and SQLite, add a Disk in Render
(mount path `/app/data`, size 1 GB) so the SQLite file survives restarts.
With Supabase Postgres + S3 this is not needed.

## 6. Deploy

Render builds the Docker image and runs the smoke check on `/api/v1/health`.
On first boot the backend runs `POSTGRES_SCHEMA_DDL` and creates all tables
in Supabase automatically.

## 7. Free-tier caveats

- Render free Web Service sleeps after 15 min of inactivity → first request
  after wake-up takes ~30–60 s (cold start).
- Supabase free: 500 MB DB, 1 GB storage, pauses after 7 days of inactivity.
- Render free: 750 hours/month (one always-on service fits).

## 8. Local test before deploy

```bash
docker compose up --build
curl http://localhost:4000/api/v1/health
```