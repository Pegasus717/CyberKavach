export function createScamFingerprint(text: string): string {
  if (!text) return "";

  return text
    .toLowerCase()
    // Replace URLs
    .replace(/(https?:\/\/[^\s]+)/gi, "")
    // Replace phone numbers / digits
    .replace(/\b\d+\b/g, "")
    // Replace UPI handles or emails
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "")
    // Replace punctuation with spaces
    .replace(/[^\w\s]/gi, " ")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim();
}
