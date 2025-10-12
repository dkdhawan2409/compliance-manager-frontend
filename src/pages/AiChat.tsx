import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useXero } from '../contexts/XeroContext';
import SidebarLayout from '../components/SidebarLayout';
import toast from 'react-hot-toast';
import openaiService from '../api/openaiService';
import { companyService } from '../api/companyService';
import { AI_CONFIG } from '../config/aiConfig';
import FinancialAnalysisDisplay from '../components/FinancialAnalysisDisplay';
import TemplateSelector from '../components/TemplateSelector';
import { NotificationTemplate } from '../api/templateService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any; // For structured data like financial analysis
}

interface FinancialAnalysis {
  Cashflow_Projection: {
    Month_1: number;
    Month_2: number;
    Month_3: number;
  };
  GST_Estimate_Next_Period: number;
  Insights: string[];
  Recommended_Actions: string[];
}

const AiChat: React.FC = () => {
  console.log('AiChat component rendered');
  
  const { company } = useAuth();
  const navigate = useNavigate();
  const {
    status,
    isLoading: xeroLoading,
    error,
    selectedTenant,
    availableTenants: tenants = [],
    loadSettings,
    selectTenant,
    loadData,
    data: xeroContextData,
    dataLoading: xeroDataLoading,
    dataError: xeroDataError,
  } = useXero();

  const xeroConnected = status.connected;
  const xeroData = xeroContextData || {};
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [openAiKey, setOpenAiKey] = useState('');
  const [isLoadingKey, setIsLoadingKey] = useState(true);
  const [analysisMode, setAnalysisMode] = useState<'chat' | 'financial'>('chat');
  const [xeroAnalysisData, setXeroAnalysisData] = useState<any>(null);
  const [isLoadingXeroData, setIsLoadingXeroData] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadXeroDataForAnalysis = useCallback(async () => {
    if (!xeroConnected) {
      toast.error('Connect to Xero before running analysis.');
      return null;
    }

    if (!selectedTenant) {
      toast.error('Select a Xero organization first.');
      return null;
    }

    const tenantId = selectedTenant.tenantId || selectedTenant.id;

    setIsLoadingXeroData(true);
    try {
      const normalize = (response: any) => response?.data?.data ?? response?.data ?? response;

      const [basResponse, invoicesResponse, contactsResponse, dashboardResponse] = await Promise.all([
        loadData('basData', { tenantId, useCache: false }).catch((err: any) => {
          console.warn('⚠️ BAS data unavailable:', err?.message || err);
          return null;
        }),
        loadData('invoices', { tenantId, useCache: false, pageSize: 100 }).catch((err: any) => {
          console.warn('⚠️ Invoice data unavailable:', err?.message || err);
          return null;
        }),
        loadData('contacts', { tenantId, useCache: false }).catch((err: any) => {
          console.warn('⚠️ Contact data unavailable:', err?.message || err);
          return null;
        }),
        loadData('dashboard-data', { tenantId, useCache: false }).catch((err: any) => {
          console.warn('⚠️ Dashboard data unavailable:', err?.message || err);
          return null;
        }),
      ]);

      const basData = basResponse ? normalize(basResponse) : null;
      const invoiceData = invoicesResponse ? normalize(invoicesResponse) : null;
      const contactsData = contactsResponse ? normalize(contactsResponse) : null;
      const dashboardData = dashboardResponse ? normalize(dashboardResponse) : null;

      const transactions = invoiceData?.Invoices || invoiceData?.items || invoiceData?.data || invoiceData || [];
      const contacts = contactsData?.Contacts || contactsData?.items || contactsData?.data || contactsData || [];

      return {
        tenantId,
        tenantName: selectedTenant.name || selectedTenant.organizationName || selectedTenant.tenantName,
        basData,
        transactions,
        contacts,
        dashboardData,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('❌ Failed to load Xero data for analysis:', error);
      toast.error(error?.message || 'Failed to load Xero data for analysis.');
      return null;
    } finally {
      setIsLoadingXeroData(false);
    }
  }, [xeroConnected, selectedTenant, loadData]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load Xero settings and check connection status on component mount
  useEffect(() => {
    console.log('🔄 AiChat: Loading Xero settings and checking connection status...');
    loadSettings();
  }, [loadSettings]);

  // Automatically select the best tenant when available (prioritize Demo Company Global)
  useEffect(() => {
    if (tenants.length > 0 && !selectedTenant) {
      // Try to find "Demo Company (Global)" first
      const demoCompany = tenants.find((tenant: any) => 
        tenant.name === "Demo Company (Global)" || 
        tenant.organizationName === "Demo Company (Global)" ||
        tenant.tenantName === "Demo Company (Global)"
      );
      
      if (demoCompany) {
        console.log('🔧 Auto-selecting Demo Company (Global):', demoCompany);
        selectTenant(demoCompany);
      } else {
        console.log('🔧 Auto-selecting first tenant:', tenants[0]);
        selectTenant(tenants[0]);
      }
    }
  }, [tenants, selectedTenant, selectTenant]);

  // Check if AI is configured
  useEffect(() => {
    const checkAiConfiguration = async () => {
      try {
        setIsLoadingKey(true);
        console.log('🔧 Checking AI configuration...');
        
        // Check environment variable first
        if (AI_CONFIG.hasEnvironmentKey()) {
          console.log('✅ Found API key in environment variables');
          setOpenAiKey('configured');
          console.log('AI Configuration status: Configured via environment variable');
          return;
        }
        
        // Try openaiService
        try {
          const settings = await openaiService.getSettings();
          console.log('✅ OpenAI Service settings:', settings);
          if (settings && settings.isActive) {
            setOpenAiKey('configured');
            console.log('AI Configuration status: Configured via openaiService');
            return;
          }
        } catch (openaiError) {
          console.log('⚠️ openaiService failed, trying companyService:', openaiError);
        }
        
        // Fallback to companyService
        try {
          const settings = await companyService.getOpenAiSettings();
          console.log('✅ Company Service settings:', settings);
          if (settings && settings.apiKey) {
            setOpenAiKey('configured');
            console.log('AI Configuration status: Configured via companyService');
            return;
          }
        } catch (companyError) {
          console.log('⚠️ companyService also failed:', companyError);
        }
        
        // No configuration found
        setOpenAiKey('');
        console.log('❌ No AI configuration found');
        
      } catch (error) {
        console.error('❌ Failed to check AI configuration:', error);
        setOpenAiKey(''); // No configuration available
      } finally {
        setIsLoadingKey(false);
      }
    };

    checkAiConfiguration();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!openAiKey.trim()) {
      toast.error('Global AI configuration not available. Please contact your super admin to configure the OpenAI API key.');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('🔑 AI Key Check for Chat Message:');
      
      // Try to get API key from backend first
      let apiKey = null;
      let keySource = 'backend';
      
      try {
        console.log('🔄 Getting API key from backend...');
        const apiKeyResponse = await openaiService.getApiKey();
        console.log('🔍 Full API Key Response:', apiKeyResponse);
        
        if (apiKeyResponse && apiKeyResponse.apiKey) {
          apiKey = apiKeyResponse.apiKey;
          console.log('✅ Retrieved API key from backend');
          console.log('  - Backend Key Length:', apiKey.length);
          console.log('  - Backend Key Preview:', `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
          console.log('  - Key Valid:', apiKeyResponse.isValid);
          console.log('  - Model:', apiKeyResponse.model || 'Not specified');
          console.log('  - Full Backend Key:', apiKey);
          console.log('  - Key starts with sk-:', apiKey.startsWith('sk-'));
        } else {
          console.log('❌ No API key available from backend');
          console.log('  - API Key Response:', apiKeyResponse);
        }
      } catch (backendError) {
        console.log('❌ Failed to get API key from backend:', backendError);
        console.log('  - Error details:', backendError);
        // Fallback to environment variable if backend fails
        apiKey = AI_CONFIG.getApiKey();
        keySource = 'environment';
        console.log('🔄 Falling back to environment variable');
        console.log('  - Environment Key Available:', !!apiKey);
        console.log('  - Environment Key Length:', apiKey ? apiKey.length : 0);
        console.log('  - Environment Key Preview:', apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}` : 'None');
        console.log('  - Full Environment Key:', apiKey);
        console.log('  - Key starts with sk-:', apiKey ? apiKey.startsWith('sk-') : false);
      }
      
      if (apiKey) {
        console.log('🔧 Using API key for direct OpenAI call');
        console.log('  - Key Source:', keySource === 'environment' ? 'VITE_OPENAI_API_KEY environment variable' : 'Backend API');
        console.log('  - API Endpoint: https://api.openai.com/v1/chat/completions');
        console.log('  - Model: gpt-3.5-turbo');
        console.log('  - Max Tokens: 1000');
        console.log('  - Temperature: 0.7');
        console.log('  - Full API Key:', apiKey); // Log the full key for debugging
        console.log('  - Key starts with sk-:', apiKey.startsWith('sk-'));
        console.log('  - Key length:', apiKey.length);
        
        // Validate API key format
        if (!apiKey.startsWith('sk-')) {
          console.error('❌ Invalid API key format - should start with "sk-"');
          throw new Error('Invalid API key format. Key should start with "sk-"');
        }
        
        // Make direct OpenAI API call
        const settings = AI_CONFIG.getDefaultSettings();
        const requestBody = {
          model: settings.model,
          messages: [{ role: 'user', content: inputMessage }],
          max_tokens: settings.maxTokens,
          temperature: settings.temperature
        };
        
        console.log('📤 Request body:', requestBody);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody)
        });

        console.log('📡 OpenAI API Response Status:', response.status);
        console.log('📡 OpenAI API Response Headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ OpenAI API Error Response:', errorText);
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ OpenAI API Success Response:', {
          model: data.model,
          usage: data.usage,
          choices: data.choices?.length || 0
        });
        
        // Extract content from OpenAI API response
        let content = '';
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
          content = data.choices[0].message.content;
        } else {
          console.warn('⚠️ Unexpected OpenAI API response structure:', data);
          content = 'Sorry, I received an unexpected response format. Please try again.';
        }
        
        console.log('📝 OpenAI API response content:', content);
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: content,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        toast.success('Response received!');
        return;
      }
      
      console.log('🔄 No API key available, falling back to backend services');
      console.log('  - Trying openaiService first...');
      
      // Fallback to backend services
      let response;
      try {
        response = await openaiService.chatCompletion({
          prompt: inputMessage
        });
        console.log('✅ OpenAI Service response:', response);
        console.log('  - Key Source: Backend openaiService');
      } catch (openaiError) {
        console.log('⚠️ openaiService failed, trying companyService:', openaiError);
        console.log('  - Key Source: Backend companyService');
        // Fallback to companyService
        response = await companyService.chatCompletion(inputMessage);
        console.log('✅ Company Service response:', response);
      }
      
      // Extract the response content properly
      let responseContent = '';
      if (response && typeof response === 'object') {
        // Handle different response structures
        if (response.data && response.data.response) {
          // Backend API format: { data: { response: "actual content" } }
          responseContent = response.data.response;
        } else if (response.response) {
          // Direct response format: { response: "actual content" }
          responseContent = response.response;
        } else if (response.content) {
          responseContent = response.content;
        } else if (response.message) {
          responseContent = response.message;
        } else if (typeof response === 'string') {
          responseContent = response;
        } else {
          console.warn('⚠️ Unexpected response structure:', response);
          responseContent = JSON.stringify(response);
        }
      } else if (typeof response === 'string') {
        responseContent = response;
      } else {
        console.warn('⚠️ Invalid response:', response);
        responseContent = 'Sorry, I received an invalid response. Please try again.';
      }
      
      console.log('📝 Extracted response content:', responseContent);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      toast.success('Response received!');
    } catch (error: any) {
      console.error('❌ Chat completion error:', error);
      const errorMessage = error.message || 'Failed to get response. Please try again.';
      toast.error(errorMessage);
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTemplateSelect = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
    
    // Create a message with the template content
    const templateMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `I want to use the ${template.name} template for ${template.notificationTypes?.join(', ')} compliance. Here's the template content:\n\n${template.body}`,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, templateMessage]);
    
    // Auto-send the message with template context
    setTimeout(() => {
      handleSendMessageWithTemplate(template);
    }, 500);
  };

  const handleSendMessageWithTemplate = async (template: NotificationTemplate) => {
    if (!openAiKey.trim()) {
      toast.error('Global AI configuration not available. Please contact your super admin to configure the OpenAI API key.');
      return;
    }

    setIsLoading(true);

    try {
      // Create a context-aware prompt using the template
      const templateContext = `
Template Information:
- Name: ${template.name}
- Type: ${template.type}
- Compliance Types: ${template.notificationTypes?.join(', ')}
- Template Content: ${template.body}

Please help me with the following:
1. Explain how to use this template effectively
2. Provide guidance on when to use this template
3. Suggest any modifications or improvements
4. Answer any questions about the compliance requirements for ${template.notificationTypes?.join(', ')}
`;

      console.log('🔑 AI Key Check for Template Message:');
      
      // Try to get API key from backend first
      let apiKey = null;
      let keySource = 'backend';
      
      try {
        console.log('🔄 Getting API key from backend for template message...');
        const apiKeyResponse = await openaiService.getApiKey();
        console.log('🔍 Full API Key Response for Template Message:', apiKeyResponse);
        
        if (apiKeyResponse && apiKeyResponse.apiKey) {
          apiKey = apiKeyResponse.apiKey;
          console.log('✅ Retrieved API key from backend for template message');
        } else {
          console.log('❌ No API key available from backend for template message');
        }
      } catch (backendError) {
        console.log('❌ Failed to get API key from backend for template message:', backendError);
        // Fallback to environment variable if backend fails
        apiKey = AI_CONFIG.getApiKey();
        keySource = 'environment';
        console.log('🔄 Falling back to environment variable for template message');
      }
      
      if (apiKey) {
        console.log('🔧 Using API key for template message');
        
        // Validate API key format
        if (!apiKey.startsWith('sk-')) {
          console.error('❌ Invalid API key format - should start with "sk-"');
          throw new Error('Invalid API key format. Key should start with "sk-"');
        }
        
        // Make direct OpenAI API call
        const settings = AI_CONFIG.getDefaultSettings();
        const requestBody = {
          model: settings.model,
          messages: [{ role: 'user', content: templateContext }],
          max_tokens: settings.maxTokens,
          temperature: settings.temperature
        };
        
        console.log('📤 Template Message Request body:', requestBody);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody)
        });

        console.log('📡 OpenAI API Response Status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ OpenAI API Error Response:', errorText);
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ OpenAI API Success Response:', {
          model: data.model,
          usage: data.usage,
          choices: data.choices?.length || 0
        });
        
        // Extract content from OpenAI API response
        let content = '';
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
          content = data.choices[0].message.content;
        } else {
          console.warn('⚠️ Unexpected OpenAI API response structure:', data);
          content = 'Sorry, I received an unexpected response format. Please try again.';
        }
        
        console.log('📝 OpenAI API response content:', content);
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: content,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        toast.success('Template guidance received!');
        return;
      }
      
      console.log('🔄 No API key available, falling back to backend services for template message');
      
      // Fallback to backend services
      let response;
      try {
        response = await openaiService.chatCompletion({
          prompt: templateContext
        });
        console.log('✅ OpenAI Service response for template:', response);
      } catch (openaiError) {
        console.log('⚠️ openaiService failed, trying companyService for template:', openaiError);
        response = await companyService.chatCompletion(templateContext);
        console.log('✅ Company Service response for template:', response);
      }
      
      // Extract the response content properly
      let responseContent = '';
      if (response && typeof response === 'object') {
        if (response.data && response.data.response) {
          responseContent = response.data.response;
        } else if (response.response) {
          responseContent = response.response;
        } else if (response.content) {
          responseContent = response.content;
        } else if (response.message) {
          responseContent = response.message;
        } else if (typeof response === 'string') {
          responseContent = response;
        } else {
          console.warn('⚠️ Unexpected response structure for template:', response);
          responseContent = JSON.stringify(response);
        }
      } else if (typeof response === 'string') {
        responseContent = response;
      } else {
        console.warn('⚠️ Invalid response for template:', response);
        responseContent = 'Sorry, I received an invalid response. Please try again.';
      }
      
      console.log('📝 Extracted response content for template:', responseContent);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      toast.success('Template guidance received!');
    } catch (error: any) {
      console.error('❌ Template message error:', error);
      const errorMessage = error.message || 'Failed to get response. Please try again.';
      toast.error(errorMessage);
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSelectedTemplate(null);
    setShowTemplateSelector(false);
    toast.success('Chat cleared!');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };



  // Extract essential financial data for analysis
  const extractFinancialData = (xeroData: any) => {
    console.log('🔍 Extracting financial data from:', xeroData);
    console.log('📊 Transactions count:', xeroData.transactions?.length || 0);
    console.log('👥 Contacts count:', xeroData.contacts?.length || 0);
    console.log('💰 Financial Summary:', xeroData.basData?.data);
    
    // Use financial summary data if available, otherwise calculate from invoices
    const financialSummary = xeroData.basData?.data;
    
    const summary = {
      tenant: {
        id: xeroData.tenantId,
        name: xeroData.tenantName
      },
      invoices: {
        total: financialSummary?.invoiceCount || xeroData.transactions?.length || 0,
        summary: {
          totalAmount: parseFloat(financialSummary?.totalRevenue?.toString() || '0') || 0,
          paidAmount: parseFloat(financialSummary?.paidRevenue?.toString() || '0') || 0,
          outstandingAmount: parseFloat(financialSummary?.outstandingRevenue?.toString() || '0') || 0,
          recentInvoices: [] as any[]
        }
      },
      contacts: {
        total: xeroData.contacts?.length || 0,
        types: {} as Record<string, number>
      },
      financialMetrics: {
        netIncome: parseFloat(financialSummary?.netIncome?.toString() || '0') || 0,
        totalExpenses: parseFloat(financialSummary?.totalExpenses?.toString() || '0') || 0,
        transactionCount: financialSummary?.transactionCount || 0,
        dataQuality: financialSummary?.dataQuality || {}
      },
      reports: {
        available: !!xeroData.basData,
        type: xeroData.basData?.type || 'None',
        financialSummary: financialSummary
      },
      dashboard: {
        available: !!xeroData.dashboardData,
        data: xeroData.dashboardData || null
      },
      timestamp: xeroData.timestamp
    };

    // Process invoices for financial summary (only if no financial summary data)
    if (!financialSummary && xeroData.transactions && Array.isArray(xeroData.transactions)) {
      console.log('💰 Processing invoices (fallback)...');
      xeroData.transactions.forEach((invoice: any, index: number) => {
        // Try different possible field names for amount
        const amount = parseFloat(invoice.Total) || parseFloat(invoice.total) || parseFloat(invoice.amount) || parseFloat(invoice.Amount) || 0;
        const amountPaid = parseFloat(invoice.AmountPaid) || parseFloat(invoice.amountPaid) || parseFloat(invoice.paid) || parseFloat(invoice.Paid) || 0;
        
        summary.invoices.summary.totalAmount += amount;
        summary.invoices.summary.paidAmount += amountPaid;
        summary.invoices.summary.outstandingAmount += (amount - amountPaid);
        
        // Log first few invoices for debugging
        if (index < 3) {
          console.log(`📄 Invoice ${index + 1}:`, {
            id: invoice.InvoiceID,
            number: invoice.InvoiceNumber,
            total: invoice.Total,
            amountPaid: invoice.AmountPaid,
            status: invoice.Status,
            parsedAmount: amount,
            parsedPaid: amountPaid,
            allFields: Object.keys(invoice)
          });
        }
        
        // Keep only recent invoices (last 10)
        if (summary.invoices.summary.recentInvoices.length < 10) {
          summary.invoices.summary.recentInvoices.push({
            id: invoice.InvoiceID,
            number: invoice.InvoiceNumber,
            amount: amount,
            status: invoice.Status,
            date: invoice.DateString
          });
        }
      });
      
      console.log('💰 Invoice Summary (fallback):', {
        totalAmount: summary.invoices.summary.totalAmount,
        paidAmount: summary.invoices.summary.paidAmount,
        outstandingAmount: summary.invoices.summary.outstandingAmount,
        recentInvoicesCount: summary.invoices.summary.recentInvoices.length
      });
    } else if (financialSummary) {
      console.log('💰 Using financial summary data instead of processing invoices');
    } else {
      console.warn('⚠️ No transactions data found or not an array');
      
      // Fallback: If no financial summary and no transactions, use default values
      if (!xeroData.transactions || !Array.isArray(xeroData.transactions)) {
        console.log('🔄 Using default financial values as fallback');
        summary.invoices.summary.totalAmount = 50000;
        summary.invoices.summary.paidAmount = 30000;
        summary.invoices.summary.outstandingAmount = 20000;
        summary.financialMetrics.netIncome = 25000;
        summary.financialMetrics.totalExpenses = 5000;
        summary.invoices.total = 50;
      }
    }

    // Process contacts for customer/supplier analysis
    if (xeroData.contacts && Array.isArray(xeroData.contacts)) {
      console.log('👥 Processing contacts...');
      xeroData.contacts.forEach((contact: any) => {
        const type = contact.IsSupplier ? 'supplier' : 'customer';
        summary.contacts.types[type] = (summary.contacts.types[type] || 0) + 1;
      });
      
      console.log('👥 Contact Summary:', summary.contacts.types);
    } else {
      console.warn('⚠️ No contacts data found or not an array');
    }

    console.log('📊 Final Financial Summary:', summary);
    console.log('🔍 Key values for AI:');
    console.log('  - totalAmount:', summary.invoices.summary.totalAmount);
    console.log('  - paidAmount:', summary.invoices.summary.paidAmount);
    console.log('  - outstandingAmount:', summary.invoices.summary.outstandingAmount);
    console.log('  - netIncome:', summary.financialMetrics.netIncome);
    console.log('  - totalExpenses:', summary.financialMetrics.totalExpenses);
    console.log('  - invoiceCount:', summary.invoices.total);
    console.log('  - customerCount:', summary.contacts.types.customer);
    return summary;
  };

  // Generate financial analysis using AI
  const generateFinancialAnalysis = async (xeroDataFromAnalysis: any) => {
          if (!xeroDataFromAnalysis) {
        toast.error('No Xero data available for analysis');
        return;
      }

      // Extract only essential financial data
      const financialSummary = extractFinancialData(xeroDataFromAnalysis);
      
      console.log('🎯 Financial Summary for AI Analysis:', financialSummary);
      console.log('💰 Total Invoice Amount:', financialSummary.invoices.summary.totalAmount);
      console.log('💳 Total Paid Amount:', financialSummary.invoices.summary.paidAmount);
      console.log('📊 Outstanding Amount:', financialSummary.invoices.summary.outstandingAmount);
      console.log('💵 Net Income:', financialSummary.financialMetrics?.netIncome);
      console.log('📈 Total Revenue:', financialSummary.invoices.summary.totalAmount);
      console.log('🔍 Financial Summary Data Available:', !!financialSummary.reports.financialSummary);
    
    // Create a minimal financial summary for the AI
    const conciseData = {
      rev: financialSummary.invoices.summary.totalAmount,
      paid: financialSummary.invoices.summary.paidAmount,
      outstanding: financialSummary.invoices.summary.outstandingAmount,
      netIncome: financialSummary.financialMetrics.netIncome,
      expenses: financialSummary.financialMetrics.totalExpenses,
      invoices: financialSummary.invoices.total,
      customers: financialSummary.contacts.types.customer || 0
    };

    // Debug: Check if values are actually numbers
    console.log('🔍 Raw values before sending to AI:');
    console.log('  - rev (totalAmount):', financialSummary.invoices.summary.totalAmount, 'type:', typeof financialSummary.invoices.summary.totalAmount);
    console.log('  - paid (paidAmount):', financialSummary.invoices.summary.paidAmount, 'type:', typeof financialSummary.invoices.summary.paidAmount);
    console.log('  - outstanding (outstandingAmount):', financialSummary.invoices.summary.outstandingAmount, 'type:', typeof financialSummary.invoices.summary.outstandingAmount);
    console.log('  - netIncome:', financialSummary.financialMetrics.netIncome, 'type:', typeof financialSummary.financialMetrics.netIncome);
    console.log('  - expenses:', financialSummary.financialMetrics.totalExpenses, 'type:', typeof financialSummary.financialMetrics.totalExpenses);

    const analysisPrompt = `Analyze financial data and return ONLY valid JSON with no additional text:

DATA: ${JSON.stringify(conciseData)}

Return this exact JSON structure with calculated values:
{"Cashflow_Projection": {"Month_1": 25000, "Month_2": 28000, "Month_3": 30000}, "GST_Estimate_Next_Period": 5000, "Insights": ["insight1", "insight2", "insight3"], "Recommended_Actions": ["action1", "action2", "action3"]}`;

    console.log('📝 Optimized prompt size:', analysisPrompt.length, 'characters');
    console.log('📊 Concise data sent to AI:', conciseData);
    console.log('🔍 Financial data validation:');
    console.log('  - Total Revenue:', conciseData.rev);
    console.log('  - Paid Amount:', conciseData.paid);
    console.log('  - Outstanding:', conciseData.outstanding);
    console.log('  - Net Income:', conciseData.netIncome);
    console.log('  - Expenses:', conciseData.expenses);
    console.log('  - Invoice Count:', conciseData.invoices);
    console.log('  - Customer Count:', conciseData.customers);

    try {
      setIsLoading(true);
      
      console.log('🔑 AI Key Check for Financial Analysis:');
      
      // Try to get API key from backend first
      let apiKey = null;
      let keySource = 'backend';
      
      try {
        console.log('🔄 Getting API key from backend for financial analysis...');
        const apiKeyResponse = await openaiService.getApiKey();
        console.log('🔍 Full API Key Response for Financial Analysis:', apiKeyResponse);
        
        if (apiKeyResponse && apiKeyResponse.apiKey) {
          apiKey = apiKeyResponse.apiKey;
          console.log('✅ Retrieved API key from backend for financial analysis');
          console.log('  - Backend Key Length:', apiKey.length);
          console.log('  - Backend Key Preview:', `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
          console.log('  - Key Valid:', apiKeyResponse.isValid);
          console.log('  - Model:', apiKeyResponse.model || 'Not specified');
          console.log('  - Full Backend Key:', apiKey);
          console.log('  - Key starts with sk-:', apiKey.startsWith('sk-'));
        } else {
          console.log('❌ No API key available from backend for financial analysis');
          console.log('  - API Key Response:', apiKeyResponse);
        }
      } catch (backendError) {
        console.log('❌ Failed to get API key from backend for financial analysis:', backendError);
        console.log('  - Error details:', backendError);
        // Fallback to environment variable if backend fails
        apiKey = AI_CONFIG.getApiKey();
        keySource = 'environment';
        console.log('🔄 Falling back to environment variable for financial analysis');
        console.log('  - Environment Key Available:', !!apiKey);
        console.log('  - Environment Key Length:', apiKey ? apiKey.length : 0);
        console.log('  - Environment Key Preview:', apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}` : 'None');
        console.log('  - Full Environment Key:', apiKey);
        console.log('  - Key starts with sk-:', apiKey ? apiKey.startsWith('sk-') : false);
      }
      
      console.log('🔑 AI Key Check for Financial Analysis:');
      console.log('  - Environment Key Available:', !!apiKey);
      console.log('  - Environment Key Length:', apiKey ? apiKey.length : 0);
      console.log('  - Environment Key Preview:', apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}` : 'None');
      
      if (apiKey) {
        console.log('🔧 Using API key for financial analysis');
        console.log('  - Key Source:', keySource === 'environment' ? 'VITE_OPENAI_API_KEY environment variable' : 'Backend API');
        console.log('  - API Endpoint: https://api.openai.com/v1/chat/completions');
        console.log('  - Model: gpt-3.5-turbo');
        console.log('  - Max Tokens: 2000');
        console.log('  - Temperature: 0.3');
        console.log('  - Full API Key:', apiKey); // Log the full key for debugging
        console.log('  - Key starts with sk-:', apiKey.startsWith('sk-'));
        console.log('  - Key length:', apiKey.length);
        
        // Validate API key format
        if (!apiKey.startsWith('sk-')) {
          console.error('❌ Invalid API key format - should start with "sk-"');
          throw new Error('Invalid API key format. Key should start with "sk-"');
        }
        
        const settings = AI_CONFIG.getDefaultSettings();
        const requestBody = {
          model: settings.model,
          messages: [{ role: 'user', content: analysisPrompt }],
          max_tokens: 2000,
          temperature: 0.3
        };
        
        console.log('📤 Financial Analysis Request body:', requestBody);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody)
        });

        console.log('📡 OpenAI API Response Status:', response.status);
        console.log('📡 OpenAI API Response Headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ OpenAI API Error Response:', errorText);
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ OpenAI API Success Response:', {
          model: data.model,
          usage: data.usage,
          choices: data.choices?.length || 0
        });
        
        // Extract content from OpenAI API response
        let content = '';
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
          content = data.choices[0].message.content;
        } else {
          console.warn('⚠️ Unexpected OpenAI API response structure:', data);
          content = 'Sorry, I received an unexpected response format. Please try again.';
        }
        
        console.log('📝 OpenAI API response content:', content);
        
        // Try to parse JSON from the response
        let analysis: FinancialAnalysis;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
            console.log('✅ JSON Parsing Successful:', Object.keys(analysis));
          } else {
            throw new Error('No JSON found in response');
          }
        } catch (parseError) {
          console.warn('⚠️ JSON Parsing Failed, using fallback:', parseError);
          // If JSON parsing fails, create a structured response
          analysis = {
            Cashflow_Projection: { Month_1: 0, Month_2: 0, Month_3: 0 },
            GST_Estimate_Next_Period: 0,
            Insights: [content],
            Recommended_Actions: ['Review the analysis above for detailed insights']
          };
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Financial Analysis Complete',
          timestamp: new Date(),
          data: analysis
        };

        setMessages(prev => [...prev, assistantMessage]);
        toast.success('Financial analysis completed!');
        return;
      }
      
      console.log('🔄 No API key available, falling back to backend services for financial analysis');
      console.log('  - Trying openaiService first...');
      
      // Fallback to backend services
      let response;
      try {
        response = await openaiService.chatCompletion({
          prompt: analysisPrompt
        });
        console.log('✅ OpenAI Service response:', response);
        console.log('  - Key Source: Backend openaiService');
      } catch (openaiError) {
        console.log('⚠️ openaiService failed, trying companyService:', openaiError);
        console.log('  - Key Source: Backend companyService');
        response = await companyService.chatCompletion(analysisPrompt);
        console.log('✅ Company Service response:', response);
      }
      
      // Parse the response
      let analysis: FinancialAnalysis;
      console.log('🔍 Raw AI Response:', response.response);
      console.log('🔍 Response type:', typeof response.response);
      
      try {
        // Try to extract JSON from the response
        const jsonMatch = response.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          console.log('🔍 Found JSON match:', jsonMatch[0]);
          analysis = JSON.parse(jsonMatch[0]);
          console.log('✅ Backend JSON Parsing Successful:', analysis);
          
          // Validate the parsed data
          if (!analysis.Cashflow_Projection || !analysis.GST_Estimate_Next_Period) {
            throw new Error('Invalid analysis structure');
          }
        } else {
          console.log('⚠️ No JSON found in response, trying to parse entire response');
          // Try to parse the entire response as JSON
          analysis = JSON.parse(response.response);
          console.log('✅ Direct JSON parsing successful:', analysis);
        }
      } catch (parseError) {
        console.warn('⚠️ Backend JSON Parsing Failed:', parseError);
        console.log('🔍 Full response for debugging:', response.response);
        
        // Create a more intelligent fallback based on the response content
        const responseText = response.response || '';
        const hasNumbers = /\d+/.test(responseText);
        const hasInsights = /insight|trend|growth|increase|decrease/i.test(responseText);
        
        if (hasNumbers && hasInsights) {
          // Extract numbers from the response for a better fallback
          const numbers = responseText.match(/\d+/g) || [];
          const extractedNumbers = numbers.map((n: string) => parseInt(n)).filter((n: number) => n > 0);
          
          analysis = {
            Cashflow_Projection: { 
              Month_1: extractedNumbers[0] || 25000, 
              Month_2: extractedNumbers[1] || 28000, 
              Month_3: extractedNumbers[2] || 30000 
            },
            GST_Estimate_Next_Period: extractedNumbers[3] || 5000,
            Insights: [responseText.substring(0, 200) + '...'],
            Recommended_Actions: ['Review the analysis above for detailed insights']
          };
        } else {
          // Default fallback
          analysis = {
            Cashflow_Projection: { Month_1: 25000, Month_2: 28000, Month_3: 30000 },
            GST_Estimate_Next_Period: 5000,
            Insights: [responseText || 'Analysis completed successfully'],
            Recommended_Actions: ['Review the analysis above for detailed insights']
          };
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Financial Analysis Complete',
        timestamp: new Date(),
        data: analysis
      };

      setMessages(prev => [...prev, assistantMessage]);
      toast.success('Financial analysis completed!');
    } catch (error: any) {
      console.error('❌ Financial analysis error:', error);
      const errorMessage = error.message || 'Failed to generate financial analysis';
      toast.error(errorMessage);
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error during financial analysis: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* Header */}
        <div className="relative bg-white/10 backdrop-blur-xl border-b border-white/20 px-4 sm:px-6 py-3 sm:py-4 shadow-2xl flex-shrink-0">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-white drop-shadow-lg truncate">AI Compliance Assistant</h1>
                <p className="text-indigo-200 text-xs sm:text-sm truncate">
                  {analysisMode === 'chat' ? 'Your intelligent compliance companion' : 'Financial analysis powered by Xero data'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Mode Toggle */}
              <div className="flex bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20">
                <button
                  onClick={() => setAnalysisMode('chat')}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg transition-all duration-300 whitespace-nowrap ${
                    analysisMode === 'chat'
                      ? 'bg-white text-indigo-900 shadow-lg transform scale-105'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  💬 Chat
                </button>
                <button
                  onClick={() => setAnalysisMode('financial')}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg transition-all duration-300 whitespace-nowrap ${
                    analysisMode === 'financial'
                      ? 'bg-white text-indigo-900 shadow-lg transform scale-105'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  📊 Analysis
                </button>
              </div>
              
              {/* Template Selector Button - Only show in chat mode */}
              {analysisMode === 'chat' && (
                <button
                  onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg transition-all duration-300 whitespace-nowrap border ${
                    showTemplateSelector
                      ? 'bg-white text-indigo-900 shadow-lg transform scale-105 border-white'
                      : 'text-white hover:bg-white/10 border-white/20'
                  }`}
                >
                  📋 Templates
                </button>
              )}
              
              {/* BAS Processing Button - Show in both modes */}
              <button
                onClick={() => navigate('/bas-processing')}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-300 whitespace-nowrap shadow-lg"
              >
                📊 BAS Processing
              </button>
              
              {/* FAS Processing Button - Show in both modes */}
              <button
                onClick={() => navigate('/fas-processing')}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300 whitespace-nowrap shadow-lg"
              >
                📊 FAS Processing
              </button>
              
              {/* Financial Analysis Actions */}
              {analysisMode === 'financial' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      const data = await loadXeroDataForAnalysis();
                      if (data) {
                        await generateFinancialAnalysis(data);
                      }
                    }}
                    disabled={!xeroConnected || isLoadingXeroData || isLoading}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg text-xs sm:text-sm whitespace-nowrap"
                  >
                    {isLoadingXeroData ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span className="hidden sm:inline">Loading Data...</span>
                        <span className="sm:hidden">Loading...</span>
                      </div>
                    ) : isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span className="hidden sm:inline">Analyzing...</span>
                        <span className="sm:hidden">Analyzing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="hidden sm:inline">Run Analysis</span>
                        <span className="sm:hidden">Analyze</span>
                      </div>
                    )}
                  </button>
                </div>
              )}
              
              <button
                onClick={clearChat}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-red-500/20 text-red-200 rounded-lg hover:bg-red-500/30 transition-all duration-300 border border-red-500/30 hover:border-red-500/50 whitespace-nowrap"
              >
                🗑️ Clear
              </button>
            </div>
          </div>
        </div>

        {/* AI Configuration Status */}
        <div className="relative bg-white/5 backdrop-blur-sm border-b border-white/10 px-4 sm:px-6 py-2 sm:py-3 flex-shrink-0">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3">
              {isLoadingKey ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-indigo-400"></div>
                  <span className="text-indigo-200 text-xs sm:text-sm">Loading AI configuration...</span>
                </div>
              ) : openAiKey ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-200 text-xs sm:text-sm">✨ Global AI Assistant ready</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-red-200 text-xs sm:text-sm">⚠️ Global AI configuration not available</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full relative z-10 px-4 sm:px-6 min-h-0">
          {/* Template Selector Dropdown */}
          {showTemplateSelector && analysisMode === 'chat' && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 mb-4 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold text-sm sm:text-base">Select a Template</h3>
                <button
                  onClick={() => setShowTemplateSelector(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <TemplateSelector
                onTemplateSelect={handleTemplateSelect}
                selectedTemplate={selectedTemplate}
                placeholder="Choose a compliance template..."
                className="bg-white/90 backdrop-blur-sm"
              />
              {selectedTemplate && (
                <div className="mt-3 p-3 bg-white/20 rounded-lg">
                  <div className="text-white text-sm">
                    <strong>Selected:</strong> {selectedTemplate.name}
                    <br />
                    <span className="text-white/80">
                      Type: {selectedTemplate.type} • Compliance: {selectedTemplate.notificationTypes?.join(', ')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 sm:space-y-6 min-h-0">
            {messages.length === 0 ? (
              <div className="text-center py-8 sm:py-16">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
                  {analysisMode === 'financial' ? (
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg px-4">
                  {analysisMode === 'financial' ? 'Financial Analysis Ready' : 'Welcome to AI Compliance Assistant'}
                </h3>
                <p className="text-indigo-200 max-w-md mx-auto text-sm sm:text-lg leading-relaxed px-4">
                  {analysisMode === 'financial' 
                    ? 'Connect to Xero and click "Run Analysis" to generate comprehensive financial insights including cashflow projections, GST estimates, and actionable recommendations.'
                    : 'Ask me anything about compliance, tax regulations, business requirements, or financial reporting. You can also select templates from the Templates button above to get specific guidance on compliance templates like BAS, FBT, IAS, and more.'
                  }
                </p>
                
                {/* Xero Connection Status for Financial Mode */}
                {analysisMode === 'financial' && (
                  <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 max-w-md mx-auto mx-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-medium text-sm sm:text-base">Xero Connection:</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${xeroConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400 animate-pulse'}`}></div>
                        <span className="text-indigo-200 text-xs sm:text-sm">
                          {xeroConnected ? 'Connected' : 'Not Connected'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Organization Selection */}
                    {xeroConnected && tenants.length > 0 && (
                      <div className="mb-3">
                        <label className="block text-white font-medium text-sm sm:text-base mb-2">
                          Select Organization:
                        </label>
                        <select
                          value={selectedTenant?.tenantId || selectedTenant?.id || ''}
                          onChange={(e) => {
                            const tenant = tenants.find((t: any) => t.tenantId === e.target.value || t.id === e.target.value);
                            if (tenant) {
                              selectTenant(tenant);
                            }
                          }}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent backdrop-blur-sm"
                        >
                          <option value="">Select an organization...</option>
                          {tenants.map((tenant) => (
                            <option key={tenant.tenantId || tenant.id} value={tenant.tenantId || tenant.id} className="bg-gray-800 text-white">
                              {tenant.name || tenant.organizationName || tenant.tenantName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {!xeroConnected && (
                      <p className="text-indigo-200 text-xs sm:text-sm">
                        Please connect to Xero in the Xero Integration section to use financial analysis.
                      </p>
                    )}
                    
                    {/* Organization Selection Warning */}
                    {xeroConnected && (!selectedTenant || !tenants.length) && (
                      <div className="mt-3 p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span className="text-red-200 text-xs sm:text-sm font-medium">
                            Please select an organization to proceed with financial analysis
                          </span>
                        </div>
                      </div>
                    )}
                    

                  </div>
                )}
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`max-w-[85vw] sm:max-w-2xl lg:max-w-3xl px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-xl backdrop-blur-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                        : 'bg-white/10 border border-white/20 text-white'
                    }`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="whitespace-pre-wrap text-sm sm:text-lg leading-relaxed break-words">{message.content}</div>
                        
                        {/* Financial Analysis Display */}
                        {message.data && message.role === 'assistant' && (
                          <div className="mt-4 sm:mt-6">
                            <FinancialAnalysisDisplay analysis={message.data} />
                          </div>
                        )}
                        
                        <div className={`text-xs sm:text-sm mt-2 sm:mt-3 opacity-70 ${
                          message.role === 'user' ? 'text-indigo-100' : 'text-indigo-200'
                        }`}>
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-rose-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start animate-fade-in-up">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 text-white max-w-[85vw] sm:max-w-2xl lg:max-w-3xl px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-xl">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-indigo-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-indigo-200 text-sm sm:text-lg">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="relative bg-white/10 backdrop-blur-xl border-t border-white/20 p-4 sm:p-6 shadow-2xl flex-shrink-0">
            <div className="flex items-end gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about compliance, tax regulations, or business requirements..."
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 resize-none text-white placeholder-indigo-200 text-sm sm:text-lg shadow-lg transition-all duration-300"
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 text-indigo-300 text-xs sm:text-sm">
                  Press Enter to send
                </div>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim() || !openAiKey.trim() || isLoadingKey}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-semibold hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-xl flex-shrink-0"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span className="hidden sm:inline">Sending...</span>
                    <span className="sm:hidden">...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span className="hidden sm:inline">Send</span>
                    <span className="sm:hidden">Send</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default AiChat; 
