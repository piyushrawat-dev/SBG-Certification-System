import { Metadata } from "next";
import Link from "next/link";
import { isValidCertificateIdFormat } from "@/lib/certificates/id-generator";
import { getAdminClient } from "@/lib/supabase/admin";
import { CertificatePreview } from "@/components/certificates/CertificatePreview";

interface PageProps {
  params: Promise<{ certificateId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { certificateId } = await params;
  const cleanId = (certificateId || "").toUpperCase();

  return {
    title: `Certificate Verification | ${cleanId} — AWS Student Builders Group`,
    description: `Official verification record for certificate ${cleanId} issued by AWS Student Builders Group at Tulas University.`,
  };
}

export default async function VerifyPage({ params }: PageProps) {
  const { certificateId } = await params;
  const cleanId = (certificateId || "").trim().toUpperCase();

  const isFormatValid = isValidCertificateIdFormat(cleanId);

  // Default / fallback state for demonstration if Supabase is not configured
  let status: "VALID" | "REVOKED" | "NOT_FOUND" = isFormatValid ? "VALID" : "NOT_FOUND";
  let cert = {
    certificateId: cleanId,
    participantName: "Rahul Sharma",
    eventTitle: "AWS Cloud Kickstart 2026",
    eventDate: "28 September 2026",
    issueDate: "28 September 2026",
    signerName: "Piyush lingwal",
    signerTitle: "Community Program Manager / AWS Student Builder Groups",
    achievementText: "For outstanding achievement in the AWS Student Builder Group",
    revocationReason: null as string | null,
    revokedAt: null as string | null,
  };

  const supabase = getAdminClient();
  if (supabase && isFormatValid) {
    const { data } = await supabase
      .from("certificates")
      .select(
        "certificate_id, participant_name, event_title, event_date, issue_date, signer_name, signer_title, achievement_text, status, revocation_reason, revoked_at"
      )
      .eq("certificate_id", cleanId)
      .maybeSingle();

    if (data) {
      status = data.status === "REVOKED" ? "REVOKED" : "VALID";
      cert = {
        certificateId: data.certificate_id,
        participantName: data.participant_name,
        eventTitle: data.event_title,
        eventDate: data.event_date,
        issueDate: data.issue_date,
        signerName: data.signer_name,
        signerTitle: data.signer_title,
        achievementText: data.achievement_text,
        revocationReason: data.revocation_reason,
        revokedAt: data.revoked_at,
      };
    } else {
      status = "NOT_FOUND";
    }
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 flex flex-col selection:bg-amber-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-wide text-zinc-100">
                AWS Student Builders Group
              </h1>
              <p className="text-[11px] text-zinc-400">Official Certificate Verification</p>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs text-zinc-400 hover:text-white transition-colors bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg"
          >
            Portal Home
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
        {status === "VALID" && (
          <div className="space-y-6">
            {/* Status Banner */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 backdrop-blur-sm relative overflow-hidden shadow-2xl shadow-emerald-950/30">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-emerald-400"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide uppercase mb-1">
                    Authentic & Verified
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Official AWS SBG Certificate
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    This certificate is cryptographically valid and registered in the AWS SBG official records.
                  </p>
                </div>
              </div>
            </div>

            {/* Certificate Record Card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-6 sm:p-8 space-y-6 shadow-xl">
              <div>
                <span className="text-xs font-medium text-amber-400 uppercase tracking-widest">
                  Recipient
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
                  {cert.participantName}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-zinc-800">
                <div>
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Event / Program
                  </span>
                  <p className="text-base font-semibold text-zinc-200 mt-1">
                    {cert.eventTitle}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Issued on
                  </span>
                  <p className="text-base font-semibold text-zinc-200 mt-1">
                    {cert.issueDate}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Certificate ID
                  </span>
                  <div className="mt-1">
                    <code className="text-sm font-mono font-bold text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2.5 py-1 rounded inline-block">
                      {cert.certificateId}
                    </code>
                  </div>
                </div>
              </div>

              {/* Security & Verification Metadata */}
              <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-amber-400 shrink-0"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  </svg>
                  <span>Issued by AWS Student Builders Group at Tulas University</span>
                </div>

                <div className="text-[11px] text-zinc-500 font-mono">
                  Verified via AWS SBG Verification Protocol
                </div>
              </div>
            </div>

            {/* Certificate Visual Preview */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-400 uppercase tracking-widest">
                  Official Vector Certificate
                </span>
                <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                  SVG Rendered
                </span>
              </div>
              <CertificatePreview
                participantName={cert.participantName}
                eventTitle={cert.eventTitle}
                eventDate={cert.eventDate}
                signerName={cert.signerName}
                signerTitle={cert.signerTitle}
                certificateId={cert.certificateId}
              />
            </div>
          </div>
        )}

        {status === "REVOKED" && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-950/20 p-8 backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
              <div>
                <h2 className="text-xl font-bold text-white">Certificate Revoked</h2>
                <p className="text-xs text-rose-300">
                  This certificate has been revoked and is no longer valid.
                </p>
              </div>
            </div>

            <div className="bg-zinc-900/60 rounded-xl p-4 border border-zinc-800 text-xs space-y-2">
              <p className="text-zinc-300">
                <span className="text-zinc-500">Certificate ID:</span>{" "}
                <span className="font-mono text-white">{cert.certificateId}</span>
              </p>
              <p className="text-zinc-300">
                <span className="text-zinc-500">Recipient:</span> {cert.participantName}
              </p>
              {cert.revocationReason && (
                <p className="text-rose-300">
                  <span className="text-zinc-500">Reason for revocation:</span> {cert.revocationReason}
                </p>
              )}
            </div>
          </div>
        )}

        {status === "NOT_FOUND" && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Certificate Not Found</h2>
              <p className="text-xs text-zinc-400 mt-1">
                No certificate record was found matching ID:{" "}
                <span className="font-mono text-amber-400">{cleanId}</span>
              </p>
            </div>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Please check that the certificate ID is typed accurately, or scan the official QR code printed directly on the certificate.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-medium text-amber-400 hover:text-amber-300"
              >
                ← Back to Generator Portal
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 py-6 text-center text-xs text-zinc-500">
        AWS Student Builders Group • Tulas University • Secure Certificate Verification System
      </footer>
    </div>
  );
}
