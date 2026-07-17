-- Supabase Multi-Company Schema - AI Chatbot Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPANIES TABLE (Tenants)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    logo VARCHAR(255),
    website VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    timezone VARCHAR(100) DEFAULT 'UTC',
    default_language VARCHAR(50) DEFAULT 'English',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index on company name
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(company_name);

-- 2. USER ROLES TABLE (RBAC mapping)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- references auth.users(id) on delete cascade (can only be configured in Supabase directly)
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'editor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, company_id)
);

-- Index for RBAC checkups
CREATE INDEX IF NOT EXISTS idx_user_roles_uid_cid ON public.user_roles(user_id, company_id);

-- 3. LEADS TABLE
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    business_name VARCHAR(255),
    industry VARCHAR(255),
    requirements TEXT,
    budget VARCHAR(100),
    timeline VARCHAR(100),
    lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
    pipeline_stage VARCHAR(50) DEFAULT 'new' CHECK (pipeline_stage IN ('new', 'contacted', 'qualified', 'closed_won', 'closed_lost', 'archived')),
    source VARCHAR(255) DEFAULT 'chatbot',
    notes TEXT,
    last_contacted TIMESTAMP WITH TIME ZONE,
    assigned_to UUID, -- references auth.users(id)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_company_id ON public.leads(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_email_phone ON public.leads(email, phone);
CREATE INDEX IF NOT EXISTS idx_leads_score_stage ON public.leads(lead_score, pipeline_stage);

-- 4. CONVERSATIONS TABLE (Interaction Logs)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    user_message TEXT NOT NULL,
    assistant_message TEXT NOT NULL,
    retrieved_sources JSONB DEFAULT '[]'::jsonb,
    model_used VARCHAR(100) NOT NULL,
    response_time INTEGER NOT NULL,
    token_usage INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversations_cid_session ON public.conversations(company_id, session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON public.conversations(created_at);

-- 5. PORTFOLIO ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT NOT NULL,
    technologies TEXT[] DEFAULT '{}'::text[],
    website VARCHAR(255),
    image VARCHAR(255),
    featured BOOLEAN DEFAULT FALSE,
    live_url VARCHAR(255),
    github_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_portfolio_company ON public.portfolio_items(company_id);

-- 6. FAQS TABLE
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    keywords TEXT[] DEFAULT '{}'::text[],
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_faqs_company ON public.faqs(company_id);

-- 7. KNOWLEDGE FILES TABLE
CREATE TABLE IF NOT EXISTS public.knowledge_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    checksum VARCHAR(255) NOT NULL,
    uploaded_by UUID, -- references auth.users(id)
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_indexed TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_kfiles_company ON public.knowledge_files(company_id);

-- Triggers for updated_at tracking
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_files ENABLE ROW LEVEL SECURITY;

-- Companies Policies
CREATE POLICY "Allow public read companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Allow owner update companies" ON public.companies FOR UPDATE 
USING (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.company_id = companies.id and user_roles.role = 'owner'));

-- User Roles Policies
CREATE POLICY "Allow members read roles" ON public.user_roles FOR SELECT 
USING (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.company_id = user_roles.company_id));
CREATE POLICY "Allow owner manage roles" ON public.user_roles FOR ALL 
USING (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.company_id = user_roles.company_id and user_roles.role = 'owner'));

-- Leads Policies
CREATE POLICY "Allow public/bot insert leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow team read leads" ON public.leads FOR SELECT 
USING (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.company_id = leads.company_id));
CREATE POLICY "Allow team update leads" ON public.leads FOR UPDATE 
USING (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.company_id = leads.company_id and user_roles.role IN ('owner', 'admin')));
CREATE POLICY "Allow team delete leads" ON public.leads FOR DELETE 
USING (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.company_id = leads.company_id and user_roles.role = 'owner'));

-- Conversations Policies
CREATE POLICY "Allow public read/insert conversations" ON public.conversations FOR ALL USING (true);

-- Portfolios & FAQs Policies
CREATE POLICY "Allow public read portfolio" ON public.portfolio_items FOR SELECT USING (true);
CREATE POLICY "Allow team manage portfolio" ON public.portfolio_items FOR ALL 
USING (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.company_id = portfolio_items.company_id and user_roles.role IN ('owner', 'admin', 'editor')));

CREATE POLICY "Allow public read faqs" ON public.faqs FOR SELECT USING (true);
CREATE POLICY "Allow team manage faqs" ON public.faqs FOR ALL 
USING (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.company_id = faqs.company_id and user_roles.role IN ('owner', 'admin', 'editor')));

-- Knowledge Files Policies
CREATE POLICY "Allow team manage knowledge" ON public.knowledge_files FOR ALL 
USING (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.company_id = knowledge_files.company_id and user_roles.role IN ('owner', 'admin', 'editor')));
