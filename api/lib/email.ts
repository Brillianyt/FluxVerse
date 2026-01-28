import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'qq', // Built-in support for QQ
  secure: true,
  auth: {
    user: process.env.SMTP_USER || '2700074128@qq.com',
    pass: process.env.SMTP_PASS || 'voufumuiorhrdhbg', // Authorization code
  },
});

export const sendEmailCode = async (email: string, code: string) => {
  // STRICT MODE: Always try to send real email if user requests it.
  // We removed the automatic fallback to ensure we debug the real connection.
  
  const mailOptions = {
    from: `"FluxVerse Auth" <${process.env.SMTP_USER || '2700074128@qq.com'}>`,
    to: email,
    subject: 'FluxVerse 登录验证码',
    text: `您的验证码是：${code}。有效期 5 分钟，请勿泄露。`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2>FluxVerse 验证码</h2>
        <p>您的验证码是：<strong style="font-size: 24px; color: #000; letter-spacing: 2px;">${code}</strong></p>
        <p style="color: #666; font-size: 14px;">有效期 5 分钟，请勿泄露给他人。</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[REAL EMAIL SENT] To: ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
