import nodemailer from 'nodemailer';

interface BudgetAlert {
  userEmail: string;
  userName: string;
  budgetName: string;
  spent: number;
  budgetAmount: number;
  percentage: number;
  category: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure your email service here
    // For development, you might use a service like Ethereal or Gmail
    this.transporter = nodemailer.createTransport({
      // Use environment variables for email configuration
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || 'your-app-password',
      },
    });
  }

  async sendBudgetAlert(alert: BudgetAlert): Promise<void> {
    try {
      const isOverBudget = alert.percentage > 100;
      const subject = isOverBudget 
        ? `🚨 Budget Alert: ${alert.budgetName} is Over Budget!`
        : `⚠️ Budget Alert: ${alert.budgetName} at ${alert.percentage.toFixed(1)}%`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Budget Alert</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
              color: white;
              padding: 30px 20px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #ffffff;
              padding: 30px 20px;
              border: 1px solid #e0e0e0;
              border-top: none;
            }
            .alert-box {
              background: ${isOverBudget ? '#ffebee' : '#fff3e0'};
              border: 2px solid ${isOverBudget ? '#f44336' : '#ff9800'};
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .stats {
              display: flex;
              justify-content: space-between;
              background: #f5f5f5;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .stat {
              text-align: center;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #1976D2;
            }
            .stat-label {
              font-size: 14px;
              color: #666;
            }
            .progress-bar {
              background: #e0e0e0;
              border-radius: 10px;
              height: 20px;
              margin: 15px 0;
              overflow: hidden;
            }
            .progress-fill {
              height: 100%;
              background: ${isOverBudget ? '#f44336' : alert.percentage > 80 ? '#ff9800' : '#4caf50'};
              width: ${Math.min(alert.percentage, 100)}%;
              border-radius: 10px;
              transition: width 0.3s ease;
            }
            .footer {
              background: #f5f5f5;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 10px 10px;
              font-size: 14px;
              color: #666;
            }
            .cta-button {
              display: inline-block;
              background: #1976D2;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 25px;
              font-weight: bold;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>💰 ExpenseTracker Pro</h1>
            <p>Budget Alert Notification</p>
          </div>
          
          <div class="content">
            <h2>Hello ${alert.userName}!</h2>
            
            <div class="alert-box">
              <h3>${isOverBudget ? '🚨 Budget Exceeded!' : '⚠️ Budget Warning!'}</h3>
              <p>Your <strong>${alert.budgetName}</strong> budget has reached <strong>${alert.percentage.toFixed(1)}%</strong> of your limit.</p>
            </div>
            
            <div class="stats">
              <div class="stat">
                <div class="stat-value">$${alert.spent.toFixed(2)}</div>
                <div class="stat-label">Spent</div>
              </div>
              <div class="stat">
                <div class="stat-value">$${alert.budgetAmount.toFixed(2)}</div>
                <div class="stat-label">Budget</div>
              </div>
              <div class="stat">
                <div class="stat-value">${alert.percentage.toFixed(1)}%</div>
                <div class="stat-label">Used</div>
              </div>
            </div>
            
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
            
            ${isOverBudget 
              ? `<p><strong>You've exceeded your budget by $${(alert.spent - alert.budgetAmount).toFixed(2)}!</strong> Consider reviewing your ${alert.category} expenses.</p>`
              : `<p>You have $${(alert.budgetAmount - alert.spent).toFixed(2)} remaining in your ${alert.category} budget.</p>`
            }
            
            <div style="text-align: center;">
              <a href="#" class="cta-button">View Dashboard</a>
            </div>
            
            <h3>💡 Quick Tips:</h3>
            <ul>
              <li>Review your recent ${alert.category} expenses</li>
              <li>Consider adjusting your budget if needed</li>
              <li>Look for opportunities to save in this category</li>
              <li>Set up spending alerts for better control</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>This is an automated message from ExpenseTracker Pro</p>
            <p>You can manage your notification preferences in your account settings</p>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"ExpenseTracker Pro" <noreply@expensetracker.com>',
        to: alert.userEmail,
        subject,
        html,
      });

      console.log(`Budget alert sent to ${alert.userEmail} for ${alert.budgetName}`);
    } catch (error) {
      console.error('Failed to send budget alert email:', error);
      throw new Error('Failed to send budget alert email');
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1976D2; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #ddd; }
            .footer { background: #f5f5f5; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to ExpenseTracker Pro!</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Welcome to ExpenseTracker Pro - your personal finance management solution!</p>
            <p>You can now:</p>
            <ul>
              <li>📄 Upload and scan receipts with AI-powered OCR</li>
              <li>📊 Track expenses automatically</li>
              <li>🎯 Set and monitor budget goals</li>
              <li>🤖 Chat with your AI financial assistant</li>
              <li>📈 View detailed spending analytics</li>
            </ul>
            <p>Get started by uploading your first receipt or setting up your budget goals!</p>
          </div>
          <div class="footer">
            <p>Happy tracking! - The ExpenseTracker Pro Team</p>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"ExpenseTracker Pro" <noreply@expensetracker.com>',
        to: userEmail,
        subject: 'Welcome to ExpenseTracker Pro!',
        html,
      });

      console.log(`Welcome email sent to ${userEmail}`);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }
  }
}

export const emailService = new EmailService();
