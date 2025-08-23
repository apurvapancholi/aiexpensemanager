import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ObjectUploader } from "./ObjectUploader.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CloudUpload, FileImage, Info, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { UploadResult } from "@uppy/core";

interface ReceiptUploadProps {
  onClose?: () => void;
}

export default function ReceiptUpload({ onClose }: ReceiptUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (receiptImageURL: string) => {
      const response = await apiRequest("POST", "/api/receipts/upload", {
        receiptImageURL,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Receipt Uploaded",
        description: "Your receipt is being processed. Expenses will appear shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      onClose?.();
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const gmailImportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/receipts/import-gmail");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.requiresAuth && data.authUrl) {
        // Need OAuth authorization
        toast({
          title: "Gmail Authorization Required",
          description: "Opening authorization window...",
        });
        
        // Open Gmail authorization in new window
        window.open(data.authUrl, 'gmail-auth', 'width=600,height=600,scrollbars=yes,resizable=yes');
        
        // Show message to user
        toast({
          title: "Authorization Required",
          description: "Please authorize Gmail access in the popup window, then try importing again.",
        });
      } else {
        toast({
          title: "Gmail Import Started",
          description: `Found ${data.receiptsFound || 0} receipts. Processing in background...`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/receipts"] });
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
        onClose?.();
      }
    },
    onError: (error) => {
      toast({
        title: "Gmail Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload");
      const data = await response.json();
      return {
        method: "PUT" as const,
        url: data.uploadURL,
      };
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to get upload parameters",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    setUploading(false);
    
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const receiptImageURL = uploadedFile.uploadURL;
      
      if (receiptImageURL) {
        uploadMutation.mutate(receiptImageURL);
      }
    }
  };

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-800">
            Upload Receipt
          </CardTitle>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              data-testid="button-close-upload"
            >
              ×
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Upload Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CloudUpload className="text-gray-400 h-6 w-6" />
            </div>
            <p className="text-gray-600 mb-2">Upload Receipt Image</p>
            <p className="text-xs text-gray-500 mb-3">Drag & drop or browse files</p>
            
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={10485760} // 10MB
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleComplete}
              buttonClassName="bg-primary text-white hover:bg-blue-700 transition-colors text-sm"
            >
              Choose File
            </ObjectUploader>
          </div>

          {/* Gmail Import */}
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Mail className="text-blue-600 h-6 w-6" />
            </div>
            <p className="text-gray-600 mb-2">Import from Gmail</p>
            <p className="text-xs text-gray-500 mb-3">Auto-find receipt emails</p>
            
            <Button
              onClick={() => gmailImportMutation.mutate()}
              disabled={gmailImportMutation.isPending}
              className="bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm"
              data-testid="button-gmail-import"
            >
              {gmailImportMutation.isPending ? "Importing..." : "Import Receipts"}
            </Button>
          </div>
        </div>

        {/* Recent Uploads Preview */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-800 mb-3">Sample Receipts</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"
                alt="Restaurant receipt"
                className="w-full h-20 object-cover rounded border border-gray-200"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 rounded flex items-center justify-center">
                <FileImage className="text-white h-6 w-6" />
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"
                alt="Grocery receipt"
                className="w-full h-20 object-cover rounded border border-gray-200"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 rounded flex items-center justify-center">
                <FileImage className="text-white h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* AI Processing Info */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="text-yellow-600 mt-0.5 mr-3 h-5 w-5" />
            <div>
              <h5 className="font-medium text-yellow-800">AI Processing</h5>
              <p className="text-sm text-yellow-700">
                Receipts are automatically processed using OCR and categorized. 
                Review and edit as needed.
              </p>
            </div>
          </div>
        </div>

        {/* Upload Status */}
        {(uploading || uploadMutation.isPending || gmailImportMutation.isPending) && (
          <div className="mt-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
            <span className="text-sm text-gray-600">
              {gmailImportMutation.isPending ? "Importing from Gmail..." : "Processing receipt..."}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
