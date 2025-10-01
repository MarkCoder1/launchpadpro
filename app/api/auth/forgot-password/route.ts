import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import nodemailer from "nodemailer";

// Singleton Prisma Client
const prisma = globalThis.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

// Initialize Nodemailer with Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      return NextResponse.json({
        message:
          "If an account with that email exists, we've sent a password reset link.",
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Create reset URL
    const resetUrl = `${
      process.env.NEXT_PUBLIC_BASE_URL   || "http://localhost:3000"
    }/reset-password?token=${resetToken}`;

    // Send email (you'll need to configure this with your email service)
    try {
      await sendResetEmail(email, resetUrl, user.name || "User");
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      // Don't expose email sending errors to client
    }

    return NextResponse.json({
      message:
        "If an account with that email exists, we've sent a password reset link.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function sendResetEmail(email: string, resetUrl: string, name: string) {
  // Validate Gmail configuration
  if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
    console.error("Gmail credentials missing");
    throw new Error("Email configuration missing");
  }

  // For development, log the reset URL and still send email if configured
  if (process.env.NODE_ENV === "development") {
    console.log(`
        === PASSWORD RESET EMAIL ===
        To: ${email}
        Subject: Reset Your Password - CareerPad

        Hello ${name},

        You requested a password reset for your CareerPad account.

        Click the link below to reset your password:
        ${resetUrl}

        This link will expire in 1 hour.

        If you didn't request this, please ignore this email.

        Best regards,
        The CareerPad Team
        ============================
    `);
  }

  try {
    const mailOptions = {
      from: `"CareerPad" <${process.env.GMAIL_EMAIL}>`,
      to: email,
      subject: "Reset Your Password - CareerPad",
      text: `
Hello ${name},

You requested a password reset for your CareerPad account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Best regards,
The CareerPad Team
      `,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; padding: 32px;">
          <div style="max-width: 520px; margin: auto; background: #fff; border-radius: 10px; box-shadow: 0 4px 16px rgba(45,127,249,0.08); padding: 36px 32px;">
            <h2 style="color: #2d7ff9; margin-top: 0; margin-bottom: 18px; font-size: 28px; font-weight: 700; letter-spacing: 0.5px;">
              🔐 Password Reset Request
            </h2>
            <p style="font-size: 17px; color: #222; margin-bottom: 16px;">
              Hello <strong>${name}</strong>,
            </p>
            <p style="font-size: 17px; color: #222; margin-bottom: 24px;">
              You requested a password reset for your CareerPad account. Click the button below to reset your password:
            </p>
            <div style="margin-bottom: 32px; text-align: center;">
              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(90deg, #2d7ff9 0%, #6ec1e4 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 8px rgba(45,127,249,0.15);">
                Reset Your Password
              </a>
            </div>
            <p style="font-size: 15px; color: #666; margin-bottom: 16px; padding: 16px; background: #f8f9fa; border-left: 4px solid #ffc107; border-radius: 4px;">
              <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
            </p>
            <p style="font-size: 14px; color: #888; margin-bottom: 16px;">
              If the button doesn't work, copy and paste this link in your browser:
            </p>
            <p style="font-size: 14px; color: #2d7ff9; word-break: break-all; background: #f8f9fa; padding: 12px; border-radius: 4px; margin-bottom: 24px;">
              ${resetUrl}
            </p>
            <p style="font-size: 15px; color: #666; margin-bottom: 8px;">
              If you didn't request this password reset, please ignore this email. Your account is still secure.
            </p>
            <p style="font-size: 16px; color: #444; margin-top: 32px; border-top: 1px solid #eee; padding-top: 24px;">
              Best regards,<br>
              <span style="color: #2d7ff9; font-weight: 600;">The CareerPad Team</span>
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}, Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Error sending password reset email to ${email}:`, error);
    throw error;
  }
}
