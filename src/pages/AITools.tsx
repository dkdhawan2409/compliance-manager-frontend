import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import SidebarLayout from '../components/SidebarLayout';
import GlobalOpenAISettings from '../components/GlobalOpenAISettings';
import ComplianceTextGenerator from '../components/ComplianceTextGenerator';
import TemplateGenerator from '../components/TemplateGenerator';
import ContentAnalyzer from '../components/ContentAnalyzer';
import { OpenAISettingsData } from '../api/openaiService';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole, requireAIToolsAccess } from '../utils/roleUtils';
import { companyService } from '../api/companyService';

const AITools: React.FC = () => {
  console.log('AITools component rendered');
  
  const { company } = useAuth();
  const userRole = useUserRole(company);
  
  // Additional protection - redirect if not super admin
  if (!requireAIToolsAccess(company)) {
    console.log('Access denied to AI Tools: User does not have access');
    return <Navigate to="/dashboard" replace />;
  }

  // Load global OpenAI settings on component mount
  useEffect(() => {
    loadGlobalOpenAISettings();
  }, []);

  const loadGlobalOpenAISettings = async () => {
    try {
      const settings = await companyService.getOpenAiSettings();
      setGlobalOpenAISettings(settings);
      console.log('Global OpenAI settings loaded:', settings);
    } catch (error) {
      console.error('Failed to load global OpenAI settings:', error);
      setGlobalOpenAISettings(null);
    }
  };
  
  const [activeTab, setActiveTab] = useState('settings');
  const [openAISettings, setOpenAISettings] = useState<OpenAISettingsData | null>(null);
  const [globalOpenAISettings, setGlobalOpenAISettings] = useState<any>(null);
  const [generatedText, setGeneratedText] = useState('');
  const [generatedTemplate, setGeneratedTemplate] = useState('');
  const [templateType, setTemplateType] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');

  const tabs = [
    { id: 'settings', name: 'OpenAI Settings', icon: '⚙️' },
    { id: 'generator', name: 'Text Generator', icon: '📝' },
    { id: 'templates', name: 'Template Generator', icon: '📋' },
    { id: 'analyzer', name: 'Content Analyzer', icon: '🔍' }
  ];

  const handleSettingsChange = (settings: OpenAISettingsData | null) => {
    setOpenAISettings(settings);
    // Reload global settings after any changes
    loadGlobalOpenAISettings();
  };

  const handleTextGenerated = (text: string) => {
    setGeneratedText(text);
    // You could automatically switch to the analyzer tab here
    // setActiveTab('analyzer');
  };

  const handleTemplateGenerated = (template: string, type: string) => {
    setGeneratedTemplate(template);
    setTemplateType(type);
  };

  const handleAnalysisComplete = (analysis: string) => {
    setAnalysisResult(analysis);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'settings':
        return (
          <GlobalOpenAISettings onSettingsChange={handleSettingsChange} />
        );
      case 'generator':
        return (
          <ComplianceTextGenerator 
            onTextGenerated={handleTextGenerated}
            defaultCompanyName=""
          />
        );
      case 'templates':
        return (
          <TemplateGenerator onTemplateGenerated={handleTemplateGenerated} />
        );
      case 'analyzer':
        return (
          <ContentAnalyzer 
            onAnalysisComplete={handleAnalysisComplete}
            defaultContent={generatedText || generatedTemplate}
          />
        );
      default:
        return null;
    }
  };

  const getTabClass = (tabId: string) => {
    const baseClass = "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors";
    return activeTab === tabId
      ? `${baseClass} bg-indigo-100 text-indigo-700`
      : `${baseClass} text-gray-600 hover:text-gray-900 hover:bg-gray-100`;
  };

  return (
    <SidebarLayout>
      <div className="flex flex-col items-center justify-start min-h-screen">
        <AppNavbar />
        <div className="bg-white/90 rounded-2xl shadow-2xl p-8 max-w-6xl w-full mt-8 md:mt-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-indigo-700 mb-2">AI Tools</h1>
            <p className="text-gray-600">
              Leverage AI to enhance your compliance management with intelligent text generation, 
              template creation, and content analysis.
            </p>
          </div>

          {/* Status Banner */}
          {!globalOpenAISettings?.apiKey && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-yellow-600">⚠️</span>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Global OpenAI Not Configured</h3>
                  <p className="text-sm text-yellow-700">
                    Please configure the global OpenAI API key in the Settings tab. This key will be used by all companies for AI features.
                  </p>
                </div>
              </div>
            </div>
          )}

          {globalOpenAISettings?.apiKey && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <div>
                  <h3 className="text-sm font-medium text-green-800">Global OpenAI Configured</h3>
                  <p className="text-sm text-green-700">
                    Global AI features are ready to use. API key is securely stored and will be used by all companies.
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Model: {globalOpenAISettings.model || 'gpt-3.5-turbo'} | 
                    Max Tokens: {globalOpenAISettings.maxTokens || 1000} | 
                    Temperature: {globalOpenAISettings.temperature || 0.7}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={getTabClass(tab.id)}
                >
                  <span>{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[600px]">
            {renderTabContent()}
          </div>

          {/* Quick Actions */}
          {globalOpenAISettings?.apiKey && (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('generator')}
                  className="p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all text-left"
                >
                  <div className="text-2xl mb-2">📝</div>
                  <h4 className="font-medium text-gray-900">Generate Compliance Text</h4>
                  <p className="text-sm text-gray-600">Create professional compliance reminders</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('templates')}
                  className="p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all text-left"
                >
                  <div className="text-2xl mb-2">📋</div>
                  <h4 className="font-medium text-gray-900">Create Templates</h4>
                  <p className="text-sm text-gray-600">Generate email and SMS templates</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('analyzer')}
                  className="p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all text-left"
                >
                  <div className="text-2xl mb-2">🔍</div>
                  <h4 className="font-medium text-gray-900">Analyze Content</h4>
                  <p className="text-sm text-gray-600">Review compliance and tone</p>
                </button>
              </div>
            </div>
          )}

          {/* Usage Tips */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Usage Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">Text Generation</h4>
                <ul className="space-y-1">
                  <li>• Specify the compliance type and days remaining</li>
                  <li>• Use custom prompts for specific requirements</li>
                  <li>• Choose appropriate AI models for your needs</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Content Analysis</h4>
                <ul className="space-y-1">
                  <li>• Analyze compliance, tone, and effectiveness</li>
                  <li>• Get detailed feedback on your content</li>
                  <li>• Use analysis to improve your communications</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default AITools; 