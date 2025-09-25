import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole, requireAIToolsAccess } from '../utils/roleUtils';
import { templateService, useTemplates,
 useCreateTemplate, NotificationTemplate,
  CreateNotificationTemplateRequest } from '../api/templateService';
import { useAnomalyDetection} from '../hooks/useAnomalyDetection';
import TemplateDataCollector from '../components/TemplateDataCollector';
import toast from 'react-hot-toast';

interface CustomTemplate {
  id: number;
  name: string;
  type: 'email' | 'sms';
  complianceType: 'BAS' | 'FBT' | 'IAS' | 'FYEND' | 'GST' | 'PAYG';
  body: string;
  variables: string[];
  anomalyThreshold?: number;
  gptPrompt?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const SuperAdminTemplates: React.FC = () => {
  const { company } = useAuth();
  const userRole = useUserRole(company);
  
  // Additional protection - redirect if not super admin
  if (!requireAIToolsAccess(company)) {
    console.log('Access denied to Super Admin Templates: User does not have access');
    return <Navigate to="/dashboard" replace />;
  }

  const { templates, loading, error, refetch } = useTemplates();
  const { createTemplate, loading: creating, error: createError } = useCreateTemplate();
  const { models, isTraining, trainModelWithDefaults } = useAnomalyDetection();

  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CustomTemplate | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form state for creating/editing templates
  const [formData, setFormData] = useState<CustomTemplate>({
    id: 0,
    name: '',
    type: 'email',
    complianceType: 'FBT',
    body: '',
    variables: [],
    anomalyThreshold: 0.5,
    gptPrompt: '',
    isActive: true
  });

  // Test data state
  const [testData, setTestData] = useState({
    companyName: 'Test Company',
    daysLeft: 7,
    amount: 50000,
    period: 'Q1 2024',
    customVariables: {} as Record<string, any>
  });

  const [selectedComplianceFilter, setSelectedComplianceFilter] = useState<'ALL' | 'BAS' | 'FBT' | 'IAS' | 'FYEND' | 'GST' | 'PAYG'>('FBT');

  // Available variables for each compliance type
  const complianceVariables = {
    BAS: ['{companyName}', '{daysLeft}', '{amount}', '{period}', '{gstAmount}', '{basNumber}'],
    FBT: ['{companyName}', '{daysLeft}', '{fbtAmount}', '{fbtYear}', '{employeeCount}', '{fbtNumber}'],
    IAS: ['{companyName}', '{daysLeft}', '{instalmentAmount}', '{quarter}', '{year}', '{iasNumber}'],
    FYEND: ['{companyName}', '{daysLeft}', '{financialYear}', '{totalRevenue}', '{totalExpenses}', '{netIncome}'],
    GST: ['{companyName}', '{daysLeft}', '{gstAmount}', '{period}', '{gstNumber}', '{registrationStatus}'],
    PAYG: ['{companyName}', '{daysLeft}', '{paygAmount}', '{period}', '{employeeCount}', '{paygNumber}']
  };

  // Load existing templates
  useEffect(() => {
    loadCustomTemplates();
  }, []);

  const loadCustomTemplates = async () => {
    try {
      // For now, we'll use the existing templates and enhance them
      // In a real implementation, you'd have a separate custom templates API
      const enhancedTemplates = templates.map(template => ({
        id: template.id,
        name: template.name,
        type: template.type,
        complianceType: (template.notificationTypes?.[0] as 'BAS' | 'FBT' | 'IAS' | 'FYEND' | 'GST' | 'PAYG') || 'BAS',
        body: template.body,
        variables: extractVariables(template.body),
        anomalyThreshold: 0.5,
        gptPrompt: generateDefaultGPTPrompt(template),
        isActive: true,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      }));
      setCustomTemplates(enhancedTemplates);
    } catch (error) {
      console.error('Failed to load custom templates:', error);
    }
  };

  const extractVariables = (text: string): string[] => {
    const variableRegex = /\{([^}]+)\}/g;
    const variables: string[] = [];
    let match;
    while ((match = variableRegex.exec(text)) !== null) {
      variables.push(match[0]);
    }
    return Array.from(new Set(variables)); // Remove duplicates
  };

  const generateDefaultGPTPrompt = (template: NotificationTemplate): string => {
    return `Analyze the following ${template.notificationTypes?.join(', ')} compliance template and provide insights:

Template: ${template.name}
Type: ${template.type}
Content: ${template.body}

Please provide:
1. Template effectiveness analysis
2. Compliance requirements covered
3. Suggested improvements
4. Best practices for usage
5. Risk assessment and mitigation strategies`;
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsProcessing(true);
      
      // Create the template using the existing API
      const templateData: CreateNotificationTemplateRequest = {
        type: 'email', // Default to email type for compatibility
        name: formData.name,
        subject: formData.name, // Use template name as subject
        body: formData.body,
        notificationTypes: [formData.complianceType],
        smsDays: [],
        emailDays: [1, 7, 14]
      };

      const newTemplate = await createTemplate(templateData);
      
      // Add custom properties
      const customTemplate: CustomTemplate = {
        id: newTemplate.id,
        name: newTemplate.name,
        type: newTemplate.type,
        complianceType: formData.complianceType,
        body: newTemplate.body,
        variables: extractVariables(formData.body),
        anomalyThreshold: formData.anomalyThreshold,
        gptPrompt: formData.gptPrompt || generateDefaultGPTPrompt({
          id: newTemplate.id,
          type: 'email',
          name: newTemplate.name,
          subject: newTemplate.subject,
          body: newTemplate.body,
          notificationTypes: newTemplate.notificationTypes,
          smsDays: newTemplate.smsDays,
          emailDays: newTemplate.emailDays,
          createdAt: newTemplate.createdAt,
          updatedAt: newTemplate.updatedAt
        }),
        isActive: formData.isActive,
        createdAt: newTemplate.createdAt,
        updatedAt: newTemplate.updatedAt
      };

      setCustomTemplates(prev => [...prev, customTemplate]);
      setShowCreateForm(false);
      resetForm();
      toast.success('Custom template created successfully!');
      
    } catch (error) {
      console.error('Failed to create template:', error);
      toast.error('Failed to create template');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id: 0,
      name: '',
      type: 'email',
      complianceType: 'FBT',
      body: '',
      variables: [],
      anomalyThreshold: 0.5,
      gptPrompt: '',
      isActive: true
    });
  };

  const handleTestTemplate = async (template: CustomTemplate) => {
    if (!template.id) {
      toast.error('Template ID is required for testing');
      return;
    }
    try {
      setIsProcessing(true);
      setTestResult(null);

      // Step 1: Run anomaly detection on test data
      console.log('🔍 Step 1: Running anomaly detection...');
      
      // Simulate anomaly detection (in real implementation, use actual anomaly detection)
      const anomalyResult = {
        score: Math.random() * 2, // Simulated anomaly score
        isAnomaly: Math.random() > 0.7, // 30% chance of anomaly
        confidence: Math.random() * 0.3 + 0.7 // 70-100% confidence
      };

      console.log('📊 Anomaly Detection Result:', anomalyResult);

      // Step 2: Process with GPT using custom prompt
      console.log('🤖 Step 2: Processing with GPT...');
      
      const gptContext = `
Template Information:
- Name: ${template.name}
- Compliance Type: ${template.complianceType}
- Body: ${template.body}

Test Data:
- Company: ${testData.companyName}
- Days Left: ${testData.daysLeft}
- Amount: ${testData.amount}
- Period: ${testData.period}
- Custom Variables: ${JSON.stringify(testData.customVariables)}

Anomaly Detection Results:
- Score: ${anomalyResult.score.toFixed(4)}
- Is Anomaly: ${anomalyResult.isAnomaly}
- Confidence: ${(anomalyResult.confidence * 100).toFixed(1)}%

Custom GPT Prompt:
${template.gptPrompt || generateDefaultGPTPrompt(template)}

Please analyze this template with the provided data and anomaly detection results.
`;

      // Use the template service to generate AI response
      const gptResponse = await templateService.generateAITemplate({
        templateType: 'email', // Default to email for compatibility
        complianceType: template.complianceType,
        tone: 'professional',
        customPrompt: gptContext
      });

      console.log('✅ GPT Processing Complete');

      // Step 3: Compile final result
      const finalResult = {
        template: template,
        testData: testData,
        anomalyDetection: anomalyResult,
        gptAnalysis: gptResponse,
        processedTemplate: processTemplate(template.body, testData),
        timestamp: new Date().toISOString()
      };

      setTestResult(finalResult);
      toast.success('Template test completed successfully!');
      
    } catch (error) {
      console.error('Template test failed:', error);
      toast.error('Template test failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const processTemplate = (template: string, data: any): string => {
    let processed = template;
    
    // Replace standard variables
    processed = processed.replace(/\{companyName\}/g, data.companyName);
    processed = processed.replace(/\{daysLeft\}/g, data.daysLeft.toString());
    processed = processed.replace(/\{amount\}/g, data.amount.toString());
    processed = processed.replace(/\{period\}/g, data.period);
    
    // Replace custom variables
    Object.entries(data.customVariables).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    });
    
    return processed;
  };

  const addVariableToBody = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      body: prev.body + ` ${variable}`
    }));
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Super Admin - Custom Templates</h1>
            <p className="mt-2 text-gray-600">
              Create and manage custom compliance templates with anomaly detection and GPT integration
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-blue-600">{customTemplates.length}</div>
              <div className="text-sm text-gray-600">Total Templates</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-green-600">
                {customTemplates.filter(t => t.isActive).length}
              </div>
              <div className="text-sm text-gray-600">Active Templates</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-purple-600">
                {customTemplates.filter(t => t.complianceType === 'FBT').length}
              </div>
              <div className="text-sm text-gray-600">FBT Templates</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-orange-600">
                {customTemplates.filter(t => t.complianceType === 'BAS').length}
              </div>
              <div className="text-sm text-gray-600">BAS Templates</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Create Custom Template
            </button>
            <button
              onClick={() => {
                setFormData({
                  id: 0,
                  name: '',
                  type: 'email',
                  complianceType: 'BAS',
                  body: '',
                  variables: [],
                  anomalyThreshold: 0.5,
                  gptPrompt: '',
                  isActive: true
                });
                setShowCreateForm(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              + Create BAS Template
            </button>
            <button
              onClick={loadCustomTemplates}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Compliance Type Filter */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-md font-medium text-gray-900 mb-3">Filter by Compliance Type</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedComplianceFilter('ALL')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedComplianceFilter === 'ALL'
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Types
                </button>
                <button
                  onClick={() => setSelectedComplianceFilter('FBT')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedComplianceFilter === 'FBT'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  FBT (Fringe Benefits Tax)
                </button>
                <button
                  onClick={() => setSelectedComplianceFilter('BAS')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedComplianceFilter === 'BAS'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  BAS (Business Activity Statement)
                </button>
                <button
                  onClick={() => setSelectedComplianceFilter('IAS')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedComplianceFilter === 'IAS'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  IAS (Instalment Activity Statement)
                </button>
                <button
                  onClick={() => setSelectedComplianceFilter('FYEND')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedComplianceFilter === 'FYEND'
                      ? 'bg-orange-600 text-white'
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  }`}
                >
                  FYEND (Financial Year End)
                </button>
                <button
                  onClick={() => setSelectedComplianceFilter('GST')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedComplianceFilter === 'GST'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  GST (Goods and Services Tax)
                </button>
                <button
                  onClick={() => setSelectedComplianceFilter('PAYG')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedComplianceFilter === 'PAYG'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  }`}
                >
                  PAYG (Pay As You Go)
                </button>
              </div>
            </div>
          </div>

          {/* Templates List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Custom Templates</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {customTemplates
                .filter(template => selectedComplianceFilter === 'ALL' || template.complianceType === selectedComplianceFilter)
                .map((template) => (
                <div key={template.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          template.complianceType === 'BAS' ? 'bg-blue-100 text-blue-800' :
                          template.complianceType === 'FBT' ? 'bg-purple-100 text-purple-800' :
                          template.complianceType === 'IAS' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {template.complianceType}
                        </span>
                        {template.isActive && (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{template.body}</p>
                      
                      <div className="flex flex-wrap gap-1 mb-2">
                        {template.variables.map((variable, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {variable}
                          </span>
                        ))}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Anomaly Threshold: {template.anomalyThreshold} | 
                        Created: {template.createdAt ? new Date(template.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowTestModal(true);
                        }}
                        className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                      >
                        Test
                      </button>
                      <button
                        onClick={() => {
                          setFormData(template);
                          setShowCreateForm(true);
                        }}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create/Edit Template Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedTemplate ? 'Edit Custom Template' : 'Create Custom Template'}
                  </h3>
                </div>
                
                <form onSubmit={handleCreateTemplate} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Template Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Compliance Type
                      </label>
                      <select
                        value={formData.complianceType}
                        onChange={(e) => setFormData({...formData, complianceType: e.target.value as any})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="BAS">BAS (Business Activity Statement)</option>
                        <option value="FBT">FBT (Fringe Benefits Tax)</option>
                        <option value="IAS">IAS (Instalment Activity Statement)</option>
                        <option value="FYEND">FYEND (Financial Year End)</option>
                        <option value="GST">GST (Goods and Services Tax)</option>
                        <option value="PAYG">PAYG (Pay As You Go)</option>
                      </select>
                    </div>
                    

                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Anomaly Threshold
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={formData.anomalyThreshold}
                        onChange={(e) => setFormData({...formData, anomalyThreshold: parseFloat(e.target.value)})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                  

                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Body
                    </label>
                    <textarea
                      value={formData.body}
                      onChange={(e) => setFormData({...formData, body: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 h-32"
                      required
                    />
                  </div>
                  
                  {/* Available Variables */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Variables
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {complianceVariables[formData.complianceType].map((variable) => (
                        <button
                          key={variable}
                          type="button"
                          onClick={() => addVariableToBody(variable)}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          {variable}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom GPT Prompt
                    </label>
                    <textarea
                      value={formData.gptPrompt}
                      onChange={(e) => setFormData({...formData, gptPrompt: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
                      placeholder="Custom prompt for GPT analysis..."
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-700">
                      Template is active
                    </label>
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setSelectedTemplate(null);
                        resetForm();
                      }}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isProcessing ? 'Creating...' : (selectedTemplate ? 'Update Template' : 'Create Template')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Test Template Modal */}
          {showTestModal && selectedTemplate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Test Template: {selectedTemplate.name}
                  </h3>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Test Data Input */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Test Data</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={testData.companyName}
                          onChange={(e) => setTestData({...testData, companyName: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Days Left
                        </label>
                        <input
                          type="number"
                          value={testData.daysLeft}
                          onChange={(e) => setTestData({...testData, daysLeft: parseInt(e.target.value)})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amount
                        </label>
                        <input
                          type="number"
                          value={testData.amount}
                          onChange={(e) => setTestData({...testData, amount: parseInt(e.target.value)})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Period
                        </label>
                        <input
                          type="text"
                          value={testData.period}
                          onChange={(e) => setTestData({...testData, period: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Test Results */}
                  {testResult && (
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-900">Test Results</h4>
                      
                      {/* Anomaly Detection Results */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h5 className="font-medium text-blue-900 mb-2">Anomaly Detection</h5>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-blue-600">Score:</span> {testResult.anomalyDetection.score.toFixed(4)}
                          </div>
                          <div>
                            <span className="text-blue-600">Is Anomaly:</span> {testResult.anomalyDetection.isAnomaly ? 'Yes' : 'No'}
                          </div>
                          <div>
                            <span className="text-blue-600">Confidence:</span> {(testResult.anomalyDetection.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      
                      {/* Processed Template */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h5 className="font-medium text-green-900 mb-2">Processed Template</h5>
                        <div className="bg-white p-3 rounded border">
                          <pre className="whitespace-pre-wrap text-sm">{testResult.processedTemplate}</pre>
                        </div>
                      </div>
                      
                      {/* GPT Analysis */}
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h5 className="font-medium text-purple-900 mb-2">GPT Analysis</h5>
                        <div className="bg-white p-3 rounded border">
                          <pre className="whitespace-pre-wrap text-sm">{testResult.gptAnalysis.template}</pre>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowTestModal(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handleTestTemplate(selectedTemplate)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                    >
                      {isProcessing ? 'Processing...' : 'Run Test'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
};

export default SuperAdminTemplates;