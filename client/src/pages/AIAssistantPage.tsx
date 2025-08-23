import Layout from "@/components/Layout";
import AIAssistant from "@/components/AIAssistant";

export default function AIAssistantPage() {
  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-ai-title">
            AI Financial Assistant
          </h1>
          <p className="text-gray-600">Get personalized insights and advice about your spending</p>
        </div>
        
        {/* Full-width AI Assistant component */}
        <div className="max-w-4xl">
          <AIAssistant />
        </div>
      </div>
    </Layout>
  );
}