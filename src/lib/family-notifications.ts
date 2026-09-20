import { Resend } from "resend";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Scan, Profile, Connection } from "@/lib/types";
import { configureWebPush } from "@/lib/push";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendFamilyAlerts(scan: Scan, scannerUserId?: string) {
  // Only send background alerts for dangerous or likely scam scans
  if (scan.level !== "dangerous" && scan.level !== "likely_scam") {
    return;
  }

  const supabase = createAdminClient();
  if (!supabase) return;

  // Lookup scanner profile
  const { data: scannerProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", scan.user_id)
    .single();

  const scannerName = (scannerProfile as any)?.display_name || "A family member";
  const scamTitle = scan.verdict?.summary || scan.scam_type.replaceAll("_", " ");
  const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://cyber-kavach-lemon.vercel.app"}/app/scan/${scan.id}`;

  try {
    // 1. Find all accepted family connections for this user
    const { data: cons } = await supabase
      .from("connections")
      .select("*")
      .eq("status", "accepted");

    if (!cons || cons.length === 0) return;

    // Filter connections involving the scanner
    const familyUserIds = new Set<string>();
    (cons as Connection[]).forEach((c) => {
      if (c.requester_id === scan.user_id) familyUserIds.add(c.addressee_id);
      if (c.addressee_id === scan.user_id) familyUserIds.add(c.requester_id);
    });

    if (familyUserIds.size === 0) return;

    // 2. Fetch profiles of connected family members
    const { data: familyProfiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", Array.from(familyUserIds));

    if (!familyProfiles || familyProfiles.length === 0) return;

    // 3. Configure Web Push
    configureWebPush();

    // 4. Send Email & Push Alerts to each family member
    for (const familyMember of familyProfiles as Profile[]) {
      // --- Web Push Notification (Works when app is closed) ---
      const pushSub = (familyMember as any).push_subscription;
      if (pushSub) {
        try {
          const payload = JSON.stringify({
            title: `🚨 Cyber Kavach Alert: ${scannerName}`,
            body: `DANGEROUS SCAM DETECTED: "${scamTitle}". Click to view report and protect them.`,
            url: scanUrl,
            tag: `scam-alert-${scan.id}`,
          });

          await webpush.sendNotification(pushSub, payload);
          console.log(`[Web Push] Sent background alert to ${familyMember.display_name}`);
        } catch (pushErr) {
          console.error(`[Web Push Error] ${familyMember.display_name}:`, pushErr);
        }
      }

      // --- Email Alert via Resend / Supabase ---
      const recipientEmail = (familyMember as any).email || familyMember.display_name;
      if (recipientEmail && recipientEmail.includes("@")) {
        try {
          if (resend) {
            await resend.emails.send({
              from: "Cyber Kavach Emergency <alerts@resend.dev>",
              to: [recipientEmail],
              subject: `🚨 Emergency Alert: ${scannerName} encountered a Dangerous Scam!`,
              html: `
                <div font-family: sans-serif; padding: 20px; background-color: #0A1124; color: #E7ECF9; border-radius: 16px;">
                  <h2 style="color: #FF6B78; margin-top: 0;">🚨 Cyber Kavach Emergency Alert</h2>
                  <p style="font-size: 16px; font-weight: bold;">
                    ${scannerName} just scanned a message flagged as <u>${scan.level.toUpperCase()}</u> on Cyber Kavach.
                  </p>
                  <div style="background: #16223F; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #223058;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #97A5C6;">SCAM VERDICT:</p>
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #FF8A4C;">${scamTitle}</p>
                    <p style="margin: 12px 0 0 0; font-size: 14px; font-style: italic; color: #E7ECF9;">"${scan.masked_text}"</p>
                  </div>
                  <p style="margin-bottom: 20px;">
                    Please contact ${scannerName} immediately to ensure they do not send money, share OTPs, or click suspicious links.
                  </p>
                  <a href="${scanUrl}" style="display: inline-block; background: #2148C9; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold;">
                    View Full Analysis & Guidance
                  </a>
                </div>
              `,
            });
            console.log(`[Resend Email] Sent email alert to ${recipientEmail}`);
          }
        } catch (emailErr) {
          console.error(`[Email Alert Error] ${recipientEmail}:`, emailErr);
        }
      }
    }
  } catch (err) {
    console.error("Error sending family background alerts:", err);
  }
}
