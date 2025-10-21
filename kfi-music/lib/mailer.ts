import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || "KFI Music <no-reply@example.com>";

if (!host || !user || !pass) {
  // Don't throw immediately to allow local dev without email, but log it.
  console.warn("SMTP credentials are not fully set. Emails will fail.");
}

export const transporter = nodemailer.createTransport({
  host,
  port,
  auth: user && pass ? { user, pass } : undefined,
});

export async function sendDownloadEmail(
  to: string,
  title: string,
  url: string
) {
  const html = `
    <p>Thanks for your purchase!</p>
    <p>Your beat <strong>${title}</strong> is ready. Click the link below to download:</p>
    <p><a href="${url}">Download ${title}</a> (expires in ~1 hour)</p>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: `Your download: ${title}`,
    html,
  });
}
