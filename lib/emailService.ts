import nodemailer from 'nodemailer';

// Email service configuration
class EmailService {
  private static transporter: nodemailer.Transporter;

  // Initialize the transporter (call this once)
  static async initialize() {
    if (this.transporter) return this.transporter;

    // Configure email transporter based on provider
    this.transporter = nodemailer.createTransport({
      // Using Gmail as an example - you can change this to your preferred provider
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // your-email@gmail.com
        pass: process.env.EMAIL_APP_PASSWORD, // App-specific password (not regular password)
      },
    });

    return this.transporter;
  }

  // Send password reset email
  static async sendPasswordReset(
    email: string,
    displayName: string,
    resetLink: string
  ): Promise<void> {
    try {
      await this.initialize();

      const mailOptions = {
        from: {
          name: 'Noorsaray Admin',
          address: process.env.EMAIL_USER || 'noreply@noorsaray.com',
        },
        to: email,
        subject: 'Reset Your Noorsaray Admin Password',
        html: this.generatePasswordResetHTML(displayName, resetLink, email),
        text: this.generatePasswordResetText(displayName, resetLink),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent:', result.messageId);
      
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  // Generate beautiful HTML email template
  private static generatePasswordResetHTML(
    displayName: string,
    resetLink: string,
    email: string
  ): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container {
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #1f2937, #374151);
                color: white;
                padding: 30px 20px;
                text-align: center;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .subtitle {
                font-size: 16px;
                opacity: 0.9;
            }
            .content {
                padding: 40px 30px;
            }
            .greeting {
                font-size: 18px;
                margin-bottom: 20px;
                color: #1f2937;
            }
            .message {
                font-size: 16px;
                line-height: 1.6;
                margin-bottom: 30px;
                color: #4b5563;
            }
            .reset-button {
                display: inline-block;
                background: #1f2937;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                transition: background 0.3s ease;
            }
            .reset-button:hover {
                background: #374151;
            }
            .alternative-link {
                background: #f3f4f6;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                font-size: 14px;
                word-break: break-all;
                color: #6b7280;
            }
            .security-notice {
                background: #fef3cd;
                border-left: 4px solid #f59e0b;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .security-notice strong {
                color: #92400e;
            }
            .footer {
                background: #f8f9fa;
                padding: 20px 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
                font-size: 14px;
                color: #6b7280;
            }
            .expiry {
                color: #dc2626;
                font-weight: 600;
            }
            @media (max-width: 600px) {
                body { padding: 10px; }
                .content { padding: 30px 20px; }
                .header { padding: 20px 15px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏢 Noorsaray</div>
                <div class="subtitle">Admin Panel</div>
            </div>
            
            <div class="content">
                <div class="greeting">Hello ${displayName},</div>
                
                <div class="message">
                    Someone (hopefully you) requested to reset the password for your Noorsaray Admin account 
                    <strong>${email}</strong>.
                </div>

                <div class="message">
                    If this was you, click the button below to reset your password:
                </div>

                <div style="text-align: center;">
                    <a href="${resetLink}" class="reset-button">
                        🔐 Reset My Password
                    </a>
                </div>

                <div class="security-notice">
                    <strong>⚠️ Security Notice:</strong> This link will expire in <span class="expiry">1 hour</span> for your security. 
                    If you didn't request this reset, please ignore this email and consider changing your password.
                </div>

                <div class="message">
                    If the button doesn't work, copy and paste this link into your browser:
                </div>
                
                <div class="alternative-link">
                    ${resetLink}
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Noorsaray Admin Team</strong></p>
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>© ${new Date().getFullYear()} Noorsaray. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Generate plain text version (fallback)
  private static generatePasswordResetText(
    displayName: string,
    resetLink: string
  ): string {
    return `
Hello ${displayName},

Someone requested to reset the password for your Noorsaray Admin account.

If this was you, click the link below to reset your password:
${resetLink}

This link will expire in 1 hour for security reasons.

If you didn't request this reset, please ignore this email.

---
Noorsaray Admin Team

This is an automated message. Please do not reply to this email.
    `.trim();
  }

  // Test email configuration
  static async testConnection(): Promise<boolean> {
    try {
      await this.initialize();
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

export default EmailService;