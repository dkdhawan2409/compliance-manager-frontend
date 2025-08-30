import React, { useState, useEffect } from 'react';
import { 
  templateService, 
  useTemplates, 
  useGenerateAITemplate, 
  useCreateTemplate,
  NotificationTemplate,
  CreateNotificationTemplateRequest,
  GenerateAITemplateRequest,
  TemplateStats
} from '../api/templateService';

interface TemplateManagerProps {
  onTemplateSelected?: (template: NotificationTemplate) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ onTemplateSelected }) => {
  const { templates, loading, error, refetch } = useTemplates();
  const { generateTemplate, loading: generating, error: generateError, generatedTemplate } = useGenerateAITemplate();
  const { createTemplate, loading: creating, error: createError } = useCreateTemplate();
  
  const [stats, setStats] = useState<TemplateStats['data'] | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [testModal, setTestModal] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateNotificationTemplateRequest>({
    type: 'email',
    name: '',
    subject: '',
    body: '',
    notificationTypes: ['BAS'],
    smsDays: [],
    emailDays: []
  });

  const [generateForm, setGenerateForm] = useState<GenerateAITemplateRequest>({
    templateType: 'email',
    complianceType: 'BAS',
    tone: 'professional',
    customPrompt: '',
    model: 'gpt-3.5-turbo',
    maxTokens: 4000,
    temperature: 0.7
  });

  const [testForm, setTestForm] = useState({
    companyId: 1,
    channel: 'email' as 'email' | 'sms',
    testData: {
      companyName: 'Test Company',
      complianceType: 'BAS',
      daysLeft: 7,
      date: '2024-03-31'
    }
  });

  // Load template statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await templateService.getTemplateStats();
        setStats(statsData);
      } catch (error) {
        console.error('Failed to load template stats:', error);
      }
    };
    loadStats();
  }, []);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTemplate(createForm);
      setShowCreateForm(false);
      setCreateForm({
        type: 'email',
        name: '',
        subject: '',
        body: '',
        notificationTypes: ['BAS'],
        smsDays: [],
        emailDays: []
      });
      refetch();
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleGenerateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await generateTemplate(generateForm);
      setShowGenerateForm(false);
    } catch (error) {
      console.error('Failed to generate template:', error);
    }
  };

  const handleTestTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      const result = await templateService.testTemplate(selectedTemplate.id, testForm);
      setTestResult(result.success ? 'Test sent successfully!' : result.message);
    } catch (error: any) {
      setTestResult(error.response?.data?.message || 'Test failed');
    }
  };

  const handleUseGeneratedTemplate = () => {
    if (generatedTemplate) {
      setCreateForm({
        ...createForm,
        body: generatedTemplate.template,
        type: generatedTemplate.templateType as 'email' | 'sms'
      });
      setShowCreateForm(true);
      setShowGenerateForm(false);
    }
  };

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
    { value: 'urgent', label: 'Urgent' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2">Loading templates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="text-red-600">Error: {error}</div>
          <button 
            onClick={refetch}
            className="ml-auto text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Template Manager</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGenerateForm(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Generate AI Template
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Create Template
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalTemplates}</div>
              <div className="text-sm text-blue-600">Total Templates</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.emailTemplates}</div>
              <div className="text-sm text-green-600">Email Templates</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.smsTemplates}</div>
              <div className="text-sm text-purple-600">SMS Templates</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Object.keys(stats.templatesByComplianceType).length}
              </div>
              <div className="text-sm text-orange-600">Compliance Types</div>
            </div>
          </div>
        )}
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Notification Templates</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {templates.map((template) => (
            <div key={template.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{template.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      template.type === 'email' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {template.type.toUpperCase()}
                    </span>
                  </div>
                  {template.subject && (
                    <p className="text-sm text-gray-600 mb-2">Subject: {template.subject}</p>
                  )}
                  <p className="text-sm text-gray-700 mb-2">{template.body}</p>
                  {template.notificationTypes && template.notificationTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {template.notificationTypes.map((type) => (
                        <span key={type} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {type}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Created: {new Date(template.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      onTemplateSelected?.(template);
                    }}
                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Use
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setTestModal(true);
                    }}
                    className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                    Test
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Template Generation Modal */}
      {showGenerateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Generate AI Template</h3>
            </div>
            <form onSubmit={handleGenerateTemplate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Type
                  </label>
                  <select
                    value={generateForm.templateType}
                    onChange={(e) => setGenerateForm({...generateForm, templateType: e.target.value as 'email' | 'sms'})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compliance Type
                  </label>
                  <select
                    value={generateForm.complianceType}
                    onChange={(e) => setGenerateForm({...generateForm, complianceType: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {complianceTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tone
                  </label>
                  <select
                    value={generateForm.tone}
                    onChange={(e) => setGenerateForm({...generateForm, tone: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {tones.map((tone) => (
                      <option key={tone.value} value={tone.value}>{tone.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <select
                    value={generateForm.model}
                    onChange={(e) => setGenerateForm({...generateForm, model: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Prompt (Optional)
                </label>
                <textarea
                  value={generateForm.customPrompt}
                  onChange={(e) => setGenerateForm({...generateForm, customPrompt: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20"
                  placeholder="Add any specific requirements or custom instructions..."
                />
              </div>
              {generateError && (
                <div className="text-red-600 text-sm">{generateError}</div>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowGenerateForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Generate Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Template Display */}
      {generatedTemplate && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Generated Template</h3>
            <div className="flex gap-2">
              <button
                onClick={handleUseGeneratedTemplate}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Use This Template
              </button>
              <button
                onClick={() => setGeneratedTemplate(null)}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">
              Type: {generatedTemplate.templateType} | 
              Compliance: {generatedTemplate.complianceType} | 
              Tone: {generatedTemplate.tone} | 
              Model: {generatedTemplate.model}
            </div>
            <div className="whitespace-pre-wrap text-gray-900">{generatedTemplate.template}</div>
            <div className="text-xs text-gray-500 mt-2">
              Tokens used: {generatedTemplate.usage.total_tokens} 
              (Prompt: {generatedTemplate.usage.prompt_tokens}, 
              Completion: {generatedTemplate.usage.completion_tokens})
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create Template</h3>
            </div>
            <form onSubmit={handleCreateTemplate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Type
                  </label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm({...createForm, type: e.target.value as 'email' | 'sms'})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>
              {createForm.type === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={createForm.subject}
                    onChange={(e) => setCreateForm({...createForm, subject: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Body
                </label>
                <textarea
                  value={createForm.body}
                  onChange={(e) => setCreateForm({...createForm, body: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-32"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notification Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {['BAS', 'FBT', 'IAS', 'FYEND'].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={createForm.notificationTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCreateForm({
                              ...createForm,
                              notificationTypes: [...createForm.notificationTypes, type]
                            });
                          } else {
                            setCreateForm({
                              ...createForm,
                              notificationTypes: createForm.notificationTypes.filter(t => t !== type)
                            });
                          }
                        }}
                        className="mr-1"
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>
              {createError && (
                <div className="text-red-600 text-sm">{createError}</div>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Template Modal */}
      {testModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Test Template</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Channel
                </label>
                <select
                  value={testForm.channel}
                  onChange={(e) => setTestForm({...testForm, channel: e.target.value as 'email' | 'sms'})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={testForm.testData.companyName}
                  onChange={(e) => setTestForm({
                    ...testForm,
                    testData: {...testForm.testData, companyName: e.target.value}
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Days Left
                </label>
                <input
                  type="number"
                  value={testForm.testData.daysLeft}
                  onChange={(e) => setTestForm({
                    ...testForm,
                    testData: {...testForm.testData, daysLeft: parseInt(e.target.value)}
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              {testResult && (
                <div className={`p-3 rounded-lg ${
                  testResult.includes('successfully') 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}>
                  {testResult}
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setTestModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTestTemplate}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Send Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;

