import React, { useState } from 'react';
import openAIService, { GenerateTemplateRequest } from '../api/openaiService';

interface TemplateGeneratorProps {
  onTemplateGenerated?: (template: string, templateType: string) => void;
}

const TemplateGenerator: React.FC<TemplateGeneratorProps> = ({ onTemplateGenerated }) => {
  const [formData, setFormData] = useState({
    templateType: 'email' as 'email' | 'sms',
    complianceType: '',
    tone: 'professional',
    customPrompt: ''
  });
  const [generatedTemplate, setGeneratedTemplate] = useState('');
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

  const tones = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'formal', label: 'Formal' },
    { value: 'casual', label: 'Casual' }
  ];



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.complianceType) {
      setError('Please select a compliance type');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const request: GenerateTemplateRequest = {
        templateType: formData.templateType,
        complianceType: formData.complianceType,
        tone: formData.tone,
        customPrompt: formData.customPrompt || undefined
      };

      const response = await openAIService.generateTemplate(request);
      setGeneratedTemplate(response.template);
      onTemplateGenerated?.(response.template, response.templateType);
    } catch (error: any) {
      console.error('Error generating template:', error);
      setError(error.message || 'Failed to generate template. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTemplate = () => {
    if (generatedTemplate) {
      navigator.clipboard.writeText(generatedTemplate);
      // You could add a toast notification here
    }
  };

  const handleUseTemplate = () => {
    if (generatedTemplate) {
      onTemplateGenerated?.(generatedTemplate, formData.templateType);
    }
  };

  const getTemplatePreview = () => {
    if (!generatedTemplate) return null;
    
    if (formData.templateType === 'email') {
      // For email templates, try to extract subject and body
      const lines = generatedTemplate.split('\n');
      const subjectLine = lines.find(line => line.toLowerCase().startsWith('subject:'));
      const subject = subjectLine ? subjectLine.replace(/^subject:\s*/i, '') : '';
      const body = lines.filter(line => !line.toLowerCase().startsWith('subject:')).join('\n');
      
      return (
        <div className="space-y-4">
          {subject && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Subject:</h4>
              <div className="bg-blue-50 border border-blue-200 rounded p-2 text-sm">{subject}</div>
            </div>
          )}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Body:</h4>
            <div className="bg-gray-50 border border-gray-200 rounded p-3">
              <div className="whitespace-pre-wrap text-sm">{body}</div>
            </div>
          </div>
        </div>
      );
    } else {
      // For SMS templates, show as is
      return (
        <div className="bg-gray-50 border border-gray-200 rounded p-3">
          <div className="whitespace-pre-wrap text-sm">{generatedTemplate}</div>
        </div>
      );
    }
  };

  return (
    <div className="template-generator bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Generate Template</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Type
            </label>
            <select
              value={formData.templateType}
              onChange={(e) => setFormData({...formData, templateType: e.target.value as 'email' | 'sms'})}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="email">Email Template</option>
              <option value="sms">SMS Template</option>
            </select>
          </div>
          
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
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tone
          </label>
          <select
            value={formData.tone}
            onChange={(e) => setFormData({...formData, tone: e.target.value})}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {tones.map(tone => (
              <option key={tone.value} value={tone.value}>{tone.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Instructions (Optional)
          </label>
          <textarea
            value={formData.customPrompt}
            onChange={(e) => setFormData({...formData, customPrompt: e.target.value})}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            rows="3"
            placeholder="Add specific instructions for the template generation..."
          />
        </div>


        
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate Template'}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}
      
      {generatedTemplate && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Generated {formData.templateType.toUpperCase()} Template
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleCopyTemplate}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Copy
              </button>
              <button
                onClick={handleUseTemplate}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Use Template
              </button>
            </div>
          </div>
          {getTemplatePreview()}
        </div>
      )}
    </div>
  );
};

export default TemplateGenerator; 