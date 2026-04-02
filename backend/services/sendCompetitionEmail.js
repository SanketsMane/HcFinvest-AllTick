// import nodemailer from "nodemailer";
// import dotenv from "dotenv";

// dotenv.config();

// const sendCompetitionEmail = async ({ to, subject, html }) => {
//   try {
//     // Use the same SMTP configuration as emailService.js
//     const transporter = nodemailer.createTransport({
//       host: process.env.SMTP_HOST || "mail.spacemail.com",
//       port: parseInt(process.env.SMTP_PORT) || 587,
//       secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
//       auth: {
//         user: process.env.SMTP_USER || "supportdesk@heddgecapitals.com",
//         pass: process.env.SMTP_PASS || "Heddge@2025"
//       },
//       tls: {
//         rejectUnauthorized: true,
//         minVersion: 'TLSv1.2'
//       },
//       connectionTimeout: 30000,
//       greetingTimeout: 30000,
//       socketTimeout: 60000,
//       debug: process.env.NODE_ENV === 'development',
//       logger: process.env.NODE_ENV === 'development'
//     });

//     const fromName = process.env.SMTP_FROM_NAME || 'HC Finvest';
//     const fromEmail = process.env.SMTP_USER || "supportdesk@heddgecapitals.com";

//     const info = await transporter.sendMail({
//       from: `"${fromName}" <${fromEmail}>`,
//       to,
//       subject,
//       html
//     });

//     console.log("✅ Email sent:", info.messageId);
//     return { success: true, messageId: info.messageId };

//   } catch (error) {
//     console.error("❌ Email Error:", error);
//     throw error;
//   }
// };

// export default sendCompetitionEmail;

import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

//Sanket v2.0 - guard against missing RESEND_API_KEY to avoid cryptic errors at runtime
if (!process.env.RESEND_API_KEY) {
  console.warn("⚠️ RESEND_API_KEY is not set. Competition emails will fail.");
}

const resend = new Resend(process.env.RESEND_API_KEY);

const sendCompetitionEmail = async ({ to, subject, html }) => {
  //Sanket v2.0 - fail early with clear error if API key is missing
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured. Cannot send emails.");
  }

  try {
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || "support@heddgecapitals.com"; //Sanket v2.0 - use RESEND_FROM_EMAIL first to match verified domain

    const fromName = process.env.SMTP_FROM_NAME || "HC Finvest";

    const response = await resend.emails.send({
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