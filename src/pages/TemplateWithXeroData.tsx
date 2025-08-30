import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole, requireAIToolsAccess } from '../utils/roleUtils';
import TemplateDataCollector from '../components/TemplateDataCollector';
import { NotificationTemplate } from '../api/templateService';
import toast from 'react-hot-toast';

const TemplateWithXeroData: React.FC = () => {
  const { company } = useAuth();
  const userRole = useUserRole(company);
  
  // Additional protection - redirect if not super admin
  if (!requireAIToolsAccess(company)) {
    console.log('Access denied to Template with Xero Data: User does not have access');
    return <Navigate to="/dashboard" replace />;
  }

  const [collectedData, setCollectedData] = useState<any>(null);
  const [aiResponse, setAiResponse] = useState<string>('');

  const handleDataCollected = (template: NotificationTemplate, data: any, processedTemplate: string) => {
    setCollectedData({
      template,
      data,
      processedTemplate,
      timestamp: new Date().toISOString()
    });
    toast.success('Template data collected successfully!');
  };

  const handleAIGenerated = (response: string) => {
    setAiResponse(response);
    toast.success('AI analysis generated successfully!');
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Template with Xero Data</h1>
            <p className="mt-2 text-gray-600">
              Select compliance templates and automatically collect data from Xero to generate AI-powered insights
            </p>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Template Data Collector */}
            <div>
              <TemplateDataCollector
                onDataCollected={handleDataCollected}
                onAIGenerated={handleAIGenerated}
              />
            </div>

            {/* Results Display */}
            <div className="space-y-6">
              {/* Collected Data Summary */}
              {collectedData && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Collection Summary</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Template Information</h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm">
                          <div><strong>Name:</strong> {collectedData.template.name}</div>
                          <div><strong>Type:</strong> {collectedData.template.type}</div>
                          <div><strong>Compliance:</strong> {collectedData.template.notificationTypes?.join(', ')}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Xero Data Collected</h4>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm space-y-1">
                          <div><strong>Company:</strong> {collectedData.data.companyName}</div>
                          <div><strong>Revenue:</strong> ${collectedData.data.totalRevenue?.toLocaleString()}</div>
                          <div><strong>GST Amount:</strong> ${collectedData.data.gstAmount?.toLocaleString()}</div>
                          <div><strong>Period:</strong> {collectedData.data.period}</div>
                          <div><strong>BAS Number:</strong> {collectedData.data.basNumber}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Processed Template</h4>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <pre className="text-sm text-green-800 whitespace-pre-wrap">
                          {collectedData.processedTemplate}
                        </pre>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      Collected at: {new Date(collectedData.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* AI Analysis */}
              {aiResponse && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis</h3>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <pre className="text-sm text-purple-800 whitespace-pre-wrap">
                      {aiResponse}
                    </pre>
                  </div>
                </div>
              )}

              {/* Instructions */}
              {!collectedData && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use</h3>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                        1
                      </div>
                      <div>
                        <strong>Select a Template:</strong> Choose from available compliance templates (BAS, FBT, IAS, etc.)
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                        2
                      </div>
                      <div>
                        <strong>Data Collection:</strong> The system automatically fetches relevant data from your Xero account
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                        3
                      </div>
                      <div>
                        <strong>AI Analysis:</strong> Get AI-powered insights and recommendations based on your data
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                        4
                      </div>
                      <div>
                        <strong>Use Results:</strong> Apply the processed template and AI recommendations to your compliance workflow
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Features Overview */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-2xl mb-3">🔗</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Xero Integration</h3>
                <p className="text-gray-600 text-sm">
                  Automatically collect company information, financial data, and compliance details from your Xero account.
                </p>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-2xl mb-3">📋</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Template Processing</h3>
                <p className="text-gray-600 text-sm">
                  Replace template variables with real data from Xero to create personalized compliance messages.
                </p>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-2xl mb-3">🤖</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Analysis</h3>
                <p className="text-gray-600 text-sm">
                  Get intelligent insights, compliance recommendations, and risk assessments based on your financial data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default TemplateWithXeroData;

