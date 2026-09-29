// ============================================================
// Certificate ID Generator
// ============================================================
//
// Format: AWS-SBG-{YEAR}-{CODE}
// Example: AWS-SBG-2026-A8F92K
//
// Character set (30 chars): ABCDEFGHJKMNPQRSTUVWXYZ23456789
// Excludes ambiguous: 0, O, 1, I, L
// 30^6 = 729,000,000 unique combinations per year
//
// ============================================================

import crypto from "crypto";

/** Unambiguous character set — excludes 0/O, 1/I/L */
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const PREFIX = "AWS-SBG";
const MAX_GENERATION_ATTEMPTS = 10;

/**
 * Generates a cryptographically random alphanumeric code
 * using the unambiguous character set.
 */
function generateRandomCode(length: number = CODE_LENGTH): string {
  const bytes = crypto.randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CHARSET[bytes[i] % CHARSET.length];
  }
  return code;
}

/**
 * Composes a full certificate ID from a random code.
 *
 * @param year - The year to include in the ID (defaults to current year)
 * @returns A certificate ID like "AWS-SBG-2026-A8F92K"
 */
export function composeCertificateId(
  code: string,
  year?: number
): string {
  const y = year ?? new Date().getFullYear();
  return `${PREFIX}-${y}-${code}`;
}

/**
 * Generates a unique certificate ID.
 *
 * In Phase 1 (no database), this just generates a random ID.
 * In Phase 2+, the `existsCheck` callback verifies uniqueness against the DB.
 *
 * @param existsCheck - Optional async function that returns true if the ID already exists
 * @param year - Optional year override (defaults to current year)
 * @returns A unique certificate ID
 * @throws Error if unable to generate a unique ID after max attempts
 */
export async function generateCertificateId(
  existsCheck?: (certificateId: string) => Promise<boolean>,
  year?: number
): Promise<string> {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const code = generateRandomCode();
    const certificateId = composeCertificateId(code, year);

    // If no uniqueness check is provided, trust randomness
    if (!existsCheck) {
      return certificateId;
    }

    const exists = await existsCheck(certificateId);
    if (!exists) {
      return certificateId;
    }

    console.warn(
      `[CertificateID] Collision detected for ${certificateId}, retrying (attempt ${attempt + 1}/${MAX_GENERATION_ATTEMPTS})`
    );
  }

  throw new Error(
    `Failed to generate a unique certificate ID after ${MAX_GENERATION_ATTEMPTS} attempts. This is extremely unlikely and may indicate a database issue.`
  );
}

/**
 * Validates the format of a certificate ID.
 *
 * @param certificateId - The certificate ID to validate
 * @returns true if the format matches AWS-SBG-{YEAR}-{CODE}
 */
export function isValidCertificateIdFormat(certificateId: string): boolean {
  const pattern = /^AWS-SBG-\d{4}-[A-Z2-9]{6}$/;
  return pattern.test(certificateId);
}

/**
 * Extracts the year from a certificate ID.
 *
 * @param certificateId - A valid certificate ID
 * @returns The year as a number, or null if invalid format
 */
export function extractYearFromCertificateId(
  certificateId: string
): number | null {
  const match = certificateId.match(/^AWS-SBG-(\d{4})-[A-Z2-9]{6}$/);
  return match ? parseInt(match[1], 10) : null;
}
