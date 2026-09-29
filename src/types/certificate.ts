// ============================================================
// Certificate System — Core Types
// ============================================================

/**
 * Public-facing certificate statuses shown on verification pages.
 */
export type CertificatePublicStatus = "VALID" | "REVOKED" | "NOT_FOUND";

/**
 * Internal certificate statuses used throughout the system.
 */
export type CertificateStatus =
  | "DRAFT"
  | "GENERATING"
  | "GENERATED"
  | "FAILED"
  | "REVOKED";

/**
 * Admin roles for role-based access control.
 */
export type AdminRole = "SUPER_ADMIN" | "TECH_ADMIN" | "EVENT_MANAGER";

/**
 * Event statuses.
 */
export type EventStatus = "DRAFT" | "PUBLISHED" | "COMPLETED" | "CANCELLED";

// ============================================================
// Certificate Generation
// ============================================================

/**
 * Input data required to generate a single certificate.
 */
export interface CertificateGenerationInput {
  participantName: string;
  eventTitle: string;
  eventDate: string; // ISO date string or formatted date
  achievementText?: string; // Custom achievement text; falls back to default
  signerName?: string; // Custom signer name; falls back to default
  signerTitle?: string; // Custom signer title; falls back to default
}

/**
 * Result of a single certificate generation.
 */
export interface CertificateGenerationResult {
  success: boolean;
  certificateId?: string;
  pdfBuffer?: Buffer;
  error?: string;
}

/**
 * Result of a bulk certificate generation.
 */
export interface BulkGenerationResult {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  results: BulkGenerationItemResult[];
}

export interface BulkGenerationItemResult {
  participantName: string;
  participantEmail: string;
  certificateId?: string;
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  reason?: string;
}

// ============================================================
// Database Models (mirrors Supabase schema)
// ============================================================

export interface DbCertificateAttendance {
  id: string;
  full_name: string;
  college_email: string;
  enrollment_no: string;
  program: string;
  event_title: string;
  event_date: string;
  certificate_id: string | null;
  created_at: string;
}

export interface DbCertificate {
  id: string;
  certificate_id: string;
  participant_id: string | null;
  event_id: string | null;
  participant_name: string;
  event_title: string;
  event_date: string;
  achievement_text: string;
  signer_name: string;
  signer_title: string;
  status: CertificateStatus;
  storage_key: string | null;
  verification_url: string | null;
  issue_date: string;
  revoked_at: string | null;
  revoked_by: string | null;
  revocation_reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DbEvent {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  event_date: string;
  location: string | null;
  status: EventStatus;
  certificate_description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbParticipant {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface DbUser {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  created_at: string;
  updated_at: string;
}

export interface DbAuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  result: "SUCCESS" | "FAILURE";
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ============================================================
// API Types
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CertificateVerificationResponse {
  status: CertificatePublicStatus;
  certificate?: {
    certificateId: string;
    participantName: string;
    eventTitle: string;
    eventDate: string;
    issueDate: string;
    issuedBy: string;
  };
  revokedAt?: string;
}

export interface GenerateCertificateRequest {
  participantName: string;
  participantEmail?: string;
  eventTitle: string;
  eventDate: string;
  achievementText?: string;
  signerName?: string;
  signerTitle?: string;
  enrollmentNo?: string;
  program?: string;
}
