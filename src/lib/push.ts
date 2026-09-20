import webpush from "web-push";

// Valid cryptographic P-256 VAPID keys for Cyber Kavach
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BFbdXwIpA5kLGQ4m4Xun53ql_tyFajAsYlniPoT3Alexw9ERMZKgx8IS0_eWDVssN5biM-HYJNkNRbN8cJtm2R4";

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  "hbmqpHpzrz7paO0ILGLFzj_3MupQwg43YFKAxt6zRuc";

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
