import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { DollarSign, TrendingUp, Calendar, Target } from "lucide-react";
import Layout from "@/components/Layout";
import { useState } from "react";

const COLORS = [
  "#3B82F6", // Blue
  "#EF4444", // Red  
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#6B7280", // Gray
  "#F97316", // Orange
];

export default function ExpensesPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("thisMonth");

  // Fetch expenses data
  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ["/api/expenses"],
  });

  // Fetch analytics data
  const { data: categoryData, isLoading: categoryLoading } = useQuery({
    queryKey: ["/api/analytics/by-category"],
  });

  // Fetch summary data
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["/api/analytics/summary"],
  });

  // Process data for pie chart
  const pieChartData = (categoryData as any[])?.map((item: any, index: number) => ({
    name: item.categoryName || "Uncategorized",
    value: parseFloat(item.totalAmount),
    color: COLORS[index % COLORS.length]
  })) || [];

  // Process data for monthly breakdown
  const monthlyData = (expenses as any[])?.reduce((acc: any, expense: any) => {
    const month = new Date(expense.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const existing = acc.find((item: any) => item.month === month);
    if (existing) {
      existing.amount += parseFloat(expense.amount);
    } else {
      acc.push({ month, amount: parseFloat(expense.amount) });
    }
    return acc;
  }, []) || [];

  // Sort monthly data chronologically
  monthlyData.sort((a: any, b: any) => {
    const dateA = new Date(a.month + " 01");
    const dateB = new Date(b.month + " 01");
    return dateA.getTime() - dateB.getTime();
  });

  const totalExpenses = pieChartData.reduce((sum: number, item: any) => sum + item.value, 0);

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / totalExpenses) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.payload.name}</p>
          <p className="text-sm text-gray-600">
            ${data.value.toFixed(2)} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="text-expenses-title">
              Expense Analytics
            </h1>
            <p className="text-gray-600">Visual breakdown of your spending patterns</p>
          </div>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="last3Months">Last 3 Months</SelectItem>
              <SelectItem value="allTime">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-total-expenses">
                    ${summaryLoading ? "..." : totalExpenses.toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-blue-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-categories-count">
                    {categoryLoading ? "..." : pieChartData.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="text-green-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-this-month">
                    ${summaryLoading ? "..." : ((summary as any)?.totalThisMonth || 0).toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-yellow-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg per Day</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-avg-per-day">
                    ${summaryLoading ? "..." : (((summary as any)?.totalThisMonth || 0) / new Date().getDate()).toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-purple-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart - Expenses by Category */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">
                Expenses by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoryLoading ? (
                <div className="flex items-center justify-center h-80">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : pieChartData.length > 0 ? (
                <div className="h-80" data-testid="pie-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-80 text-gray-500">
                  No expense data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bar Chart - Monthly Trends */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">
                Monthly Spending Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expensesLoading ? (
                <div className="flex items-center justify-center h-80">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : monthlyData.length > 0 ? (
                <div className="h-80" data-testid="bar-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any) => [`$${value.toFixed(2)}`, 'Amount']}
                      />
                      <Bar dataKey="amount" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-80 text-gray-500">
                  No monthly data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown Table */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">
              Category Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : pieChartData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="category-breakdown-table">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Amount</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pieChartData
                      .sort((a: any, b: any) => b.value - a.value)
                      .map((item: any, index: number) => {
                        const percentage = ((item.value / totalExpenses) * 100).toFixed(1);
                        return (
                          <tr key={item.name} className="border-b border-gray-100" data-testid={`category-row-${index}`}>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: item.color }}
                                ></div>
                                <span className="font-medium text-gray-900">{item.name}</span>
                              </div>
                            </td>
                            <td className="text-right py-3 px-4 font-medium text-gray-900">
                              ${item.value.toFixed(2)}
                            </td>
                            <td className="text-right py-3 px-4 text-gray-600">
                              {percentage}%
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}