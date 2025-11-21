import React, { useState } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import BASProcessor from '../components/BASProcessor';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole, requireAIToolsAccess } from '../utils/roleUtils';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { downloadBASReportPdf } from '../api/xeroService';

interface BASData {
  BAS_Period: string;
  BAS_Fields: {
    G1: number;
    G2: number;
    G3: number;
    G10: number;
    G11: number;
    '1A': number;
    '1B': number;
    W1: number;
    W2: number;
  };
}

const BASProcessing: React.FC = () => {
  const { company } = useAuth();
  const userRole = useUserRole(company);
  
  // Allow both normal users and super admins to access BAS Processing
  // No additional restrictions needed

  const [processedBASData, setProcessedBASData] = useState<BASData | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);

  const handleBASGenerated = (basData: BASData) => {
    setProcessedBASData(basData);
    toast.success(`BAS data for ${basData.BAS_Period} has been processed successfully!`);
  };

  const downloadBASReport = async () => {
    if (!processedBASData || isDownloadingReport) return;

    try {
      setIsDownloadingReport(true);
      const gstOnSales = processedBASData.BAS_Fields['1A'];
      const gstOnPurchases = processedBASData.BAS_Fields['1B'];

      const payload = {
        basData: processedBASData,
        summary: {
          totalSales: processedBASData.BAS_Fields.G1,
          totalGST: gstOnSales,
          gstOnPurchases,
          netGST: gstOnSales - gstOnPurchases,
          totalWages: processedBASData.BAS_Fields.W1,
          paygWithholding: processedBASData.BAS_Fields.W2
        },
        metadata: {
          companyName: company?.name || 'Unknown Company',
          generatedAt: new Date().toISOString(),
          dataSource: 'Xero Accounting',
          reportType: 'Business Activity Statement',
          notes: 'BAS PDF generated from processed BAS data based on Xero account information.'
        }
      };

      const pdfBlob = await downloadBASReportPdf(payload);
      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const safePeriod = processedBASData.BAS_Period.replace(/[^a-z0-9]+/gi, '_');
      link.download = `BAS_Report_${safePeriod}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('BAS PDF downloaded successfully!');
    } catch (error: any) {
      console.error('Failed to download BAS PDF:', error);
      const message = error?.response?.data?.message || 'Failed to download BAS PDF. Please try again.';
      toast.error(message);
    } finally {
      setIsDownloadingReport(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">BAS Processing System</h1>
                <p className="mt-2 text-gray-600">
                  Automated Business Activity Statement processing with AI-powered analysis
                </p>
              </div>
              <div className="flex gap-2">
                {processedBASData && (
                  <button
                    onClick={downloadBASReport}
                    disabled={isDownloadingReport}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDownloadingReport ? '⏳ Preparing PDF...' : '📥 Download PDF'}
                  </button>
                )}
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  📋 {showHistory ? 'Hide' : 'Show'} History
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-blue-600">4</div>
              <div className="text-sm text-gray-600">Processing Steps</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-green-600">9</div>
              <div className="text-sm text-gray-600">BAS Fields</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-purple-600">AI</div>
              <div className="text-sm text-gray-600">Powered Analysis</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-orange-600">ATO</div>
              <div className="text-sm text-gray-600">Compliant</div>
            </div>
          </div>

          {/* Processing History */}
          {showHistory && (
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Processing History</h3>
              </div>
              <div className="p-6">
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">📊</div>
                  <p>Processing history will be displayed here</p>
                  <p className="text-sm">Track your BAS processing activities over time</p>
                </div>
              </div>
            </div>
          )}

          {/* BAS Processor Component */}
          <BASProcessor onBASGenerated={handleBASGenerated} />

          {/* Recent Results Summary */}
          {processedBASData && (
            <div className="bg-white rounded-lg shadow mt-6">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Latest BAS Results Summary</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      ${processedBASData.BAS_Fields.G1.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Sales (G1)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ${(processedBASData.BAS_Fields['1A'] - processedBASData.BAS_Fields['1B']).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Net GST (1A - 1B)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      ${processedBASData.BAS_Fields.W2.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">PAYG Withholding (W2)</div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(processedBASData, null, 2))}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Copy JSON
                    </button>
                    <button
                      onClick={() => {
                        const formatted = `BAS Period: ${processedBASData.BAS_Period}\nG1: $${processedBASData.BAS_Fields.G1.toLocaleString()}\n1A: $${processedBASData.BAS_Fields['1A'].toLocaleString()}\n1B: $${processedBASData.BAS_Fields['1B'].toLocaleString()}\nW2: $${processedBASData.BAS_Fields.W2.toLocaleString()}`;
                        navigator.clipboard.writeText(formatted);
                        toast.success('BAS summary copied!');
                      }}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Copy Summary
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                    >
                      Print Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Information Panel */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">About BAS Processing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">Processing Steps:</h4>
                <ul className="space-y-1">
                  <li>• <strong>Step 1:</strong> Extract Xero transaction data</li>
                  <li>• <strong>Step 2:</strong> Run anomaly detection analysis</li>
                  <li>• <strong>Step 3:</strong> AI-powered GPT analysis</li>
                  <li>• <strong>Step 4:</strong> Generate ATO-compliant BAS form</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">BAS Fields Mapped:</h4>
                <ul className="space-y-1">
                  <li>• <strong>G1:</strong> Total sales (including GST)</li>
                  <li>• <strong>1A:</strong> GST on sales</li>
                  <li>• <strong>1B:</strong> GST on purchases</li>
                  <li>• <strong>W2:</strong> PAYG withholding</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default BASProcessing;
