// Legacy standalone competition sender retained only for backward compatibility.
// Production competition emails should now flow through `emailService.js` so they are logged uniformly.

import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

//Sanket v2.0 - Lazy-init Resend so missing API key doesn't crash server on import
let _resend = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('[sendCompetitionEmail] RESEND_API_KEY not set in .env');
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const sendCompetitionEmail = async ({ to, subject, html }) => {
  try {
    const fromEmail =
      process.env.SMTP_FROM_EMAIL || "support@heddgecapitals.com";

    const fromName = process.env.SMTP_FROM_NAME || "HC Finvest";

    const response = await getResend().emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html,
    });

    console.log("✅ Email sent:", response.id);

    return {
      success: true,
      messageId: response.id,
    };

  } catch (error) {
    console.error("❌ Email Error:", error);
    throw error;
  }
};

export default sendCompetitionEmail;