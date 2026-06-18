import nodemailer from "nodemailer";

// In-memory OTP storage (for production, use Redis or database)
const otpStore: { [key: string]: { otp: string; expiresAt: number } } = {};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function generateAndSendOTP(email: string): Promise<string> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore[email] = { otp, expiresAt };

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Password Reset OTP - Smart Attendance",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #6366f1;">Smart Attendance</h2>
            </div>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
              <h3 style="margin-top: 0;">Password Reset Request</h3>
              <p>You requested a password reset for your Smart Attendance account.</p>
              
              <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
                <p style="margin: 0 0 10px 0; color: #666;">Your OTP is:</p>
                <div style="font-size: 32px; font-weight: bold; color: #6366f1; letter-spacing: 5px;">
                  ${otp}
                </div>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                This OTP will expire in 10 minutes. Do not share this OTP with anyone.
              </p>
              
              <p style="margin-top: 30px; color: #999; font-size: 12px;">
                If you didn't request this password reset, please ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>&copy; 2024 Smart Attendance. All rights reserved.</p>
            </div>
          </div>
        </div>
      `,
    });

    return otp;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send OTP email");
  }
}

export function verifyOTP(email: string, otp: string): boolean {
  const stored = otpStore[email];

  if (!stored) {
    return false;
  }

  if (stored.expiresAt < Date.now()) {
    delete otpStore[email];
    return false;
  }

  if (stored.otp === otp) {
    delete otpStore[email];
    return true;
  }

  return false;
}

export function clearOTP(email: string): void {
  delete otpStore[email];
}
