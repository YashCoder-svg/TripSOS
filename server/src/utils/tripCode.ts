import crypto from 'node:crypto';

// Characters excluding ambiguous ones like 0, O, 1, I
const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generates an 8-character trip code in the format TRP-XXXX
 * e.g., "TRP-82K7"
 */
export function generateTripCode(): string {
  const bytes = crypto.randomBytes(4);
  let code = '';
  for (let i = 0; i < 4; i++) {
    const byte = bytes[i] ?? 0;
    code += CODE_CHARS[byte % CODE_CHARS.length];
  }
  return `TRP-${code}`;
}

export function isValidTripCode(code: string): boolean {
  return /^TRP-[2-9A-HJ-NP-Z]{4,6}$/i.test(code.trim());
}
