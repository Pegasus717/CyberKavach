export type MaskToken =
  | "[PHONE]"
  | "[AADHAAR]"
  | "[PAN]"
  | "[ACCOUNT]"
  | "[EMAIL]"
  | "[UPI]"
  | "[OTP]"
  | "[NUMBER]";

export type MaskHit = {
  token: MaskToken;
  original: string;
};

export type MaskResult = {
  masked: string;
  hits: MaskHit[];
};

const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const UPI = /\b[A-Z0-9._-]{2,256}@[A-Z][A-Z0-9._-]{1,64}\b/gi;
const PAN = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/gi;
const AADHAAR = /(?<!\d)(\d{4}[\s-]?\d{4}[\s-]?\d{4})(?!\d)/g;
const PHONE =
  /(?<!\d)(?:\+91[\s-]?|91[\s-]?|0)?([6-9]\d{9})(?!\d)/g;
const OTP_NEAR =
  /(?:\b(?:otp|one[\s-]?time(?:\s+password)?|code|pin|passcode)\b[^\d]{0,24})(\d{4,8})(?!\d)|(\d{4,8})(?=[^\d]{0,24}\b(?:otp|one[\s-]?time(?:\s+password)?|code|pin|passcode)\b)/gi;
const ACCOUNT = /(?<!\d)\d{9,18}(?!\d)/g;
const TEN_DIGIT = /(?<!\d)\d{10}(?!\d)/g;

function pushUnique(hits: MaskHit[], token: MaskToken, original: string) {
  if (!hits.some((hit) => hit.original === original && hit.token === token)) {
    hits.push({ token, original });
  }
}

export function maskText(input: string): MaskResult {
  let masked = input;
  const hits: MaskHit[] = [];

  masked = masked.replace(EMAIL, (match) => {
    pushUnique(hits, "[EMAIL]", match);
    return "[EMAIL]";
  });

  masked = masked.replace(UPI, (match) => {
    if (match.includes(".")) return match;
    pushUnique(hits, "[UPI]", match);
    return "[UPI]";
  });

  masked = masked.replace(PAN, (match) => {
    pushUnique(hits, "[PAN]", match);
    return "[PAN]";
  });

  masked = masked.replace(OTP_NEAR, (match, a: string | undefined, b: string | undefined) => {
    const digits = a || b || match.match(/\d{4,8}/)?.[0] || match;
    pushUnique(hits, "[OTP]", digits);
    return match.replace(digits, "[OTP]");
  });

  masked = masked.replace(PHONE, (match) => {
    pushUnique(hits, "[PHONE]", match);
    return "[PHONE]";
  });

  masked = masked.replace(AADHAAR, (match) => {
    pushUnique(hits, "[AADHAAR]", match);
    return "[AADHAAR]";
  });

  masked = masked.replace(ACCOUNT, (match) => {
    if (match.length === 10) return match;
    if (match.length === 12) return match;
    pushUnique(hits, "[ACCOUNT]", match);
    return "[ACCOUNT]";
  });

  masked = masked.replace(TEN_DIGIT, (match) => {
    pushUnique(hits, "[NUMBER]", match);
    return "[NUMBER]";
  });

  return { masked, hits };
}
