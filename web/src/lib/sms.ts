/**
 * OTP sending utility.
 *
 * Uses Infobip WhatsApp API (authentication template).
 * Falls back to SMS if WhatsApp fails.
 *
 * Required env vars:
 *   INFOBIP_API_KEY, INFOBIP_BASE_URL
 *   INFOBIP_WA_SENDER — WhatsApp sender number (e.g. "447860088970")
 */

/**
 * Extract OTP code from a message string.
 * Matches 4-8 digit sequences.
 */
function extractOtp(message: string): string | null {
  const match = message.match(/\b(\d{4,8})\b/);
  return match ? match[1] : null;
}

/**
 * Send OTP via Infobip WhatsApp authentication template.
 */
async function sendViaWhatsApp(to: string, message: string): Promise<void> {
  const apiKey = process.env.INFOBIP_API_KEY!;
  const rawBase = process.env.INFOBIP_BASE_URL!;
  const baseUrl = rawBase.startsWith("http") ? rawBase : `https://${rawBase}`;
  const sender = process.env.INFOBIP_WA_SENDER ?? "447860088970";

  const intlNumber = to.startsWith("+") ? to : `+212${to.slice(1)}`;
  const otp = extractOtp(message);

  if (!otp) {
    console.error("[WhatsApp/Infobip] No OTP found in message, falling back to SMS");
    return sendViaSMS(to, message);
  }

  console.log("[WhatsApp/Infobip] Sending to:", intlNumber.slice(0, 7) + "***");

  const res = await fetch(`${baseUrl}/whatsapp/1/message/template`, {
    method: "POST",
    headers: {
      Authorization: `App ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          from: sender,
          to: intlNumber,
          content: {
            templateName: "authentication",
            templateData: {
              body: {
                placeholders: [otp],
              },
            },
            language: "fr",
          },
        },
      ],
    }),
  });

  const body = await res.text();
  console.log("[WhatsApp/Infobip] Response:", res.status, body);

  if (!res.ok) {
    console.error("[WhatsApp/Infobip] Failed:", res.status, body, "— falling back to SMS");
    return sendViaSMS(to, message);
  }
}

/**
 * Fallback: send via Infobip SMS API.
 */
async function sendViaSMS(to: string, message: string): Promise<void> {
  const apiKey = process.env.INFOBIP_API_KEY!;
  const rawBase = process.env.INFOBIP_BASE_URL!;
  const baseUrl = rawBase.startsWith("http") ? rawBase : `https://${rawBase}`;
  const sender = process.env.INFOBIP_SENDER ?? "Palier";

  const intlNumber = to.startsWith("+") ? to : `+212${to.slice(1)}`;
  console.log("[SMS/Infobip] Fallback sending to:", intlNumber.slice(0, 7) + "***");

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
 * Send an OTP message. Uses WhatsApp first, falls back to SMS.
 * Returns silently in dev mode if no provider configured.
 * Throws "sms_send_failed" in production if both channels fail.
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

  return sendViaWhatsApp(to, message);
}
