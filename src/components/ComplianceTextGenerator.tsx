import React, { useState } from 'react';
import openAIService, { GenerateComplianceTextRequest } from '../api/openaiService';
import TemplateDataCollector from './TemplateDataCollector';
import { NotificationTemplate } from '../api/templateService';

interface ComplianceTextGeneratorProps {
  onTextGenerated?: (text: string) => void;
  defaultCompanyName?: string;
  useTemplateDataCollector?: boolean;
}

const ComplianceTextGenerator: React.FC<ComplianceTextGeneratorProps> = ({ 
  onTextGenerated, 
  defaultCompanyName = '',
  useTemplateDataCollector = false
}) => {
  const [formData, setFormData] = useState({
    complianceType: '',
    companyName: defaultCompanyName,
    daysLeft: '',
    customPrompt: ''
  });
  const [generatedText, setGeneratedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const complianceTypes = [
    { value: 'BAS', label: 'BAS (Business Activity Statement)' },
    { value: 'FBT', label: 'FBT (Fringe Benefits Tax)' },
    { value: 'IAS', label: 'IAS (Instalment Activity Statement)' },
    { value: 'FYEND', label: 'Financial Year End' },
    { value: 'GST', label: 'GST (Goods and Services Tax)' },
    { value: 'PAYG', label: 'PAYG (Pay As You Go)' }
  ];



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.complianceType || !formData.companyName || !formData.daysLeft) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const request: GenerateComplianceTextRequest = {
        complianceType: formData.complianceType,
        companyName: formData.companyName,
        daysLeft: parseInt(formData.daysLeft),
        customPrompt: formData.customPrompt || undefined
      };

      const response = await openAIService.generateComplianceText(request);
      setGeneratedText(response.response);
      onTextGenerated?.(response.response);
    } catch (error: any) {
      console.error('Error generating text:', error);
      setError(error.message || 'Failed to generate compliance text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = () => {
    if (generatedText) {
      navigator.clipboard.writeText(generatedText);
      // You could add a toast notification here
    }
  };

  const handleUseText = () => {
    if (generatedText) {
      onTextGenerated?.(generatedText);
    }
  };

  const handleTemplateDataCollected = (template: NotificationTemplate, data: any, processedTemplate: string) => {
    onTextGenerated?.(processedTemplate);
  };

  const handleAIGenerated = (aiResponse: string) => {
    onTextGenerated?.(aiResponse);
  };

  // If using template data collector, render that instead
  if (useTemplateDataCollector) {
    return (
      <div className="compliance-generator bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Template with Xero Data</h2>
          <p className="text-gray-600 mt-2">
            Select a template and automatically collect data from Xero to generate personalized compliance text.
          </p>
        </div>
        <TemplateDataCollector
          onDataCollected={handleTemplateDataCollected}
          onAIGenerated={handleAIGenerated}
        />
      </div>
    );
  }

  return (
    <div className="compliance-generator bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Generate Compliance Text</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compliance Type *
            </label>
            <select
              value={formData.complianceType}
              onChange={(e) => setFormData({...formData, complianceType: e.target.value})}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            >
              <option value="">Select Type</option>
              {complianceTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({...formData, companyName: e.target.value})}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Days Left *
          </label>
          <input
            type="number"
            value={formData.daysLeft}
            onChange={(e) => setFormData({...formData, daysLeft: e.target.value})}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            min="1"
            max="365"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Prompt (Optional)
          </label>
          <textarea
            value={formData.customPrompt}
            onChange={(e) => setFormData({...formData, customPrompt: e.target.value})}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            rows="3"
            placeholder="Add any specific instructions or requirements for the generated text..."
          />
        </div>


        
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate Text'}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}
      
      {generatedText && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Generated Text</h3>
            <div className="flex gap-2">
              <button
                onClick={handleCopyText}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Copy
              </button>
              <button
                onClick={handleUseText}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Use Text
              </button>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <div className="whitespace-pre-wrap text-gray-800">{generatedText}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceTextGenerator; 