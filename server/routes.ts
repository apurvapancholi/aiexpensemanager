import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { processReceiptOCR, categorizeExpense, generateExpenseInsights, EXPENSE_CATEGORIES } from "./services/openai";
import { emailService } from "./services/emailService";
import multer from "multer";
import sharp from "sharp";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize default categories
  const initializeCategories = async () => {
    try {
      const existingCategories = await storage.getCategories();
      if (existingCategories.length === 0) {
        const defaultCategories = [
          { name: "Food & Dining", icon: "fas fa-utensils", color: "#FF6B6B" },
          { name: "Transportation", icon: "fas fa-car", color: "#4ECDC4" },
          { name: "Entertainment", icon: "fas fa-film", color: "#45B7D1" },
          { name: "Shopping", icon: "fas fa-shopping-bag", color: "#96CEB4" },
          { name: "Utilities", icon: "fas fa-bolt", color: "#FFEAA7" },
          { name: "Healthcare", icon: "fas fa-heartbeat", color: "#DDA0DD" },
          { name: "Travel", icon: "fas fa-plane", color: "#98D8C8" },
          { name: "Education", icon: "fas fa-graduation-cap", color: "#F7DC6F" },
          { name: "Groceries", icon: "fas fa-shopping-cart", color: "#BB8FCE" },
          { name: "Bills & Services", icon: "fas fa-file-invoice", color: "#85C1E9" },
          { name: "Gas & Fuel", icon: "fas fa-gas-pump", color: "#F8C471" },
          { name: "Home & Garden", icon: "fas fa-home", color: "#82E0AA" },
          { name: "Personal Care", icon: "fas fa-spa", color: "#F1948A" },
          { name: "Other", icon: "fas fa-question", color: "#BDC3C7" },
        ];

        for (const category of defaultCategories) {
          await storage.createCategory(category);
        }
        console.log("Default categories initialized");
      }
    } catch (error) {
      console.error("Failed to initialize categories:", error);
    }
  };

  await initializeCategories();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Categories routes
  app.get('/api/categories', isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Receipt upload and processing
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    const userId = (req.user as any)?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  app.post("/api/receipts/upload", isAuthenticated, async (req, res) => {
    if (!req.body.receiptImageURL) {
      return res.status(400).json({ error: "receiptImageURL is required" });
    }

    const userId = (req.user as any)?.claims?.sub;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.receiptImageURL,
        {
          owner: userId,
          visibility: "private",
        },
      );

      // Create receipt record
      const receipt = await storage.createReceipt({
        userId,
        originalUrl: objectPath,
        processingStatus: "pending",
      });

      // Start OCR processing asynchronously
      processReceiptAsync(receipt.id, req.body.receiptImageURL);

      res.status(200).json({
        receiptId: receipt.id,
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error uploading receipt:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Asynchronous receipt processing function
  async function processReceiptAsync(receiptId: string, imageUrl: string) {
    try {
      // Update status to processing
      await storage.updateReceiptOCR(receiptId, "", "processing");

      // Download and process the image
      const response = await fetch(imageUrl);
      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');

      // Process with OpenAI Vision
      const receiptData = await processReceiptOCR(base64Image);
      
      // Update receipt with OCR text
      await storage.updateReceiptOCR(receiptId, JSON.stringify(receiptData), "completed");

      // Get receipt details to get userId
      const receipt = await storage.getReceipt(receiptId);
      if (!receipt) return;

      // Create expenses from receipt items
      for (const item of receiptData.items) {
        // Categorize the expense
        const categoryResult = await categorizeExpense(item.description, receiptData.vendor);
        
        // Find category ID
        const categories = await storage.getCategories();
        const category = categories.find(c => c.name === categoryResult.category);

        await storage.createExpense({
          userId: receipt.userId,
          receiptId: receiptId,
          categoryId: category?.id,
          description: item.description,
          amount: item.amount.toString(),
          date: receiptData.date,
          vendor: receiptData.vendor,
          isManual: 0,
        });
      }

      // Check budget alerts
      await checkBudgetAlerts(receipt.userId);

    } catch (error) {
      console.error("OCR processing failed:", error);
      await storage.updateReceiptOCR(receiptId, "", "failed");
    }
  }

  // Budget alert checking function
  async function checkBudgetAlerts(userId: string) {
    try {
      const user = await storage.getUser(userId);
      if (!user?.email) return;

      const budgetGoals = await storage.getUserBudgetGoals(userId);
      
      for (const goal of budgetGoals) {
        if (!goal.emailAlerts) continue;
        
        const percentage = (goal.spent / Number(goal.amount)) * 100;
        const threshold = Number(goal.alertThreshold) || 80;
        
        if (percentage >= threshold) {
          await emailService.sendBudgetAlert({
            userEmail: user.email,
            userName: user.firstName || user.email,
            budgetName: goal.name,
            spent: goal.spent,
            budgetAmount: Number(goal.amount),
            percentage,
            category: goal.category?.name || goal.name,
          });
        }
      }
    } catch (error) {
      console.error("Failed to check budget alerts:", error);
    }
  }

  // Expenses routes
  app.get('/api/expenses', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const expenses = await storage.getUserExpenses(userId, limit);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post('/api/expenses', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const expense = await storage.createExpense({
        ...req.body,
        userId,
        amount: req.body.amount.toString(),
        isManual: 1,
      });
      
      // Check budget alerts after manual expense entry
      await checkBudgetAlerts(userId);
      
      res.json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.put('/api/expenses/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.updateExpense(id, {
        ...req.body,
        amount: req.body.amount?.toString(),
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating expense:", error);
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete('/api/expenses/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteExpense(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Budget goals routes
  app.get('/api/budget-goals', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const budgetGoals = await storage.getUserBudgetGoals(userId);
      res.json(budgetGoals);
    } catch (error) {
      console.error("Error fetching budget goals:", error);
      res.status(500).json({ message: "Failed to fetch budget goals" });
    }
  });

  app.post('/api/budget-goals', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const budgetGoal = await storage.createBudgetGoal({
        ...req.body,
        userId,
        amount: req.body.amount.toString(),
        alertThreshold: req.body.alertThreshold?.toString() || "80.00",
      });
      res.json(budgetGoal);
    } catch (error) {
      console.error("Error creating budget goal:", error);
      res.status(500).json({ message: "Failed to create budget goal" });
    }
  });

  app.put('/api/budget-goals/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.updateBudgetGoal(id, {
        ...req.body,
        amount: req.body.amount?.toString(),
        alertThreshold: req.body.alertThreshold?.toString(),
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating budget goal:", error);
      res.status(500).json({ message: "Failed to update budget goal" });
    }
  });

  app.delete('/api/budget-goals/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBudgetGoal(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting budget goal:", error);
      res.status(500).json({ message: "Failed to delete budget goal" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/summary', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const summary = await storage.getUserSpendingSummary(userId);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching analytics summary:", error);
      res.status(500).json({ message: "Failed to fetch analytics summary" });
    }
  });

  app.get('/api/analytics/monthly-spending', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const months = parseInt(req.query.months as string) || 6;
      const monthlySpending = await storage.getMonthlySpending(userId, months);
      res.json(monthlySpending);
    } catch (error) {
      console.error("Error fetching monthly spending:", error);
      res.status(500).json({ message: "Failed to fetch monthly spending" });
    }
  });

  app.get('/api/analytics/by-category', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const categoryData = await storage.getExpensesByCategory(userId);
      res.json(categoryData);
    } catch (error) {
      console.error("Error fetching category analytics:", error);
      res.status(500).json({ message: "Failed to fetch category analytics" });
    }
  });

  // AI Assistant routes
  app.post('/api/ai/chat', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Get user's recent expenses and budget data
      const expenses = await storage.getUserExpenses(userId, 50);
      const budgetGoals = await storage.getUserBudgetGoals(userId);

      // Generate AI response
      const response = await generateExpenseInsights(
        expenses.map(e => ({
          description: e.description,
          amount: Number(e.amount),
          category: e.category?.name || 'Uncategorized',
          date: e.date,
        })),
        budgetGoals.map(b => ({
          name: b.name,
          amount: Number(b.amount),
          spent: b.spent,
          category: b.category?.name || b.name,
        })),
        message
      );

      // Store conversation
      let conversation = await storage.getUserLatestChat(userId);
      const newMessages = [
        ...((conversation?.messages as any[]) || []),
        { role: 'user', content: message, timestamp: new Date() },
        { role: 'assistant', content: response, timestamp: new Date() }
      ];

      if (conversation) {
        await storage.updateChatConversation(conversation.id, newMessages);
      } else {
        conversation = await storage.createChatConversation({
          userId,
          messages: newMessages,
        });
      }

      res.json({ response, conversationId: conversation.id });
    } catch (error) {
      console.error("Error processing AI chat:", error);
      res.status(500).json({ message: "Failed to process AI chat" });
    }
  });

  app.get('/api/ai/conversation', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const conversation = await storage.getUserLatestChat(userId);
      res.json(conversation || { messages: [] });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  // Gmail authentication route
  app.get('/api/gmail/auth', isAuthenticated, async (req, res) => {
    try {
      const { gmailService } = await import('./services/gmail.js');
      const authUrl = await gmailService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error("Error getting Gmail auth URL:", error);
      res.status(500).json({ message: "Failed to get Gmail authorization URL" });
    }
  });

  // Gmail OAuth callback
  app.get('/api/gmail/callback', async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).send('Authorization code not provided');
      }

      const { gmailService } = await import('./services/gmail.js');
      const tokens = await gmailService.handleCallback(code as string);
      
      // Store tokens in session
      if (req.session) {
        (req.session as any).gmailTokens = tokens;
      }
      
      res.redirect('/?gmail_connected=true');
    } catch (error) {
      console.error("Error handling Gmail callback:", error);
      res.redirect('/?gmail_error=true');
    }
  });

  // Real Gmail import route - replaces the simulation
  app.post('/api/receipts/import-gmail', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      
      // Check if we have Gmail tokens in session
      const gmailTokens = (req.session as any)?.gmailTokens;
      if (!gmailTokens) {
        // If no tokens, initiate OAuth flow
        const { gmailService } = await import('./services/gmail.js');
        const authUrl = await gmailService.getAuthUrl();
        return res.json({ 
          requiresAuth: true, 
          authUrl,
          message: "Gmail authorization required. Please authorize access to your Gmail account." 
        });
      }

      const { gmailService } = await import('./services/gmail.js');
      
      // Authenticate with Gmail using stored tokens
      await gmailService.authenticateUser(gmailTokens.accessToken, gmailTokens.refreshToken);
      
      // Search for and process receipt emails
      const result = await gmailService.searchReceiptEmails(userId, 20);
      
      // Check budget alerts after import
      await checkBudgetAlerts(userId);
      
      res.json({
        receiptsFound: result.receiptsFound,
        receiptsProcessed: result.receiptsProcessed,
        message: `Successfully imported ${result.receiptsProcessed} receipts from Gmail`
      });
      
    } catch (error) {
      console.error("Error importing from Gmail:", error);
      res.status(500).json({ 
        message: "Failed to import receipts from Gmail",
        error: error.message 
      });
    }
  });


  // Simulated Gmail import for demonstration
  async function simulateGmailImport(userId: string) {
    // Simulate finding and processing receipt emails
    const sampleReceipts = [
      {
        vendor: "Amazon",
        subject: "Your order has been shipped",
        amount: 29.99,
        items: ["Wireless Mouse", "USB Cable"]
      },
      {
        vendor: "Uber Eats", 
        subject: "Receipt for your order",
        amount: 18.45,
        items: ["Burger", "Fries", "Drink"]
      },
      {
        vendor: "Walmart",
        subject: "Your Walmart receipt",
        amount: 67.23,
        items: ["Groceries", "Household items"]
      }
    ];

    let processedCount = 0;
    
    // Create sample expenses from "email receipts"
    for (const receiptData of sampleReceipts) {
      try {
        // Find appropriate category
        const categories = await storage.getCategories();
        let categoryId = categories.find(c => 
          c.name === "Food & Dining" || c.name === "Shopping" || c.name === "Groceries"
        )?.id;

        // Create a receipt record first
        const receipt = await storage.createReceipt({
          userId,
          originalUrl: `mailto:${receiptData.vendor.toLowerCase()}@example.com`,
          processingStatus: "completed",
        });

        // Create expense from email data
        await storage.createExpense({
          userId,
          receiptId: receipt.id,
          categoryId,
          description: `${receiptData.vendor} - ${receiptData.subject}`,
          amount: receiptData.amount.toString(),
          date: new Date().toISOString().split('T')[0],
          vendor: receiptData.vendor,
          isManual: 0, // Imported from email
        });

        processedCount++;
      } catch (error) {
        console.error(`Failed to process receipt from ${receiptData.vendor}:`, error);
      }
    }

    // Check budget alerts after import
    await checkBudgetAlerts(userId);

    return {
      receiptsFound: sampleReceipts.length,
      receiptsProcessed: processedCount,
      message: `Successfully imported ${processedCount} receipts from Gmail`
    };
  }

  // Receipts routes
  app.get('/api/receipts', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const receipts = await storage.getUserReceipts(userId);
      res.json(receipts);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      res.status(500).json({ message: "Failed to fetch receipts" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
