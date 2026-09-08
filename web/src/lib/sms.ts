/**
 * OTP / code sending utility.
 *
 * Uses Infobip WhatsApp API (authentication template).
 *
 * Required env vars:
 *   INFOBIP_API_KEY, INFOBIP_BASE_URL
 *   INFOBIP_WA_SENDER — WhatsApp sender number
 */

/**
 * Extract a code from a message string.
 * Matches OTP digits (4-8) or alphanumeric codes with prefix (e.g. SYN-AB3K7P, BETA-XY12ZW34).
 */
function extractCode(message: string): string | null {
  // Match prefixed codes like BETA-XXXXXXXX or SYN-XXXXXX
  const prefixed = message.match(/\b([A-Z]+-[A-Z0-9]{4,10})\b/);
  if (prefixed) return prefixed[1];
  // Match pure digit OTP (4-8 digits)
  const digits = message.match(/\b(\d{4,8})\b/);
  if (digits) return digits[1];
  return null;
}

/**
 * Send a code via Infobip WhatsApp authentication template.
 */
async function sendViaWhatsApp(to: string, code: string): Promise<void> {
  const apiKey = process.env.INFOBIP_API_KEY!;
  const rawBase = process.env.INFOBIP_BASE_URL!;
  const baseUrl = rawBase.startsWith("http") ? rawBase : `https://${rawBase}`;
  const sender = process.env.INFOBIP_WA_SENDER ?? "447860088970";

  const intlNumber = to.startsWith("+") ? to : `+212${to.slice(1)}`;

  console.log("[WhatsApp/Infobip] Sending to:", intlNumber.slice(0, 7) + "***", "code:", code.slice(0, 4) + "***");

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
                placeholders: [code],
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
    console.error("[WhatsApp/Infobip] Failed:", res.status, body);
    throw new Error("sms_send_failed");
  }
}

/**
 * Send a message containing a code via WhatsApp.
 * Extracts the code from the message and sends it via the authentication template.
 * Returns silently in dev mode if no provider configured.
 * Throws "sms_send_failed" in production on failure.
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

  const code = extractCode(message);
  if (!code) {
    console.error("[WhatsApp/Infobip] No code found in message:", message.slice(0, 50));
    throw new Error("sms_send_failed");
  }

  return sendViaWhatsApp(to, code);
}
