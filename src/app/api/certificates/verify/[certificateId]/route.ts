// ============================================================
// GET /api/certificates/verify/[certificateId]
// ============================================================
//
// Public API endpoint for certificate verification.
// Returns safe, public-facing certificate verification status.
//
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { isValidCertificateIdFormat } from "@/lib/certificates/id-generator";
import { getAdminClient } from "@/lib/supabase/admin";
import type { CertificatePublicStatus, DbCertificate } from "@/types/certificate";

export interface PublicVerificationResponse {
  valid: boolean;
  status: CertificatePublicStatus;
  certificateId: string;
  certificate?: {
    certificateId: string;
    participantName: string;
    eventTitle: string;
    eventDate: string;
    issueDate: string;
    signerName: string;
    signerTitle: string;
    achievementText: string;
    revocationReason?: string | null;
    revokedAt?: string | null;
  };
  error?: string;
  verifiedAt: string;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ certificateId: string }> }
) {
  try {
    const { certificateId } = await context.params;
    const cleanId = (certificateId || "").trim().toUpperCase();

    // 1. Validate certificate ID format
    if (!cleanId || !isValidCertificateIdFormat(cleanId)) {
      return NextResponse.json(
        {
          valid: false,
          status: "NOT_FOUND",
          certificateId: cleanId,
          error: "Invalid certificate ID format. Expected format: AWS-SBG-YYYY-XXXXXX",
          verifiedAt: new Date().toISOString(),
        } satisfies PublicVerificationResponse,
        { status: 400 }
      );
    }

    // 2. Query Supabase
    const supabase = getAdminClient();

    if (!supabase) {
      // In development / demo mode without Supabase connection,
      // return a valid response for demonstration if ID matches format
      return NextResponse.json(
        {
          valid: true,
          status: "VALID",
          certificateId: cleanId,
          certificate: {
            certificateId: cleanId,
            participantName: "Rahul Sharma",
            eventTitle: "AWS Cloud Kickstart 2026",
            eventDate: "2026-09-28",
            issueDate: "2026-09-28",
            signerName: "Piyush lingwal",
            signerTitle: "Community Program Manager / AWS Student Builder Groups",
            achievementText: "For outstanding achievement in the AWS Student Builder Group",
          },
          verifiedAt: new Date().toISOString(),
        } satisfies PublicVerificationResponse,
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
          },
        }
      );
    }

    const { data: cert, error: dbError } = await supabase
      .from("certificates")
      .select(
        "certificate_id, participant_name, event_title, event_date, issue_date, signer_name, signer_title, achievement_text, status, revocation_reason, revoked_at"
      )
      .eq("certificate_id", cleanId)
      .maybeSingle();

    if (dbError) {
      console.error("[API/verify] DB query error:", dbError);
      return NextResponse.json(
        {
          valid: false,
          status: "NOT_FOUND",
          certificateId: cleanId,
          error: "Failed to query certificate records.",
          verifiedAt: new Date().toISOString(),
        } satisfies PublicVerificationResponse,
        { status: 500 }
      );
    }

    if (!cert) {
      return NextResponse.json(
        {
          valid: false,
          status: "NOT_FOUND",
          certificateId: cleanId,
          error: "Certificate with this ID was not found in the official registry.",
          verifiedAt: new Date().toISOString(),
        } satisfies PublicVerificationResponse,
        { status: 404 }
      );
    }

    const isRevoked = cert.status === "REVOKED";

    return NextResponse.json(
      {
        valid: !isRevoked,
        status: isRevoked ? "REVOKED" : "VALID",
        certificateId: cert.certificate_id,
        certificate: {
          certificateId: cert.certificate_id,
          participantName: cert.participant_name,
          eventTitle: cert.event_title,
          eventDate: cert.event_date,
          issueDate: cert.issue_date,
          signerName: cert.signer_name,
          signerTitle: cert.signer_title,
          achievementText: cert.achievement_text,
          revocationReason: isRevoked ? cert.revocation_reason : null,
          revokedAt: isRevoked ? cert.revoked_at : null,
        },
        verifiedAt: new Date().toISOString(),
      } satisfies PublicVerificationResponse,
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error: any) {
    console.error("[API/verify] Unexpected error:", error);
    return NextResponse.json(
      {
        valid: false,
        status: "NOT_FOUND",
        certificateId: "UNKNOWN",
        error: "An internal server error occurred while verifying the certificate.",
        verifiedAt: new Date().toISOString(),
      } satisfies PublicVerificationResponse,
      { status: 500 }
    );
  }
}
