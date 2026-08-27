import { logger } from "../../core/logger/index.js";
// @ts-ignore
import nodemailer from 'nodemailer';

export class EmailService {
  private static transporter: any = null;

  /**
   * Initialize email transporter based on available configuration
   */
  private static async getTransporter(): Promise<any> {
    // If transporter is already initialized, return it
    if (this.transporter) {
      return this.transporter;
    }

    // Check for SMTP configuration first
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpSecure = process.env.SMTP_SECURE === 'true';

    // Check for Resend API key
    const resendApiKey = process.env.RESEND_API_KEY;

    // Check for SendGrid API key
    const sendgridApiKey = process.env.SENDGRID_API_KEY;

    // Check for Mailgun API key
    const mailgunApiKey = process.env.MAILGUN_API_KEY;
    const mailgunDomain = process.env.MAILGUN_DOMAIN;

    // Initialize transporter based on available configuration
    if (smtpHost && smtpUser && smtpPass) {
      // SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
      });

      logger.info('SMTP transporter initialized');
      return this.transporter;
    }

    // If no transporter, return null (will use console fallback)
    logger.warn('No email provider configured. Emails will be logged to console only.');
    return null;
  }

  /**
   * Generate HTML email template for OTP
   */
  private static generateOTPEmailHTML(otp: string, appName: string = 'Repository Intelligence Platform'): string {
    const currentYear = new Date().getFullYear();

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f4f4f5;
            line-height: 1.6;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #09090b 0%, #1a1a1a 100%);
            color: #ffffff;
            padding: 32px 40px;
            text-align: center;
          }
          .header h1 {
            font-size: 24px;
            font-weight: 600;
            letter-spacing: -0.5px;
          }
          .header p {
            color: #a1a1aa;
            font-size: 14px;
            margin-top: 8px;
          }
          .content {
            padding: 40px;
            background-color: #ffffff;
          }
          .greeting {
            font-size: 16px;
            color: #18181b;
            margin-bottom: 16px;
          }
          .message {
            color: #3f3f46;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .otp-container {
            background-color: #f4f4f5;
            border: 2px dashed #10b981;
            border-radius: 12px;
            padding: 24px 20px;
            text-align: center;
            margin: 24px 0;
            position: relative;
          }
          .otp-code {
            font-family: 'Courier New', monospace;
            font-size: 48px;
            font-weight: 700;
            letter-spacing: 12px;
            color: #10b981;
            display: block;
            padding: 8px 0;
          }
          .otp-label {
            font-size: 12px;
            color: #71717a;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 8px;
          }
          .expiry-info {
            color: #71717a;
            font-size: 13px;
            text-align: center;
            margin: 16px 0 24px 0;
            padding: 12px;
            background-color: #fafafa;
            border-radius: 8px;
          }
          .security-note {
            border-top: 1px solid #e4e4e7;
            padding-top: 20px;
            margin-top: 20px;
            color: #71717a;
            font-size: 12px;
          }
          .security-note p {
            margin-bottom: 6px;
          }
          .footer {
            background-color: #fafafa;
            padding: 20px 40px;
            text-align: center;
            border-top: 1px solid #e4e4e7;
          }
          .footer p {
            color: #71717a;
            font-size: 12px;
          }
          .footer a {
            color: #10b981;
            text-decoration: none;
          }
          @media (max-width: 600px) {
            .content {
              padding: 24px;
            }
            .otp-code {
              font-size: 36px;
              letter-spacing: 8px;
            }
            .header {
              padding: 24px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 ${appName}</h1>
            <p>Secure Email Verification</p>
          </div>
          <div class="content">
            <div class="greeting">
              <strong>Hello!</strong>
            </div>
            <div class="message">
              Welcome to ${appName}. Please use the verification code below to complete your email verification process. 
              This code is valid for <strong>10 minutes</strong>.
            </div>
            <div class="otp-container">
              <span class="otp-code">${otp}</span>
              <div class="otp-label">Verification Code</div>
            </div>
            <div class="expiry-info">
              ⏱️ This code will expire in <strong>10 minutes</strong>
              <br>
              <span style="font-size: 12px;">If you didn't request this, please ignore this email.</span>
            </div>
            <div class="security-note">
              <p>🔒 For security, never share this code with anyone.</p>
              <p>📧 If you have any questions, contact our support team.</p>
            </div>
          </div>
          <div class="footer">
            <p>© ${currentYear} ${appName}. All rights reserved.</p>
            <p style="margin-top: 4px;">
              <a href="${process.env.APP_URL || 'https://app.projectanalyser.com'}">${process.env.APP_URL || 'https://app.projectanalyser.com'}</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text fallback for email
   */
  private static generateOTPPlainText(otp: string): string {
    return `
VERIFY YOUR EMAIL

Hello!

Your verification code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Security: Never share this code with anyone.

---
Repository Intelligence Platform
${process.env.APP_URL || 'https://app.projectanalyser.com'}
    `.trim();
  }

  /**
   * Send OTP email using Resend API
   */
  private static async sendViaResend(email: string, otp: string): Promise<boolean> {
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        logger.debug('Resend API key not configured, skipping...');
        return false;
      }

      const appName = process.env.APP_NAME || 'Repository Intelligence Platform';
      const fromEmail = process.env.EMAIL_FROM || `Auth <noreply@${process.env.EMAIL_DOMAIN || 'projectanalyser.com'}>`;

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: `Verify Your Email - ${appName}`,
          html: this.generateOTPEmailHTML(otp, appName),
          text: this.generateOTPPlainText(otp),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        logger.error({
          status: response.status,
          statusText: response.statusText,
          error: errData
        }, "Resend email dispatch failed");
        return false;
      }

      const result = await response.json();
      logger.info({ email, id: result.id }, "✅ OTP email successfully delivered via Resend");
      return true;
    } catch (error) {
      logger.error({ error, email }, "Failed to send email via Resend");
      return false;
    }
  }

  /**
   * Send OTP email using SMTP
   */
  private static async sendViaSMTP(email: string, otp: string): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      if (!transporter) {
        return false;
      }

      const appName = process.env.APP_NAME || 'Repository Intelligence Platform';
      const fromEmail = process.env.EMAIL_FROM || `Auth <noreply@${process.env.EMAIL_DOMAIN || 'projectanalyser.com'}>`;

      const mailOptions = {
        from: fromEmail,
        to: email,
        subject: `Verify Your Email - ${appName}`,
        html: this.generateOTPEmailHTML(otp, appName),
        text: this.generateOTPPlainText(otp),
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info({ email, messageId: info.messageId }, "✅ OTP email successfully delivered via SMTP");
      return true;
    } catch (error) {
      logger.error({ error, email }, "Failed to send email via SMTP");
      return false;
    }
  }

  /**
   * Send OTP email using SendGrid API
   */
  private static async sendViaSendGrid(email: string, otp: string): Promise<boolean> {
    try {
      const sendgridApiKey = process.env.SENDGRID_API_KEY;
      if (!sendgridApiKey) {
        logger.debug('SendGrid API key not configured, skipping...');
        return false;
      }

      const appName = process.env.APP_NAME || 'Repository Intelligence Platform';
      const fromEmail = process.env.EMAIL_FROM || `noreply@${process.env.EMAIL_DOMAIN || 'projectanalyser.com'}`;

      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sendgridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: fromEmail, name: appName },
          subject: `Verify Your Email - ${appName}`,
          content: [
            { type: "text/html", value: this.generateOTPEmailHTML(otp, appName) },
            { type: "text/plain", value: this.generateOTPPlainText(otp) }
          ]
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        logger.error({
          status: response.status,
          statusText: response.statusText,
          error: errData
        }, "SendGrid email dispatch failed");
        return false;
      }

      logger.info({ email }, "✅ OTP email successfully delivered via SendGrid");
      return true;
    } catch (error) {
      logger.error({ error, email }, "Failed to send email via SendGrid");
      return false;
    }
  }

  /**
   * Send OTP email using Mailgun API
   */
  private static async sendViaMailgun(email: string, otp: string): Promise<boolean> {
    try {
      const mailgunApiKey = process.env.MAILGUN_API_KEY;
      const mailgunDomain = process.env.MAILGUN_DOMAIN;

      if (!mailgunApiKey || !mailgunDomain) {
        logger.debug('Mailgun configuration not found, skipping...');
        return false;
      }

      const appName = process.env.APP_NAME || 'Repository Intelligence Platform';
      const fromEmail = process.env.EMAIL_FROM || `noreply@${mailgunDomain}`;

      const formData = new URLSearchParams();
      formData.append('from', `${appName} <${fromEmail}>`);
      formData.append('to', email);
      formData.append('subject', `Verify Your Email - ${appName}`);
      formData.append('html', this.generateOTPEmailHTML(otp, appName));
      formData.append('text', this.generateOTPPlainText(otp));

      const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${Buffer.from(`api:${mailgunApiKey}`).toString('base64')}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        logger.error({
          status: response.status,
          statusText: response.statusText,
          error: errData
        }, "Mailgun email dispatch failed");
        return false;
      }

      const result = await response.json();
      logger.info({ email, id: result.id }, "✅ OTP email successfully delivered via Mailgun");
      return true;
    } catch (error) {
      logger.error({ error, email }, "Failed to send email via Mailgun");
      return false;
    }
  }

  /**
   * Log OTP to console (development fallback)
   */
  private static logOTPToConsole(email: string, otp: string): void {
    logger.info(`
┌─────────────────────────────────────────────┐
│  📧 EMAIL VERIFICATION                      │
├─────────────────────────────────────────────┤
│  To: ${email.padEnd(35)} │
│  OTP Code: ${otp.padEnd(30)} │
│  Expires: 10 minutes                       │
└─────────────────────────────────────────────┘
    `);
  }

  /**
   * Send OTP email using the best available provider
   * Priority: Resend > SendGrid > Mailgun > SMTP > Console (fallback)
   */
  static async sendOTPEmail(email: string, otp: string): Promise<boolean> {
    try {
      // Validate inputs
      if (!email || !otp) {
        logger.error({ email, otp }, 'Invalid email or OTP provided');
        return false;
      }

      // Always log for development/testing visibility
      this.logOTPToConsole(email, otp);

      // Try providers in order of preference
      const providers = [
        { name: 'Resend', fn: () => this.sendViaResend(email, otp) },
        { name: 'SendGrid', fn: () => this.sendViaSendGrid(email, otp) },
        { name: 'Mailgun', fn: () => this.sendViaMailgun(email, otp) },
        { name: 'SMTP', fn: () => this.sendViaSMTP(email, otp) },
      ];

      for (const provider of providers) {
        try {
          const success = await provider.fn();
          if (success) {
            logger.info({ email, provider: provider.name }, '✅ OTP email sent successfully');
            return true;
          }
        } catch (error) {
          logger.warn({ error, provider: provider.name }, `Failed to send via ${provider.name}, trying next...`);
        }
      }

      // If all providers fail, still consider it a success in development
      if (process.env.NODE_ENV !== 'production') {
        logger.warn({ email }, '⚠️ No email provider configured. OTP logged to console only.');
        return true;
      }

      // In production, log an error if all providers fail
      logger.error({ email }, '❌ All email providers failed to send OTP');
      return false;

    } catch (error) {
      logger.error({ error, email }, 'Unexpected error in sendOTPEmail');
      return false;
    }
  }

  /**
   * Send a test email to verify configuration
   */
  static async sendTestEmail(email: string): Promise<boolean> {
    try {
      const testOTP = '123456';
      return await this.sendOTPEmail(email, testOTP);
    } catch (error) {
      logger.error({ error, email }, 'Failed to send test email');
      return false;
    }
  }

  /**
   * Send bulk OTP emails (with rate limiting)
   */
  static async sendBulkOTPEmails(emails: Array<{ email: string; otp: string }>): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    const BATCH_SIZE = 10;
    const BATCH_DELAY_MS = 1000;

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async ({ email, otp }) => {
          const success = await this.sendOTPEmail(email, otp);
          results.set(email, success);
        })
      );

      // Delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < emails.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    return results;
  }
}