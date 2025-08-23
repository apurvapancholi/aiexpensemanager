import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, CreditCard, Target, Receipt, Utensils } from "lucide-react";
import ExpenseChart from "./ExpenseChart.js";
import ReceiptUpload from "./ReceiptUpload.js";
import BudgetGoals from "./BudgetGoals.js";
import AIAssistant from "./AIAssistant.js";
import ExpenseList from "./ExpenseList.js";

export default function Dashboard() {
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Fetch analytics summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["/api/analytics/summary"],
  });

  // Fetch recent expenses
  const { data: recentExpenses, isLoading: expensesLoading } = useQuery({
    queryKey: ["/api/expenses"],
  });

  // Fetch budget goals
  const { data: budgetGoals, isLoading: budgetLoading } = useQuery({
    queryKey: ["/api/budget-goals"],
  });

  // Calculate percentage change
  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const monthlyChange = (summary as any)
    ? getPercentageChange((summary as any).totalThisMonth, (summary as any).totalLastMonth)
    : 0;

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800" data-testid="text-dashboard-title">
              Dashboard
            </h2>
            <p className="text-gray-600">Overview of your financial activity</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setShowUploadModal(true)}
              className="bg-primary text-white hover:bg-blue-700"
              data-testid="button-upload-receipt"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Receipt
            </Button>
            <Button variant="outline" data-testid="button-export-data">
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Spent This Month</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-monthly-spent">
                    ${summaryLoading ? "..." : (summary as any)?.totalThisMonth?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="text-red-600 h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${monthlyChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {monthlyChange >= 0 ? '+' : ''}{monthlyChange.toFixed(1)}%
                </span>
                <span className="text-gray-500 text-sm ml-2">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Budget Remaining</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-budget-remaining">
                    ${budgetLoading ? "..." : 
                      (budgetGoals as any[])?.reduce((total: number, goal: any) => total + (Number(goal.amount) - goal.spent), 0).toFixed(2) || "0.00"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="text-green-600 h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-green-600 text-sm font-medium">
                  {(budgetGoals as any[])?.length || 0} active goals
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Receipts Processed</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-receipts-count">
                    {summaryLoading ? "..." : (summary as any)?.receiptsCount || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Receipt className="text-blue-600 h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-blue-600 text-sm font-medium">All time</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Top Category</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-top-category">
                    {summaryLoading ? "..." : (summary as any)?.topCategory || "N/A"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Utensils className="text-yellow-600 h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-yellow-600 text-sm font-medium">This month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <ExpenseChart />
          </div>
          <div>
            <BudgetGoals />
          </div>
        </div>

        {/* Recent Activity and Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ExpenseList limit={5} />
          <ReceiptUpload />
        </div>

        {/* AI Assistant */}
        <AIAssistant />
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <ReceiptUpload onClose={() => setShowUploadModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
