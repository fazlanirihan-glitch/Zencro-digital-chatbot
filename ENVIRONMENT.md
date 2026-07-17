# Environment Configuration (v1.0.0)

This document maps all the necessary `.env` variables required to operate both the Frontend and Backend of the ZenCro AI Platform.

## Frontend (`frontend/.env.local` / `.env.production`)

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | The URL where the FastAPI backend is hosted. | `https://api.zencro.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | The URL of your Supabase project. | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The anonymous public key for Supabase. | `eyJhb...` |
| `NEXT_PUBLIC_TENANT_ID` | (Optional) The specific `company_id` for white-labeled client builds. | `comp_123456` |
| `NEXT_PUBLIC_ENVIRONMENT` | Defines if the app is in `development` or `production`. | `production` |

## Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key for standard generations. | `AIzaSy...` |
| `OPENAI_API_KEY` | (Optional) For OpenAI / pgvector embeddings fallback. | `sk-...` |
| `SUPABASE_URL` | The backend URL for the Supabase Postgres instance. | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_KEY` | The secret Service Role Key. **Never expose this to the frontend.** | `eyJhb...` |
| `REDIS_URL` | Connection string for Rate Limiting and Session cache. | `redis://localhost:6379/0` |
| `SENTRY_DSN` | The Sentry Data Source Name for backend error monitoring. | `https://123@o456.ingest.sentry.io/789` |
| `JWT_SECRET_KEY` | Secret used to sign administrative JSON Web Tokens. | `super_secret_string` |
| `ENVIRONMENT` | `development` or `production` | `production` |
