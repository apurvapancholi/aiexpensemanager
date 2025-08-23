import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, Calendar, DollarSign, Building, Tag } from "lucide-react";
import Layout from "@/components/Layout";

export default function ReceiptsPage() {
  // Fetch receipts
  const { data: receipts, isLoading } = useQuery({
    queryKey: ["/api/receipts"],
  });

  // Fetch expenses to get associated expense data
  const { data: expenses } = useQuery({
    queryKey: ["/api/expenses"],
  });

  // Map receipts with their associated expense data
  const receiptsWithExpenses = (receipts as any[])?.map(receipt => {
    const associatedExpense = (expenses as any[])?.find(
      expense => expense.receiptId === receipt.id
    );
    return {
      ...receipt,
      expense: associatedExpense
    };
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "processing": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="text-receipts-title">
              Receipts
            </h1>
            <p className="text-gray-600">View all processed receipts with extracted data</p>
          </div>
          <div className="text-sm text-gray-500">
            {isLoading ? "Loading..." : `${receiptsWithExpenses.length} receipts found`}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : receiptsWithExpenses.length > 0 ? (
          <div className="grid gap-6">
            {receiptsWithExpenses.map((receipt: any) => (
              <Card key={receipt.id} className="bg-white border border-gray-200" data-testid={`receipt-card-${receipt.id}`}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {receipt.expense?.vendor || "Receipt"}
                        </CardTitle>
                        <p className="text-sm text-gray-500">
                          ID: {receipt.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <Badge 
                      className={getStatusColor(receipt.processingStatus)} 
                      data-testid={`status-${receipt.processingStatus}`}
                    >
                      {receipt.processingStatus.charAt(0).toUpperCase() + receipt.processingStatus.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Receipt Source */}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className="font-medium">Source:</span>
                    <span>{receipt.originalUrl?.includes('mailto:') ? 'Gmail Import' : 'File Upload'}</span>
                  </div>

                  {/* Processed Data */}
                  {receipt.expense && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <h4 className="font-medium text-gray-900">Extracted Information</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Amount */}
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-600">Amount:</span>
                          <span className="font-semibold text-gray-900" data-testid={`amount-${receipt.id}`}>
                            ${parseFloat(receipt.expense.amount).toFixed(2)}
                          </span>
                        </div>

                        {/* Date */}
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-gray-600">Date:</span>
                          <span className="text-gray-900" data-testid={`date-${receipt.id}`}>
                            {new Date(receipt.expense.date).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Vendor */}
                        {receipt.expense.vendor && (
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4 text-purple-600" />
                            <span className="text-sm text-gray-600">Vendor:</span>
                            <span className="text-gray-900" data-testid={`vendor-${receipt.id}`}>
                              {receipt.expense.vendor}
                            </span>
                          </div>
                        )}

                        {/* Category */}
                        {receipt.expense.category && (
                          <div className="flex items-center space-x-2">
                            <Tag className="h-4 w-4 text-orange-600" />
                            <span className="text-sm text-gray-600">Category:</span>
                            <span className="text-gray-900" data-testid={`category-${receipt.id}`}>
                              {receipt.expense.category.name}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {receipt.expense.description && (
                        <div className="pt-2 border-t border-gray-200">
                          <span className="text-sm text-gray-600">Description:</span>
                          <p className="text-gray-900 mt-1" data-testid={`description-${receipt.id}`}>
                            {receipt.expense.description}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Processing Timestamp */}
                  <div className="text-xs text-gray-500">
                    Processed: {formatDate(receipt.createdAt)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white border border-gray-200">
            <CardContent className="text-center py-12">
              <Receipt className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No receipts found</h3>
              <p className="text-gray-500 mb-4">
                Upload receipts or import from Gmail to see processed data here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}