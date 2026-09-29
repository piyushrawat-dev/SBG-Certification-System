// ============================================================
// POST /api/certificates/generate
// ============================================================
//
// Generates a single certificate PDF and returns it for download.
//
// Phase 1: No database, no auth — direct PDF generation.
// Phase 2+: Will add database storage, auth, and duplicate checks.
//
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { generateCertificatePdf } from "@/lib/certificates/pdf-generator";
import type {
  GenerateCertificateRequest,
  ApiResponse,
} from "@/types/certificate";

/**
 * Validates the generation request body.
 */
function validateRequest(
  body: Partial<GenerateCertificateRequest>
): { valid: false; errors: Record<string, string> } | { valid: true } {
  const errors: Record<string, string> = {};

  if (!body.participantName?.trim()) {
    errors.participantName = "Participant name is required.";
  } else if (body.participantName.trim().length < 2) {
    errors.participantName =
      "Participant name must be at least 2 characters.";
  } else if (body.participantName.trim().length > 100) {
    errors.participantName =
      "Participant name must be at most 100 characters.";
  }

  if (!body.eventTitle?.trim()) {
    errors.eventTitle = "Event title is required.";
  } else if (body.eventTitle.trim().length > 200) {
    errors.eventTitle = "Event title must be at most 200 characters.";
  }

  if (!body.eventDate?.trim()) {
    errors.eventDate = "Event date is required.";
  } else {
    const date = new Date(body.eventDate);
    if (isNaN(date.getTime())) {
      errors.eventDate = "Invalid date format. Use ISO date (YYYY-MM-DD).";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: Partial<GenerateCertificateRequest>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body.",
        } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // Validate input
    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed.",
          data: validation.errors,
        } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // Generate certificate PDF
    const result = await generateCertificatePdf({
      participantName: body.participantName!.trim(),
      eventTitle: body.eventTitle!.trim(),
      eventDate: body.eventDate!.trim(),
      achievementText: body.achievementText?.trim() || undefined,
      signerName: body.signerName?.trim() || undefined,
      signerTitle: body.signerTitle?.trim() || undefined,
    });

    if (!result.success || !result.pdfBuffer) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Certificate generation failed.",
        } satisfies ApiResponse,
        { status: 500 }
      );
    }

    // Save to database with student and event details for long-term storage
    try {
      const { getAdminClient } = await import("@/lib/supabase/admin");
      const supabase = getAdminClient();
      if (supabase && result.certificateId) {
        let participantId: string | null = null;
        let eventId: string | null = null;

        const email = body.participantEmail?.trim();
        const studentName = body.participantName!.trim();
        const eventTitle = body.eventTitle!.trim();
        const eventDate = body.eventDate!.trim();

        // 1. Link or create participant if email is provided
        if (email) {
          try {
            const { data: existingParticipant } = await supabase
              .from("participants")
              .select("id")
              .eq("email", email.toLowerCase())
              .maybeSingle();

            if (existingParticipant) {
              participantId = existingParticipant.id;
            } else {
              const { data: newParticipant } = await supabase
                .from("participants")
                .insert({
                  full_name: studentName,
                  email: email.toLowerCase(),
                })
                .select("id")
                .single();
              if (newParticipant) {
                participantId = newParticipant.id;
              }
            }
          } catch (pErr) {
            console.warn("[API/generate] Participant lookup/creation error:", pErr);
          }
        }

        // 2. Link or create event record
        try {
          const eventSlug = eventTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

          const { data: existingEvent } = await supabase
            .from("events")
            .select("id")
            .eq("slug", eventSlug)
            .maybeSingle();

          if (existingEvent) {
            eventId = existingEvent.id;
          } else {
            const { data: newEvent } = await supabase
              .from("events")
              .insert({
                title: eventTitle,
                slug: eventSlug,
                event_date: eventDate,
                status: "PUBLISHED",
              })
              .select("id")
              .single();
            if (newEvent) {
              eventId = newEvent.id;
            }
          }
        } catch (eErr) {
          console.warn("[API/generate] Event lookup/creation error:", eErr);
        }

        // 3. Insert the official Certificate record
        const verificationUrl = `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/verify/${result.certificateId}`;

        const { error: insertError } = await supabase.from("certificates").insert({
          certificate_id: result.certificateId,
          participant_id: participantId,
          event_id: eventId,
          participant_name: studentName,
          event_title: eventTitle,
          event_date: eventDate,
          achievement_text:
            body.achievementText?.trim() ||
            "For outstanding achievement in the AWS Student Builder Group",
          signer_name: body.signerName?.trim() || "Piyush lingwal",
          signer_title:
            body.signerTitle?.trim() ||
            "Community Program Manager / AWS Student Builder Groups",
          status: "GENERATED",
          verification_url: verificationUrl,
          issue_date: new Date().toISOString().split("T")[0],
          metadata: {
            studentEmail: email || null,
            generatedAt: new Date().toISOString(),
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
            engine: "svg-vector-ibm-plex",
          },
        });

        if (insertError) {
          console.error("[API/generate] Certificate DB insert error:", insertError);
        } else {
          console.log(`[API/generate] Stored certificate ${result.certificateId} in Supabase registry.`);
        }

        // 4. Create an immutable Audit Log entry
        try {
          await supabase.from("audit_logs").insert({
            action: "CERTIFICATE_GENERATED",
            resource_type: "CERTIFICATE",
            resource_id: result.certificateId,
            result: insertError ? "FAILURE" : "SUCCESS",
            metadata: {
              participantName: studentName,
              participantEmail: email || null,
              eventTitle: eventTitle,
              eventDate: eventDate,
              timestamp: new Date().toISOString(),
            },
          });
        } catch (aErr) {
          console.warn("[API/generate] Audit log error:", aErr);
        }

        // 5. Record attendance in the certificate_attendance table
        const enrollmentNo = body.enrollmentNo?.trim();
        const program = body.program?.trim();
        if (enrollmentNo && program) {
          try {
            const { error: attInsertErr } = await supabase.from("certificate_attendance").insert({
              full_name: studentName,
              college_email: email || "",
              enrollment_no: enrollmentNo,
              program: program,
              event_title: eventTitle,
              event_date: eventDate,
              certificate_id: result.certificateId,
            });
            if (attInsertErr) {
              console.error("[API/generate] Attendance insert error:", attInsertErr);
            } else {
              console.log(`[API/generate] Attendance recorded for ${studentName}`);
            }
          } catch (attErr) {
            console.warn("[API/generate] Attendance recording error:", attErr);
          }
        }
      }
    } catch (dbErr) {
      console.warn("[API/generate] Database recording skipped or failed:", dbErr);
    }

    // Return PDF as downloadable file
    const filename = `${result.certificateId}.pdf`;

    return new NextResponse(new Uint8Array(result.pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": result.pdfBuffer.length.toString(),
        "X-Certificate-Id": result.certificateId!,
      },
    });
  } catch (error: any) {
    console.error("[API/generate] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred during certificate generation.",
      } satisfies ApiResponse,
      { status: 500 }
    );
  }
}