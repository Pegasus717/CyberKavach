import { z } from "zod";
import { clampScore, filterRedFlags, levelFromScore } from "@/lib/level";
import { SCAM_TYPES, type Verdict } from "@/lib/types";

export const verdictSchema = z.object({
  riskScore: z.number(),
  confidence: z.enum(["low", "medium", "high"]),
  scamType: z.enum(SCAM_TYPES),
  impersonating: z.string().nullable(),
  redFlags: z
    .array(z.object({ quote: z.string(), reason: z.string() }))
    .max(12)
    .default([]),
  summary: z.string(),
  whatToDoNow: z.array(z.string()).max(8).default([]),
  whatNotToDo: z.array(z.string()).max(6).default([]),
  ifAlreadyActed: z.array(z.string()).max(8).default([]),
  urls: z
    .array(
      z.object({
        url: z.string(),
        verdict: z.string(),
        reason: z.string(),
      }),
    )
    .max(12)
    .default([]),
  needsComplaintHelp: z.boolean(),
});

function capWords(text: string, maxWords: number) {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(" ");
}

export function normalizeVerdict(raw: unknown, maskedText: string): Verdict {
  const parsed = verdictSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Invalid model JSON");
  }
  const data = parsed.data;
  return {
    riskScore: clampScore(data.riskScore),
    confidence: data.confidence,
    scamType: data.scamType,
    impersonating: data.impersonating?.trim() || null,
    redFlags: filterRedFlags(data.redFlags, maskedText, 6),
    summary: capWords(data.summary, 40),
    whatToDoNow: data.whatToDoNow.slice(0, 4),
    whatNotToDo: data.whatNotToDo.slice(0, 3),
    ifAlreadyActed: data.ifAlreadyActed.slice(0, 4),
    urls: data.urls.slice(0, 8),
    needsComplaintHelp: data.needsComplaintHelp,
  };
}

export function withLevel(verdict: Verdict) {
  return { ...verdict, level: levelFromScore(verdict.riskScore) };
}

export const ANALYZE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "riskScore",
    "confidence",
    "scamType",
    "impersonating",
    "redFlags",
    "summary",
    "whatToDoNow",
    "whatNotToDo",
    "ifAlreadyActed",
    "urls",
    "needsComplaintHelp",
  ],
  properties: {
    riskScore: { type: "integer", minimum: 0, maximum: 100 },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    scamType: { type: "string", enum: [...SCAM_TYPES] },
    impersonating: { type: ["string", "null"] },
    redFlags: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["quote", "reason"],
        properties: {
          quote: { type: "string" },
          reason: { type: "string" },
        },
      },
    },
    summary: { type: "string" },
    whatToDoNow: { type: "array", maxItems: 4, items: { type: "string" } },
    whatNotToDo: { type: "array", maxItems: 3, items: { type: "string" } },
    ifAlreadyActed: { type: "array", maxItems: 4, items: { type: "string" } },
    urls: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["url", "verdict", "reason"],
        properties: {
          url: { type: "string" },
          verdict: { type: "string" },
          reason: { type: "string" },
        },
      },
    },
    needsComplaintHelp: { type: "boolean" },
  },
} as const;

export const PLAN_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["urgency", "urgencyNote", "steps", "fieldsNeeded", "evidenceChecklist"],
  properties: {
    urgency: { type: "string", enum: ["critical", "high", "normal"] },
    urgencyNote: { type: "string" },
    steps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "detail", "timeCritical", "channelId"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          detail: { type: "string" },
          timeCritical: { type: "boolean" },
          channelId: { type: ["string", "null"] },
        },
      },
    },
    fieldsNeeded: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "label", "type", "required", "hint"],
        properties: {
          key: { type: "string" },
          label: { type: "string" },
          type: { type: "string", enum: ["text", "number", "datetime", "longtext"] },
          required: { type: "boolean" },
          hint: { type: "string" },
        },
      },
    },
    evidenceChecklist: { type: "array", items: { type: "string" } },
  },
} as const;

export const DOCS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["documents"],
  properties: {
    documents: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "title", "body"],
        properties: {
          kind: {
            type: "string",
            enum: ["national_portal_complaint", "bank_letter", "police_statement", "platform_report"],
          },
          title: { type: "string" },
          body: { type: "string" },
        },
      },
    },
  },
} as const;
