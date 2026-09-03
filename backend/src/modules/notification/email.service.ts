import nodemailer from 'nodemailer';
import { logger } from '../../core/logger/index.js';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
    replyTo?: string;
}

// Ambient module declarations for optional email packages
// @ts-ignore
declare module '@sendgrid/mail';
// @ts-ignore
declare module 'resend';

interface AdminContactData {
    name: string;
    email: string;
    requestType: string;
    company?: string;
    message?: string;
    requestId: string;
}

interface UserConfirmationData {
    name: string;
    email: string;
    requestType: string;
}

export class EmailService {
    private static instance: EmailService;
    private transporter: any = null;
    private initialized: boolean = false;

    private constructor() { }

    static getInstance(): EmailService {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }

    /**
     * Initialize email transporter based on environment
     */
    private async initializeTransporter(): Promise<void> {
        if (this.initialized) return;

        try {
            // Check for SendGrid API Key
            const sendgridApiKey = process.env.SENDGRID_API_KEY;
            if (sendgridApiKey) {
                const sgMail = await import('@sendgrid/mail');
                sgMail.default.setApiKey(sendgridApiKey);
                this.transporter = sgMail.default;
                logger.info('📧 SendGrid email service initialized');
                this.initialized = true;
                return;
            }

            // Check for SMTP configuration
            const smtpHost = process.env.SMTP_HOST;
            const smtpPort = parseInt(process.env.SMTP_PORT || '587');
            const smtpUser = process.env.SMTP_USER;
            const smtpPass = process.env.SMTP_PASS;

            if (smtpHost && smtpUser && smtpPass) {
                const isSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
                this.transporter = nodemailer.createTransport({
                    host: smtpHost,
                    port: smtpPort,
                    secure: isSecure,
                    auth: {
                        user: smtpUser,
                        pass: smtpPass,
                    },
                    connectionTimeout: 10000,
                    greetingTimeout: 10000,
                    socketTimeout: 15000,
                    tls: {
                        rejectUnauthorized: false,
                    },
                });
                console.log(`📧 [EmailService] SMTP Transporter configured (${smtpHost}:${smtpPort}, secure=${isSecure}, user=${smtpUser})`);
                logger.info('📧 SMTP email service initialized');
                this.initialized = true;
                return;
            }

            // Check for Resend API Key
            const resendApiKey = process.env.RESEND_API_KEY;
            if (resendApiKey) {
                this.transporter = { type: 'resend', apiKey: resendApiKey };
                logger.info('📧 Resend email service initialized');
                this.initialized = true;
                return;
            }

            logger.warn('⚠️ No email provider configured. Emails will be logged only.');
            this.initialized = true;
        } catch (error) {
            logger.error(error as any, 'Failed to initialize email transporter:');
            this.initialized = true;
        }
    }

    /**
     * Send an email using the configured provider
     */
    async sendEmail(options: EmailOptions): Promise<void> {
        await this.initializeTransporter();

        const fromEmail = options.from || process.env.FROM_EMAIL || process.env.EMAIL_FROM || process.env.SMTP_USER || 'onboarding@resend.dev';
        const appName = process.env.APP_NAME || 'Helix';
        const formattedFrom = fromEmail.includes('<') ? fromEmail : `${appName} <${fromEmail}>`;

        console.log(`🚀 [EmailService.sendEmail] Attempting to send email to "${options.to}" (From: "${formattedFrom}", Subject: "${options.subject}")`);
        logger.info({ to: options.to, from: formattedFrom, subject: options.subject }, '🚀 [EmailService.sendEmail] Sending email...');

        try {
            // Development mode - just log
            if (process.env.NODE_ENV === 'development' && !process.env.SENDGRID_API_KEY && !process.env.SMTP_HOST && !process.env.RESEND_API_KEY) {
                console.log(`📧 [DEV MODE] Email target: ${options.to}`);
                logger.info('📧 [DEV MODE] Email would be sent:');
                logger.info(`  To: ${options.to}`);
                logger.info(`  From: ${formattedFrom}`);
                logger.info(`  Subject: ${options.subject}`);
                logger.info(`  Body: ${options.text || options.html}`);
                return;
            }

            // Resend (REST API via fetch - robust on Render)
            if (this.transporter?.type === 'resend' || process.env.RESEND_API_KEY) {
                const apiKey = this.transporter?.apiKey || process.env.RESEND_API_KEY;
                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: formattedFrom,
                        to: [options.to],
                        subject: options.subject,
                        html: options.html,
                        text: options.text,
                        reply_to: options.replyTo,
                    }),
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(`Resend API error (${response.status}): ${JSON.stringify(errData)}`);
                }

                const result = await response.json().catch(() => ({ id: 'ok' }));
                console.log(`✅ [EmailService] Email successfully sent to "${options.to}" via Resend (ID: ${result.id || 'ok'})`);
                logger.info({ email: options.to, id: result.id }, '✅ Email sent via Resend');
                return;
            }

            // SendGrid
            if (this.transporter && this.transporter.send) {
                await this.transporter.send({
                    to: options.to,
                    from: formattedFrom,
                    subject: options.subject,
                    html: options.html,
                    text: options.text,
                    replyTo: options.replyTo,
                });
                console.log(`✅ [EmailService] Email successfully sent to "${options.to}" via SendGrid`);
                logger.info(`✅ Email sent to ${options.to} via SendGrid`);
                return;
            }

            // Nodemailer (SMTP)
            if (this.transporter && this.transporter.sendMail) {
                const info = await this.transporter.sendMail({
                    to: options.to,
                    from: formattedFrom,
                    subject: options.subject,
                    html: options.html,
                    text: options.text,
                    replyTo: options.replyTo,
                });
                console.log(`✅ [EmailService] Email successfully sent to "${options.to}" via SMTP (MessageId: ${info?.messageId || 'ok'})`);
                logger.info(`✅ Email sent to ${options.to} via SMTP`);
                return;
            }

            // Fallback: log the email
            console.warn(`⚠️ [EmailService] No active email provider found. Logging email for "${options.to}"`);
            logger.warn('⚠️ No email provider available. Logging email:');
            logger.info(`  To: ${options.to}`);
            logger.info(`  Subject: ${options.subject}`);
            logger.info(`  Body: ${options.text || options.html}`);

        } catch (error: any) {
            console.error(`❌ [EmailService] Failed to send email to "${options.to}":`, error?.message || error);
            logger.error(error as any, `Failed to send email to ${options.to}:`);
            throw error;
        }
    }

    /**
     * Send admin notification for new contact request
     */
    async sendAdminContactNotification(data: AdminContactData): Promise<void> {
        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'admin@projectanalyser.com';
        const appUrl = process.env.APP_URL || 'http://localhost:3000';

        const requestTypeLabels: Record<string, string> = {
            MORE_SCANS: 'Request More Scans',
            SUBSCRIPTION: 'Subscription Inquiry',
            PROFESSIONAL: 'Professional Access',
            ENTERPRISE: 'Enterprise Access',
            TEAM: 'Team Plan',
            GENERAL: 'General Inquiry',
        };

        const requestTypeLabel = requestTypeLabels[data.requestType] || data.requestType;

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { color: #09090b; margin: 0; font-size: 24px; }
          .header p { color: #71717a; margin: 5px 0 0 0; }
          .badge { display: inline-block; padding: 4px 12px; background: #10b981; color: white; border-radius: 20px; font-size: 12px; font-weight: 600; }
          .details { margin: 20px 0; }
          .detail-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f4f4f5; }
          .detail-label { font-weight: 600; color: #18181b; width: 120px; }
          .detail-value { color: #3f3f46; }
          .message-box { background: #f4f4f5; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .actions { margin-top: 20px; }
          .btn { display: inline-block; padding: 10px 20px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #f4f4f5; color: #71717a; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 New Helix Access Request</h1>
            <p>A user has submitted a request for additional access</p>
          </div>

          <div>
            <span class="badge">${requestTypeLabel}</span>
            <span style="margin-left: 10px; color: #71717a; font-size: 14px;">Request ID: ${data.requestId}</span>
          </div>

          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Name</span>
              <span class="detail-value">${data.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email</span>
              <span class="detail-value">${data.email}</span>
            </div>
            ${data.company ? `
            <div class="detail-row">
              <span class="detail-label">Company</span>
              <span class="detail-value">${data.company}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">Request Type</span>
              <span class="detail-value">${requestTypeLabel}</span>
            </div>
          </div>

          ${data.message ? `
          <div class="message-box">
            <strong>Message:</strong>
            <p style="margin: 8px 0 0 0; color: #3f3f46;">${data.message}</p>
          </div>
          ` : ''}

          <div class="actions">
            <a href="${appUrl}/admin/contact-requests" class="btn">View in Admin Dashboard</a>
          </div>

          <div class="footer">
            <p>This notification was sent from your Helix application.</p>
          </div>
        </div>
      </body>
      </html>
    `;

        const text = `
      🔔 New Helix Access Request

      Request ID: ${data.requestId}

      Name: ${data.name}
      Email: ${data.email}
      Request Type: ${requestTypeLabel}
      ${data.company ? `Company: ${data.company}` : ''}
      ${data.message ? `\nMessage: ${data.message}` : ''}

      View in Admin: ${appUrl}/admin/contact-requests

      ---
      This notification was sent from your Helix application.
    `;

        await this.sendEmail({
            to: adminEmail,
            subject: `🔔 New Helix Access Request from ${data.name}`,
            html,
            text,
        });
    }

    /**
     * Send confirmation email to user
     */
    async sendUserConfirmation(data: UserConfirmationData): Promise<void> {
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const supportEmail = process.env.SUPPORT_EMAIL || 'support@projectanalyser.com';

        const requestTypeLabels: Record<string, string> = {
            MORE_SCANS: 'More Repository Scans',
            SUBSCRIPTION: 'Subscription Inquiry',
            PROFESSIONAL: 'Professional Access',
            ENTERPRISE: 'Enterprise Access',
            TEAM: 'Team Plan',
            GENERAL: 'General Inquiry',
        };

        const requestTypeLabel = requestTypeLabels[data.requestType] || data.requestType;

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { color: #09090b; margin: 0; font-size: 24px; }
          .header p { color: #71717a; margin: 5px 0 0 0; }
          .checkmark { font-size: 48px; text-align: center; margin: 20px 0; }
          .content { color: #3f3f46; line-height: 1.6; }
          .content p { margin: 12px 0; }
          .info-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 15px; margin: 20px 0; }
          .btn { display: inline-block; padding: 10px 20px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #f4f4f5; color: #71717a; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📬 We've Received Your Request</h1>
            <p>Thank you for reaching out to Helix</p>
          </div>

          <div class="checkmark">✅</div>

          <div class="content">
            <p>Hi <strong>${data.name}</strong>,</p>
            
            <p>We've received your request for <strong>${requestTypeLabel}</strong>. Our team will review it and get back to you within <strong>24-48 hours</strong>.</p>

            <div class="info-box">
              <strong>📋 Request Summary</strong>
              <p style="margin: 8px 0 0 0; font-size: 14px;">
                <strong>Request Type:</strong> ${requestTypeLabel}<br/>
                <strong>Submitted:</strong> ${new Date().toLocaleString()}
              </p>
            </div>

            <p>In the meantime, you can continue using your current plan. If you have any questions, feel free to reply to this email or contact us at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>

            <p style="margin-top: 24px;">
              <a href="${appUrl}" class="btn">Return to Helix</a>
            </p>
          </div>

          <div class="footer">
            <p>Helix Repository Intelligence Platform</p>
            <p style="margin-top: 4px;">
              <a href="${appUrl}">${appUrl}</a>
            </p>
            <p style="margin-top: 4px; font-size: 11px;">
              This email was sent because you submitted a contact request on our platform.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

        const text = `
      📬 We've Received Your Request

      Hi ${data.name},

      We've received your request for ${requestTypeLabel}. Our team will review it and get back to you within 24-48 hours.

      Request Summary:
      - Request Type: ${requestTypeLabel}
      - Submitted: ${new Date().toLocaleString()}

      In the meantime, you can continue using your current plan. If you have any questions, reply to this email.

      Return to Helix: ${appUrl}

      ---
      Helix Repository Intelligence Platform
      ${appUrl}
    `;

        await this.sendEmail({
            to: data.email,
            subject: `📬 We've received your Helix access request`,
            html,
            text,
        });
    }

    /**
     * Send a test email to verify configuration
     */
    async sendTestEmail(to: string): Promise<void> {
        const html = `
      <h2>✅ Email Configuration Test</h2>
      <p>This is a test email to verify your email configuration is working correctly.</p>
      <p>Time: ${new Date().toISOString()}</p>
      <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
    `;

        await this.sendEmail({
            to,
            subject: 'Helix Email Test',
            html,
            text: '✅ Email Configuration Test\n\nThis is a test email.',
        });
    }
}

// Export singleton instance
export const emailService = EmailService.getInstance();