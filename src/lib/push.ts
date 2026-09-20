import webpush from "web-push";

// Default public/private VAPID keys for Cyber Kavach (or load from process.env)
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BEl62iUYgUivxIkv69yViEuiBIa45b_1C-46e3hE0YvN2_S_N1a9F6m4Q9O1-n41E-Uv56Z20a-Fv8P6B8G3R0o";

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  "zW-V5Y27-T5U11-M6b_G7V0Y9Z1-V56P4N3M2L1K0J";

export function configureWebPush() {
  try {
    webpush.setVapidDetails(
      "mailto:alerts@cyberkavach.org",
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
  } catch (err) {
    console.error("Web push config error:", err);
  }
}
