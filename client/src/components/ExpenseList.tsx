import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Coffee, 
  Car, 
  ShoppingBag, 
  Utensils, 
  Fuel, 
  CreditCard,
  MoreHorizontal
} from "lucide-react";

interface ExpenseListProps {
  limit?: number;
}

export default function ExpenseList({ limit }: ExpenseListProps) {
  const { data: expenses, isLoading } = useQuery({
    queryKey: ["/api/expenses", { limit }],
  });

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName?.toLowerCase() || "";
    if (name.includes("food") || name.includes("dining")) return Coffee;
    if (name.includes("transport")) return Car;
    if (name.includes("shopping")) return ShoppingBag;
    if (name.includes("gas") || name.includes("fuel")) return Fuel;
    if (name.includes("groceries")) return ShoppingBag;
    return CreditCard;
  };

  const getCategoryColor = (categoryName: string) => {
    const name = categoryName?.toLowerCase() || "";
    if (name.includes("food") || name.includes("dining")) return "bg-blue-100 text-blue-600";
    if (name.includes("transport")) return "bg-green-100 text-green-600";
    if (name.includes("shopping")) return "bg-purple-100 text-purple-600";
    if (name.includes("gas") || name.includes("fuel")) return "bg-orange-100 text-orange-600";
    if (name.includes("groceries")) return "bg-yellow-100 text-yellow-600";
    return "bg-gray-100 text-gray-600";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `Today, ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })}`;
    } else if (diffInHours < 48) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-gray-800">
          Recent Expenses
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (expenses as any[]) && (expenses as any[]).length > 0 ? (
          <>
            {(expenses as any[]).slice(0, limit || (expenses as any[]).length).map((expense: any) => {
              const IconComponent = getCategoryIcon(expense.category?.name);
              const colorClass = getCategoryColor(expense.category?.name);
              
              return (
                <div 
                  key={expense.id}
                  className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  data-testid={`expense-item-${expense.id}`}
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${colorClass}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900" data-testid={`expense-description-${expense.id}`}>
                        {expense.description}
                      </p>
                      <p className="text-sm text-gray-500" data-testid={`expense-date-${expense.id}`}>
                        {formatDate(expense.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900" data-testid={`expense-amount-${expense.id}`}>
                      ${Number(expense.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500" data-testid={`expense-category-${expense.id}`}>
                      {expense.category?.name || 'Uncategorized'}
                    </p>
                  </div>
                </div>
              );
            })}
            
            <div className="p-4">
              <Button 
                variant="ghost" 
                className="w-full text-primary font-medium text-sm hover:bg-blue-50 py-2 rounded-lg transition-colors"
                data-testid="button-view-all-expenses"
              >
                View All Expenses
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No expenses yet</p>
            <p className="text-sm text-gray-400">Upload receipts or add expenses manually to get started!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
