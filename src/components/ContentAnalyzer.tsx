import React, { useState } from 'react';
import openAIService, { AnalyzeContentRequest } from '../api/openaiService';

interface ContentAnalyzerProps {
  onAnalysisComplete?: (analysis: string) => void;
  defaultContent?: string;
}

const ContentAnalyzer: React.FC<ContentAnalyzerProps> = ({ 
  onAnalysisComplete, 
  defaultContent = '' 
}) => {
  const [formData, setFormData] = useState({
    content: defaultContent,
    analysisType: 'compliance' as 'compliance' | 'tone' | 'effectiveness',
    customPrompt: ''
  });
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const analysisTypes = [
    { 
      value: 'compliance', 
      label: 'Compliance Analysis',
      description: 'Analyze if the content meets compliance requirements and regulations'
    },
    { 
      value: 'tone', 
      label: 'Tone Analysis',
      description: 'Evaluate the tone, professionalism, and appropriateness of the content'
    },
    { 
      value: 'effectiveness', 
      label: 'Effectiveness Analysis',
      description: 'Assess how effective the content is in conveying the message'
    }
  ];



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      setError('Please enter content to analyze');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const request: AnalyzeContentRequest = {
        content: formData.content,
        analysisType: formData.analysisType,
        customPrompt: formData.customPrompt || undefined
      };

      const response = await openAIService.analyzeContent(request);
      setAnalysis(response.analysis);
      onAnalysisComplete?.(response.analysis);
    } catch (error: any) {
      console.error('Error analyzing content:', error);
      setError(error.message || 'Failed to analyze content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAnalysis = () => {
    if (analysis) {
      navigator.clipboard.writeText(analysis);
      // You could add a toast notification here
    }
  };

  const getAnalysisIcon = () => {
    switch (formData.analysisType) {
      case 'compliance':
        return '📋';
      case 'tone':
        return '🎭';
      case 'effectiveness':
        return '📊';
      default:
        return '🔍';
    }
  };

  const getAnalysisColor = () => {
    switch (formData.analysisType) {
      case 'compliance':
        return 'border-blue-200 bg-blue-50';
      case 'tone':
        return 'border-purple-200 bg-purple-50';
      case 'effectiveness':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="content-analyzer bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Content Analyzer</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Analysis Type
          </label>
          <select
            value={formData.analysisType}
            onChange={(e) => setFormData({...formData, analysisType: e.target.value as 'compliance' | 'tone' | 'effectiveness'})}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {analysisTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {analysisTypes.find(t => t.value === formData.analysisType)?.description}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content to Analyze *
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            rows="6"
            placeholder="Paste your compliance content here for analysis..."
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Analysis Instructions (Optional)
          </label>
          <textarea
            value={formData.customPrompt}
            onChange={(e) => setFormData({...formData, customPrompt: e.target.value})}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            rows="3"
            placeholder="Add specific instructions for the analysis..."
          />
        </div>


        
        <button
          type="submit"
          disabled={loading || !formData.content.trim()}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Analyzing...' : `Analyze ${formData.analysisType.charAt(0).toUpperCase() + formData.analysisType.slice(1)}`}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}
      
      {analysis && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getAnalysisIcon()}</span>
              <h3 className="text-lg font-semibold text-gray-900">
                {formData.analysisType.charAt(0).toUpperCase() + formData.analysisType.slice(1)} Analysis
              </h3>
            </div>
            <button
              onClick={handleCopyAnalysis}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              Copy Analysis
            </button>
          </div>
          <div className={`border rounded-md p-4 ${getAnalysisColor()}`}>
            <div className="whitespace-pre-wrap text-gray-800">{analysis}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentAnalyzer; 