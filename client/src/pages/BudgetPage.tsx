import Layout from "@/components/Layout";
import BudgetGoals from "@/components/BudgetGoals";

export default function BudgetPage() {
  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-budget-title">
            Budget Goals
          </h1>
          <p className="text-gray-600">Set and track your spending goals with smart alerts</p>
        </div>
        
        {/* Full-width Budget Goals component */}
        <div className="max-w-4xl">
          <BudgetGoals />
        </div>
      </div>
    </Layout>
  );
}