import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import ReceiptsPage from "@/pages/ReceiptsPage.js";
import ExpensesPage from "@/pages/ExpensesPage.js";
import BudgetPage from "@/pages/BudgetPage.js";
import AIAssistantPage from "@/pages/AIAssistantPage.js";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/receipts" component={ReceiptsPage} />
          <Route path="/expenses" component={ExpensesPage} />
          <Route path="/budget" component={BudgetPage} />
          <Route path="/ai" component={AIAssistantPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
