export type Language = "en" | "hi";
export type Country = "IN" | "US" | "UK";

export type Profile = {
  id: string;
  display_name: string;
  share_code: string;
  language: Language;
  country: Country;
  created_at: string;
};

export type Connection = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  requester_shares: boolean;
  addressee_shares: boolean;
  created_at: string;
  responded_at: string | null;
};

export const SCAM_TYPES = [
  "digital_arrest",
  "kyc_update",
  "bank_impersonation",
  "upi_collect_refund",
  "courier_customs",
  "job_task",
  "investment",
  "lottery_prize",
  "loan_app",
  "utility_disconnection",
  "e_challan",
  "family_emergency",
  "sextortion",
  "phishing_link",
  "tech_support",
  "other_scam",
  "legitimate",
  "unclear",
] as const;

export type ScamType = (typeof SCAM_TYPES)[number];

export type Verdict = {
  riskScore: number;
  confidence: "low" | "medium" | "high";
  scamType: ScamType;
  impersonating: string | null;
  redFlags: { quote: string; reason: string }[];
  summary: string;
  whatToDoNow: string[];
  whatNotToDo: string[];
  ifAlreadyActed: string[];
  urls: { url: string; verdict: string; reason: string }[];
  needsComplaintHelp: boolean;
};

export type Scan = {
  id: string;
  user_id: string;
  masked_text: string;
  risk_score: number;
  level: "safe" | "careful" | "likely_scam" | "dangerous";
  scam_type: string;
  verdict: Verdict;
  source: "ai" | "fallback";
  created_at: string;
  owner?: Pick<Profile, "id" | "display_name" | "share_code">;
};

export type PlanStep = {
  id: string;
  title: string;
  detail: string;
  timeCritical: boolean;
  channelId: string | null;
};

export type FieldNeeded = {
  key: string;
  label: string;
  type: "text" | "number" | "datetime" | "longtext";
  required: boolean;
  hint: string;
};

export type ComplaintPlan = {
  urgency: "critical" | "high" | "normal";
  urgencyNote: string;
  steps: PlanStep[];
  fieldsNeeded: FieldNeeded[];
  evidenceChecklist: string[];
};

export type ComplaintDocument = {
  kind: "national_portal_complaint" | "bank_letter" | "police_statement" | "platform_report";
  title: string;
  body: string;
};

export type Complaint = {
  id: string;
  user_id: string;
  scan_id: string | null;
  incident: Record<string, unknown>;
  plan: ComplaintPlan;
  fields: Record<string, string>;
  documents: ComplaintDocument[];
  progress: Record<string, boolean>;
  status: string;
  language: Language;
  created_at: string;
  updated_at: string;
};
