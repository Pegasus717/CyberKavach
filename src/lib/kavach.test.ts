import { describe, expect, it } from "vitest";
import { maskText } from "@/lib/mask";
import { filterRedFlags, levelFromScore, quoteIsSubstring } from "@/lib/level";
import {
  canRespondToRequest,
  familyCanSeeScan,
  normalizeShareCode,
  sharingColumnFor,
} from "@/lib/share-code";

describe("maskText", () => {
  it("masks Indian mobile, Aadhaar, PAN, email, UPI and OTP", () => {
    const input =
      "Call 9876543210. Aadhaar 2345 6789 0123 PAN ABCDE1234F email a@b.com UPI name@okaxis OTP is 482913";
    const { masked, hits } = maskText(input);
    expect(masked).toContain("[PHONE]");
    expect(masked).toContain("[AADHAAR]");
    expect(masked).toContain("[PAN]");
    expect(masked).toContain("[EMAIL]");
    expect(masked).toContain("[UPI]");
    expect(masked).toContain("[OTP]");
    expect(hits.map((h) => h.token)).toEqual(
      expect.arrayContaining(["[PHONE]", "[AADHAAR]", "[PAN]", "[EMAIL]", "[UPI]", "[OTP]"]),
    );
  });

  it("does not leave a raw 10-digit number", () => {
    expect(maskText("pay 9123456789 now").masked).not.toMatch(/9123456789/);
  });
});

describe("levelFromScore", () => {
  it("uses fixed thresholds", () => {
    expect(levelFromScore(0)).toBe("safe");
    expect(levelFromScore(24)).toBe("safe");
    expect(levelFromScore(25)).toBe("careful");
    expect(levelFromScore(49)).toBe("careful");
    expect(levelFromScore(50)).toBe("likely_scam");
    expect(levelFromScore(74)).toBe("likely_scam");
    expect(levelFromScore(75)).toBe("dangerous");
    expect(levelFromScore(100)).toBe("dangerous");
  });
});

describe("quote substring validation", () => {
  it("keeps only exact substrings of the masked text", () => {
    const text = "Share [OTP] with Inspector Sharma for DIGITAL ARREST";
    expect(quoteIsSubstring("DIGITAL ARREST", text)).toBe(true);
    expect(quoteIsSubstring("share otp", text)).toBe(false);
    const kept = filterRedFlags(
      [
        { quote: "DIGITAL ARREST", reason: "fear" },
        { quote: "not in the message", reason: "invented" },
      ],
      text,
    );
    expect(kept).toHaveLength(1);
    expect(kept[0].quote).toBe("DIGITAL ARREST");
  });
});

describe("connection rules", () => {
  it("normalizes codes", () => {
    expect(normalizeShareCode("ab12-cd34")).toBe("AB12CD34");
  });

  it("only the addressee can respond while pending", () => {
    expect(
      canRespondToRequest({ currentUserId: "b", addresseeId: "b", status: "pending" }),
    ).toBe(true);
    expect(
      canRespondToRequest({ currentUserId: "a", addresseeId: "b", status: "pending" }),
    ).toBe(false);
    expect(
      canRespondToRequest({ currentUserId: "b", addresseeId: "b", status: "accepted" }),
    ).toBe(false);
  });

  it("picks the sharing column for the current user", () => {
    expect(
      sharingColumnFor({ currentUserId: "a", requesterId: "a", addresseeId: "b" }),
    ).toBe("requester_shares");
    expect(
      sharingColumnFor({ currentUserId: "b", requesterId: "a", addresseeId: "b" }),
    ).toBe("addressee_shares");
    expect(
      sharingColumnFor({ currentUserId: "c", requesterId: "a", addresseeId: "b" }),
    ).toBeNull();
  });

  it("family only sees likely_scam or dangerous when sharing is on", () => {
    expect(familyCanSeeScan({ level: "dangerous", ownerSharesWithViewer: true })).toBe(true);
    expect(familyCanSeeScan({ level: "safe", ownerSharesWithViewer: true })).toBe(false);
    expect(familyCanSeeScan({ level: "dangerous", ownerSharesWithViewer: false })).toBe(false);
  });
});
