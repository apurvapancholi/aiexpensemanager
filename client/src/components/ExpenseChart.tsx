import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Pie, PieChart, Cell } from "recharts";

const COLORS = [
  "#1976D2",
  "#388E3C", 
  "#F57C00",
  "#7B1FA2",
  "#D32F2F",
  "#455A64",
  "#E91E63",
  "#00BCD4",
  "#8BC34A",
  "#FF9800"
];

export default function ExpenseChart() {
  // Monthly spending data
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ["/api/analytics/monthly-spending", { months: 6 }],
  });

  // Category breakdown data
  const { data: categoryData, isLoading: categoryLoading } = useQuery({
    queryKey: ["/api/analytics/by-category"],
  });

  // Format monthly data for chart
  const chartData = (monthlyData as any[])?.map((item: any) => ({
    month: new Date(item.month + "-01").toLocaleDateString('en-US', { month: 'short' }),
    spending: item.total
  })) || [];

  // Format category data for pie chart
  const pieData = (categoryData as any[])?.slice(0, 6).map((item: any, index: number) => ({
    name: item.categoryName,
    value: item.total,
    color: COLORS[index % COLORS.length]
  })) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Trend Chart */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Monthly Spending Trend
            </CardTitle>
            <select className="text-sm border border-gray-300 rounded px-3 py-1 bg-white">
              <option>Last 6 months</option>
              <option>Last 12 months</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {monthlyLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spending']}
                    labelStyle={{ color: '#333' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="spending" 
                    stroke="#1976D2" 
                    strokeWidth={3}
                    dot={{ fill: '#1976D2', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#1976D2', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>No spending data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            Category Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {categoryLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>No category data available</p>
              </div>
            )}
          </div>
          {/* Legend */}
          {pieData.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-xs text-gray-600 truncate">
                    {entry.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
