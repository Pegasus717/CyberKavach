export type ExtractedSignals = {
  urls: string[];
  shorteners: string[];
  rawIpHosts: string[];
  unusualTlds: string[];
  apkLinks: string[];
  urgency: boolean;
  asksOtpOrPin: boolean;
  asksRemoteAccess: boolean;
  asksPayment: boolean;
};

export type UrlTrace = { original: string; chain: string[]; final: string; error?: string };

const PRIVATE_IP = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|0\.0\.0\.0|::1)/;
const LOCAL_NAMES = /^(localhost|.*\.local)$/i;

export async function traceUrls(urls: string[]): Promise<UrlTrace[]> {
  const results: UrlTrace[] = [];
  for (const url of urls.slice(0, 5)) {
    let current = url;
    if (!current.startsWith("http")) current = `https://${current}`;
    
    const trace: UrlTrace = { original: url, chain: [], final: current };
    
    for (let i = 0; i < 5; i++) {
      try {
        const u = new URL(current);
        if (u.protocol !== "http:" && u.protocol !== "https:") {
          trace.error = "Disallowed protocol";
          break;
        }
        if (PRIVATE_IP.test(u.hostname) || LOCAL_NAMES.test(u.hostname)) {
          trace.error = "Blocked private/local IP (SSRF protection)";
          break;
        }
        
        trace.chain.push(current);
        
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        
        // redirect: 'manual' to track chain
        const res = await fetch(current, { 
          method: "HEAD", 
          redirect: "manual",
          signal: controller.signal,
          headers: { "User-Agent": "KavachBot/1.0" } // no cookies
        }).catch(async (e) => {
           // Fallback to GET if HEAD is rejected
           if (e.name === 'AbortError') throw e;
           return fetch(current, { method: "GET", redirect: "manual", signal: controller.signal, headers: { "User-Agent": "KavachBot/1.0" } });
        });
        
        clearTimeout(timer);
        
        if (res.status >= 300 && res.status < 400) {
          const loc = res.headers.get("location");
          if (!loc) break;
          current = new URL(loc, current).toString();
          trace.final = current;
        } else {
          break; // Not a redirect
        }
      } catch (e: any) {
        if (e.name === "AbortError") trace.error = "Timeout";
        else trace.error = e.message || "Failed to fetch";
        break;
      }
    }
    results.push(trace);
  }
  return results;
}

const SHORTENERS = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "cutt.ly",
  "rb.gy",
];

const UNUSUAL_TLDS = [".xyz", ".top", ".click", ".loan", ".zip", ".mov", ".gq", ".tk", ".ml", ".cf"];

const URGENCY =
  /\b(immediately|urgent|urgently|right now|act now|last chance|account (will be )?block|suspend|arrest|fir|legal action|within \d+ (hour|min)|expire|kyc update|click here now|do not ignore)\b/i;

const OTP = /\b(otp|one[\s-]?time password|pin|cvv|password|passcode)\b/i;
const REMOTE = /\b(anydesk|teamviewer|remote access|screen share|install app|apk)\b/i;
const PAYMENT =
  /\b(upi|pay now|send money|gift card|crypto|bitcoin|collect request|refund(?: to)? (?:upi|account)|google pay|phonepe|paytm)\b/i;

const URL_RE = /\bhttps?:\/\/[^\s<>"')\]]+/gi;
const LOOSE_URL = /\b(?:www\.)[^\s<>"')\]]+/gi;

function hostOf(url: string): string | null {
  try {
    const withProto = url.startsWith("http") ? url : `https://${url}`;
    return new URL(withProto).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function extractSignals(text: string): ExtractedSignals {
  const urls = [...text.matchAll(URL_RE), ...text.matchAll(LOOSE_URL)].map((m) => m[0]);
  const uniqueUrls = Array.from(new Set(urls));
  const hosts = uniqueUrls.map(hostOf).filter((h): h is string => Boolean(h));

  return {
    urls: uniqueUrls.slice(0, 12),
    shorteners: hosts.filter((host) => SHORTENERS.some((s) => host === s || host.endsWith(`.${s}`))),
    rawIpHosts: hosts.filter((host) => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)),
    unusualTlds: hosts.filter((host) => UNUSUAL_TLDS.some((tld) => host.endsWith(tld))),
    apkLinks: uniqueUrls.filter((url) => /\.apk(\b|$)/i.test(url)),
    urgency: URGENCY.test(text),
    asksOtpOrPin: OTP.test(text) && /\b(share|send|tell|give|confirm|verify)\b/i.test(text),
    asksRemoteAccess: REMOTE.test(text),
    asksPayment: PAYMENT.test(text) && /\b(send|pay|transfer|collect|refund)\b/i.test(text),
  };
}

export function heuristicVerdict(text: string, language: "en" | "hi") {
  const signals = extractSignals(text);
  let score = 12;
  const flags: { quote: string; reason: string }[] = [];

  const add = (points: number, quote: string, reason: string) => {
    score += points;
    if (quote && text.includes(quote) && flags.length < 6) {
      flags.push({ quote, reason });
    }
  };

  if (/\bdigital arrest|cyber (?:crime )?(?:cell|police)|cbi|ed |narcotics\b/i.test(text)) {
    add(45, "arrest", language === "hi" ? "पुलिस या गिरफ्तारी का डर।" : "Police or arrest fear.");
  }
  if (signals.asksOtpOrPin) add(22, "OTP", language === "hi" ? "OTP या PIN माँगा गया है।" : "Someone asked for OTP or PIN.");
  if (signals.asksRemoteAccess) add(20, "remote", language === "hi" ? "रिमोट ऐप की माँग।" : "Remote-access request.");
  if (signals.asksPayment) add(18, "pay", language === "hi" ? "पैसे भेजने की माँग।" : "Payment request.");
  if (signals.urgency) add(12, "urgent", language === "hi" ? "जल्दी करने का दबाव।" : "Urgency pressure.");
  if (signals.shorteners.length) add(16, signals.shorteners[0], language === "hi" ? "छोटा लिंक।" : "Shortened link.");
  if (signals.apkLinks.length) add(22, ".apk", language === "hi" ? "ऐप फ़ाइल लिंक।" : "APK file link.");
  if (signals.rawIpHosts.length) add(18, signals.rawIpHosts[0], language === "hi" ? "IP वाले लिंक।" : "Raw IP host.");
  if (signals.unusualTlds.length) add(10, signals.unusualTlds[0], language === "hi" ? "अजीब वेबसाइट।" : "Unusual website.");

  const looksLegit =
    /\b(?:debited|credited|a\/c|account xx|inr|rs\.?)\b/i.test(text) &&
    /\b(do not share|don't share|never share).{0,20}(otp|pin)\b/i.test(text) &&
    !signals.asksOtpOrPin &&
    !signals.asksPayment;

  if (looksLegit) score = Math.min(score, 18);

  score = Math.min(92, Math.max(8, score));

  const hi = language === "hi";
  return {
    riskScore: score,
    confidence: "low" as const,
    scamType: score >= 50 ? ("other_scam" as const) : ("unclear" as const),
    impersonating: null as string | null,
    redFlags: flags,
    summary: hi
      ? "AI उपलब्ध नहीं है। यह एक साधारण जाँच है।"
      : "AI is unavailable. This is a basic check only.",
    whatToDoNow: hi
      ? ["किसी को OTP न दें।", "आधिकारिक ऐप या साइट से जाँचें।"]
      : ["Do not share OTP or PIN.", "Check using the official app or website."],
    whatNotToDo: hi ? ["लिंक न खोलें।"] : ["Do not tap unknown links."],
    ifAlreadyActed: hi
      ? ["बैंक हेल्पलाइन पर तुरंत कॉल करें।"]
      : ["Call your bank's official fraud line at once."],
    urls: signals.urls.slice(0, 6).map((url) => ({
      url,
      verdict: "unknown" as const,
      reason: hi ? "लिंक की पूरी जाँच नहीं हो सकी।" : "Could not fully inspect this link.",
    })),
    needsComplaintHelp: score >= 50,
  };
}
