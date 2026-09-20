export const JOIN_CODE_KEY = "kavach-join-code";

export function normalizeShareCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function formatShareCode(code: string): string {
  const normalized = normalizeShareCode(code);
  if (normalized.length !== 8) return normalized;
  return `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
}

export type ConnectionStatus = "pending" | "accepted" | "declined";

export function canRespondToRequest(params: {
  currentUserId: string;
  addresseeId: string;
  status: ConnectionStatus;
}): boolean {
  return params.status === "pending" && params.currentUserId === params.addresseeId;
}

export function sharingColumnFor(params: {
  currentUserId: string;
  requesterId: string;
  addresseeId: string;
}): "requester_shares" | "addressee_shares" | null {
  if (params.currentUserId === params.requesterId) return "requester_shares";
  if (params.currentUserId === params.addresseeId) return "addressee_shares";
  return null;
}

export function familyCanSeeScan(params: {
  level: "safe" | "careful" | "likely_scam" | "dangerous";
  ownerSharesWithViewer: boolean;
}): boolean {
  return (
    params.ownerSharesWithViewer &&
    (params.level === "likely_scam" || params.level === "dangerous")
  );
}
