import React from 'react';

interface BasSummary {
  totalSales: number;
  totalPurchases: number;
  gstOnSales: number;
  gstOnPurchases: number;
  netGST: number;
  hasData?: boolean;
}

interface FbtExposure {
  totalFringeBenefits: number;
  totalFBT: number;
  categories?: Record<string, number>;
  keyRisks?: string[];
  hasData?: boolean;
}

interface FinancialAnalysis {
  Cashflow_Projection: {
    Month_1: number;
    Month_2: number;
    Month_3: number;
  };
  GST_Estimate_Next_Period: number;
  BAS_Summary?: BasSummary | null;
  FBT_Exposure?: FbtExposure | null;
  Insights: string[];
  Recommended_Actions: string[];
}

interface FinancialAnalysisDisplayProps {
  analysis: FinancialAnalysis;
}

const FinancialAnalysisDisplay: React.FC<FinancialAnalysisDisplayProps> = ({ analysis }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthName = (monthNumber: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() + monthNumber);
    return date.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900">AI Financial Analysis Report</h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* Cashflow Projection */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4">
        <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">90-Day Cashflow Projection</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">
              {formatCurrency(analysis.Cashflow_Projection.Month_1)}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">{getMonthName(1)}</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">
              {formatCurrency(analysis.Cashflow_Projection.Month_2)}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">{getMonthName(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">
              {formatCurrency(analysis.Cashflow_Projection.Month_3)}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">{getMonthName(3)}</div>
          </div>
        </div>
      </div>

      {/* GST Estimate */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 sm:p-4">
        <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">GST Estimate (Next Period)</h4>
        <div className="text-2xl sm:text-3xl font-bold text-green-600">
          {formatCurrency(analysis.GST_Estimate_Next_Period)}
        </div>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Estimated GST payable/receivable for the next BAS period</p>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 sm:p-4">
        <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Key Insights</h4>
        <div className="space-y-2">
          {analysis.Insights.map((insight, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm sm:text-base text-gray-700 break-words">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-3 sm:p-4">
        <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Recommended Actions</h4>
        <div className="space-y-3">
          {analysis.Recommended_Actions.map((action, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
                {index + 1}
              </div>
              <p className="text-sm sm:text-base text-gray-700 break-words">{action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Raw JSON Data - Always Visible */}
      <div className="bg-gray-50 rounded-lg border border-gray-200">
        <div className="p-3 sm:p-4 bg-gray-100 border-b border-gray-200">
          <h4 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Raw JSON Data
          </h4>
        </div>
        <div className="p-3 sm:p-4">
          <pre className="text-xs bg-white p-3 rounded border overflow-x-auto max-h-80 overflow-y-auto whitespace-pre-wrap font-mono text-gray-800">
            {JSON.stringify(analysis, null, 2)}
          </pre>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-gray-500 text-center border-t border-gray-200 pt-3 sm:pt-4">
        <p>
          This analysis is based on Xero data and AI-generated insights. 
          Please consult with a qualified financial advisor before making any business decisions.
        </p>
      </div>
    </div>
  );
};

export default FinancialAnalysisDisplay;
