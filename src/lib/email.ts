import nodemailer from "nodemailer";

// Helper to clean environment variable strings (trim spaces, single/double quotes)
const cleanEnvVar = (val: string | undefined): string => {
  if (!val) return "";
  const trimmed = val.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

// Retrieve email configurations from environment variables
const SMTP_USER = cleanEnvVar(process.env.SMTP_USER || process.env.TEST_USER_EMAIL);
const SMTP_PASS = cleanEnvVar(process.env.SMTP_PASS || process.env.TEST_USER_PASS);
const SMTP_HOST = cleanEnvVar(process.env.SMTP_HOST) || (SMTP_USER.endsWith("@gmail.com") ? "smtp.gmail.com" : "");
const SMTP_PORT = parseInt(cleanEnvVar(process.env.SMTP_PORT) || (SMTP_HOST === "smtp.gmail.com" ? "465" : "587"));
export const SMTP_FROM = cleanEnvVar(process.env.SMTP_FROM) || (SMTP_USER ? `"Insight Blog" <${SMTP_USER}>` : '"Insight Blog" <newsletter@insight.com>');

/**
 * Creates and returns a Nodemailer transporter.
 * If credentials are not provided, it falls back to a mock transporter
 * that prints emails to console (for development purposes).
 */
export function getTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn(
      "[Mailer] Warning: SMTP credentials are not set in .env.local. Falling back to console-logging mock mailer."
    );
    return {
      sendMail: async (options: { to: string; subject: string; html: string; from?: string }) => {
        console.log("======================================== MOCK EMAIL ========================================");
        console.log(`From:    ${options.from || SMTP_FROM}`);
        console.log(`To:      ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log("--------------------------------------- HTML Body ---------------------------------------");
        console.log(options.html);
        console.log("==========================================================================================");
        return { messageId: `mock-msg-${Date.now()}` };
      },
    };
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends a single email using the configured transporter.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const transporter = getTransporter();
  return transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    html,
  });
}

/**
 * Composes a premium HTML newsletter layout wrapping the body content.
 */
export function getNewsletterTemplate(content: string, unsubscribeUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Insight Newsletter</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #f9fafb;
            color: #1f2937;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            border: 1px solid #e5e7eb;
          }
          .header {
            background-color: #0f172a;
            padding: 32px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.025em;
          }
          .content {
            padding: 40px 32px;
            line-height: 1.6;
            font-size: 16px;
          }
          .footer {
            background-color: #f3f4f6;
            padding: 24px 32px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
          }
          .footer a {
            color: #4f46e5;
            text-decoration: underline;
          }
          p {
            margin-top: 0;
            margin-bottom: 16px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Insight</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>You received this email because you subscribed to our newsletter.</p>
            <p>
              <a href="${unsubscribeUrl}" target="_blank">Unsubscribe</a> from this list at any time.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
