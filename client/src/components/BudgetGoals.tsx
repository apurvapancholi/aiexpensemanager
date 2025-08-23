import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function BudgetGoals() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: "",
    amount: "",
    categoryId: "",
    period: "monthly",
    alertThreshold: "80",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch budget goals
  const { data: budgetGoals, isLoading } = useQuery({
    queryKey: ["/api/budget-goals"],
  });

  // Fetch categories for dropdown
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Create budget goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      const response = await apiRequest("POST", "/api/budget-goals", goalData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Budget Goal Created",
        description: "Your new budget goal has been set up successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/budget-goals"] });
      setShowAddDialog(false);
      setNewGoal({
        name: "",
        amount: "",
        categoryId: "",
        period: "monthly",
        alertThreshold: "80",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createGoalMutation.mutate({
      ...newGoal,
      amount: parseFloat(newGoal.amount),
      alertThreshold: parseFloat(newGoal.alertThreshold),
      startDate: new Date().toISOString().split('T')[0],
    });
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage > 100) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    } else if (percentage > 80) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    } else {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getStatusText = (percentage: number) => {
    if (percentage > 100) return "Over Budget";
    if (percentage > 80) return "Warning";
    return "On Track";
  };

  const getStatusColor = (percentage: number) => {
    if (percentage > 100) return "text-red-800 bg-red-100";
    if (percentage > 80) return "text-yellow-800 bg-yellow-100";
    return "text-green-800 bg-green-100";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage > 100) return "bg-red-500";
    if (percentage > 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-800">
            Budget Goals
          </CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary text-white hover:bg-blue-700" data-testid="button-add-goal">
                <Plus className="mr-2 h-4 w-4" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Budget Goal</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="goal-name">Goal Name</Label>
                  <Input
                    id="goal-name"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                    placeholder="e.g., Food & Dining"
                    data-testid="input-goal-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="goal-amount">Budget Amount</Label>
                  <Input
                    id="goal-amount"
                    type="number"
                    step="0.01"
                    value={newGoal.amount}
                    onChange={(e) => setNewGoal({ ...newGoal, amount: e.target.value })}
                    placeholder="0.00"
                    data-testid="input-goal-amount"
                  />
                </div>

                <div>
                  <Label htmlFor="goal-category">Category (Optional)</Label>
                  <Select 
                    value={newGoal.categoryId} 
                    onValueChange={(value) => setNewGoal({ ...newGoal, categoryId: value })}
                  >
                    <SelectTrigger data-testid="select-goal-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {(categories as any[])?.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="goal-period">Period</Label>
                  <Select 
                    value={newGoal.period} 
                    onValueChange={(value) => setNewGoal({ ...newGoal, period: value })}
                  >
                    <SelectTrigger data-testid="select-goal-period">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="alert-threshold">Alert Threshold (%)</Label>
                  <Input
                    id="alert-threshold"
                    type="number"
                    min="1"
                    max="100"
                    value={newGoal.alertThreshold}
                    onChange={(e) => setNewGoal({ ...newGoal, alertThreshold: e.target.value })}
                    data-testid="input-alert-threshold"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddDialog(false)}
                    data-testid="button-cancel-goal"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createGoalMutation.isPending}
                    data-testid="button-save-goal"
                  >
                    {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (budgetGoals as any[]) && (budgetGoals as any[]).length > 0 ? (
          <div className="space-y-4">
            {(budgetGoals as any[]).slice(0, 4).map((goal: any) => {
              const percentage = (goal.spent / Number(goal.amount)) * 100;
              const remaining = Number(goal.amount) - goal.spent;
              
              return (
                <div 
                  key={goal.id} 
                  className="border border-gray-200 rounded-lg p-4"
                  data-testid={`budget-goal-${goal.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">{goal.name}</h4>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(percentage)}
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(percentage)}`}>
                        {getStatusText(percentage)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>${goal.spent.toFixed(2)} of ${Number(goal.amount).toFixed(2)}</span>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${getProgressColor(percentage)}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    {remaining > 0 
                      ? `$${remaining.toFixed(2)} remaining this ${goal.period}`
                      : `$${Math.abs(remaining).toFixed(2)} over budget`
                    }
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No budget goals set</p>
            <p className="text-sm text-gray-400">Create your first budget goal to start tracking!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
