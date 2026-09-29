-- ============================================================
-- AWS SBG Certificate Attendance Table
-- Migration: 20260929000000_certificate_attendance.sql
-- ============================================================
-- New table for recording certificate issuance attendance.
-- This lives in the same project DB as the certificate system
-- (szzjbjzardmqesiyblux), NOT in the attendance DB (mjtzkofoandkeeieyert).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.certificate_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    college_email TEXT NOT NULL,
    enrollment_no TEXT NOT NULL,
    program TEXT NOT NULL,
    event_title TEXT NOT NULL,
    event_date DATE NOT NULL,
    certificate_id TEXT REFERENCES public.certificates(certificate_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cert_attendance_email ON public.certificate_attendance (college_email);
CREATE INDEX IF NOT EXISTS idx_cert_attendance_enrollment ON public.certificate_attendance (enrollment_no);
CREATE INDEX IF NOT EXISTS idx_cert_attendance_event ON public.certificate_attendance (event_title);
CREATE INDEX IF NOT EXISTS idx_cert_attendance_cert_id ON public.certificate_attendance (certificate_id);

-- RLS
ALTER TABLE public.certificate_attendance ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (the form is public)
CREATE POLICY "Public can insert attendance"
    ON public.certificate_attendance
    FOR INSERT
    WITH CHECK (true);

-- Authenticated admins can read all records
CREATE POLICY "Admin full access attendance"
    ON public.certificate_attendance
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
