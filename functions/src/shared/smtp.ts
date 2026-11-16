import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import {defineSecret} from "firebase-functions/params";

/** Gmail / SMTP mailbox (same pattern as activenext nodemailer flow). */
export const smtpUser = defineSecret("SMTP_USER");
export const smtpPass = defineSecret("SMTP_PASS");

export const EMAIL_LOGO_CID = "derbyfit-logo@cid";

function cleanEnv(value?: string) {
  return value?.trim().replace(/^["']|["']$/g, "") ?? "";
}

export function getSmtpCredentials() {
  const user = cleanEnv(smtpUser.value() || process.env.SMTP_USER);
  const pass = (smtpPass.value() || process.env.SMTP_PASS || "")
    .replace(/\s/g, "")
    .replace(/^["']|["']$/g, "");

  if (!user || !pass) {
    return null;
  }

  const host = cleanEnv(process.env.SMTP_HOST) || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 465;

  return {user, pass, host, port, secure: port === 465};
}

/** Resolve packaged brand logo for inline CID attachments. */
export function resolveEmailLogoPath(): string | null {
  const candidates = [
    path.join(process.cwd(), "assets", "derbyfit-logo-ink.png"),
    // Compiled output lives in lib/shared → go up to functions/assets
    path.join(__dirname, "..", "..", "assets", "derbyfit-logo-ink.png"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

export function getEmailLogoAttachment() {
  const logoPath = resolveEmailLogoPath();
  if (!logoPath) return [];
  return [
    {
      filename: "derbyfit-logo.png",
      path: logoPath,
      cid: EMAIL_LOGO_CID,
      contentDisposition: "inline" as const,
    },
  ];
}

export async function sendSmtpHtmlEmail(options: {
  to: string;
  fromName: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    path: string;
    cid: string;
    contentDisposition?: "inline" | "attachment";
  }>;
}) {
  const creds = getSmtpCredentials();
  if (!creds) {
    throw new Error("SMTP_NOT_CONFIGURED");
  }

  const transporter = nodemailer.createTransport({
    host: creds.host,
    port: creds.port,
    secure: creds.secure,
    auth: {user: creds.user, pass: creds.pass},
  });

  await transporter.sendMail({
    from: `"${options.fromName}" <${creds.user}>`,
    to: options.to,
    replyTo: options.replyTo || creds.user,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments ?? [],
  });

  return {from: creds.user};
}
