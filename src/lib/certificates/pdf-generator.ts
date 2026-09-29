// ============================================================
// Certificate PDF Generator (SVG-Driven)
// ============================================================
//
// Generates an ultra high-quality PDF certificate by:
// 1. Building the pure vector SVG with dynamic participant,
//    event, signer, and QR code data.
// 2. Rendering the SVG at 300 DPI via sharp (serverless-compatible).
// 3. Embedding into a US Letter Landscape PDF page via pdf-lib.
//
// 100% SVG-driven. No raster template conflicts.
//
// ============================================================

import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import QRCode from "qrcode";
import type {
  CertificateGenerationInput,
  CertificateGenerationResult,
} from "@/types/certificate";
import { generateCertificateId } from "./id-generator";
import { getVerificationUrl } from "./qr-generator";
import { generateCertificateSvg } from "./svg-generator";

/**
 * Formats an ISO date string into a human-readable format.
 * Example: "2026-09-28" → "28 September 2026"
 */
function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return isoDate;
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

/**
 * Generates a complete PDF certificate from dynamic input using the SVG template.
 *
 * @param input - Certificate generation parameters
 * @returns Generation result with certificateId and downloadable pdfBuffer
 */
export async function generateCertificatePdf(
  input: CertificateGenerationInput
): Promise<CertificateGenerationResult> {
  try {
    // 1. Generate unique Certificate ID
    const certificateId = await generateCertificateId();

    // 2. Generate QR code pointing to public verification page
    const verificationUrl = getVerificationUrl(certificateId);
    const qrDataUri = await QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 300,
      errorCorrectionLevel: "M",
    });

    // 3. Format event date
    const formattedDate = formatDate(input.eventDate);

    // 4. Generate dynamic SVG certificate
    const svgString = await generateCertificateSvg({
      participantName: input.participantName.trim(),
      eventTitle: input.eventTitle.trim(),
      eventDate: formattedDate,
      signerName: input.signerName?.trim(),
      signerTitle: input.signerTitle?.trim(),
      certificateId,
      qrDataUri,
    });

    // 5. Render SVG to pristine 300-DPI PNG buffer via sharp
    const renderedImageBuffer = await sharp(Buffer.from(svgString))
      .png({ quality: 100, compressionLevel: 8 })
      .toBuffer();

    // 6. Create PDF page (US Letter Landscape: 792 × 612 pt)
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([792, 612]);

    // 7. Embed rendered image as full-bleed background
    const embeddedImage = await pdfDoc.embedPng(renderedImageBuffer);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: 792,
      height: 612,
    });

    // 8. Serialize PDF
    const pdfBytes = await pdfDoc.save();

    console.log(
      `[PDFGenerator] SVG-based certificate generated: ${certificateId} ` +
        `(${(pdfBytes.length / 1024).toFixed(1)} KB) ` +
        `for "${input.participantName}" — "${input.eventTitle}"`
    );

    return {
      success: true,
      certificateId,
      pdfBuffer: Buffer.from(pdfBytes),
    };
  } catch (error: any) {
    console.error("[PDFGenerator] Certificate generation failed:", error);
    return {
      success: false,
      error: error.message || "Unknown error during PDF generation",
    };
  }
}
