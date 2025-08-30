import React, { useState } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import FASProcessor from '../components/FASProcessor';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../utils/roleUtils';
import toast from 'react-hot-toast';

interface FASData {
  FAS_Period: string;
  FAS_Fields: {
    A1: number;
    A2: number;
    A3: number;
    A4: number;
    A5: number;
    A6: number;
    A7: number;
    A8: number;
    A9: number;
  };
}

const FASProcessing: React.FC = () => {
  const { company } = useAuth();
  const userRole = useUserRole(company);

  const [processedFASData, setProcessedFASData] = useState<FASData | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleFASGenerated = (fasData: FASData) => {
    setProcessedFASData(fasData);
    toast.success(`FAS data for ${fasData.FAS_Period} has been processed successfully!`);
  };

  const downloadFASReport = () => {
    if (!processedFASData) return;

    const reportData = {
      generatedAt: new Date().toISOString(),
      company: company?.name || 'Unknown Company',
      fasData: processedFASData,
      summary: {
        totalFringeBenefits: processedFASData.FAS_Fields.A1,
        fbtPayable: processedFASData.FAS_Fields.A5,
        fbtRate: processedFASData.FAS_Fields.A6,
        reportableBenefits: processedFASData.FAS_Fields.A3
      }
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FAS_Report_${processedFASData.FAS_Period}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('FAS report downloaded successfully!');
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">FAS Processing System</h1>
                <p className="mt-2 text-gray-600">
                  Automated Fringe Benefits Tax Activity Statement processing with AI-powered analysis
                </p>
              </div>
              <div className="flex gap-2">
                {processedFASData && (
                  <button
                    onClick={downloadFASReport}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    📥 Download Report
                  </button>
                )}
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  📋 {showHistory ? 'Hide' : 'Show'} History
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-purple-600">4</div>
              <div className="text-sm text-gray-600">Processing Steps</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-indigo-600">9</div>
              <div className="text-sm text-gray-600">FAS Fields</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-pink-600">AI</div>
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
                  <p>FAS processing history will be displayed here</p>
                  <p className="text-sm">Track your FAS processing activities over time</p>
                </div>
              </div>
            </div>
          )}

          {/* FAS Processor Component */}
          <FASProcessor onFASGenerated={handleFASGenerated} />

          {/* Recent Results Summary */}
          {processedFASData && (
            <div className="bg-white rounded-lg shadow mt-6">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Latest FAS Results Summary</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      ${processedFASData.FAS_Fields.A1.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Fringe Benefits (A1)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      ${processedFASData.FAS_Fields.A5.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">FBT Payable (A5)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-600">
                      {processedFASData.FAS_Fields.A6}%
                    </div>
                    <div className="text-sm text-gray-600">FBT Rate (A6)</div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(processedFASData, null, 2))}
                      className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                    >
                      Copy JSON
                    </button>
                    <button
                      onClick={() => {
                        const formatted = `FAS Period: ${processedFASData.FAS_Period}\nA1: $${processedFASData.FAS_Fields.A1.toLocaleString()}\nA5: $${processedFASData.FAS_Fields.A5.toLocaleString()}\nA6: ${processedFASData.FAS_Fields.A6}%`;
                        navigator.clipboard.writeText(formatted);
                        toast.success('FAS summary copied!');
                      }}
                      className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                    >
                      Copy Summary
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1 text-sm bg-pink-100 text-pink-700 rounded hover:bg-pink-200"
                    >
                      Print Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Information Panel */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-3">About FAS Processing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-purple-800">
              <div>
                <h4 className="font-medium mb-2">Processing Steps:</h4>
                <ul className="space-y-1">
                  <li>• <strong>Step 1:</strong> Extract Xero FBT transaction data</li>
                  <li>• <strong>Step 2:</strong> Run FBT anomaly detection analysis</li>
                  <li>• <strong>Step 3:</strong> AI-powered FBT analysis</li>
                  <li>• <strong>Step 4:</strong> Generate ATO-compliant FAS form</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">FAS Fields Mapped:</h4>
                <ul className="space-y-1">
                  <li>• <strong>A1:</strong> Total fringe benefits taxable value</li>
                  <li>• <strong>A5:</strong> FBT payable</li>
                  <li>• <strong>A6:</strong> FBT rate</li>
                  <li>• <strong>A8/A9:</strong> Gross-up rates</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default FASProcessing;
