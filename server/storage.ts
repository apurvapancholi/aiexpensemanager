import {
  users,
  categories,
  receipts,
  expenses,
  budgetGoals,
  chatConversations,
  type User,
  type UpsertUser,
  type Category,
  type Receipt,
  type Expense,
  type BudgetGoal,
  type ChatConversation,
  type InsertCategory,
  type InsertReceipt,
  type InsertExpense,
  type InsertBudgetGoal,
  type InsertChatConversation,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sum, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser, userId?: string): Promise<User>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Receipt operations
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;
  getReceipt(id: string): Promise<Receipt | undefined>;
  updateReceiptOCR(id: string, ocrText: string, status: string): Promise<void>;
  getUserReceipts(userId: string): Promise<Receipt[]>;
  
  // Expense operations
  createExpense(expense: InsertExpense): Promise<Expense>;
  getUserExpenses(userId: string, limit?: number): Promise<(Expense & { category: Category | null })[]>;
  getExpensesByDateRange(userId: string, startDate: string, endDate: string): Promise<(Expense & { category: Category | null })[]>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<void>;
  deleteExpense(id: string): Promise<void>;
  getExpensesByCategory(userId: string): Promise<{ categoryName: string; total: number; count: number }[]>;
  
  // Budget operations
  createBudgetGoal(budget: InsertBudgetGoal): Promise<BudgetGoal>;
  getUserBudgetGoals(userId: string): Promise<(BudgetGoal & { category: Category | null; spent: number })[]>;
  updateBudgetGoal(id: string, budget: Partial<InsertBudgetGoal>): Promise<void>;
  deleteBudgetGoal(id: string): Promise<void>;
  
  // Chat operations
  createChatConversation(chat: InsertChatConversation): Promise<ChatConversation>;
  getUserLatestChat(userId: string): Promise<ChatConversation | undefined>;
  updateChatConversation(id: string, messages: any[]): Promise<void>;
  
  // Analytics
  getMonthlySpending(userId: string, months: number): Promise<{ month: string; total: number }[]>;
  getUserSpendingSummary(userId: string): Promise<{
    totalThisMonth: number;
    totalLastMonth: number;
    topCategory: string;
    receiptsCount: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser, userId?: string): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ ...userData, id: userId })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  // Receipt operations
  async createReceipt(receipt: InsertReceipt): Promise<Receipt> {
    const [newReceipt] = await db.insert(receipts).values(receipt).returning();
    return newReceipt;
  }

  async getReceipt(id: string): Promise<Receipt | undefined> {
    const [receipt] = await db.select().from(receipts).where(eq(receipts.id, id));
    return receipt;
  }

  async updateReceiptOCR(id: string, ocrText: string, status: string): Promise<void> {
    await db
      .update(receipts)
      .set({ ocrText, processingStatus: status, processedAt: new Date() })
      .where(eq(receipts.id, id));
  }

  async getUserReceipts(userId: string): Promise<Receipt[]> {
    return await db
      .select()
      .from(receipts)
      .where(eq(receipts.userId, userId))
      .orderBy(desc(receipts.uploadedAt));
  }

  // Expense operations
  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  async getUserExpenses(userId: string, limit?: number): Promise<(Expense & { category: Category | null })[]> {
    const query = db
      .select({
        id: expenses.id,
        userId: expenses.userId,
        receiptId: expenses.receiptId,
        categoryId: expenses.categoryId,
        description: expenses.description,
        amount: expenses.amount,
        date: expenses.date,
        vendor: expenses.vendor,
        notes: expenses.notes,
        isManual: expenses.isManual,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
        category: categories,
      })
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .where(eq(expenses.userId, userId))
      .orderBy(desc(expenses.date));

    if (limit) {
      query.limit(limit);
    }

    return await query;
  }

  async getExpensesByDateRange(userId: string, startDate: string, endDate: string): Promise<(Expense & { category: Category | null })[]> {
    return await db
      .select({
        id: expenses.id,
        userId: expenses.userId,
        receiptId: expenses.receiptId,
        categoryId: expenses.categoryId,
        description: expenses.description,
        amount: expenses.amount,
        date: expenses.date,
        vendor: expenses.vendor,
        notes: expenses.notes,
        isManual: expenses.isManual,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
        category: categories,
      })
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .where(and(
        eq(expenses.userId, userId),
        gte(expenses.date, startDate),
        lte(expenses.date, endDate)
      ))
      .orderBy(desc(expenses.date));
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<void> {
    await db
      .update(expenses)
      .set({ ...expense, updatedAt: new Date() })
      .where(eq(expenses.id, id));
  }

  async deleteExpense(id: string): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  async getExpensesByCategory(userId: string): Promise<{ categoryName: string; total: number; count: number }[]> {
    const result = await db
      .select({
        categoryName: sql<string>`COALESCE(${categories.name}, 'Uncategorized')`,
        total: sql<number>`CAST(SUM(${expenses.amount}) AS DECIMAL)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .where(eq(expenses.userId, userId))
      .groupBy(categories.name);

    return result.map(row => ({
      categoryName: row.categoryName,
      total: Number(row.total),
      count: Number(row.count),
    }));
  }

  // Budget operations
  async createBudgetGoal(budget: InsertBudgetGoal): Promise<BudgetGoal> {
    const [newBudget] = await db.insert(budgetGoals).values(budget).returning();
    return newBudget;
  }

  async getUserBudgetGoals(userId: string): Promise<(BudgetGoal & { category: Category | null; spent: number })[]> {
    const goals = await db
      .select({
        id: budgetGoals.id,
        userId: budgetGoals.userId,
        categoryId: budgetGoals.categoryId,
        name: budgetGoals.name,
        amount: budgetGoals.amount,
        period: budgetGoals.period,
        startDate: budgetGoals.startDate,
        endDate: budgetGoals.endDate,
        isActive: budgetGoals.isActive,
        emailAlerts: budgetGoals.emailAlerts,
        alertThreshold: budgetGoals.alertThreshold,
        createdAt: budgetGoals.createdAt,
        updatedAt: budgetGoals.updatedAt,
        category: categories,
      })
      .from(budgetGoals)
      .leftJoin(categories, eq(budgetGoals.categoryId, categories.id))
      .where(and(eq(budgetGoals.userId, userId), eq(budgetGoals.isActive, 1)));

    // Calculate spent amount for each goal
    const goalsWithSpent = await Promise.all(
      goals.map(async (goal) => {
        const now = new Date();
        const startDate = new Date(goal.startDate);
        let endDate = goal.endDate ? new Date(goal.endDate) : new Date();
        
        if (goal.period === 'monthly') {
          endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        }

        const spentQuery = db
          .select({ total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)` })
          .from(expenses)
          .where(and(
            eq(expenses.userId, userId),
            goal.categoryId ? eq(expenses.categoryId, goal.categoryId) : sql`1=1`,
            gte(expenses.date, startDate.toISOString().split('T')[0]),
            lte(expenses.date, endDate.toISOString().split('T')[0])
          ));

        const [{ total }] = await spentQuery;
        
        return {
          ...goal,
          spent: Number(total) || 0,
        };
      })
    );

    return goalsWithSpent;
  }

  async updateBudgetGoal(id: string, budget: Partial<InsertBudgetGoal>): Promise<void> {
    await db
      .update(budgetGoals)
      .set({ ...budget, updatedAt: new Date() })
      .where(eq(budgetGoals.id, id));
  }

  async deleteBudgetGoal(id: string): Promise<void> {
    await db.delete(budgetGoals).where(eq(budgetGoals.id, id));
  }

  // Chat operations
  async createChatConversation(chat: InsertChatConversation): Promise<ChatConversation> {
    const [newChat] = await db.insert(chatConversations).values(chat).returning();
    return newChat;
  }

  async getUserLatestChat(userId: string): Promise<ChatConversation | undefined> {
    const [chat] = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.userId, userId))
      .orderBy(desc(chatConversations.updatedAt))
      .limit(1);
    return chat;
  }

  async updateChatConversation(id: string, messages: any[]): Promise<void> {
    await db
      .update(chatConversations)
      .set({ messages, updatedAt: new Date() })
      .where(eq(chatConversations.id, id));
  }

  // Analytics
  async getMonthlySpending(userId: string, months: number): Promise<{ month: string; total: number }[]> {
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - months);
    
    const result = await db
      .select({
        month: sql<string>`TO_CHAR(${expenses.date}, 'YYYY-MM')`,
        total: sql<number>`CAST(SUM(${expenses.amount}) AS DECIMAL)`,
      })
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        gte(expenses.date, monthsAgo.toISOString().split('T')[0])
      ))
      .groupBy(sql`TO_CHAR(${expenses.date}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${expenses.date}, 'YYYY-MM')`);

    return result.map(row => ({
      month: row.month,
      total: Number(row.total) || 0,
    }));
  }

  async getUserSpendingSummary(userId: string): Promise<{
    totalThisMonth: number;
    totalLastMonth: number;
    topCategory: string;
    receiptsCount: number;
  }> {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // This month total
    const [thisMonth] = await db
      .select({ total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)` })
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        gte(expenses.date, thisMonthStart.toISOString().split('T')[0])
      ));

    // Last month total
    const [lastMonth] = await db
      .select({ total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)` })
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        gte(expenses.date, lastMonthStart.toISOString().split('T')[0]),
        lte(expenses.date, lastMonthEnd.toISOString().split('T')[0])
      ));

    // Top category this month
    const topCategoryResult = await db
      .select({
        categoryName: sql<string>`COALESCE(${categories.name}, 'Uncategorized')`,
        total: sql<number>`CAST(SUM(${expenses.amount}) AS DECIMAL)`,
      })
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .where(and(
        eq(expenses.userId, userId),
        gte(expenses.date, thisMonthStart.toISOString().split('T')[0])
      ))
      .groupBy(categories.name)
      .orderBy(sql`SUM(${expenses.amount}) DESC`)
      .limit(1);

    // Receipts count
    const [receiptsResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(receipts)
      .where(eq(receipts.userId, userId));

    return {
      totalThisMonth: Number(thisMonth.total) || 0,
      totalLastMonth: Number(lastMonth.total) || 0,
      topCategory: topCategoryResult[0]?.categoryName || 'N/A',
      receiptsCount: Number(receiptsResult.count) || 0,
    };
  }
}

export const storage = new DatabaseStorage();
