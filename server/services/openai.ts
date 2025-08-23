import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface ReceiptData {
  vendor: string;
  date: string;
  total: number;
  items: Array<{
    description: string;
    amount: number;
    category?: string;
  }>;
}

export interface ExpenseCategory {
  category: string;
  confidence: number;
}

// Default expense categories
export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation", 
  "Entertainment",
  "Shopping",
  "Utilities",
  "Healthcare",
  "Travel",
  "Education",
  "Groceries",
  "Bills & Services",
  "Gas & Fuel",
  "Home & Garden",
  "Personal Care",
  "Other"
];

export async function processReceiptOCR(base64Image: string): Promise<ReceiptData> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at reading receipts and extracting structured data. 
          Analyze the receipt image and extract key information in JSON format. 
          Return data in this exact format: {
            "vendor": "store name",
            "date": "YYYY-MM-DD",
            "total": number,
            "items": [
              {
                "description": "item name",
                "amount": number
              }
            ]
          }
          If you cannot determine a value, use reasonable defaults or empty strings.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please extract the receipt data from this image:"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validate and clean the result
    return {
      vendor: result.vendor || "Unknown Vendor",
      date: result.date || new Date().toISOString().split('T')[0],
      total: Number(result.total) || 0,
      items: Array.isArray(result.items) ? result.items.map((item: any) => ({
        description: item.description || "Unknown Item",
        amount: Number(item.amount) || 0,
      })) : []
    };

  } catch (error) {
    console.error("OCR processing failed:", error);
    throw new Error("Failed to process receipt image");
  }
}

export async function categorizeExpense(description: string, vendor: string): Promise<ExpenseCategory> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at categorizing expenses. Given an expense description and vendor, 
          choose the most appropriate category from this list: ${EXPENSE_CATEGORIES.join(", ")}.
          
          Return your response in JSON format: {
            "category": "category name from the list",
            "confidence": number between 0 and 1
          }`
        },
        {
          role: "user",
          content: `Categorize this expense:
          Description: ${description}
          Vendor: ${vendor}`
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 200,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      category: result.category || "Other",
      confidence: Number(result.confidence) || 0.5,
    };

  } catch (error) {
    console.error("Expense categorization failed:", error);
    return {
      category: "Other",
      confidence: 0.5,
    };
  }
}

export async function generateExpenseInsights(
  expenses: Array<{ description: string; amount: number; category: string; date: string }>,
  budgets: Array<{ name: string; amount: number; spent: number; category: string }>,
  query: string
): Promise<string> {
  try {
    const expensesSummary = expenses.slice(0, 50).map(e => 
      `${e.date}: ${e.description} - $${e.amount} (${e.category})`
    ).join('\n');

    const budgetsSummary = budgets.map(b => 
      `${b.name}: $${b.spent}/$${b.amount} (${((b.spent / b.amount) * 100).toFixed(1)}%)`
    ).join('\n');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful financial assistant. You help users understand their spending patterns,
          track budget goals, and provide financial insights. Be conversational, helpful, and specific with 
          numbers when providing analysis.
          
          Recent Expenses:
          ${expensesSummary}
          
          Budget Goals:
          ${budgetsSummary}
          
          Provide helpful, specific advice based on this financial data.`
        },
        {
          role: "user",
          content: query
        },
      ],
      max_tokens: 500,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't generate insights for your query.";

  } catch (error) {
    console.error("AI insights generation failed:", error);
    return "I'm sorry, I'm having trouble analyzing your expenses right now. Please try again later.";
  }
}
