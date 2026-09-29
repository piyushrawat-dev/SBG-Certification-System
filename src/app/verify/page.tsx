"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Search, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function VerifyLookup() {
  const router = useRouter();
  const [certId, setCertId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = certId.trim();
    if (!id) {
      setError("Please enter a certificate ID.");
      return;
    }
    router.push(`/verify/${id}`);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center text-[#F4F4F6]"
      style={{
        background: `
          radial-gradient(600px 300px at 50% 0%, rgba(52,211,153,0.12), transparent 70%),
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px) 0 0/44px 44px,
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px) 0 0/44px 44px,
          #08080B
        `,
        padding: "40px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "440px" }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
            style={{
              background: "rgba(52,211,153,0.1)",
              border: "1px solid rgba(52,211,153,0.3)",
            }}
          >
            <ShieldCheck className="w-8 h-8 text-[#34D399]" />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-white mb-2">
            Verify Certificate
          </h1>
          <p className="text-[#8B8B96] text-sm leading-relaxed">
            Enter the certificate ID to verify its authenticity and view details.
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
            padding: "28px 24px",
          }}
        >
          <form onSubmit={handleSubmit}>
            <label
              htmlFor="certId"
              className="block text-xs font-semibold uppercase tracking-wider text-[#8B8B96] mb-2"
            >
              Certificate ID
            </label>
            <div className="relative">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B8B96] pointer-events-none"
              />
              <input
                id="certId"
                type="text"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                value={certId}
                onChange={(e) => {
                  setCertId(e.target.value);
                  setError("");
                }}
                placeholder="e.g. AWS-SBG-2026-XXXXXX"
                style={{
                  width: "100%",
                  background: "#17171C",
                  border: error
                    ? "1px solid rgba(248,113,113,0.6)"
                    : "1px solid #26262D",
                  borderRadius: "12px",
                  padding: "11px 14px 11px 38px",
                  fontSize: "14px",
                  color: "#F4F4F6",
                  outline: "none",
                  fontFamily: "monospace",
                  boxSizing: "border-box",
                  letterSpacing: "0.03em",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border =
                    "1px solid rgba(52,211,153,0.5)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = error
                    ? "1px solid rgba(248,113,113,0.6)"
                    : "1px solid #26262D";
                }}
              />
            </div>

            {error && (
              <p className="text-xs text-[#F87171] mt-2">{error}</p>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                marginTop: "16px",
                padding: "12px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #34D399, #10B981)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "14px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <ShieldCheck className="w-4 h-4" />
              Verify Certificate
            </button>
          </form>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#8B8B96] hover:text-[#F4F4F6] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to attendance form
          </Link>
        </div>
      </div>
    </div>
  );
}
