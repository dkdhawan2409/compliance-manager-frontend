import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useXero } from '../hooks/useXero';
import { getXeroCompanyInfo, getFinancialSummary, getAllInvoices } from '../api/xeroService';
import { templateService, NotificationTemplate } from '../api/templateService';
import TemplateSelector from './TemplateSelector';
import toast from 'react-hot-toast';

interface TemplateDataCollectorProps {
  onDataCollected?: (template: NotificationTemplate, data: any, processedTemplate: string) => void;
  onAIGenerated?: (aiResponse: string) => void;
}

interface XeroData {
  companyName: string;
  amount: number;
  period: string;
  gstAmount: number;
  basNumber: string;
  fbtAmount?: number;
  fbtYear?: string;
  fbtNumber?: string;
  instalmentAmount?: number;
  quarter?: string;
  year?: string;
  iasNumber?: string;
  financialYear?: string;
  totalRevenue?: number;
  totalExpenses?: number;
  netIncome?: number;
  employeeCount?: number;
  paygAmount?: number;
  paygNumber?: string;
  gstNumber?: string;
  registrationStatus?: string;
}

const TemplateDataCollector: React.FC<TemplateDataCollectorProps> = ({
  onDataCollected,
  onAIGenerated
}) => {
  const { company } = useAuth();
  const { isConnected, connectionStatus } = useXero();
  
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [xeroData, setXeroData] = useState<XeroData | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [processedTemplate, setProcessedTemplate] = useState<string>('');

  // Extract variables from template body
  const extractVariables = (templateBody: string): string[] => {
    const variableRegex = /\{([^}]+)\}/g;
    const variables: string[] = [];
    let match;
    while ((match = variableRegex.exec(templateBody)) !== null) {
      variables.push(match[1]); // Remove curly braces
    }
    return Array.from(new Set(variables)); // Remove duplicates
  };

  // Get compliance type from template
  const getComplianceType = (template: NotificationTemplate): string => {
    return template.notificationTypes?.[0] || 'BAS';
  };

  // Fetch Xero data based on compliance type
  const fetchXeroData = async (complianceType: string): Promise<XeroData> => {
    setLoading(true);
    
    try {
      // Get company info
      const companyInfo = await getXeroCompanyInfo();
      
      // Get financial summary
      const financialSummary = await getFinancialSummary();
      
      // Get recent invoices for additional data
      const invoices = await getAllInvoices(1, 10);
      
      // Calculate GST amount from invoices (simplified calculation)
      let gstAmount = 0;
      if (invoices.data && Array.isArray(invoices.data)) {
        invoices.data.forEach((invoice: any) => {
          const amount = parseFloat(invoice.Total) || 0;
          gstAmount += amount * 0.1; // Assume 10% GST
        });
      }

      // Generate BAS number (format: BAS-YYYY-QX)
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
      const basNumber = `BAS-${year}-Q${quarter}`;

      // Base data structure
      const data: XeroData = {
        companyName: companyInfo.companyName || 'Unknown Company',
        amount: parseFloat(financialSummary.data.totalRevenue) || 0,
        period: `Q${quarter} ${year}`,
        gstAmount: gstAmount,
        basNumber: basNumber,
        totalRevenue: parseFloat(financialSummary.data.totalRevenue) || 0,
        totalExpenses: parseFloat(financialSummary.data.totalExpenses) || 0,
        netIncome: parseFloat(financialSummary.data.netIncome) || 0,
        gstNumber: companyInfo.id || 'GST-UNKNOWN',
        registrationStatus: 'Active'
      };

      // Add compliance-specific data
      switch (complianceType) {
        case 'FBT':
          data.fbtAmount = data.totalRevenue * 0.05; // Estimate 5% of revenue
          data.fbtYear = year.toString();
          data.fbtNumber = `FBT-${year}`;
          data.employeeCount = 10; // Default estimate
          break;
        case 'IAS':
          data.instalmentAmount = data.totalRevenue * 0.25; // Estimate 25% of revenue
          data.quarter = `Q${quarter}`;
          data.year = year.toString();
          data.iasNumber = `IAS-${year}-Q${quarter}`;
          break;
        case 'FYEND':
          data.financialYear = `${year}-${year + 1}`;
          break;
        case 'PAYG':
          data.paygAmount = data.totalRevenue * 0.02; // Estimate 2% of revenue
          data.employeeCount = 10; // Default estimate
          data.paygNumber = `PAYG-${year}`;
          break;
        case 'GST':
          // GST data already calculated above
          break;
        default:
          // BAS data already calculated above
          break;
      }

      return data;
    } catch (error) {
      console.error('Error fetching Xero data:', error);
      toast.error('Failed to fetch Xero data. Please check your connection.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Process template with collected data
  const processTemplate = (template: string, data: XeroData): string => {
    let processed = template;
    
    // Replace all variables with actual data
    const variableMappings: Record<string, any> = {
      companyName: data.companyName,
      daysLeft: 7, // Default to 7 days
      amount: data.amount,
      period: data.period,
      gstAmount: data.gstAmount,
      basNumber: data.basNumber,
      fbtAmount: data.fbtAmount,
      fbtYear: data.fbtYear,
      fbtNumber: data.fbtNumber,
      employeeCount: data.employeeCount,
      instalmentAmount: data.instalmentAmount,
      quarter: data.quarter,
      year: data.year,
      iasNumber: data.iasNumber,
      financialYear: data.financialYear,
      totalRevenue: data.totalRevenue,
      totalExpenses: data.totalExpenses,
      netIncome: data.netIncome,
      paygAmount: data.paygAmount,
      paygNumber: data.paygNumber,
      gstNumber: data.gstNumber,
      registrationStatus: data.registrationStatus
    };

    Object.entries(variableMappings).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        processed = processed.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
      }
    });

    return processed;
  };

  // Generate AI response with template and data
  const generateAIResponse = async (template: NotificationTemplate, data: XeroData) => {
    setProcessing(true);
    
    try {
      const complianceType = getComplianceType(template);
      const processedTemplateText = processTemplate(template.body, data);
      
      // Create comprehensive prompt for AI
      const aiPrompt = `
Template Information:
- Name: ${template.name}
- Compliance Type: ${complianceType}
- Original Template: ${template.body}
- Processed Template: ${processedTemplateText}

Xero Data Context:
- Company: ${data.companyName}
- Total Revenue: $${data.totalRevenue?.toLocaleString()}
- GST Amount: $${data.gstAmount?.toLocaleString()}
- Period: ${data.period}
- BAS Number: ${data.basNumber}

Please analyze this template with the provided Xero data and provide:
1. Template effectiveness analysis
2. Compliance requirements covered
3. Suggested improvements
4. Best practices for usage
5. Risk assessment and mitigation strategies
6. Any additional recommendations based on the financial data
`;

      const response = await templateService.generateAITemplate({
        templateType: template.type,
        complianceType: complianceType,
        tone: 'professional',
        customPrompt: aiPrompt
      });

      setAiResponse(response.template);
      setProcessedTemplate(processedTemplateText);
      
      // Call callbacks
      onDataCollected?.(template, data, processedTemplateText);
      onAIGenerated?.(response.template);
      
      toast.success('Template processed and AI analysis generated successfully!');
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      toast.error('Failed to generate AI analysis');
    } finally {
      setProcessing(false);
    }
  };

  // Handle template selection
  const handleTemplateSelect = async (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    
    try {
      const complianceType = getComplianceType(template);
      const data = await fetchXeroData(complianceType);
      setXeroData(data);
      
      // Auto-generate AI response
      await generateAIResponse(template, data);
      
    } catch (error) {
      console.error('Error processing template:', error);
    }
  };

  // Manual data refresh
  const handleRefreshData = async () => {
    if (!selectedTemplate) return;
    
    try {
      const complianceType = getComplianceType(selectedTemplate);
      const data = await fetchXeroData(complianceType);
      setXeroData(data);
      
      // Re-generate AI response with fresh data
      await generateAIResponse(selectedTemplate, data);
      
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Template Data Collector</h2>
        <p className="text-gray-600 mt-2">
          Select a template and automatically collect data from Xero to generate AI-powered compliance insights.
        </p>
      </div>

      {/* Xero Connection Status */}
      <div className="mb-6">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          isConnected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            isConnected ? 'bg-green-400' : 'bg-red-400'
          }`}></div>
          {isConnected ? 'Connected to Xero' : 'Not connected to Xero'}
        </div>
        {!isConnected && (
          <p className="text-sm text-red-600 mt-1">
            Please connect to Xero to collect financial data automatically.
          </p>
        )}
      </div>

      {/* Template Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Template
        </label>
        <TemplateSelector
          onTemplateSelect={handleTemplateSelect}
          selectedTemplate={selectedTemplate}
          placeholder="Choose a compliance template..."
        />
      </div>

      {/* Xero Data Display */}
      {xeroData && selectedTemplate && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Xero Data</h3>
            <button
              onClick={handleRefreshData}
              disabled={loading}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Company</div>
              <div className="font-medium">{xeroData.companyName}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Total Revenue</div>
              <div className="font-medium">${xeroData.totalRevenue?.toLocaleString()}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">GST Amount</div>
              <div className="font-medium">${xeroData.gstAmount?.toLocaleString()}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Period</div>
              <div className="font-medium">{xeroData.period}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">BAS Number</div>
              <div className="font-medium">{xeroData.basNumber}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Net Income</div>
              <div className="font-medium">${xeroData.netIncome?.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Processed Template */}
      {processedTemplate && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Processed Template</h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm text-green-800">{processedTemplate}</pre>
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {aiResponse && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Analysis</h3>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm text-purple-800">{aiResponse}</pre>
          </div>
        </div>
      )}

      {/* Loading States */}
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Fetching Xero data...</p>
        </div>
      )}

      {processing && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Generating AI analysis...</p>
        </div>
      )}
    </div>
  );
};

export default TemplateDataCollector;

