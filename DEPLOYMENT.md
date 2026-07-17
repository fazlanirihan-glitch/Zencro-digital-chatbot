# Deployment Checklist (v1.0.0)

This checklist ensures your environment is securely configured before public traffic hits the ZenCro AI Platform.

## Pre-Flight Checks
- [ ] **Environment Variables:** All production API keys, Supabase URLs, and LLM tokens are set.
- [ ] **Supabase Setup:** Database tables (`leads`, `companies`, `conversations`) exist and Row Level Security (RLS) is configured.
- [ ] **Cors & Security:** Backend `main.py` CORS origins restrict traffic specifically to your production frontend domain.
- [ ] **Performance:** `npm run build` generates a Next.js standalone app with 0 errors.

## Docker Orchestration (Phase 9)
To deploy the entire stack on a single Virtual Private Server (VPS) via Docker:

1. Compile the White-Label Frontend:
   ```bash
   cd backend
   python scripts/generate_deployment.py <tenant_company_id> <production_api_url>
   ```
2. Build and run containers:
   ```bash
   docker-compose up -d --build
   ```

## Cloud Providers

### 1. Vercel / Netlify (Frontend)
- Set the Build Command: `npm run build`
- Set the Output Directory: `.next`
- Inject all `NEXT_PUBLIC_*` environment variables in the Vercel/Netlify dashboard.

### 2. Render / Railway / AWS (Backend)
- Deploy using the `backend/Dockerfile`.
- Ensure the start command is `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
- Verify the `/api/v1/health` and `/live` endpoints return `200 OK`.
