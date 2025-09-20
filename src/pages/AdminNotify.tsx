import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { companyService, NotificationTemplate, NotificationTemplateInput } from '../api/companyService';
import AppNavbar from '../components/AppNavbar';
import SidebarLayout from '../components/SidebarLayout';
import OpenAISettings from '../components/OpenAISettings';
import ComplianceTextGenerator from '../components/ComplianceTextGenerator';
import TemplateGenerator from '../components/TemplateGenerator';
import ContentAnalyzer from '../components/ContentAnalyzer';
import { OpenAISettingsData } from '../api/openaiService';
import { getApiUrl } from '../utils/envChecker';

const adminNavLinks = [
  { name: 'Company List', to: '/admin/companies' },
  { name: 'Send Notification', to: '/admin/notify' },
  { name: 'Settings', to: '/admin/settings' },
  { name: 'Cronjob Settings', to: '/admin/cron-settings' },
];

const emptyTemplate: NotificationTemplateInput = {
  type: 'email',
  name: '',
  subject: '',
  body: '',
  notificationTypes: ['BAS'],
  smsDays: [],
  emailDays: []
};

// Add type for notification settings days
interface NotificationSettingsDays {
  [type: string]: {
    sms: number[];
    email: number[];
    smsEnabled: boolean;
    emailEnabled: boolean;
  };
}

const AdminNotify: React.FC = () => {
  const location = useLocation();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<NotificationTemplateInput>(emptyTemplate);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [notifTypes, setNotifTypes] = useState<{BAS: boolean, FBT: boolean, IAS: boolean, FYEND: boolean}>({ BAS: false, FBT: false, IAS: false, FYEND: false });
  const [smsMessage, setSmsMessage] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  const [smsResult, setSmsResult] = useState<string | null>(null);
  const [notifSettings, setNotifSettings] = useState<NotificationSettingsDays>({});
  const [selectedDays, setSelectedDays] = useState<{ [type: string]: { sms: number[]; email: number[] } }>({});
  const [showTestModal, setShowTestModal] = useState(false);
  const [testTemplateId, setTestTemplateId] = useState<number | null>(null);
  const [testForm, setTestForm] = useState({
    companyId: '',
    channel: 'sms',
    testData: {}
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  
  // AI Tools state
  const [activeAITab, setActiveAITab] = useState('settings');
  const [openAISettings, setOpenAISettings] = useState<OpenAISettingsData | null>(null);
  const [generatedText, setGeneratedText] = useState('');
  const [generatedTemplate, setGeneratedTemplate] = useState('');
  const [templateType, setTemplateType] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [showAITools, setShowAITools] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the new template service for backward compatibility
      const { templateService } = await import('../api/templateService');
      const data = await templateService.getTemplatesLegacy();
      setTemplates(data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch templates.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch notification settings for days
  useEffect(() => {
    const fetchNotifSettings = async () => {
      const apiBase = getApiUrl();
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/companies/notification-settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const settings: NotificationSettingsDays = {};
          result.data.forEach((item: any) => {
            settings[item.type] = {
              sms: (item.smsDays || '').split(',').map((d: string) => parseInt(d)).filter(Boolean),
              email: (item.emailDays || '').split(',').map((d: string) => parseInt(d)).filter(Boolean),
              smsEnabled: !!item.smsEnabled,
              emailEnabled: !!item.emailEnabled,
            };
          });
          setNotifSettings(settings);
        }
      }
    };
    fetchNotifSettings();
  }, []);

  const fetchCompanies = async () => {
    try {
      const apiBase = getApiUrl();
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/companies/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const result = await response.json();
        console.log('Companies fetch result:', result);
        if (result.success && result.data) {
          setCompanies(result.data);
        }
      } else {
        console.error('Failed to fetch companies:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  useEffect(() => { 
    fetchTemplates(); 
  }, []);

  const openAdd = () => { setEditId(null); setForm(emptyTemplate); setNotifTypes({ BAS: false, FBT: false, IAS: false, FYEND: false }); setShowDrawer(true); };
  const openEdit = async (tpl: NotificationTemplate) => { 
    setEditId(tpl.id); 
    setForm({ 
      type: tpl.type, 
      name: tpl.name, 
      subject: tpl.subject, 
      body: tpl.body,
      notificationTypes: tpl.notificationTypes || ['BAS'],
      smsDays: tpl.smsDays || [],
      emailDays: tpl.emailDays || []
    }); 
    
    // Fetch template details by ID to get notification types and days
    try {
      const templateDetails = await companyService.getTemplateById(tpl.id);
      console.log('Template details:', templateDetails);
      
      // Set notification types
      if (templateDetails.notificationTypes) {
        const types = {
          BAS: templateDetails.notificationTypes.includes('BAS'),
          FBT: templateDetails.notificationTypes.includes('FBT'),
          IAS: templateDetails.notificationTypes.includes('IAS'),
          FYEND: templateDetails.notificationTypes.includes('FYEND')
        };
        setNotifTypes(types);

        // Set selected days for each notification type
        const days: { [type: string]: { sms: number[]; email: number[] } } = {};
        templateDetails.notificationTypes.forEach((type: string) => {
          days[type] = {
            sms: templateDetails.smsDays || [],
            email: templateDetails.emailDays || []
          };
        });
        setSelectedDays(days);
      }
    } catch (error) {
      console.error('Error fetching template details:', error);
      // Fallback to basic form data
      setNotifTypes({ BAS: false, FBT: false, IAS: false, FYEND: false });
      setSelectedDays({});
    }
    
    setShowDrawer(true); 
  };
  const closeDrawer = () => { setShowDrawer(false); setEditId(null); setForm(emptyTemplate); setNotifTypes({ BAS: false, FBT: false, IAS: false, FYEND: false }); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Prepare the payload with selected days and notification types
      const selectedNotificationTypes = Object.entries(notifTypes)
        .filter(([_, checked]) => checked)
        .map(([type, _]) => type);

      const payload = {
        ...form,
        notificationTypes: selectedNotificationTypes,
        smsDays: form.type === 'sms' ? 
          Object.values(selectedDays).reduce((acc, typeDays) => [...acc, ...typeDays.sms], [] as number[]) : 
          [],
        emailDays: form.type === 'email' ? 
          Object.values(selectedDays).reduce((acc, typeDays) => [...acc, ...typeDays.email], [] as number[]) : 
          [],
      };

      if (editId) {
        await companyService.updateTemplate(editId, payload);
      } else {
        await companyService.createTemplate(payload);
      }
      await fetchTemplates();
      closeDrawer();
    } catch {
      setError('Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
    try {
      await companyService.deleteTemplate(id);
      await fetchTemplates();
    } catch {
      setError('Failed to delete template.');
    } finally {
      setDeleteId(null);
    }
  };

  const handleSendSmsToAll = async () => {
    setSmsSending(true);
    setSmsResult(null);
    try {
      const res = await companyService.sendSmsToAllUsers(smsMessage);
      setSmsResult(res.success ? 'SMS sent to all users!' : res.message);
      setSmsMessage('');
    } catch (err: any) {
      setSmsResult('Failed to send SMS.');
    } finally {
      setSmsSending(false);
    }
  };

  const openTestModal = async (templateId: number) => {
    const template = templates.find(tpl => tpl.id === templateId);
    setTestTemplateId(templateId);
    setSelectedTemplate(template || null);
    
    // Fetch companies when modal opens
    try {
      const apiBase = getApiUrl();
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/companies/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const result = await response.json();
        console.log('Companies fetch result:', result);
        if (result.success && result.data) {
          setCompanies(result.data);
        }
      } else {
        console.error('Failed to fetch companies:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
    
    // Set default test data based on template body
    let defaultTestData: any = {};
    let defaultTestDataString = '';
    if (template?.body) {
      // Extract potential variables from template body
      const matches = template.body.match(/\{(\w+)\}/g);
      if (matches) {
        matches.forEach(match => {
          const key = match.replace(/[{}]/g, '');
          if (key === 'days') defaultTestData[key] = 14;
          else if (key === 'companyName') defaultTestData[key] = 'Test Company';
          else if (key === 'dueDate') defaultTestData[key] = '2025-08-15';
          else defaultTestData[key] = `Test ${key}`;
        });
        defaultTestDataString = JSON.stringify(defaultTestData, null, 2);
      } else {
        // No variables, show the body as the test data string
        defaultTestDataString = template.body;
      }
    }
    
    setTestForm({
      companyId: '',
      channel: template?.type || 'sms',
      testData: defaultTestData
    });
    setTestResult(null);
    setShowTestModal(true);
    setTimeout(() => {
      const textarea = document.getElementById('testDataTextarea');
      if (textarea && defaultTestDataString) {
        (textarea as HTMLTextAreaElement).value = defaultTestDataString;
      }
    }, 0);
  };

  const closeTestModal = () => {
    setShowTestModal(false);
    setTestTemplateId(null);
    setSelectedTemplate(null);
    setTestForm({
      companyId: '',
      channel: 'sms',
      testData: {}
    });
    setTestResult(null);
  };

  const handleTestTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTemplateId) return;

    setTesting(true);
    setTestResult(null);
    try {
      const apiBase = getApiUrl();
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/companies/templates/${testTemplateId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          companyId: parseInt(testForm.companyId),
          channel: testForm.channel,
          testData: testForm.testData
        })
      });

      const result = await response.json();
      if (result.success) {
        setTestResult('Template test sent successfully!');
      } else {
        setTestResult(`Test failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error testing template:', error);
      setTestResult('Failed to test template. Please try again.');
    } finally {
      setTesting(false);
    }
  };

  // AI Tools handlers
  const handleSettingsChange = (settings: OpenAISettingsData | null) => {
    setOpenAISettings(settings);
  };

  const handleTextGenerated = (text: string) => {
    setGeneratedText(text);
  };

  const handleTemplateGenerated = (template: string, type: string) => {
    setGeneratedTemplate(template);
    setTemplateType(type);
  };

  const handleAnalysisComplete = (analysis: string) => {
    setAnalysisResult(analysis);
  };

  const renderAITabContent = () => {
    switch (activeAITab) {
      case 'settings':
        return <OpenAISettings onSettingsChange={handleSettingsChange} />;
      case 'generator':
        return (
          <ComplianceTextGenerator 
            onTextGenerated={handleTextGenerated}
            defaultCompanyName=""
          />
        );
      case 'templates':
        return <TemplateGenerator onTemplateGenerated={handleTemplateGenerated} />;
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

  const getAITabClass = (tabId: string) => {
    const baseClass = "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors";
    return activeAITab === tabId
      ? `${baseClass} bg-indigo-100 text-indigo-700`
      : `${baseClass} text-gray-600 hover:text-gray-900 hover:bg-gray-100`;
  };

  return (
    <SidebarLayout>
      <div className="flex flex-col items-center justify-start min-h-screen">
        <AppNavbar />
        <div className="bg-white/90 rounded-2xl shadow-2xl p-8 max-w-4xl w-full mt-8 md:mt-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-indigo-700">Notification Templates</h1>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowAITools(!showAITools)} 
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition"
              >
                {showAITools ? 'Hide AI Tools' : 'AI Tools'}
              </button>
              <button onClick={openAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow hover:bg-indigo-700 transition">Add Template</button>
            </div>
          </div>
          {/* --- SMS to All Users Section --- */}
          <div className="mb-8 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <h2 className="text-xl font-semibold mb-2 text-indigo-800">Send SMS to All Users</h2>
            <textarea
              className="w-full rounded border-gray-300 min-h-[60px] mb-2"
              placeholder="Enter SMS message to send to all users"
              value={smsMessage}
              onChange={e => setSmsMessage(e.target.value)}
              disabled={smsSending}
            />
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow hover:bg-indigo-700 transition disabled:opacity-50"
              onClick={handleSendSmsToAll}
              disabled={smsSending || !smsMessage.trim()}
            >
              {smsSending ? 'Sending...' : 'Send SMS to All Users'}
            </button>
            {smsResult && <div className="mt-2 text-sm text-indigo-700">{smsResult}</div>}
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <span className="text-indigo-600 font-semibold animate-pulse">Loading templates...</span>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-6">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-indigo-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-indigo-700">Type</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-indigo-700">Name</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-indigo-700">Subject</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-indigo-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map(tpl => (
                    <tr key={tpl.id} className="border-b last:border-b-0 hover:bg-indigo-50 transition">
                      <td className="px-4 py-2 capitalize">{tpl.type}</td>
                      <td className="px-4 py-2">{tpl.name}</td>
                      <td className="px-4 py-2">{tpl.subject}</td>
                      <td className="px-4 py-2 flex gap-2">
                        <button onClick={() => openEdit(tpl)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Edit</button>
                        <button onClick={() => openTestModal(tpl.id)} className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">Test</button>
                        <button onClick={() => handleDelete(tpl.id)} disabled={deleteId === tpl.id} className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50">{deleteId === tpl.id ? 'Deleting...' : 'Delete'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* AI Tools Section */}
        {showAITools && (
          <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-green-800 mb-2">🤖 AI-Powered Tools</h2>
              <p className="text-green-700">
                Use AI to generate compliance text, create templates, and analyze content quality.
              </p>
            </div>

            {/* AI Status Banner */}
            {!openAISettings && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-600">⚠️</span>
                  <p className="text-sm text-yellow-700">
                    Please configure OpenAI settings to use AI features.
                  </p>
                </div>
              </div>
            )}

            {openAISettings && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <p className="text-sm text-green-700">
                    AI features are ready to use.
                  </p>
                </div>
              </div>
            )}

            {/* AI Tools Tabs */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveAITab('settings')}
                  className={getAITabClass('settings')}
                >
                  <span>⚙️</span>
                  Settings
                </button>
                <button
                  onClick={() => setActiveAITab('generator')}
                  className={getAITabClass('generator')}
                >
                  <span>📝</span>
                  Text Generator
                </button>
                <button
                  onClick={() => setActiveAITab('templates')}
                  className={getAITabClass('templates')}
                >
                  <span>📋</span>
                  Templates
                </button>
                <button
                  onClick={() => setActiveAITab('analyzer')}
                  className={getAITabClass('analyzer')}
                >
                  <span>🔍</span>
                  Analyzer
                </button>
              </div>
            </div>

            {/* AI Tools Content */}
            <div className="min-h-[400px]">
              {renderAITabContent()}
            </div>
          </div>
        )}

        {/* Drawer for Add/Edit */}
        {showDrawer && (
          <div className="fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={closeDrawer}></div>
            <div className="relative ml-auto h-full w-full max-w-lg bg-white shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-indigo-700">{editId ? 'Edit' : 'Add'} Template</h2>
                <button onClick={closeDrawer} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
              <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="w-full rounded border-gray-300" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'email' | 'sms' }))}>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input className="w-full rounded border-gray-300" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input className="w-full rounded border-gray-300" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required={form.type === 'email'} disabled={form.type === 'sms'} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                  <textarea className="w-full rounded border-gray-300 min-h-[100px]" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notification Types</label>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={notifTypes.BAS} onChange={e => setNotifTypes(t => ({ ...t, BAS: e.target.checked }))} /> BAS
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={notifTypes.FBT} onChange={e => setNotifTypes(t => ({ ...t, FBT: e.target.checked }))} /> FBT
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={notifTypes.IAS} onChange={e => setNotifTypes(t => ({ ...t, IAS: e.target.checked }))} /> IAS
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={notifTypes.FYEND} onChange={e => setNotifTypes(t => ({ ...t, FYEND: e.target.checked }))} /> Financial Year End Date
                    </label>
                  </div>
                </div>
                {/* For each selected notif type, show SMS/Email day checkboxes if enabled */}
                {Object.entries(notifTypes).map(([type, checked]) =>
                  checked && notifSettings[type] ? (
                    <div key={type} className="mt-2 border rounded p-2 bg-indigo-50">
                      <div className="font-semibold text-indigo-700 mb-1">{type} Days</div>
                      {form.type === 'sms' && notifSettings[type].smsEnabled && (
                        <div className="mb-1">
                          <div className="text-sm font-medium text-blue-700 mb-1">SMS Days:</div>
                          <div className="flex flex-wrap gap-2">
                            {notifSettings[type].sms.map(day => (
                              <label key={day} className="flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={selectedDays[type]?.sms?.includes(day) || false}
                                  onChange={e => {
                                    setSelectedDays(prev => ({
                                      ...prev,
                                      [type]: {
                                        ...prev[type],
                                        sms: e.target.checked
                                          ? [...(prev[type]?.sms || []), day]
                                          : (prev[type]?.sms || []).filter(d => d !== day),
                                        email: prev[type]?.email || [],
                                      },
                                    }));
                                  }}
                                />
                                <span>{day} days</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      {form.type === 'email' && notifSettings[type].emailEnabled && (
                        <div>
                          <div className="text-sm font-medium text-indigo-700 mb-1">Email Days:</div>
                          <div className="flex flex-wrap gap-2">
                            {notifSettings[type].email.map(day => (
                              <label key={day} className="flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={selectedDays[type]?.email?.includes(day) || false}
                                  onChange={e => {
                                    setSelectedDays(prev => ({
                                      ...prev,
                                      [type]: {
                                        ...prev[type],
                                        email: e.target.checked
                                          ? [...(prev[type]?.email || []), day]
                                          : (prev[type]?.email || []).filter(d => d !== day),
                                        sms: prev[type]?.sms || [],
                                      },
                                    }));
                                  }}
                                />
                                <span>{day} days</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null
                )}
                <button type="submit" className="w-full py-2 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50" disabled={saving}>{saving ? (editId ? 'Saving...' : 'Adding...') : (editId ? 'Save Changes' : 'Add Template')}</button>
              </form>
            </div>
          </div>
        )}
      </div>
      
      {/* Test Template Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={closeTestModal}></div>
          <div className="relative ml-auto h-full w-full max-w-lg bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-indigo-700">Test Template</h2>
              <button onClick={closeTestModal} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleTestTemplate} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <select 
                  className="w-full rounded border-gray-300" 
                  value={testForm.companyId} 
                  onChange={e => setTestForm(f => ({ ...f, companyId: e.target.value }))}
                  required
                >
                  <option value="">Select a Company</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>{company.companyName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                <select 
                  className="w-full rounded border-gray-300" 
                  value={testForm.channel} 
                  onChange={e => setTestForm(f => ({ ...f, channel: e.target.value as 'sms' | 'email' }))}
                >
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Body</label>
                <textarea 
                  className="w-full rounded border-gray-300 min-h-[100px] bg-gray-50" 
                  value={selectedTemplate?.body || ''} 
                  readOnly
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">This is the template body. Test data will replace placeholders like {"{days}"}.</p>
              </div>
              {/* Show relevant days for selected notification types and channel */}
              {selectedTemplate && selectedTemplate.notificationTypes && notifSettings && (
                <div className="mb-4">
                  {selectedTemplate.notificationTypes.map(type => (
                    notifSettings[type] ? (
                      <div key={type} className="mt-2 border rounded p-2 bg-indigo-50">
                        <div className="font-semibold text-indigo-700 mb-1">{type} Days</div>
                        {testForm.channel === 'sms' && notifSettings[type].smsEnabled && (
                          <div className="mb-1">
                            <div className="text-sm font-medium text-blue-700 mb-1">SMS Days:</div>
                            <div className="flex flex-wrap gap-2">
                              {notifSettings[type].sms.map(day => (
                                <span key={day} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm">{day} days</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {testForm.channel === 'email' && notifSettings[type].emailEnabled && (
                          <div>
                            <div className="text-sm font-medium text-indigo-700 mb-1">Email Days:</div>
                            <div className="flex flex-wrap gap-2">
                              {notifSettings[type].email.map(day => (
                                <span key={day} className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm">{day} days</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null
                  ))}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Data (JSON)</label>
                <textarea 
                  className="w-full rounded border-gray-300 min-h-[100px]" 
                  value={JSON.stringify(testForm.testData, null, 2)} 
                  onChange={e => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setTestForm(f => ({ ...f, testData: parsed }));
                    } catch (error) {
                      // Invalid JSON, keep the current value
                    }
                  }}
                  placeholder='{"days": 14, "companyName": "Test Company"}'
                  id="testDataTextarea"
                />
                <p className="text-xs text-gray-500 mt-1">Enter JSON data to replace template variables (e.g., {"{days}"} will be replaced with the "days" value)</p>
              </div>
              
              {testResult && (
                <div className={`p-3 rounded text-sm ${testResult.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {testResult}
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeTestModal}
                  className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={testing}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50"
                >
                  {testing ? 'Testing...' : 'Test Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};
export default AdminNotify; 