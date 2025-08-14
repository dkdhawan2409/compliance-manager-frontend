import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SidebarLayout from '../components/SidebarLayout';
import toast from 'react-hot-toast';
import openaiService from '../api/openaiService';
import { companyService } from '../api/companyService';
import { AI_CONFIG } from '../config/aiConfig';
import { useXero } from '../hooks/useXero';
import FinancialAnalysisDisplay from '../components/FinancialAnalysisDisplay';

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
  const { isConnected: xeroConnected, loadData: loadXeroData, isLoading: xeroLoading } = useXero();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [openAiKey, setOpenAiKey] = useState('');
  const [isLoadingKey, setIsLoadingKey] = useState(true);
  const [analysisMode, setAnalysisMode] = useState<'chat' | 'financial'>('chat');
  const [xeroData, setXeroData] = useState<any>(null);
  const [isLoadingXeroData, setIsLoadingXeroData] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      console.log('  - Environment Key Available:', AI_CONFIG.hasEnvironmentKey());
      console.log('  - Environment Key Length:', AI_CONFIG.getApiKey() ? AI_CONFIG.getApiKey()!.length : 0);
      console.log('  - Environment Key Preview:', AI_CONFIG.getApiKey() ? `${AI_CONFIG.getApiKey()!.substring(0, 10)}...${AI_CONFIG.getApiKey()!.substring(AI_CONFIG.getApiKey()!.length - 4)}` : 'None');
      
      // Check if we have environment variable API key
      const envApiKey = AI_CONFIG.getApiKey();
      if (envApiKey) {
        console.log('🔧 Using environment variable API key for direct OpenAI call');
        console.log('  - Key Source: VITE_OPENAI_API_KEY environment variable');
        console.log(envApiKey,'  - API Endpoint: https://api.openai.com/v1/chat/completions');
        console.log('  - Model: gpt-3.5-turbo');
        console.log('  - Max Tokens: 1000');
        console.log('  - Temperature: 0.7');
        
        // Make direct OpenAI API call
        const settings = AI_CONFIG.getDefaultSettings();
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${envApiKey}`
          },
          body: JSON.stringify({
            model: settings.model,
            messages: [{ role: 'user', content: inputMessage }],
            max_tokens: settings.maxTokens,
            temperature: settings.temperature
          })
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
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.choices[0].message.content,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        toast.success('Response received!');
        return;
      }
      
      console.log('🔄 Environment key not available, falling back to backend services');
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
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
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

  const clearChat = () => {
    setMessages([]);
    toast.success('Chat cleared!');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Load Xero data for financial analysis
  const loadXeroDataForAnalysis = async () => {
    if (!xeroConnected) {
      toast.error('Please connect to Xero first');
      return null;
    }

    try {
      setIsLoadingXeroData(true);
      toast.loading('Loading Xero data for analysis...');

      // Load transactions for the last 12 months
      const transactions = await loadXeroData('invoices');
      const contacts = await loadXeroData('contacts');
      
      // Also try to load BAS data if available
      let basData = null;
      try {
        basData = await loadXeroData('reports');
      } catch (error) {
        console.log('BAS data not available, proceeding without it');
      }

      const data = {
        transactions,
        contacts,
        basData,
        timestamp: new Date().toISOString()
      };

      setXeroData(data);
      toast.dismiss();
      toast.success('Xero data loaded successfully');
      return data;
    } catch (error: any) {
      toast.dismiss();
      toast.error('Failed to load Xero data: ' + (error.message || 'Unknown error'));
      return null;
    } finally {
      setIsLoadingXeroData(false);
    }
  };

  // Generate financial analysis using AI
  const generateFinancialAnalysis = async (xeroData: any) => {
    if (!xeroData) {
      toast.error('No Xero data available for analysis');
      return;
    }

    const analysisPrompt = `You are an AI financial analyst for AI Comply Hub.

Using the provided Xero data, generate a comprehensive financial analysis including:

1. 90-day cashflow projection based on historical data
2. Trend insights for sales and expenses
3. Potential tax liabilities for the next quarter
4. Suggested actions to improve cashflow

XERO DATA:
${JSON.stringify(xeroData, null, 2)}

Please provide your analysis in the following JSON format:
{
  "Cashflow_Projection": {
    "Month_1": <amount>,
    "Month_2": <amount>, 
    "Month_3": <amount>
  },
  "GST_Estimate_Next_Period": <amount>,
  "Insights": [
    "<insight 1>",
    "<insight 2>",
    "<insight 3>"
  ],
  "Recommended_Actions": [
    "<action 1>",
    "<action 2>", 
    "<action 3>"
  ]
}

Focus on practical, actionable insights that can help improve the business's financial health.`;

    try {
      setIsLoading(true);
      
      // Check if we have environment variable API key
      const envApiKey = AI_CONFIG.getApiKey();
      console.log('🔑 AI Key Check for Financial Analysis:');
      console.log('  - Environment Key Available:', !!envApiKey);
      console.log('  - Environment Key Length:', envApiKey ? envApiKey.length : 0);
      console.log('  - Environment Key Preview:', envApiKey ? `${envApiKey.substring(0, 10)}...${envApiKey.substring(envApiKey.length - 4)}` : 'None');
      
      if (envApiKey) {
        console.log('🔧 Using environment variable API key for financial analysis');
        console.log('  - Key Source: VITE_OPENAI_API_KEY environment variable');
        console.log('  - API Endpoint: https://api.openai.com/v1/chat/completions');
        console.log('  - Model: gpt-3.5-turbo');
        console.log('  - Max Tokens: 2000');
        console.log('  - Temperature: 0.3');
        
        const settings = AI_CONFIG.getDefaultSettings();
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${envApiKey}`
          },
          body: JSON.stringify({
            model: settings.model,
            messages: [{ role: 'user', content: analysisPrompt }],
            max_tokens: 2000,
            temperature: 0.3
          })
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
        
        const content = data.choices[0].message.content;
        
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
      
      console.log('🔄 Environment key not available, falling back to backend services');
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
      try {
        const jsonMatch = response.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
          console.log('✅ Backend JSON Parsing Successful:', Object.keys(analysis));
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.warn('⚠️ Backend JSON Parsing Failed, using fallback:', parseError);
        analysis = {
          Cashflow_Projection: { Month_1: 0, Month_2: 0, Month_3: 0 },
          GST_Estimate_Next_Period: 0,
          Insights: [response.response],
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
                    : 'Ask me anything about compliance, tax regulations, business requirements, or financial reporting. I\'m here to help you stay compliant and informed.'
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
                    {!xeroConnected && (
                      <p className="text-indigo-200 text-xs sm:text-sm">
                        Please connect to Xero in the Xero Integration section to use financial analysis.
                      </p>
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