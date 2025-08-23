import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  uuid,
  integer,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Expense categories
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 7 }), // hex color
  createdAt: timestamp("created_at").defaultNow(),
});

// Receipts
export const receipts = pgTable("receipts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  originalUrl: text("original_url").notNull(), // Object storage path
  ocrText: text("ocr_text"),
  processingStatus: varchar("processing_status", { length: 20 }).notNull().default("pending"), // pending, processing, completed, failed
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Expenses
export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  receiptId: uuid("receipt_id").references(() => receipts.id),
  categoryId: uuid("category_id").references(() => categories.id),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  vendor: varchar("vendor", { length: 200 }),
  notes: text("notes"),
  isManual: integer("is_manual").notNull().default(0), // 0 = from receipt, 1 = manual entry
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Budget goals
export const budgetGoals = pgTable("budget_goals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  categoryId: uuid("category_id").references(() => categories.id),
  name: varchar("name", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  period: varchar("period", { length: 20 }).notNull().default("monthly"), // weekly, monthly, yearly
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isActive: integer("is_active").notNull().default(1),
  emailAlerts: integer("email_alerts").notNull().default(1),
  alertThreshold: decimal("alert_threshold", { precision: 5, scale: 2 }).default("80.00"), // percentage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI chat conversations
export const chatConversations = pgTable("chat_conversations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  messages: jsonb("messages").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertReceiptSchema = createInsertSchema(receipts).omit({
  id: true,
  uploadedAt: true,
  processedAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBudgetGoalSchema = createInsertSchema(budgetGoals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Receipt = typeof receipts.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type BudgetGoal = typeof budgetGoals.$inferSelect;
export type ChatConversation = typeof chatConversations.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type InsertBudgetGoal = z.infer<typeof insertBudgetGoalSchema>;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
