import nodemailer from "nodemailer";

const RECIPIENTS = [
  // Independent operators
  "jtoneller@gmail.com",
  "kelsey3601@gmail.com",
  "matt.cooop@gmail.com",
  "steeventremb@gmail.com",
  "cdooher@utilitieskingston.com",
  "dasminderdhillon@gmail.com",
  "hasham0216@gmail.com",
  "rfeng98@outlook.com",
  "robin.mckenzie.southgate@gmail.com",
  "shavare@gmail.com",
  "tinduong87@gmail.com",
  "tristahuggett@icloud.com",
  // Utilities Kingston operators
  "a.wilson@utilitieskingston.ca",
  "ajrichard@utilitieskingston.com",
  "azawada@utilitieskingston.com",
  "bcurran@utilitieskingston.com",
  "bknowles@utilitieskingston.com",
  "cemon@utilitieskingston.com",
  "civanleeuwen@utilitieskingston.com",
  "d.garcia@utilitieskingston.ca",
  "hmcveigh@utilitieskingston.com",
  "irines@utilitieskingston.com",
  "j.smith@utilitieskingston.ca",
  "jflisikowski@utilitieskingston.com",
  "kgowsell@utilitieskingston.com",
  "lmhartwick@utilitieskingston.com",
  "lnewman1@utilitieskingston.com",
  "m.jones@utilitieskingston.ca",
  "mturney@utilitieskingston.com",
  "nduarte@utilitieskingston.com",
  "pemon@utilitieskingston.com",
  "r.patel@utilitieskingston.ca",
  "s.chen@utilitieskingston.ca",
  "t.brown@utilitieskingston.ca",
  "tmcivor@utilitieskingston.com",
  "zdillon@utilitieskingston.com",
];

const HTML_BODY = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0F172A 0%,#1E3A5F 50%,#0E7490 100%);padding:32px 40px;text-align:center;">
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp" alt="Echelon Institute" width="48" style="margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;">
            <p style="color:#7DD3FC;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0;">Echelon Institute</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="font-size:16px;color:#334155;line-height:1.7;margin:0 0 20px;">Hi there,</p>
            <p style="font-size:16px;color:#334155;line-height:1.7;margin:0 0 20px;">I wanted to reach out personally — you've been putting in the work on Echelon, and I'd love to know how it's going.</p>
            <p style="font-size:16px;color:#0F172A;font-weight:700;margin:0 0 12px;">Did you sit your certification exam?</p>
            <p style="font-size:16px;color:#334155;line-height:1.7;margin:0 0 20px;">If you did, I'd love to hear how it went. Your outcome helps us understand what's working and where we can improve for future operators.</p>
            <p style="font-size:16px;color:#334155;line-height:1.7;margin:0 0 28px;">And if Echelon helped you prepare — even a little — a Google review goes a long way for us as a small, independent platform built specifically for Canadian operators.</p>
            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr>
                <td style="background:linear-gradient(135deg,#1D4ED8,#0E7490);border-radius:10px;padding:14px 28px;">
                  <a href="https://g.page/r/CWsjBbkUlS8rEBM/review" target="_blank" style="color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;display:block;">⭐ Leave a Google Review</a>
                </td>
              </tr>
            </table>
            <p style="font-size:16px;color:#334155;line-height:1.7;margin:0 0 32px;">Either way, thank you for studying with us. It means a lot.</p>
            <p style="font-size:15px;color:#0F172A;margin:0;">— Ay Bello<br>
            <span style="color:#64748B;font-size:14px;">Founder, Echelon Institute</span></p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#F1F5F9;padding:20px 40px;border-top:1px solid #E2E8F0;">
            <p style="font-size:12px;color:#94A3B8;margin:0;text-align:center;">
              <a href="https://echeloninstitute.ca" style="color:#1D4ED8;text-decoration:none;">echeloninstitute.ca</a> &nbsp;·&nbsp; 289-788-1885 &nbsp;·&nbsp; abello@echeloninstitute.ca
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

const TEXT_BODY = `Hi there,

I wanted to reach out personally — you've been putting in the work on Echelon, and I'd love to know how it's going.

Did you sit your certification exam? If you did, I'd love to hear how it went. Your outcome helps us understand what's working and where we can improve for future operators.

And if Echelon helped you prepare — even a little — a Google review goes a long way for us as a small, independent platform built specifically for Canadian operators.

Leave a Google Review: https://g.page/r/CWsjBbkUlS8rEBM/review

Either way, thank you for studying with us. It means a lot.

— Ay Bello
Founder, Echelon Institute
echeloninstitute.ca | 289-788-1885`;

async function main() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  console.log(`Sending to ${RECIPIENTS.length} recipients...`);
  let sent = 0;
  let failed = 0;

  for (const email of RECIPIENTS) {
    try {
      await transporter.sendMail({
        from: `"Ay Bello — Echelon Institute" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "How did your exam go? 🎓",
        text: TEXT_BODY,
        html: HTML_BODY,
      });
      console.log(`✅ Sent to ${email}`);
      sent++;
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`❌ Failed to send to ${email}:`, err);
      failed++;
    }
  }

  console.log(`\nDone. Sent: ${sent}, Failed: ${failed}`);
}

main().catch(console.error);
