import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  try {
    await resend.emails.send({
      from: "Fingerspot <onboarding@resend.dev>",
      to: email,
      subject: "Kode Verifikasi Fingerspot",
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 400px; margin: 0 auto; padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #004ccd; color: white; width: 48px; height: 48px; border-radius: 12px; line-height: 48px; font-size: 24px;">F</div>
          </div>
          <h2 style="color: #1a1a1a; text-align: center; margin-bottom: 8px;">Kode Verifikasi Anda</h2>
          <p style="color: #666; text-align: center; font-size: 14px; margin-bottom: 24px;">Masukkan kode ini untuk menyelesaikan registrasi:</p>
          <div style="background: #f5f5f5; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #004ccd; font-family: 'JetBrains Mono', monospace;">${code}</span>
          </div>
          <p style="color: #999; text-align: center; font-size: 12px;">Kode ini berlaku selama 5 menit. Jika Anda tidak meminta kode ini, abaikan email ini.</p>
        </div>
      `,
    });
    return true;
  } catch (e) {
    console.error("[Email] Failed to send verification:", e);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, code: string): Promise<boolean> {
  try {
    await resend.emails.send({
      from: "Fingerspot <onboarding@resend.dev>",
      to: email,
      subject: "Reset Password Fingerspot",
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 400px; margin: 0 auto; padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #004ccd; color: white; width: 48px; height: 48px; border-radius: 12px; line-height: 48px; font-size: 24px;">F</div>
          </div>
          <h2 style="color: #1a1a1a; text-align: center; margin-bottom: 8px;">Reset Password</h2>
          <p style="color: #666; text-align: center; font-size: 14px; margin-bottom: 24px;">Gunakan kode ini untuk reset password Anda:</p>
          <div style="background: #f5f5f5; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #004ccd; font-family: 'JetBrains Mono', monospace;">${code}</span>
          </div>
          <p style="color: #999; text-align: center; font-size: 12px;">Kode ini berlaku selama 5 menit. Jika Anda tidak meminta reset password, abaikan email ini.</p>
        </div>
      `,
    });
    return true;
  } catch (e) {
    console.error("[Email] Failed to send password reset:", e);
    return false;
  }
}

export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
