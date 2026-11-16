import {HttpsError, onCall} from "firebase-functions/v2/https";
import {db} from "../../config/firebase.js";
import {COLLECTIONS} from "../../config/collections.js";
import {assertStaffCaller} from "../../lib/authz.js";
import {
  EMAIL_LOGO_CID,
  getEmailLogoAttachment,
  sendSmtpHtmlEmail,
  smtpPass,
  smtpUser,
} from "../../shared/smtp.js";

const FROM_EMAIL = "tamerosama73@gmail.com";
const FROM_NAME = "Derby Fit";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildCredentialsEmailHtml(input: {
  name: string;
  email: string;
  password: string;
  loginUrl: string;
  locale: "en" | "ar";
  hasLogo: boolean;
}): string {
  const isAr = input.locale === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const align = isAr ? "right" : "left";
  const name = escapeHtml(input.name);
  const email = escapeHtml(input.email);
  const password = escapeHtml(input.password);
  const loginUrl = escapeHtml(input.loginUrl);

  const eyebrow = isAr ? "حساب العضو" : "Member account";
  const headline = isAr ? "حسابك جاهز الآن" : "Your account is ready";
  const intro = isAr
    ? `مرحباً ${name} — تم إنشاء حسابك في Derby Fit. استخدم بيانات الدخول أدناه للوصول إلى لوحة المشترك.`
    : `Hello ${name} — your Derby Fit account is set up. Use the credentials below to sign in to your member panel.`;
  const emailLabel = isAr ? "البريد الإلكتروني" : "Email";
  const passwordLabel = isAr ? "كلمة المرور" : "Password";
  const cta = isAr ? "تسجيل الدخول" : "Sign in";
  const linkHint = isAr ? "أو افتح هذا الرابط:" : "Or open this link:";
  const keepSafe = isAr
    ? "احتفظ بهذه البيانات ولا تشاركها مع أي شخص."
    : "Keep these details private and do not share them with anyone.";
  const footer = isAr
    ? "إذا لم تتوقع هذا الحساب، يمكنك تجاهل هذه الرسالة."
    : "If you did not expect this account, you can ignore this email.";
  const brand = "Derby Fit";
  let siteUrl = "https://trainer-d4699.web.app";
  try {
    siteUrl = new URL(input.loginUrl).origin + "/";
  } catch {
    // keep fallback
  }
  const accent = "#fb5001";
  const ink = "#1d1d1f";
  const muted = "#6e6e73";
  const line = "#e8e8ed";
  const page = "#f5f5f7";
  const brandLink = `<a href="${escapeHtml(siteUrl)}" style="color:${ink};text-decoration:underline;text-underline-offset:3px;font-weight:700;">${brand}</a>`;

  const logoBlock = input.hasLogo
    ? `<img src="cid:${EMAIL_LOGO_CID}" alt="${brand}" width="148" height="auto" style="display:block;width:148px;max-width:148px;height:auto;border:0;outline:none;text-decoration:none;" />`
    : `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;font-weight:700;letter-spacing:-0.03em;color:${ink};">${brand}</div>`;

  return `<!DOCTYPE html>
<html lang="${isAr ? "ar" : "en"}" dir="${dir}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <meta name="x-apple-data-detectors" content="none" />
  <title>${brand}</title>
</head>
<body style="margin:0;padding:0;background:${page};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${isAr ? "بيانات الدخول إلى حسابك في Derby Fit" : "Your Derby Fit login details are inside"}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${page};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 28px;">
              ${logoBlock}
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid ${line};box-shadow:0 1px 2px rgba(0,0,0,0.04);">
          <tr>
            <td style="height:4px;background:${accent};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:36px 36px 8px;text-align:${align};direction:${dir};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
              <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${accent};">
                ${eyebrow}
              </p>
              <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;font-weight:700;letter-spacing:-0.03em;color:${ink};">
                ${headline}
              </h1>
              <p style="margin:0;font-size:16px;line-height:1.65;color:${muted};">
                ${intro}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 36px 8px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafafa;border:1px solid ${line};border-radius:16px;overflow:hidden;">
                <tr>
                  <td style="padding:18px 20px;border-bottom:1px solid ${line};text-align:${align};direction:${dir};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
                    <div style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${muted};">${emailLabel}</div>
                    <div style="font-size:17px;font-weight:700;line-height:1.4;color:${ink};font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;direction:ltr;text-align:${align};">${email}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 20px;text-align:${align};direction:${dir};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
                    <div style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${muted};">${passwordLabel}</div>
                    <div style="font-size:17px;font-weight:700;line-height:1.4;color:${ink};font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;direction:ltr;text-align:${align};letter-spacing:0.02em;">${password}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 36px 10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
              <a href="${loginUrl}" style="display:inline-block;background:${ink};color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:980px;font-size:15px;font-weight:700;letter-spacing:-0.01em;min-width:180px;text-align:center;">
                ${cta}
              </a>
              <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:${muted};text-align:center;">
                ${linkHint}<br />
                <a href="${loginUrl}" style="color:${accent};text-decoration:none;word-break:break-all;">${loginUrl}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:8px 36px 32px;text-align:center;direction:${dir};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
              <p style="margin:0;font-size:13px;line-height:1.65;color:${muted};text-align:center;">
                ${keepSafe}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 36px 24px;border-top:1px solid ${line};background:#fcfcfd;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
              <p style="margin:0 0 4px;font-size:13px;">${brandLink}</p>
              <p style="margin:0;font-size:12px;line-height:1.55;color:${muted};">${footer}</p>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:22px 12px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;line-height:1.5;color:#aeaeb2;">
              © ${new Date().getFullYear()} <a href="${escapeHtml(siteUrl)}" style="color:#aeaeb2;text-decoration:underline;text-underline-offset:2px;">${brand}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const sendSubscriberCredentialsEmail = onCall(
  {secrets: [smtpUser, smtpPass]},
  async (request) => {
    assertStaffCaller(request.auth, "subscribers:write");
    const data = (request.data ?? {}) as Record<string, unknown>;

    const subscriberId = String(data.subscriberId ?? "").trim();
    const toEmail = String(data.toEmail ?? "").trim().toLowerCase();
    const password = String(data.password ?? "").trim();
    const displayName = String(data.displayName ?? "").trim() || toEmail;
    const loginUrl = String(data.loginUrl ?? "").trim();
    const locale: "en" | "ar" = data.locale === "en" ? "en" : "ar";

    if (!toEmail || !toEmail.includes("@")) {
      throw new HttpsError("invalid-argument", "A valid recipient email is required.");
    }
    if (!password || password.length < 6) {
      throw new HttpsError("invalid-argument", "Password is required.");
    }
    if (!loginUrl.startsWith("http://") && !loginUrl.startsWith("https://")) {
      throw new HttpsError("invalid-argument", "A valid login URL is required.");
    }

    let email = toEmail;
    let name = displayName;
    let pwd = password;
    if (subscriberId) {
      const snap = await db.collection(COLLECTIONS.subscribers).doc(subscriberId).get();
      if (snap.exists) {
        const raw = snap.data() ?? {};
        email = String(raw.email ?? email).trim().toLowerCase() || email;
        name = String(raw.displayName ?? name).trim() || name;
        const stored = String(raw.loginPassword ?? "").trim();
        if (stored) pwd = stored;
      }
    }

    const subject =
      locale === "ar"
        ? "بيانات الدخول إلى حسابك — Derby Fit"
        : "Your Derby Fit login details";

    const text =
      locale === "ar"
        ? [
            `مرحباً ${name}،`,
            "",
            "تم إنشاء حسابك في Derby Fit بنجاح.",
            `البريد: ${email}`,
            `كلمة المرور: ${pwd}`,
            `تسجيل الدخول: ${loginUrl}`,
          ].join("\n")
        : [
            `Hello ${name},`,
            "",
            "Your Derby Fit account is ready.",
            `Email: ${email}`,
            `Password: ${pwd}`,
            `Sign in: ${loginUrl}`,
          ].join("\n");

    const logoAttachments = getEmailLogoAttachment();
    const html = buildCredentialsEmailHtml({
      name,
      email,
      password: pwd,
      loginUrl,
      locale,
      hasLogo: logoAttachments.length > 0,
    });

    try {
      const sent = await sendSmtpHtmlEmail({
        to: email,
        fromName: FROM_NAME,
        replyTo: FROM_EMAIL,
        subject,
        text,
        html,
        attachments: logoAttachments,
      });

      return {ok: true, to: email, from: sent.from};
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === "SMTP_NOT_CONFIGURED") {
        throw new HttpsError(
          "failed-precondition",
          "Email is not configured. Set SMTP_USER and SMTP_PASS secrets for Cloud Functions.",
        );
      }
      console.error("sendSubscriberCredentialsEmail SMTP error", message);
      throw new HttpsError(
        "internal",
        "Could not send the login email. Check SMTP credentials and try again.",
      );
    }
  },
);
