/**
 * SMS sending utility for OTP codes.
 *
 * Supports multiple providers via SMS_PROVIDER env var:
 * - "twilio" — Twilio SMS API
 * - "infobip" — Infobip SMS API
 *
 * Required env vars per provider:
 *   Twilio:  SMS_PROVIDER=twilio, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 *   Infobip: SMS_PROVIDER=infobip, INFOBIP_API_KEY, INFOBIP_BASE_URL, INFOBIP_SENDER
 *
 * If SMS_PROVIDER is not set, SMS sending is skipped (dev mode).
 */

const provider = process.env.SMS_PROVIDER; // "twilio" | "infobip" | undefined

async function sendViaTwilio(to: string, message: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_FROM_NUMBER!;

  // Moroccan numbers: 06/07/05 → +212 6/7/5
  const intlNumber = to.startsWith("+") ? to : `+212${to.slice(1)}`;

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: from, To: intlNumber, Body: message }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("[SMS/Twilio] Failed:", res.status, err);
    throw new Error("sms_send_failed");
  }
}

async function sendViaInfobip(to: string, message: string): Promise<void> {
  const apiKey = process.env.INFOBIP_API_KEY!;
  const baseUrl = process.env.INFOBIP_BASE_URL!; // e.g. https://xxxxx.api.infobip.com
  const sender = process.env.INFOBIP_SENDER ?? "Palier";

  const intlNumber = to.startsWith("+") ? to : `+212${to.slice(1)}`;

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

  if (!res.ok) {
    const err = await res.text();
    console.error("[SMS/Infobip] Failed:", res.status, err);
    throw new Error("sms_send_failed");
  }
}

/**
 * Send an SMS message. Returns silently in dev mode if no provider configured.
 * Throws "sms_send_failed" on provider error.
 */
export async function sendSMS(to: string, message: string): Promise<void> {
  if (!provider) {
    // No SMS provider configured — log in dev, warn in prod
    if (process.env.NODE_ENV !== "production") {
      console.log(`[SMS/DEV] → ${to}: ${message}`);
    } else {
      console.warn("[SMS] No SMS_PROVIDER configured — OTP not sent!");
    }
    return;
  }

  if (provider === "twilio") return sendViaTwilio(to, message);
  if (provider === "infobip") return sendViaInfobip(to, message);

  console.error(`[SMS] Unknown provider: ${provider}`);
  throw new Error("sms_provider_unknown");
}
