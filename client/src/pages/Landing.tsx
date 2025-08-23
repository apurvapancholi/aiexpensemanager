import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, BarChart3, Target, Bot, Shield, Zap } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Receipt className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">ExpenseTracker Pro</h1>
          </div>
          <Button onClick={handleLogin} size="lg" data-testid="button-login">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Smart Expense Management with{" "}
            <span className="text-primary">AI-Powered</span> Insights
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Upload receipts, track expenses automatically, set budget goals, and get
            personalized financial insights with our AI assistant.
          </p>
          <Button onClick={handleLogin} size="lg" className="text-lg px-8 py-3" data-testid="button-get-started">
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything You Need for Financial Control
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Receipt className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Smart Receipt Scanning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Upload receipts and let AI extract expense data automatically.
                  No more manual entry - just snap and track.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>Visual Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Beautiful charts and insights help you understand your spending
                  patterns and make informed financial decisions.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-yellow-600" />
                </div>
                <CardTitle>Budget Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Set spending limits by category and get alerts when you're
                  approaching your budget limits.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Bot className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle>AI Financial Assistant</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Chat with your personal AI assistant for spending insights,
                  budget advice, and financial planning tips.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle>Secure & Private</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Your financial data is encrypted and secure. We never share
                  your information with third parties.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-8 w-8 text-indigo-600" />
                </div>
                <CardTitle>Smart Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Receive email notifications when you're approaching budget
                  limits or unusual spending patterns are detected.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-white">
        <div className="container mx-auto text-center max-w-3xl">
          <h3 className="text-4xl font-bold mb-6">
            Take Control of Your Finances Today
          </h3>
          <p className="text-xl mb-10 opacity-90">
            Join thousands of users who have transformed their financial habits
            with ExpenseTracker Pro.
          </p>
          <Button
            onClick={handleLogin}
            size="lg"
            variant="secondary"
            className="text-lg px-8 py-3"
            data-testid="button-start-tracking"
          >
            Start Tracking Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-white">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Receipt className="h-6 w-6" />
            <span className="text-lg font-semibold">ExpenseTracker Pro</span>
          </div>
          <p className="text-gray-400">
            Smart expense management for the modern professional
          </p>
        </div>
      </footer>
    </div>
  );
}
