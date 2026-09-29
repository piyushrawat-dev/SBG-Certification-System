-- ============================================================
-- AWS SBG Certificate Management & Verification System Schema
-- Migration: 20260928000000_certificate_system.sql
-- ============================================================

-- Enable pgcrypto extension for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. Events Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    event_date DATE NOT NULL,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED')),
    certificate_description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for lookup by slug
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events (slug);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events (status);

-- ── 2. Participants Table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participants_email ON public.participants (email);

-- ── 3. Certificates Table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id TEXT NOT NULL UNIQUE,
    participant_id UUID REFERENCES public.participants(id) ON DELETE SET NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    participant_name TEXT NOT NULL,
    event_title TEXT NOT NULL,
    event_date DATE NOT NULL,
    achievement_text TEXT NOT NULL,
    signer_name TEXT NOT NULL,
    signer_title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'GENERATED' CHECK (status IN ('DRAFT', 'GENERATING', 'GENERATED', 'FAILED', 'REVOKED')),
    storage_key TEXT,
    verification_url TEXT,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    revocation_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning-fast public verification
CREATE INDEX IF NOT EXISTS idx_certificates_cert_id ON public.certificates (certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates (status);
CREATE INDEX IF NOT EXISTS idx_certificates_event ON public.certificates (event_id);
CREATE INDEX IF NOT EXISTS idx_certificates_participant ON public.certificates (participant_id);

-- ── 4. Audit Logs Table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    result TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (result IN ('SUCCESS', 'FAILURE')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- ── 5. Trigger for updated_at ────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_events_updated_at ON public.events;
CREATE TRIGGER trigger_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_participants_updated_at ON public.participants;
CREATE TRIGGER trigger_participants_updated_at
    BEFORE UPDATE ON public.participants
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_certificates_updated_at ON public.certificates;
CREATE TRIGGER trigger_certificates_updated_at
    BEFORE UPDATE ON public.certificates
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 6. Row Level Security (RLS) ──────────────────────────────
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Public can verify certificates (read-only for generated or revoked certificates)
-- Safe fields are queried by public verification API
CREATE POLICY "Public certificates verification access"
    ON public.certificates
    FOR SELECT
    USING (status IN ('GENERATED', 'REVOKED'));

-- Public can read published events
CREATE POLICY "Public published events access"
    ON public.events
    FOR SELECT
    USING (status = 'PUBLISHED');

-- Authenticated admins can manage all records
CREATE POLICY "Admin full access events"
    ON public.events
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admin full access participants"
    ON public.participants
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admin full access certificates"
    ON public.certificates
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admin full access audit_logs"
    ON public.audit_logs
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
