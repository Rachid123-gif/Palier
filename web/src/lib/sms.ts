/**
 * SMS sending utility for OTP codes.
 *
 * Uses Infobip SMS API.
 *
 * Required env vars:
 *   INFOBIP_API_KEY, INFOBIP_BASE_URL, INFOBIP_SENDER
 *
 * If SMS_PROVIDER is not set, SMS sending is skipped (dev mode).
 */

async function sendViaInfobip(to: string, message: string): Promise<void> {
  const apiKey = process.env.INFOBIP_API_KEY!;
  const rawBase = process.env.INFOBIP_BASE_URL!;
  const baseUrl = rawBase.startsWith("http") ? rawBase : `https://${rawBase}`;
  const sender = process.env.INFOBIP_SENDER ?? "Palier";

  const intlNumber = to.startsWith("+") ? to : `+212${to.slice(1)}`;
  console.log("[SMS/Infobip] Sending to:", intlNumber.slice(0, 7) + "***");

  const res = await fetch(`${baseUrl}/sms/2/text/advanced`, {
    method: "POST",
    headers: {
      Authorization: `App ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [{ from: sender, destinations: [{ to: intlNumber }], text: message }],
    }),
  });

  const body = await res.text();
  console.log("[SMS/Infobip] Response:", res.status, body);

  if (!res.ok) {
    console.error("[SMS/Infobip] Failed:", res.status, body);
    throw new Error("sms_send_failed");
  }
}

/**
 * Send an SMS message. Returns silently in dev mode if no provider configured.
 * Throws "sms_send_failed" in production if not configured, or on provider error.
 */
export async function sendSMS(to: string, message: string): Promise<void> {
  if (process.env.SKIP_SMS === "1") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SKIP_SMS must not be set in production");
    }
    console.log("[SMS/SKIP] → [REDACTED]");
    return;
  }

  if (!process.env.INFOBIP_API_KEY) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[SMS/DEV] → [REDACTED]");
      return;
    }
    throw new Error("sms_send_failed");
  }

  return sendViaInfobip(to, message);
}
