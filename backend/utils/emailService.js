const nodemailer = require('nodemailer');

function createTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = (process.env.EMAIL_PASS || '').replace(/\s/g, '');
  const brevoUser = process.env.BREVO_USER;
  const brevoPass = process.env.BREVO_PASS;
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const mailgunApiKey = process.env.MAILGUN_API_KEY;
  const mailgunDomain = process.env.MAILGUN_DOMAIN;

  console.log('🔍 DEBUG EMAIL_CONFIG:', {
    hasBrevo: !!(brevoUser && brevoPass),
    hasSendGrid: !!sendgridApiKey,
    hasMailgun: !!(mailgunApiKey && mailgunDomain),
    hasGmail: !!(user && pass)
  });

  if (sendgridApiKey) {
    console.log('🔍 Using SendGrid');
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: sendgridApiKey,
      },
    });
  }

  if (mailgunApiKey && mailgunDomain) {
    console.log('🔍 Using Mailgun');
    return nodemailer.createTransport({
      host: 'smtp.mailgun.org',
      port: 587,
      auth: {
        user: `postmaster@${mailgunDomain}`,
        pass: mailgunApiKey,
      },
    });
  }

  if (brevoUser && brevoPass) {
    console.log('🔍 Using Brevo');
    return nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: { user: brevoUser, pass: brevoPass },
    });
  }

  if (user && pass) {
    console.log('🔍 Using Gmail');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  console.log('🔍 No email configuration found - OTP will be logged to console only.');
  return null;
}

const FROM_NAME = 'NSMP Scholarship Portal';

function getFromAddress() {
  if (process.env.SENDGRID_FROM) return `"${FROM_NAME}" <${process.env.SENDGRID_FROM}>`;
  if (process.env.MAILGUN_FROM) return `"${FROM_NAME}" <${process.env.MAILGUN_FROM}>`;
  if (process.env.BREVO_FROM) return `"${FROM_NAME}" <${process.env.BREVO_FROM}>`;
  if (process.env.EMAIL_USER) return `"${FROM_NAME}" <${process.env.EMAIL_USER}>`;
  return `"${FROM_NAME}" <noreply@nsmp.gov.ph>`;
}

async function trySendMail(mailOptions) {
  try {
    const transporter = createTransporter();
    console.log('🔍 DEBUG transporter created:', !!transporter);
    if (!transporter) {
      console.log(`📧 [NO EMAIL CONFIG] OTP will be shown in console only.`);
      return;
    }
    console.log('🔍 Sending email to:', mailOptions.to);
    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully');
  } catch (err) {
    console.warn(`⚠️ Email failed: ${err.message}`);
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
            <p style="color:#9ca3af;font-size:12px;margin:10px 0 0;">This code expires in <strong>5 minutes</strong></p>
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
        <td style="background:linear-gradient(135deg,#10b981,#34d399);padding:30px 40px;text-align:center;">
          <div style="font-size:36px;margin-bottom:8px;">🎉</div>
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">Welcome to NSMP!</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:12px;">Registration Successful</p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 40px;">
          <p style="color:#374151;font-size:15px;margin:0 0 8px;">Hello <strong>${userName}</strong>,</p>
          <p style="color:#6b7280;font-size:14px;margin:0 0 24px;line-height:1.6;">
            Your account has been successfully created. We are excited to have you on board!
          </p>
          <p style="color:#6b7280;font-size:14px;margin:0 0 24px;line-height:1.6;">
            You can now log in and start applying for scholarships that match your profile.
          </p>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="https://nsmp.gov.ph/login" style="background:#10b981;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Go to Dashboard</a>
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
        <td style="background:linear-gradient(135deg,#ef4444,#f87171);padding:30px 40px;text-align:center;">
          <div style="font-size:36px;margin-bottom:8px;">🔒</div>
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">NSMP Scholarship Portal</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:12px;">Password Reset Request</p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 40px;">
          <p style="color:#374151;font-size:15px;margin:0 0 8px;">Hello <strong>${userName}</strong>,</p>
          <p style="color:#6b7280;font-size:14px;margin:0 0 24px;line-height:1.6;">
            We received a request to reset your password. Use the OTP below to proceed.
          </p>
          <div style="background:#fef2f2;border:2px dashed #fecaca;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="color:#ef4444;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;">Your Reset Code</p>
            <div style="font-size:48px;font-weight:900;letter-spacing:16px;color:#ef4444;font-family:'Courier New',monospace;">${otp}</div>
            <p style="color:#9ca3af;font-size:12px;margin:10px 0 0;">This code expires in <strong>5 minutes</strong></p>
          </div>
          <p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.6;">
            If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
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

