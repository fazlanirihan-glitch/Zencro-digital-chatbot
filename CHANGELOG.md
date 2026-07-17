# Changelog

All notable changes to this project will be documented in this file.

## [v1.0.0] - 2026-07-16

### Added
- **Multi-Tenant SaaS Architecture**: Full isolation of AI Knowledge and Prompts by `company_id`.
- **Admin Dashboard UI**: Rebuilt entirely in Next.js App Router with Sidebar navigation.
- **Knowledge Engine Manager**: Support for uploading PDF, DOCX, MD, and TXT files directly to the RAG memory context.
- **Leads CRM**: Table-based CRM to track, score, and export generated leads.
- **Conversation Explorer**: Audit logs for AI responses, including latency, tokens, and RAG sources.
- **White-Label Configurator**: UI to dynamically adjust Hex Colors, Avatar URLs, and Welcome Messages.
- **Multi-Channel Providers**: Abstract backend interfaces for Voice, WhatsApp, and Email.
- **Prompt Studio**: Version-controlled system prompt testing playground.
- **Client Deployment Automator**: Python script to generate client-specific Next.js builds.

### Changed
- Refactored legacy monolithic UI into decoupled React Components.
- Upgraded to Tailwind CSS v4 and Framer Motion for premium aesthetics.
- Optimized frontend Next.js bundle to produce a `standalone` output for Dockerization.

### Security
- Purged all hardcoded console.logs and debug statements.
- Replaced insecure `any` types across the TypeScript codebase.
- Enforced strict Supabase `isSupabaseConfigured` gating.
