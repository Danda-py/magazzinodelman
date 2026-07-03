/**
 * Shared nodemailer transporter factory.
 * Returns null when SMTP_HOST is not set (dev mode).
 */
async function createTransporter() {
  const smtpHost = process.env["SMTP_HOST"];
  if (!smtpHost) return null;
  const nodemailer = await import("nodemailer");
  return nodemailer.default.createTransport({
    host: smtpHost,
    port: Number(process.env["SMTP_PORT"] ?? 587),
    secure: process.env["SMTP_SECURE"] === "true",
    auth: {
      user: process.env["SMTP_USER"],
      pass: process.env["SMTP_PASS"],
    },
  });
}

const FROM = () => process.env["FROM_EMAIL"] ?? "noreply@ilmagazzinodelman.it";

/**
 * Sends a post-purchase invoice email to the buyer.
 */
export async function sendInvoiceEmail(opts: {
  to: string;
  buyerName: string;
  productTitle: string;
  amountCents: number;
  transactionId: string;
}): Promise<void> {
  const { to, buyerName, productTitle, amountCents, transactionId } = opts;
  const amount = (amountCents / 100).toFixed(2);
  const date = new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });

  const transporter = await createTransporter();
  if (!transporter) {
    console.log(`\n╔══════════════════════════════════════════════════╗`);
    console.log(`║  FATTURA — ${to.substring(0, 36).padEnd(36)} ║`);
    console.log(`║  Articolo: ${productTitle.substring(0, 36).padEnd(36)} ║`);
    console.log(`║  Importo:  €${amount.padEnd(35)} ║`);
    console.log(`║  ID:       ${transactionId.substring(0, 36).padEnd(36)} ║`);
    console.log(`╚══════════════════════════════════════════════════╝\n`);
    return;
  }

  await transporter.sendMail({
    from: FROM(),
    to,
    subject: `Fattura acquisto — Il magazzino del man`,
    text: `Grazie ${buyerName}!\n\nRicevuta del tuo acquisto:\nArticolo: ${productTitle}\nImporto: €${amount}\nData: ${date}\nID transazione: ${transactionId}\n\nIl magazzino del man`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 520px; margin: auto; padding: 48px 32px; background: #fafaf9; border: 1px solid #e5e5e3;">
        <p style="font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; color: #888; margin: 0 0 32px;">Il magazzino del man</p>
        <h1 style="font-size: 26px; font-weight: normal; margin: 0 0 8px;">Grazie, ${buyerName}!</h1>
        <p style="color: #555; margin: 0 0 32px;">Il tuo ordine è confermato. Ecco il riepilogo del tuo acquisto.</p>

        <table style="width:100%; border-collapse:collapse; margin-bottom:32px;">
          <tr style="border-bottom:1px solid #e5e5e3;">
            <td style="padding:12px 0; color:#888; font-size:12px; text-transform:uppercase; letter-spacing:0.1em;">Articolo</td>
            <td style="padding:12px 0; text-align:right; font-weight:bold;">${productTitle}</td>
          </tr>
          <tr style="border-bottom:1px solid #e5e5e3;">
            <td style="padding:12px 0; color:#888; font-size:12px; text-transform:uppercase; letter-spacing:0.1em;">Data</td>
            <td style="padding:12px 0; text-align:right;">${date}</td>
          </tr>
          <tr style="border-bottom:1px solid #e5e5e3;">
            <td style="padding:12px 0; color:#888; font-size:12px; text-transform:uppercase; letter-spacing:0.1em;">ID Transazione</td>
            <td style="padding:12px 0; text-align:right; font-family:monospace; font-size:11px;">${transactionId}</td>
          </tr>
          <tr>
            <td style="padding:16px 0; font-size:16px; font-weight:bold;">Totale</td>
            <td style="padding:16px 0; text-align:right; font-size:22px; font-weight:bold; font-family:monospace;">€${amount}</td>
          </tr>
        </table>

        <p style="font-size:12px; color:#aaa;">Per qualsiasi domanda scrivi a <a href="mailto:${FROM()}" style="color:#555;">${FROM()}</a></p>
      </div>
    `,
  });
}

/**
 * Sends a one-time OTP code to the given email address.
 *
 * Development (no SMTP_HOST env var): logs the code to the server console so
 * you can grab it from the workflow logs without needing an email account.
 *
 * Production: sends via SMTP using nodemailer (set SMTP_HOST, SMTP_PORT,
 * SMTP_USER, SMTP_PASS, and optionally FROM_EMAIL).
 */
export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const transporter = await createTransporter();

  if (!transporter) {
    // Dev fallback — visible in the API Server workflow logs
    console.log(`\n╔══════════════════════════════════╗`);
    console.log(`║  OTP PER ${to.substring(0, 22).padEnd(22)} ║`);
    console.log(`║  Codice: ${otp}                   ║`);
    console.log(`╚══════════════════════════════════╝\n`);
    return;
  }

  await transporter.sendMail({
    from: FROM(),
    to,
    subject: "Il tuo codice di accesso — Il magazzino del man",
    text: `Il tuo codice di verifica è: ${otp}\n\nIl codice scade tra 10 minuti.\n\nSe non hai richiesto questo codice, ignora questa email.`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: auto; padding: 48px 32px; background: #fafaf9; border: 1px solid #e5e5e3;">
        <p style="font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; color: #888; margin: 0 0 32px;">Il magazzino del man</p>
        <h1 style="font-size: 28px; font-weight: normal; margin: 0 0 16px;">Codice di accesso</h1>
        <p style="color: #555; margin: 0 0 32px;">Usa questo codice per completare il tuo accesso. Scade tra 10 minuti.</p>
        <div style="font-size: 40px; font-weight: bold; letter-spacing: 0.3em; text-align: center; padding: 24px; background: #fff; border: 1px solid #e5e5e3; margin-bottom: 32px;">${otp}</div>
        <p style="font-size: 12px; color: #aaa;">Se non hai richiesto questo codice, ignora questa email.</p>
      </div>
    `,
  });
}
