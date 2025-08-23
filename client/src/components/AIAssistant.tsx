import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Maximize2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIAssistant() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch conversation history
  const { data: conversation } = useQuery({
    queryKey: ["/api/ai/conversation"],
  });

  // Load messages from conversation
  useEffect(() => {
    if ((conversation as any)?.messages) {
      setMessages((conversation as any).messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })));
    }
  }, [conversation]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const response = await apiRequest("POST", "/api/ai/chat", {
        message: userMessage,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        {
          role: "user",
          content: message,
          timestamp: new Date(),
        },
        {
          role: "assistant", 
          content: data.response,
          timestamp: new Date(),
        },
      ]);
      setMessage("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "Show my top spending categories",
    "How can I reduce my transportation costs?",
    "Compare this month to last month",
    "Am I staying within my budget goals?",
  ];

  const handleSuggestedQuestion = (question: string) => {
    setMessage(question);
  };

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bot className="text-primary mr-3 h-5 w-5" />
            <CardTitle className="text-lg font-semibold text-gray-800">
              AI Financial Assistant
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Chat Messages */}
        <div className="h-64 overflow-y-auto mb-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-start">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <Bot className="text-white h-4 w-4" />
                </div>
                <div className="bg-white rounded-lg p-3 max-w-xs">
                  <p className="text-sm text-gray-700">
                    Hello! I can help you analyze your spending patterns and answer questions about your expenses. What would you like to know?
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`flex items-start ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <Bot className="text-white h-4 w-4" />
                    </div>
                  )}
                  <div className={`rounded-lg p-3 max-w-xs ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white ml-auto' 
                      : 'bg-white text-gray-700'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
                      <User className="text-gray-600 h-4 w-4" />
                    </div>
                  )}
                </div>
              ))
            )}
            {sendMessageMutation.isPending && (
              <div className="flex items-start">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <Bot className="text-white h-4 w-4" />
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="flex space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your expenses..."
            className="flex-1"
            disabled={sendMessageMutation.isPending}
            data-testid="input-ai-message"
          />
          <Button 
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-primary text-white hover:bg-blue-700"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Suggested Questions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {suggestedQuestions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleSuggestedQuestion(question)}
              className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              data-testid={`button-suggested-${index}`}
            >
              "{question}"
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
