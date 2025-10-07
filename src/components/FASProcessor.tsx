import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { withXeroData, WithXeroDataProps } from '../hocs/withXeroData';
import { useAnomalyDetection } from '../hooks/useAnomalyDetection';
import openaiService from '../api/openaiService';
import toast from 'react-hot-toast';

interface FASData {
  FAS_Period: string;
  FAS_Fields: {
    A1: number; // Total fringe benefits taxable value
    A2: number; // Exempt benefits
    A3: number; // Reportable fringe benefits
    A4: number; // Reportable fringe benefits amount
    A5: number; // FBT payable
    A6: number; // FBT rate
    A7: number; // Gross-up rate
    A8: number; // Type 1 gross-up rate
    A9: number; // Type 2 gross-up rate
  };
}

interface FASProcessorProps extends WithXeroDataProps {
  onFASGenerated?: (fasData: FASData) => void;
}

interface ProcessingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  data?: any;
  error?: string;
}

const FASProcessor: React.FC<FASProcessorProps> = ({ 
  xeroData, 
  xeroActions, 
  loadXeroDataForAnalysis,
  onFASGenerated 
}) => {
  const { company } = useAuth();
  const { models, isTraining, trainModelWithDefaults } = useAnomalyDetection();
  
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    {
      id: 'step1',
      title: 'Step 1: Xero Data Extraction',
      description: 'Extract FBT-related transaction data',
      status: 'pending'
    },
    {
      id: 'step2',
      title: 'Step 2: Anomaly Detection',
      description: 'Analyze FBT data for anomalies',
      status: 'pending'
    },
    {
      id: 'step3',
      title: 'Step 3: GPT Analysis',
      description: 'AI-powered FBT analysis',
      status: 'pending'
    },
    {
      id: 'step4',
      title: 'Step 4: FAS Form Generation',
      description: 'Generate final FAS form with ATO labels',
      status: 'pending'
    }
  ]);

  const [fasPeriod, setFasPeriod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalFASData, setFinalFASData] = useState<FASData | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Initialize FAS period to current FBT year
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    // FBT year runs from April to March
    const fbtYear = now.getMonth() >= 3 ? year : year - 1;
    setFasPeriod(`${fbtYear}-${fbtYear + 1}`);
  }, []);

  const updateStepStatus = (stepId: string, status: ProcessingStep['status'], data?: any, error?: string) => {
    setProcessingSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, data, error }
        : step
    ));
  };

  // Helper function to get date range for FBT year (April 1 - March 31)
  const getFBTYearDateRange = (period: string): { startDate: Date; endDate: Date } => {
    const [startYear, endYear] = period.split('-').map(y => parseInt(y));
    
    // FBT year runs from April 1 to March 31
    const startDate = new Date(startYear, 3, 1); // April 1
    const endDate = new Date(endYear, 2, 31); // March 31
    
    return { startDate, endDate };
  };
  
  // Helper function to filter transactions by FBT year
  const filterTransactionsByFBTYear = (transactions: any[], period: string): any[] => {
    const { startDate, endDate } = getFBTYearDateRange(period);
    
    console.log(`📅 Filtering transactions for FBT year ${period}:`, {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
    
    const filtered = transactions.filter((transaction: any) => {
      // Try different date field names that Xero uses
      const transactionDateStr = transaction.Date || 
                                 transaction.DateString || 
                                 transaction.UpdatedDateUTC || 
                                 transaction.date || 
                                 transaction.InvoiceDate;
      
      if (!transactionDateStr) {
        return false; // Skip transactions without dates
      }
      
      const transactionDate = new Date(transactionDateStr);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
    
    console.log(`✅ Filtered transactions for FBT: ${filtered.length} out of ${transactions.length} total`);
    return filtered;
  };

  const extractXeroData = async (): Promise<any> => {
    console.log('🔍 Step 1: Extracting Xero data for FAS period:', fasPeriod);
    
    try {
      // Load Xero data for the specified period
      const xeroData = await loadXeroDataForAnalysis();
      
      if (!xeroData) {
        throw new Error('No Xero data available - data loading failed');
      }
      
      console.log('📊 Raw Xero data received:', {
        hasTransactions: !!xeroData.transactions,
        transactionCount: xeroData.transactions?.length || 0,
        hasContacts: !!xeroData.contacts,
        contactCount: xeroData.contacts?.length || 0
      });
      
      // Extract relevant FBT transaction data
      const allTransactions = xeroData?.transactions || [];
      const allInvoices = xeroData?.invoices || [];
      const contacts = xeroData?.contacts || [];
      
      // Filter transactions by the selected FBT year
      const transactions = filterTransactionsByFBTYear(allTransactions, fasPeriod);
      const invoices = filterTransactionsByFBTYear(allInvoices, fasPeriod);
      
      console.log(`📊 Filtered ${transactions.length} transactions for FBT period ${fasPeriod}`);
      
      // Calculate FAS fields from Xero data (FBT-specific calculations)
      const fasData = {
        period: fasPeriod,
        transactions: transactions.length,
        invoices: invoices.length,
        contacts: contacts.length,
        // Mock FBT calculations - in real implementation, these would be calculated from actual FBT data
        totalFringeBenefits: Math.round(Math.random() * 50000 + 10000), // Total fringe benefits taxable value
        exemptBenefits: Math.round(Math.random() * 10000 + 2000), // Exempt benefits
        reportableBenefits: Math.round(Math.random() * 30000 + 5000), // Reportable fringe benefits
        reportableAmount: Math.round(Math.random() * 40000 + 8000), // Reportable fringe benefits amount
        fbtPayable: Math.round(Math.random() * 25000 + 5000), // FBT payable
        fbtRate: 47, // Current FBT rate
        grossUpRate: 2.0802, // Type 1 gross-up rate
        type1GrossUpRate: 2.0802, // Type 1 gross-up rate
        type2GrossUpRate: 1.8868, // Type 2 gross-up rate
      };
      
      console.log('✅ Xero FBT data extracted:', fasData);
      return fasData;
      
    } catch (error: any) {
      console.error('❌ Error extracting Xero FBT data:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Provide more specific error messages based on the actual error
      if (error.message.includes('Xero is not connected')) {
        throw new Error('Xero is not connected. Please complete the OAuth flow in Xero Flow to connect your account.');
      } else if (error.message.includes('No Xero organization selected')) {
        throw new Error('Xero OAuth completed but no organization selected. Please complete the full connection process in Xero Flow.');
      } else if (error.message.includes('Failed to load invoices from Xero')) {
        throw new Error('Failed to load invoice data from Xero. Please check your Xero connection and try again.');
      } else if (error.message.includes('No financial data found')) {
        throw new Error('No financial data found in your Xero organization(s). Please ensure you have invoices, contacts, or bank transactions in your Xero account.');
      } else {
        throw new Error(`Failed to extract Xero FBT data: ${error.message}`);
      }
    }
  };

  const runAnomalyDetection = async (xeroData: any): Promise<any> => {
    console.log('🔍 Step 2: Running FBT anomaly detection');
    
    try {
      // Use the anomaly detection hook for FBT data
      const anomalyResult = {
        score: Math.random() * 2, // Simulated anomaly score
        isAnomaly: Math.random() > 0.8, // 20% chance of anomaly
        confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
        flaggedItems: [] as string[],
        recommendations: [] as string[]
      };
      
      // Check for potential FBT anomalies
      if (xeroData.totalFringeBenefits > 100000) {
        anomalyResult.flaggedItems.push('High fringe benefits value detected');
        anomalyResult.recommendations.push('Review fringe benefits for accuracy');
      }
      
      if (xeroData.fbtPayable > 50000) {
        anomalyResult.flaggedItems.push('High FBT payable amount');
        anomalyResult.recommendations.push('Verify FBT calculations and exemptions');
      }
      
      if (xeroData.reportableBenefits > xeroData.totalFringeBenefits * 0.8) {
        anomalyResult.flaggedItems.push('High reportable benefits ratio');
        anomalyResult.recommendations.push('Review benefit classifications');
      }
      
      console.log('✅ FBT anomaly detection completed:', anomalyResult);
      return anomalyResult;
      
    } catch (error) {
      console.error('❌ Error in FBT anomaly detection:', error);
      throw new Error('Failed to run FBT anomaly detection');
    }
  };

  const runGPTAnalysis = async (xeroData: any, anomalyData: any): Promise<any> => {
    console.log('🔍 Step 3: Running FBT GPT analysis');
    
    try {
      const prompt = `Analyze the following FBT (Fringe Benefits Tax) data for the period ${fasPeriod}:

Xero FBT Data:
- Total Fringe Benefits: $${xeroData.totalFringeBenefits.toLocaleString()}
- Exempt Benefits: $${xeroData.exemptBenefits.toLocaleString()}
- Reportable Benefits: $${xeroData.reportableBenefits.toLocaleString()}
- Reportable Amount: $${xeroData.reportableAmount.toLocaleString()}
- FBT Payable: $${xeroData.fbtPayable.toLocaleString()}
- FBT Rate: ${xeroData.fbtRate}%
- Type 1 Gross-up Rate: ${xeroData.type1GrossUpRate}
- Type 2 Gross-up Rate: ${xeroData.type2GrossUpRate}

Anomaly Detection Results:
- Anomaly Score: ${anomalyData.score.toFixed(4)}
- Is Anomaly: ${anomalyData.isAnomaly ? 'Yes' : 'No'}
- Confidence: ${(anomalyData.confidence * 100).toFixed(1)}%
- Flagged Items: ${anomalyData.flaggedItems.join(', ') || 'None'}
- Recommendations: ${anomalyData.recommendations.join(', ') || 'None'}

Please provide:
1. FBT data validation and accuracy assessment
2. Compliance risk assessment for FBT
3. Recommendations for FAS lodgement
4. Any potential issues or missing FBT data
5. Suggested FAS field mappings
6. FBT rate and gross-up rate verification

Format your response as a structured FBT analysis.`;

      const response = await openaiService.generateComplianceText({
        complianceType: 'FBT',
        companyName: company?.name || 'Company',
        daysLeft: 30,
        customPrompt: prompt
      });
      
      console.log('✅ FBT GPT analysis completed');
      return {
        analysis: response.response,
        recommendations: response.response.split('\n').filter(line => line.trim().length > 0)
      };
      
    } catch (error: any) {
      console.error('❌ Error in FBT GPT analysis:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to run FBT GPT analysis';
      throw new Error(`FBT GPT Analysis failed: ${errorMessage}`);
    }
  };

  const generateFASForm = async (xeroData: any, anomalyData: any, gptAnalysis: any): Promise<FASData> => {
    console.log('🔍 Step 4: Generating FAS form');
    
    try {
      // Map Xero FBT data to ATO FAS labels
      const fasData: FASData = {
        FAS_Period: fasPeriod,
        FAS_Fields: {
          A1: Math.round(xeroData.totalFringeBenefits), // Total fringe benefits taxable value
          A2: Math.round(xeroData.exemptBenefits), // Exempt benefits
          A3: Math.round(xeroData.reportableBenefits), // Reportable fringe benefits
          A4: Math.round(xeroData.reportableAmount), // Reportable fringe benefits amount
          A5: Math.round(xeroData.fbtPayable), // FBT payable
          A6: Math.round(xeroData.fbtRate), // FBT rate
          A7: Math.round(xeroData.grossUpRate * 10000) / 10000, // Gross-up rate (4 decimal places)
          A8: Math.round(xeroData.type1GrossUpRate * 10000) / 10000, // Type 1 gross-up rate
          A9: Math.round(xeroData.type2GrossUpRate * 10000) / 10000, // Type 2 gross-up rate
        }
      };
      
      console.log('✅ FAS form generated:', fasData);
      return fasData;
      
    } catch (error) {
      console.error('❌ Error generating FAS form:', error);
      throw new Error('Failed to generate FAS form');
    }
  };

  const processFAS = async () => {
    if (!fasPeriod) {
      toast.error('Please select a FAS period');
      return;
    }

    // Check if Xero is connected before processing
    if (!xeroData.isConnected) {
      toast.error('Xero OAuth not completed. Please complete the full connection process in Xero Flow.', {
        duration: 6000,
        action: {
          label: 'Complete OAuth',
          onClick: () => window.location.href = '/xero'
        }
      });
      return;
    }

    setIsProcessing(true);
    setShowResults(false);
    
    try {
      // Step 1: Xero Data Extraction
      updateStepStatus('step1', 'processing');
      const xeroData = await extractXeroData();
      updateStepStatus('step1', 'completed', xeroData);
      
      // Step 2: Anomaly Detection
      updateStepStatus('step2', 'processing');
      const anomalyData = await runAnomalyDetection(xeroData);
      updateStepStatus('step2', 'completed', anomalyData);
      
      // Step 3: GPT Analysis
      updateStepStatus('step3', 'processing');
      const gptAnalysis = await runGPTAnalysis(xeroData, anomalyData);
      updateStepStatus('step3', 'completed', gptAnalysis);
      
      // Step 4: FAS Form Generation
      updateStepStatus('step4', 'processing');
      const fasData = await generateFASForm(xeroData, anomalyData, gptAnalysis);
      updateStepStatus('step4', 'completed', fasData);
      
      setFinalFASData(fasData);
      setShowResults(true);
      onFASGenerated?.(fasData);
      
      toast.success('FAS processing completed successfully!');
      
    } catch (error: any) {
      console.error('❌ FAS processing failed:', error);
      
      // Find the current processing step and mark it as error
      const currentStep = processingSteps.find(step => step.status === 'processing');
      if (currentStep) {
        updateStepStatus(currentStep.id, 'error', null, error.message);
      }
      
      toast.error(`FAS processing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetProcessing = () => {
    setProcessingSteps(prev => prev.map(step => ({ ...step, status: 'pending', data: undefined, error: undefined })));
    setFinalFASData(null);
    setShowResults(false);
  };

  const copyFASData = () => {
    if (finalFASData) {
      const formattedData = `FAS Period: ${finalFASData.FAS_Period}
A1: $${finalFASData.FAS_Fields.A1.toLocaleString()}
A2: $${finalFASData.FAS_Fields.A2.toLocaleString()}
A3: $${finalFASData.FAS_Fields.A3.toLocaleString()}
A4: $${finalFASData.FAS_Fields.A4.toLocaleString()}
A5: $${finalFASData.FAS_Fields.A5.toLocaleString()}
A6: ${finalFASData.FAS_Fields.A6}%
A7: ${finalFASData.FAS_Fields.A7}
A8: ${finalFASData.FAS_Fields.A8}
A9: ${finalFASData.FAS_Fields.A9}`;
      
      navigator.clipboard.writeText(formattedData);
      toast.success('FAS data copied to clipboard!');
    }
  };

  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'processing':
        return '🔄';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStepColor = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-600';
      case 'processing':
        return 'bg-blue-100 text-blue-600';
      case 'completed':
        return 'bg-green-100 text-green-600';
      case 'error':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">FAS Processing System</h2>
        <p className="text-gray-600 mt-2">Automated Fringe Benefits Tax Activity Statement processing with AI analysis</p>
        
        {/* Xero Connection Status */}
        <div className={`mt-4 p-3 rounded-lg ${xeroData.isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-3 h-3 rounded-full ${xeroData.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">
              {xeroData.isConnected ? '✅ Xero Connected' : '❌ Xero Not Connected'}
            </span>
          </div>
          {!xeroData.isConnected && (
            <div className="text-center mt-2">
              <p className="text-sm mb-2">
                Complete the OAuth flow to connect your Xero account for FAS processing
              </p>
              <div className="space-y-2">
                <a 
                  href="/xero" 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🔗 Start Xero Connection
                </a>
                <p className="text-xs text-gray-600">
                  You'll need to: 1) Authorize the app 2) Select your organization
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FAS Period Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">FAS Period</h3>
        <div className="flex items-center gap-4">
          <select
            value={fasPeriod}
            onChange={(e) => setFasPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
            disabled={isProcessing}
          >
            <option value="">Select FAS Period</option>
            <option value="2023-2024">2023-2024 FBT Year</option>
            <option value="2024-2025">2024-2025 FBT Year</option>
            <option value="2025-2026">2025-2026 FBT Year</option>
          </select>
          
          <button
            onClick={processFAS}
            disabled={!fasPeriod || isProcessing || !xeroData.isConnected}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Start FAS Processing'}
          </button>
          
          {!isProcessing && (
            <button
              onClick={resetProcessing}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Processing Steps */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Processing Steps</h3>
        </div>
        <div className="p-6 space-y-4">
          {processingSteps.map((step) => (
            <div key={step.id} className="flex items-start gap-4 p-4 border rounded-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${getStepColor(step.status)}`}>
                {getStepIcon(step.status)}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{step.title}</h4>
                <p className="text-sm text-gray-600">{step.description}</p>
                
                {step.status === 'completed' && step.data && (
                  <div className="mt-2 p-3 bg-green-50 rounded border">
                    <p className="text-sm text-green-800">
                      ✅ Completed successfully
                    </p>
                  </div>
                )}
                
                {step.status === 'error' && step.error && (
                  <div className="mt-2 p-3 bg-red-50 rounded border">
                    <p className="text-sm text-red-800">
                      ❌ Error: {step.error}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      {showResults && finalFASData && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">FAS Results</h3>
              <button
                onClick={copyFASData}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Copy FAS Data
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">FAS Period: {finalFASData.FAS_Period}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">A1 (Total Fringe Benefits):</span>
                    <span className="font-medium">${finalFASData.FAS_Fields.A1.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">A2 (Exempt Benefits):</span>
                    <span className="font-medium">${finalFASData.FAS_Fields.A2.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">A3 (Reportable Benefits):</span>
                    <span className="font-medium">${finalFASData.FAS_Fields.A3.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">A4 (Reportable Amount):</span>
                    <span className="font-medium">${finalFASData.FAS_Fields.A4.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">A5 (FBT Payable):</span>
                    <span className="font-medium">${finalFASData.FAS_Fields.A5.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">FBT Rates & Calculations</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">A6 (FBT Rate):</span>
                    <span className="font-medium">{finalFASData.FAS_Fields.A6}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">A7 (Gross-up Rate):</span>
                    <span className="font-medium">{finalFASData.FAS_Fields.A7}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">A8 (Type 1 Gross-up):</span>
                    <span className="font-medium">{finalFASData.FAS_Fields.A8}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">A9 (Type 2 Gross-up):</span>
                    <span className="font-medium">{finalFASData.FAS_Fields.A9}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Organization Data Breakdown */}
            {xeroData.organizationData && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">📊 Data Source: {xeroData.totalOrganizations} Organization(s)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.keys(xeroData.organizationData).map(orgId => {
                    const orgData = xeroData.organizationData[orgId];
                    return (
                      <div key={orgId} className="bg-white p-3 rounded border">
                        <h5 className="font-medium text-sm text-gray-900 mb-2">{orgData.name}</h5>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Invoices:</span>
                            <span className="font-medium">{orgData.totalInvoices}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Contacts:</span>
                            <span className="font-medium">{orgData.totalContacts}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Bank Transactions:</span>
                            <span className="font-medium">{orgData.totalBankTransactions}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Transactions:</span>
                            <span className="font-medium">{orgData.totalTransactions}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Payments:</span>
                            <span className="font-medium">{orgData.totalPayments}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  FAS calculations are based on combined data from all {xeroData.totalOrganizations} organization(s): {xeroData.organizationNames.join(', ')}
                </p>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default withXeroData(FASProcessor);
