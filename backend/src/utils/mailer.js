const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

async function sendOtpEmail(to, otpCode) {
  let transporter;

  // Use real SMTP if an API Key / App Password is provided in .env
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // The SMTP App/API Key goes here
      },
    });
  } else {
    // Fallback for immediate Dev/Testing: Ethereal generates fake email accounts instantly 
    // without requiring you to set up an API key first!
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const info = await transporter.sendMail({
    from: '"UGIRP Platform" <noreply@ugirp.local>',
    to,
    subject: "Your UGIRP Registration OTP",
    text: `Your OTP for registration is: ${otpCode}. It is valid for 10 minutes.`,
    html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
             <h2 style="color: #4f46e5;">UGIRP Authentication</h2>
             <p>Your One-Time Password (OTP) for registration is:</p>
             <div style="background: #f1f5f9; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 4px; border-radius: 8px;">
               ${otpCode}
             </div>
             <p style="color: #64748b; font-size: 14px; margin-top: 20px;">This OTP is valid for 10 minutes. Do not share this code with anyone.</p>
           </div>`,
  });

  // If we are in dev mode without an API key, we print the Ethereal URL where you can view the fake email sent!
  if (!process.env.SMTP_USER) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log("-----------------------------------------");
    console.log(`[SMTP DEV MODE] Email successfully sent to ${to}`);
    console.log(`Preview Delivery URL: ${previewUrl}`);
    console.log("-----------------------------------------");
    
    // Write out to a log file so the user can easily find it without terminal access
    fs.appendFileSync(path.join(__dirname, "../../.otp-logs.txt"), `[OTP SENT TO: ${to}] -> PREVIEW URL: ${previewUrl}\nOR OTP CODE: ${otpCode}\n\n`);
  } else {
    console.log(`Email successfully delivered to ${to}. Message ID: ${info.messageId}`);
  }
}

module.exports = { sendOtpEmail };
