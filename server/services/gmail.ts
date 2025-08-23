// @ts-ignore - googleapis has built-in types but may not resolve correctly
import { google } from 'googleapis';
import { processReceiptOCR } from './openai.js';

export interface GmailReceiptResult {
  receiptsFound: number;
  receiptsProcessed: number;
}

export class GmailService {
  private gmail: any;

  constructor() {
    // Initialize Gmail API client
    const auth = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/gmail/callback`
    );

    this.gmail = google.gmail({ version: 'v1', auth });
  }

  async authenticateUser(accessToken: string, refreshToken: string) {
    const auth = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET
    );

    auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    this.gmail = google.gmail({ version: 'v1', auth });
  }

  async searchReceiptEmails(userId: string, maxResults: number = 10): Promise<GmailReceiptResult> {
    try {
      // Search for emails that likely contain receipts
      const searchQueries = [
        'receipt OR invoice OR "order confirmation" OR "purchase confirmation"',
        'from:(amazon.com OR walmart.com OR target.com OR starbucks.com OR uber.com OR doordash.com)',
        'subject:(receipt OR invoice OR "your order" OR "order #" OR "confirmation")',
        'has:attachment (receipt OR invoice OR pdf)'
      ];

      let receiptsFound = 0;
      let receiptsProcessed = 0;

      for (const query of searchQueries) {
        try {
          const response = await this.gmail.users.messages.list({
            userId: 'me',
            q: query,
            maxResults: Math.floor(maxResults / searchQueries.length),
          });

          if (!response.data.messages) continue;

          receiptsFound += response.data.messages.length;

          // Process each message
          for (const message of response.data.messages) {
            try {
              await this.processReceiptEmail(message.id, userId);
              receiptsProcessed++;
            } catch (error) {
              console.error(`Failed to process message ${message.id}:`, error);
            }
          }
        } catch (error) {
          console.error(`Failed to search with query "${query}":`, error);
        }
      }

      return { receiptsFound, receiptsProcessed };
    } catch (error) {
      console.error('Gmail search failed:', error);
      throw new Error('Failed to search Gmail for receipts');
    }
  }

  private async processReceiptEmail(messageId: string, userId: string) {
    try {
      // Get the full message
      const message = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
      });

      const messageData = message.data;
      const headers = messageData.payload.headers;
      
      // Extract email metadata
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
      const from = headers.find((h: any) => h.name === 'From')?.value || '';
      const date = headers.find((h: any) => h.name === 'Date')?.value || '';

      // Look for attachments or embedded images
      let imageFound = false;
      
      if (messageData.payload.parts) {
        for (const part of messageData.payload.parts) {
          if (part.filename && (
            part.filename.toLowerCase().includes('receipt') ||
            part.filename.toLowerCase().includes('invoice') ||
            part.mimeType?.startsWith('image/') ||
            part.mimeType === 'application/pdf'
          )) {
            if (part.body?.attachmentId) {
              const attachment = await this.gmail.users.messages.attachments.get({
                userId: 'me',
                messageId: messageId,
                id: part.body.attachmentId,
              });
              
              if (attachment.data?.data) {
                // Process the attachment
                await this.processAttachment(attachment.data.data, userId, from, subject);
                imageFound = true;
                break;
              }
            }
          }
        }
      }

      // If no attachment found, try to extract receipt data from email body
      if (!imageFound) {
        await this.processEmailBody(messageData, userId, from, subject);
      }

    } catch (error) {
      console.error('Failed to process email message:', error);
      throw error;
    }
  }

  private async processAttachment(attachmentData: string, userId: string, vendor: string, subject: string) {
    try {
      // The attachment data is base64 encoded
      const base64Data = attachmentData.replace(/-/g, '+').replace(/_/g, '/');
      
      // If it's an image, process with OCR
      if (base64Data) {
        const receiptData = await processReceiptOCR(base64Data);
        
        // Save to database through storage interface
        const { storage } = await import('../storage.js');
        
        // Create receipt record
        const receipt = await storage.createReceipt({
          userId,
          originalUrl: `gmail:${vendor}`,
          processingStatus: "completed",
        });

        // Find appropriate category
        const categories = await storage.getCategories();
        let categoryId = categories.find(c => 
          c.name === "Food & Dining" || c.name === "Shopping" || c.name === "Groceries"
        )?.id;

        // Create expense from OCR data
        await storage.createExpense({
          userId,
          receiptId: receipt.id,
          categoryId,
          description: receiptData.description || `${vendor} - ${subject}`,
          amount: receiptData.amount?.toString() || "0",
          date: receiptData.date || new Date().toISOString().split('T')[0],
          vendor: receiptData.vendor || vendor,
          isManual: 0, // Imported from Gmail
        });
      }
    } catch (error) {
      console.error('Failed to process attachment:', error);
    }
  }

  private async processEmailBody(messageData: any, userId: string, vendor: string, subject: string) {
    try {
      let emailBody = '';
      
      // Extract email body text
      if (messageData.payload.body?.data) {
        emailBody = Buffer.from(messageData.payload.body.data, 'base64').toString();
      } else if (messageData.payload.parts) {
        for (const part of messageData.payload.parts) {
          if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
            if (part.body?.data) {
              emailBody += Buffer.from(part.body.data, 'base64').toString();
            }
          }
        }
      }

      // Look for receipt-like patterns in the email body
      if (this.containsReceiptData(emailBody)) {
        await this.extractReceiptFromText(emailBody, userId, vendor, subject);
      }
    } catch (error) {
      console.error('Failed to process email body:', error);
    }
  }

  private containsReceiptData(text: string): boolean {
    const receiptIndicators = [
      /total[:\s]*\$[\d,.]+/i,
      /amount[:\s]*\$[\d,.]+/i,
      /order\s*#?\s*\d+/i,
      /receipt\s*#?\s*\d+/i,
      /transaction\s*id/i,
      /\$[\d,.]+/g, // Dollar amounts
    ];

    return receiptIndicators.some(pattern => pattern.test(text));
  }

  private async extractReceiptFromText(emailText: string, userId: string, vendor: string, subject: string) {
    try {
      // Use AI to extract receipt data from email text
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `Extract receipt/purchase information from this email:

Subject: ${subject}
From: ${vendor}
Content: ${emailText}

Extract and return ONLY a JSON object with:
{
  "vendor": "company name",
  "amount": "total amount as number",
  "date": "purchase date in YYYY-MM-DD format",
  "description": "brief description",
  "items": ["list", "of", "items"]
}

If this doesn't look like a receipt/purchase email, return: {"isReceipt": false}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "user", 
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      if (result.isReceipt === false) {
        return;
      }

      // Save to database through storage interface
      const { storage } = await import('../storage.js');
      
      // Create receipt record
      const receipt = await storage.createReceipt({
        userId,
        originalUrl: `gmail:${vendor}`,
        processingStatus: "completed",
      });

      // Find appropriate category
      const categories = await storage.getCategories();
      let categoryId = categories.find(c => 
        c.name === "Food & Dining" || c.name === "Shopping" || c.name === "Groceries"
      )?.id;

      // Create expense from email data
      await storage.createExpense({
        userId,
        receiptId: receipt.id,
        categoryId,
        description: result.description || subject,
        amount: result.amount?.toString() || "0",
        date: result.date || new Date().toISOString().split('T')[0],
        vendor: result.vendor || vendor,
        isManual: 0, // Imported from Gmail
      });
      
    } catch (error) {
      console.error('Failed to extract receipt from text:', error);
    }
  }

  async getAuthUrl(): Promise<string> {
    const redirectUri = process.env.GMAIL_REDIRECT_URI || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/gmail/callback`;
    
    const auth = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      redirectUri
    );

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
    ];

    const url = auth.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });

    return url;
  }

  async handleCallback(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    const redirectUri = process.env.GMAIL_REDIRECT_URI || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/gmail/callback`;
    
    const auth = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await auth.getToken(code);
    
    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token || '',
    };
  }
}

export const gmailService = new GmailService();