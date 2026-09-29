"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Award,
  Check,
  Copy,
  ExternalLink,
  Download,
  Calendar,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import "./attendance.css";

interface FormData {
  name: string;
  email: string;
  enrollmentNo: string;
  program: string;
  eventTitle: string;
  eventDate: string;
}

const DEFAULT_FORM: FormData = {
  name: "",
  email: "",
  enrollmentNo: "",
  program: "",
  eventTitle: "",
  eventDate: new Date().toISOString().split("T")[0],
};

const SAMPLE_DATA: FormData = {
  name: "Piyush Rawat",
  email: "piyush.rawat@tulas.edu.in",
  enrollmentNo: "202609018",
  program: "B.Tech",
  eventTitle: "Cloud Kickstart 2026",
  eventDate: new Date().toISOString().split("T")[0],
};

const PROGRAMS = ["B.Tech", "BCA", "MCA", "B.Sc", "BBA", "MBA", "Other"];

const EVENT_PRESETS = [
  "Cloud Kickstart 2026",
  "AWS Immersion Day",
  "GenAI Builder Workshop",
  "Serverless Architecture Day",
];

function formatEventDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    if (y && m && d) {
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export default function Home() {
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastCertificateId, setLastCertificateId] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrorMsg("");
  };

  const loadSample = () => {
    setForm(SAMPLE_DATA);
    setErrorMsg("");
    toast.info("Sample attendee details loaded");
  };

  const handleReset = () => {
    setForm(DEFAULT_FORM);
    setErrorMsg("");
    setLastCertificateId(null);
    setPdfBlob(null);
    setSubmitted(false);
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return "Full name is required.";
    if (form.name.trim().length < 2) return "Name must be at least 2 characters.";
    if (!form.email.trim()) return "College email ID is required.";
    if (!form.enrollmentNo.trim()) return "Enrollment number is required.";
    if (!form.program) return "Please select your course / academic program.";
    if (!form.eventTitle.trim()) return "Event title is required.";
    if (!form.eventDate) return "Event date is required.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setErrorMsg(err);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const response = await fetch("/api/certificates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantName: form.name.trim(),
          participantEmail: form.email.trim(),
          eventTitle: form.eventTitle.trim(),
          eventDate: form.eventDate,
          enrollmentNo: form.enrollmentNo.trim(),
          program: form.program,
        }),
      });

      if (response.status === 409) {
        // Duplicate email — a certificate was already issued
        const data = await response.json().catch(() => null);
        const existingId: string | undefined = data?.data?.certificateId;
        setErrorMsg(
          existingId
            ? `A certificate has already been issued to this email.\nCertificate ID: ${existingId}`
            : "A certificate has already been issued to this email address."
        );
        if (existingId) {
          setLastCertificateId(existingId);
        }
        setIsSubmitting(false);
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || `Generation failed (${response.status})`);
      }

      const certificateId = response.headers.get("X-Certificate-Id");
      setLastCertificateId(certificateId);

      // Store the generated PDF blob for on-demand download
      const blob = await response.blob();
      setPdfBlob(blob);

      setSubmitted(true);
      toast.success("Attendance marked & certificate ready!");
    } catch (error: any) {
      console.error("Submission failed:", error);
      setErrorMsg("Could not submit — " + (error.message || "please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadCertificate = () => {
    if (!lastCertificateId) return;

    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${lastCertificateId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Certificate downloaded!");
    } else {
      toast.info("Certificate already downloaded.");
    }
  };

  const copyToClipboard = (text: string, type: "id" | "link") => {
    navigator.clipboard.writeText(text);
    if (type === "id") {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
      toast.success("Certificate ID copied");
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success("Verification link copied");
    }
  };

  // ── Success Screen ─────────────────────────────────────────
  if (submitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-[#F4F4F6]"
        style={{
          background: `
            radial-gradient(600px 300px at 50% 0%, rgba(108,99,255,0.18), transparent 70%),
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px) 0 0/44px 44px,
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px) 0 0/44px 44px,
            #08080B
          `,
          padding: "48px 16px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "440px" }}>
          {/* Brand Tag */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(108,99,255,0.1)] border border-[rgba(108,99,255,0.25)] text-xs text-[#A78BFA] font-medium">
              <Award className="w-3.5 h-3.5 text-[#6C63FF]" />
              <span>AWS Student Builder Group • Tulas University</span>
            </div>
          </div>

          {/* Card */}
          <div className="att-card text-center !p-8 sm:!p-9">
            {/* ✓ Icon */}
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-[rgba(52,211,153,0.12)] border border-[rgba(52,211,153,0.35)] text-[#34D399]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-7 h-7"
              >
                <path d="m5 12 5 5L20 7" />
              </svg>
            </div>

            {/* Attendance Confirmed */}
            <h2 className="text-2xl font-bold text-white mb-2">
              Attendance Confirmed
            </h2>

            {/* Personalized Message */}
            <div className="text-sm leading-relaxed mb-5">
              <p className="text-white font-medium text-[15px]">
                Thank you, {form.name}!
              </p>
              <p className="text-[#8B8B96] mt-0.5">
                Your certificate is ready.
              </p>
            </div>

            {/* Event Summary Box */}
            <div className="p-4 rounded-xl bg-[#17171C]/90 border border-[#26262D] text-left mb-4 space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#8B8B96] font-mono font-medium mb-0.5">
                  EVENT
                </div>
                <div className="text-[13.5px] font-semibold text-white">
                  {form.eventTitle || "Cloud Kickstart 2026"}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#8B8B96] font-mono font-medium mb-0.5">
                  DATE
                </div>
                <div className="text-[13px] text-[#D1D1DB] font-medium">
                  {formatEventDate(form.eventDate)}
                </div>
              </div>
            </div>

            {/* Certificate ID Box */}
            {lastCertificateId && (
              <div className="p-3.5 rounded-xl bg-[#17171C] border border-[#26262D] mb-5">
                <div className="text-[10.5px] uppercase tracking-wider text-[#8B8B96] mb-1 font-mono font-medium">
                  CERTIFICATE ID
                </div>
                <div className="font-mono text-base sm:text-lg font-bold text-[#6C63FF] tracking-wider select-all">
                  {lastCertificateId}
                </div>
              </div>
            )}

            {/* Action Buttons Stack */}
            <div className="space-y-3">
              {/* Primary CTA: Download Certificate */}
              <button
                type="button"
                onClick={handleDownloadCertificate}
                className="w-full h-12 rounded-xl text-sm font-semibold bg-[#6C63FF] hover:brightness-110 active:scale-[0.99] text-white flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(108,99,255,0.25)] transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Certificate</span>
              </button>

              {/* Secondary CTA: Verify Certificate */}
              {lastCertificateId && (
                <Link
                  href={`/verify/${lastCertificateId}`}
                  target="_blank"
                  className="w-full h-12 rounded-xl text-sm font-semibold bg-[#17171C] hover:bg-[#1f1f26] active:scale-[0.99] text-[#F4F4F6] border border-[#26262D] hover:border-[#3A3A44] flex items-center justify-center gap-2 transition-all"
                >
                  <ExternalLink className="w-4 h-4 text-[#8B8B96]" />
                  <span>Verify Certificate</span>
                </Link>
              )}

              {/* Utility actions */}
              {lastCertificateId && (
                <div className="flex items-center justify-center gap-5 pt-3">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(lastCertificateId, "id")}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8B8B96] hover:text-[#F4F4F6] transition-colors cursor-pointer"
                  >
                    {copiedId ? (
                      <Check className="w-3.5 h-3.5 text-[#34D399]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedId ? "Copied ID" : "Copy ID"}</span>
                  </button>

                  <span className="text-[#26262D]">•</span>

                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/verify/${lastCertificateId}`;
                      copyToClipboard(url, "link");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8B8B96] hover:text-[#F4F4F6] transition-colors cursor-pointer"
                  >
                    {copiedLink ? (
                      <Check className="w-3.5 h-3.5 text-[#34D399]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedLink ? "Copied Link" : "Copy Verification Link"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Form Screen ───────────────────────────────────────
  return (
    <div
      className="min-h-screen flex justify-center text-[#F4F4F6]"
      style={{
        background: `
          radial-gradient(600px 300px at 15% 0%, rgba(108,99,255,0.18), transparent 70%),
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px) 0 0/44px 44px,
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px) 0 0/44px 44px,
          #08080B
        `,
        padding: "40px 16px 60px",
      }}
    >
      <div className="att-page-wrap">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(108,99,255,0.1)] border border-[rgba(108,99,255,0.25)] text-xs text-[#A78BFA] font-medium mb-3">
            <Award className="w-3.5 h-3.5 text-[#6C63FF]" />
            <span>AWS Student Builder Group • Tulas University</span>
          </div>
          <h1 className="text-[28px] sm:text-[32px] leading-tight font-bold tracking-tight text-white mb-2">
            You&apos;re marking your presence
          </h1>
          <p className="text-[#8B8B96] text-[14px] sm:text-[14.5px] leading-relaxed max-w-[460px] mx-auto">
            Fill this in right after the session so your attendance is recorded and your certificate is generated.
          </p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={loadSample}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-[#A78BFA] bg-[rgba(108,99,255,0.08)] hover:bg-[rgba(108,99,255,0.18)] border border-[rgba(108,99,255,0.25)] transition-all cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              Load Sample Data
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-[#8B8B96] hover:text-[#F4F4F6] bg-[#17171C] hover:bg-[#1f1f26] border border-[#26262D] transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </header>

        <form onSubmit={handleSubmit}>
          {/* ── Card 1: Contact & Identification ──────────────── */}
          <section className="att-card">
            <div className="att-card-head">
              <div className="att-badge green">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                </svg>
              </div>
              <div>
                <h2 className="att-card-title">1. Contact &amp; Identification</h2>
                <p className="att-card-note">How we record who you are</p>
              </div>
            </div>

            {/* Full Name */}
            <div className="att-field">
              <label className="att-lbl" htmlFor="name">
                Full name <span className="req">*</span>
              </label>
              <div className="att-input-wrap">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                </svg>
                <input
                  id="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. John"
                  className="att-input"
                />
              </div>
            </div>

            {/* College Email ID */}
            <div className="att-field">
              <label className="att-lbl" htmlFor="email">
                College email ID <span className="req">*</span>
              </label>
              <div className="att-input-wrap">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="e.g. john202609018@tulas.edu.in"
                  className="att-input"
                />
              </div>
            </div>

            {/* Enrollment Number */}
            <div className="att-field">
              <label className="att-lbl" htmlFor="enroll">
                Enrollment number <span className="req">*</span>
              </label>
              <div className="att-input-wrap">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16" />
                </svg>
                <input
                  id="enroll"
                  type="text"
                  required
                  value={form.enrollmentNo}
                  onChange={(e) => updateField("enrollmentNo", e.target.value)}
                  placeholder="e.g. 202609018"
                  className="att-input"
                />
              </div>
            </div>
          </section>

          {/* ── Card 2: Academic Details ──────────────────────── */}
          <section className="att-card">
            <div className="att-card-head">
              <div className="att-badge cyan">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m2 9 10-5 10 5-10 5z" />
                  <path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
                </svg>
              </div>
              <div>
                <h2 className="att-card-title">2. Academic Details</h2>
                <p className="att-card-note">Your course at Tulas University</p>
              </div>
            </div>

            <div className="att-field">
              <div className="att-lbl" id="programLabel">
                Course <span className="req">*</span>
              </div>
              <div className="att-pills" role="radiogroup" aria-labelledby="programLabel">
                {PROGRAMS.map((p) => (
                  <label key={p} className="att-pill">
                    <input
                      type="radio"
                      name="program"
                      value={p}
                      checked={form.program === p}
                      onChange={() => updateField("program", p)}
                      required
                    />
                    <span>{p}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* ── Card 3: Event Details ─────────────────────────── */}
          <section className="att-card">
            <div className="att-card-head">
              <div className="att-badge amber">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h2 className="att-card-title">3. Event Details</h2>
                <p className="att-card-note">The session you attended</p>
              </div>
            </div>

            {/* Event Title */}
            <div className="att-field">
              <label className="att-lbl" htmlFor="eventTitle">
                Event title <span className="req">*</span>
              </label>
              <div className="att-input-wrap">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                <input
                  id="eventTitle"
                  type="text"
                  required
                  value={form.eventTitle}
                  onChange={(e) => updateField("eventTitle", e.target.value)}
                  placeholder="e.g. Cloud Kickstart 2026"
                  className="att-input"
                />
              </div>

              {/* Event Presets */}
              <div className="att-pills !gap-2 mt-3">
                {EVENT_PRESETS.map((preset) => (
                  <label key={preset} className="att-pill att-preset-pill">
                    <input
                      type="radio"
                      name="eventPreset"
                      value={preset}
                      checked={form.eventTitle === preset}
                      onChange={() => updateField("eventTitle", preset)}
                    />
                    <span>{preset}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Event Date */}
            <div className="att-field">
              <div className="flex items-center justify-between mb-2">
                <label className="att-lbl !mb-0" htmlFor="eventDate">
                  Event date <span className="req">*</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    updateField("eventDate", new Date().toISOString().split("T")[0])
                  }
                  className="text-[11.5px] text-[#6C63FF] hover:underline cursor-pointer font-medium font-mono"
                >
                  Set today
                </button>
              </div>
              <input
                id="eventDate"
                type="date"
                required
                value={form.eventDate}
                onChange={(e) => updateField("eventDate", e.target.value)}
                className="att-input-no-icon"
              />
            </div>
          </section>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="att-submit-btn"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Marking attendance &amp; generating certificate…</span>
              </>
            ) : (
              <span>Mark attendance &amp; Download Certificate</span>
            )}
          </button>

          {/* Error Message */}
          {errorMsg && (
            <div className="mt-3.5 text-center">
              <p className="text-sm leading-relaxed text-[#F87171] whitespace-pre-line">
                {errorMsg}
              </p>
              {lastCertificateId && (
                <Link
                  href={`/verify/${lastCertificateId}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-[#6C63FF] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View existing certificate →
                </Link>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
