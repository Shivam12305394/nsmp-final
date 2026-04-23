const nodemailer = require('nodemailer');

function createTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = (process.env.EMAIL_PASS || '').replace(/\s/g, '');
  const brevoUser = process.env.BREVO_USER;
  const brevoPass = process.env.BREVO_PASS;

  if (brevoUser && brevoPass) {
    return nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: { user: brevoUser, pass: brevoPass },
    });
  }

  if (user && pass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  return null;
}

const FROM_NAME = 'NSMP Scholarship Portal';

function getFromAddress() {
  if (process.env.BREVO_USER) return `"${FROM_NAME}" <${process.env.BREVO_FROM || process.env.BREVO_USER}>`;
  return `"${FROM_NAME}" <${process.env.EMAIL_USER}>`;
}

async function trySendMail(mailOptions) {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`📧 [NO EMAIL CONFIG] OTP will be shown in console only.`);
      return;
    }
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.warn(`⚠️ Email failed (${err.message}) — continuing without email.`);
  }
}

// ── OTP Email ──
const sendOtpEmail = async (toEmail, userName, otp) => {
  await trySendMail({
    from: getFromAddress(),
    to: toEmail,
    subject: `${otp} is your NSMP verification code`,
    html: `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f7ff;font-family:Arial,sans-serif;">
<table width="100%" style="padding:40px 0;background:#f4f7ff;">
  <tr><td align="center">
    <table width="520" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr>
        <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:30px 40px;text-align:center;">
          <div style="font-size:36px;margin-bottom:8px;">🎓</div>
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">NSMP Scholarship Portal</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:12px;">Email Verification</p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 40px;">
          <p style="color:#374151;font-size:15px;margin:0 0 8px;">Hello <strong>${userName}</strong>,</p>
          <p style="color:#6b7280;font-size:14px;margin:0 0 24px;line-height:1.6;">
            Use the OTP below to verify your email and complete your NSMP registration.
          </p>
          <div style="background:#f5f3ff;border:2px dashed #c4b5fd;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="color:#7c3aed;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;">Your Verification Code</p>
            <div style="font-size:48px;font-weight:900;letter-spacing:16px;color:#6366f1;font-family:'Courier New',monospace;">${otp}</div>
            <p style="color:#9ca3af;font-size:12px;margin:10px 0 0;">This code expires in <strong>10 minutes</strong></p>
          </div>
          <p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.6;">
            If you did not request this, please ignore this email.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;padding:16px 40px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="color:#9ca3af;font-size:11px;margin:0;">© ${new Date().getFullYear()} NSMP — National Scholarship Matching Portal</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  });

  console.log(`✅ OTP email sent to: ${toEmail}`);
};

// ── Welcome Email ──
const sendWelcomeEmail = async (toEmail, userName) => {
  await trySendMail({
    from: getFromAddress(),
    to: toEmail,
    subject: `Welcome to NSMP, ${userName}! 🎓`,
    html: `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f7ff;font-family:Arial,sans-serif;">
<table width="100%" style="padding:40px 0;background:#f4f7ff;">
  <tr><td align="center">
    <table width="520" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr>
        <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
          <div style="font-size:48px;margin-bottom:10px;">🎓</div>
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Welcome to NSMP!</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:13px;">Your account has been successfully created</p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 40px;">
          <p style="color:#374151;font-size:15px;margin:0 0 14px;">Hi <strong>${userName}</strong> 👋</p>
          <p style="color:#6b7280;font-size:14px;margin:0 0 22px;line-height:1.7;">
            Your account on the <strong>National Scholarship Matching Portal (NSMP)</strong> has been successfully created!
          </p>
          <div style="background:#f5f3ff;border-radius:10px;padding:20px;margin-bottom:22px;">
            <p style="color:#7c3aed;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 14px;">🚀 Next Steps</p>
            <p style="color:#374151;font-size:13px;margin:6px 0;">✅ <strong>1.</strong> Complete your profile (marks, income, category)</p>
            <p style="color:#374151;font-size:13px;margin:6px 0;">✅ <strong>2.</strong> Browse AI-matched scholarships</p>
            <p style="color:#374151;font-size:13px;margin:6px 0;">✅ <strong>3.</strong> Apply directly from the portal</p>
          </div>
          <div style="text-align:center;margin-bottom:20px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard"
               style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:13px 32px;border-radius:9px;font-weight:700;font-size:14px;display:inline-block;">
              Open Dashboard →
            </a>
          </div>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;padding:16px 40px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="color:#9ca3af;font-size:11px;margin:0;">© ${new Date().getFullYear()} NSMP — National Scholarship Matching Portal</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  });

  console.log(`✅ Welcome email sent to: ${toEmail}`);
};

// ── Password Reset OTP Email ──
const sendResetOtpEmail = async (toEmail, userName, otp) => {
  await trySendMail({
    from: getFromAddress(),
    to: toEmail,
    subject: `${otp} — NSMP Password Reset Code`,
    html: `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f7ff;font-family:Arial,sans-serif;">
<table width="100%" style="padding:40px 0;background:#f4f7ff;">
  <tr><td align="center">
    <table width="520" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr>
        <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:30px 40px;text-align:center;">
          <div style="font-size:36px;margin-bottom:8px;">🔐</div>
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">NSMP Scholarship Portal</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:12px;">Password Reset Request</p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 40px;">
          <p style="color:#374151;font-size:15px;margin:0 0 8px;">Hello <strong>${userName}</strong>,</p>
          <p style="color:#6b7280;font-size:14px;margin:0 0 24px;line-height:1.6;">
            We received a request to reset your NSMP account password. Use the OTP below to proceed.
          </p>
          <div style="background:#f5f3ff;border:2px dashed #c4b5fd;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="color:#7c3aed;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;">Password Reset Code</p>
            <div style="font-size:48px;font-weight:900;letter-spacing:16px;color:#6366f1;font-family:'Courier New',monospace;">${otp}</div>
            <p style="color:#9ca3af;font-size:12px;margin:10px 0 0;">This code expires in <strong>5 minutes</strong></p>
          </div>
          <p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.6;">
            If you did not request a password reset, please ignore this email. Your password will remain unchanged.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;padding:16px 40px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="color:#9ca3af;font-size:11px;margin:0;">© ${new Date().getFullYear()} NSMP — National Scholarship Matching Portal</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  });

  console.log(`✅ Reset OTP email sent to: ${toEmail}`);
};

module.exports = { sendOtpEmail, sendWelcomeEmail, sendResetOtpEmail };
