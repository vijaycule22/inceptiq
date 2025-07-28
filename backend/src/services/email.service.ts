import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { emailConfig } from '../config/email.config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      // Always use real SMTP - no more Ethereal Email
      if (emailConfig.user && emailConfig.password) {
        this.transporter = nodemailer.createTransport({
          service: emailConfig.service,
          auth: {
            user: emailConfig.user,
            pass: emailConfig.password,
          },
        });

        // Verify connection
        await this.transporter.verify();
        this.logger.log(
          `✅ Email service initialized with ${emailConfig.service}`,
        );
        this.logger.log(`📧 Using email: ${emailConfig.user}`);
      } else {
        this.logger.error('❌ Email credentials not configured!');
        this.logger.error(
          'Please set EMAIL_USER and EMAIL_PASSWORD environment variables',
        );
        this.transporter = null;
      }
    } catch (error) {
      this.logger.error('Failed to initialize email transporter:', error);
      this.transporter = null;
    }
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    firstName: string,
  ): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.logger.error(
          'Email transporter not initialized. Check your email configuration.',
        );
        return false;
      }

      const resetUrl = `${emailConfig.frontendUrl}/reset-password?token=${token}`;

      const mailOptions = {
        from: emailConfig.from,
        to: email,
        subject: 'Password Reset Request - InceptIQ',
        html: this.getPasswordResetEmailTemplate(firstName, resetUrl),
        text: this.getPasswordResetEmailText(firstName, resetUrl),
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`📧 Password reset email sent to: ${email}`);
      this.logger.log(`📧 Message ID: ${info.messageId}`);

      return true;
    } catch (error) {
      this.logger.error('Failed to send password reset email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.logger.error(
          'Email transporter not initialized. Check your email configuration.',
        );
        return false;
      }

      const mailOptions = {
        from: emailConfig.from,
        to: email,
        subject: 'Welcome to InceptIQ!',
        html: this.getWelcomeEmailTemplate(firstName),
        text: this.getWelcomeEmailText(firstName),
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`📧 Welcome email sent to: ${email}`);
      this.logger.log(`📧 Message ID: ${info.messageId}`);

      return true;
    } catch (error) {
      this.logger.error('Failed to send welcome email:', error);
      return false;
    }
  }

  private getPasswordResetEmailTemplate(
    firstName: string,
    resetUrl: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - InceptIQ</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #1B8FF0 0%, #0EA5E9 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
          .content { padding: 40px 30px; }
          .content h2 { color: #1B8FF0; margin-bottom: 20px; font-size: 24px; }
          .content p { margin-bottom: 20px; font-size: 16px; color: #555; }
          .button { display: inline-block; background: linear-gradient(135deg, #1B8FF0 0%, #0EA5E9 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; transition: transform 0.2s; }
          .button:hover { transform: translateY(-2px); }
          .warning { background: #FEF3C7; border: 1px solid #F59E0B; padding: 20px; border-radius: 8px; margin: 25px 0; }
          .warning strong { color: #D97706; }
          .warning ul { margin: 10px 0; padding-left: 20px; }
          .warning li { margin-bottom: 5px; color: #92400E; }
          .footer { background: #F8FAFC; padding: 30px; text-align: center; color: #64748B; font-size: 14px; }
          .link { word-break: break-all; color: #1B8FF0; text-decoration: none; }
          .link:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>InceptIQ</h1>
            <p>Your AI-Powered Learning Companion</p>
          </div>
          <div class="content">
            <h2>Hello ${firstName},</h2>
            <p>We received a request to reset your password for your InceptIQ account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <div class="warning">
              <strong>Important Security Information:</strong>
              <ul>
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this password reset, please ignore this email</li>
                <li>For security, this link can only be used once</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}" class="link">${resetUrl}</a></p>
            <p>Best regards,<br><strong>The InceptIQ Team</strong></p>
          </div>
          <div class="footer">
            <p>This email was sent because a password reset was requested for your InceptIQ account.</p>
            <p>&copy; 2024 InceptIQ. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetEmailText(
    firstName: string,
    resetUrl: string,
  ): string {
    return `
Hello ${firstName},

We received a request to reset your password for your InceptIQ account.

Click the link below to reset your password:
${resetUrl}

IMPORTANT SECURITY INFORMATION:
- This link will expire in 1 hour
- If you didn't request this password reset, please ignore this email
- For security, this link can only be used once
- Never share this link with anyone

If the link doesn't work, copy and paste it into your browser.

Best regards,
The InceptIQ Team

---
This email was sent because a password reset was requested for your InceptIQ account.
© 2024 InceptIQ. All rights reserved.
    `;
  }

  private getWelcomeEmailTemplate(firstName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to InceptIQ!</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #1B8FF0 0%, #0EA5E9 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
          .content { padding: 40px 30px; }
          .content h2 { color: #1B8FF0; margin-bottom: 20px; font-size: 24px; }
          .content p { margin-bottom: 20px; font-size: 16px; color: #555; }
          .features { margin: 30px 0; }
          .feature { display: flex; align-items: center; margin-bottom: 15px; }
          .feature-icon { width: 40px; height: 40px; background: #1B8FF0; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; color: white; font-weight: bold; }
          .button { display: inline-block; background: linear-gradient(135deg, #1B8FF0 0%, #0EA5E9 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; transition: transform 0.2s; }
          .button:hover { transform: translateY(-2px); }
          .footer { background: #F8FAFC; padding: 30px; text-align: center; color: #64748B; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>InceptIQ</h1>
            <p>Your AI-Powered Learning Companion</p>
          </div>
          <div class="content">
            <h2>Welcome to InceptIQ, ${firstName}!</h2>
            <p>Thank you for joining InceptIQ! We're excited to help you transform your learning experience with AI-powered tools.</p>
            
            <div class="features">
              <div class="feature">
                <div class="feature-icon">📄</div>
                <div>
                  <strong>Smart Summaries</strong><br>
                  Upload documents and get AI-generated summaries with key insights
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">🧠</div>
                <div>
                  <strong>Interactive Flashcards</strong><br>
                  Test your knowledge with AI-generated flashcards
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">❓</div>
                <div>
                  <strong>Smart Quizzes</strong><br>
                  Challenge yourself with personalized quizzes
                </div>
              </div>
            </div>

            <p>Ready to get started? Upload your first document and experience the power of AI-enhanced learning!</p>
            
            <div style="text-align: center;">
              <a href="${emailConfig.frontendUrl}" class="button">Start Learning Now</a>
            </div>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Best regards,<br><strong>The InceptIQ Team</strong></p>
          </div>
          <div class="footer">
            <p>Welcome to the future of learning!</p>
            <p>&copy; 2024 InceptIQ. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getWelcomeEmailText(firstName: string): string {
    return `
Welcome to InceptIQ, ${firstName}!

Thank you for joining InceptIQ! We're excited to help you transform your learning experience with AI-powered tools.

What you can do with InceptIQ:
📄 Smart Summaries - Upload documents and get AI-generated summaries with key insights
🧠 Interactive Flashcards - Test your knowledge with AI-generated flashcards
❓ Smart Quizzes - Challenge yourself with personalized quizzes

Ready to get started? Upload your first document and experience the power of AI-enhanced learning!

Visit: ${emailConfig.frontendUrl}

If you have any questions, feel free to reach out to our support team.

Best regards,
The InceptIQ Team

---
Welcome to the future of learning!
© 2024 InceptIQ. All rights reserved.
    `;
  }
}
