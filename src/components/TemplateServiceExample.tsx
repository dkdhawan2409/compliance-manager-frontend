import React, { useState } from 'react';
import { 
  templateService, 
  useTemplates, 
  useGenerateAITemplate, 
  useCreateTemplate,
  NotificationTemplate,
  CreateNotificationTemplateRequest,
  GenerateAITemplateRequest
} from '../api/templateService';

/**
 * Example component demonstrating the new template service with backward compatibility
 * This shows how to use both the legacy and new API endpoints seamlessly
 */
const TemplateServiceExample: React.FC = () => {
  const { templates, loading, error, refetch } = useTemplates();
  const { generateTemplate, loading: generating, error: generateError } = useGenerateAITemplate();
  const { createTemplate, loading: creating, error: createError } = useCreateTemplate();
  
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string>('');

  // Example: Generate an AI template
  const handleGenerateExample = async () => {
    try {
      const request: GenerateAITemplateRequest = {
        templateType: 'email',
        complianceType: 'BAS',
        tone: 'professional',
        customPrompt: 'Include specific details about BAS lodgement requirements',
        model: 'gpt-3.5-turbo',
        maxTokens: 2000,
        temperature: 0.7
      };

      const result = await generateTemplate(request);
      setGeneratedContent(result.template);
      console.log('Generated template:', result);
    } catch (error) {
      console.error('Failed to generate template:', error);
    }
  };

  // Example: Create a template using the new API
  const handleCreateExample = async () => {
    try {
      const templateData: CreateNotificationTemplateRequest = {
        type: 'email',
        name: 'BAS Reminder Template',
        subject: 'BAS Due Soon - Action Required',
        body: 'Dear {companyName}, your BAS is due in {daysLeft} days. Please ensure timely lodgement.',
        notificationTypes: ['BAS'],
        emailDays: [1, 7, 14]
      };

      const result = await createTemplate(templateData);
      console.log('Created template:', result);
      refetch(); // Refresh the templates list
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  // Example: Test a template
  const handleTestExample = async () => {
    if (!selectedTemplate) return;

    try {
      const testData = {
        companyId: 1,
        channel: 'email' as 'email' | 'sms',
        testData: {
          companyName: 'Example Company',
          complianceType: 'BAS',
          daysLeft: 7,
          date: '2024-03-31'
        }
      };

      const result = await templateService.testTemplate(selectedTemplate.id, testData);
      console.log('Test result:', result);
    } catch (error) {
      console.error('Failed to test template:', error);
    }
  };

  // Example: Get template statistics
  const handleGetStats = async () => {
    try {
      const stats = await templateService.getTemplateStats();
      console.log('Template statistics:', stats);
    } catch (error) {
      console.error('Failed to get stats:', error);
    }
  };

  // Example: Get templates by type
  const handleGetByType = async (type: 'email' | 'sms') => {
    try {
      const templates = await templateService.getTemplatesByType(type);
      console.log(`${type} templates:`, templates);
    } catch (error) {
      console.error(`Failed to get ${type} templates:`, error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-blue-900 mb-2">
          Template Service Example
        </h2>
        <p className="text-blue-700">
          This component demonstrates the new template service with backward compatibility.
          It shows how to use both legacy and new API endpoints seamlessly.
        </p>
      </div>

      {/* API Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">API Examples</h3>
          <div className="space-y-2">
            <button
              onClick={handleGenerateExample}
              disabled={generating}
              className="w-full px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate AI Template'}
            </button>
            
            <button
              onClick={handleCreateExample}
              disabled={creating}
              className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Template'}
            </button>
            
            <button
              onClick={handleGetStats}
              className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Get Template Stats
            </button>
            
            <button
              onClick={() => handleGetByType('email')}
              className="w-full px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Get Email Templates
            </button>
            
            <button
              onClick={() => handleGetByType('sms')}
              className="w-full px-3 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
            >
              Get SMS Templates
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Template Actions</h3>
          <div className="space-y-2">
            <select
              value={selectedTemplate?.id || ''}
              onChange={(e) => {
                const template = templates.find(t => t.id === parseInt(e.target.value));
                setSelectedTemplate(template || null);
              }}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Select a template to test</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.type})
                </option>
              ))}
            </select>
            
            <button
              onClick={handleTestExample}
              disabled={!selectedTemplate}
              className="w-full px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
            >
              Test Selected Template
            </button>
          </div>
        </div>
      </div>

      {/* Generated Content Display */}
      {generatedContent && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Generated Template</h3>
          <div className="bg-gray-50 p-3 rounded border">
            <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
          </div>
        </div>
      )}

      {/* Error Display */}
      {(error || generateError || createError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Errors</h3>
          <div className="space-y-1 text-sm text-red-700">
            {error && <div>Fetch Error: {error}</div>}
            {generateError && <div>Generation Error: {generateError}</div>}
            {createError && <div>Creation Error: {createError}</div>}
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Templates (Backward Compatible)</h3>
          <button
            onClick={refetch}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-4">Loading templates...</div>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => (
              <div key={template.id} className="border border-gray-200 rounded p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-gray-600">{template.type}</p>
                    {template.subject && (
                      <p className="text-sm text-gray-500">Subject: {template.subject}</p>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    ID: {template.id}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Backward Compatibility Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Backward Compatibility Features
        </h3>
        <ul className="text-green-700 space-y-1 text-sm">
          <li>• Legacy `/api/companies/templates` endpoint still works</li>
          <li>• New `/api/templates` endpoint provides enhanced features</li>
          <li>• Automatic fallback between old and new endpoints</li>
          <li>• Same interface for both legacy and new APIs</li>
          <li>• AI-powered template generation</li>
          <li>• Template testing and statistics</li>
        </ul>
      </div>
    </div>
  );
};

export default TemplateServiceExample;

