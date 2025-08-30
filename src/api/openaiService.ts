import apiClient from './client';

// Types for OpenAI API responses
export interface OpenAISettingsData {
  id: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OpenAISettingsInput {
  apiKey: string;
}

export interface TestApiKeyResponse {
  isValid: boolean;
  model: string | null;
  error: string | null;
}

export interface ApiKeyResponse {
  apiKey: string;
  isValid: boolean;
  model?: string;
}

export interface ChatCompletionRequest {
  prompt: string;
}

export interface ChatCompletionResponse {
  response: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finishReason: string;
}

export interface GenerateComplianceTextRequest {
  complianceType: string;
  companyName: string;
  daysLeft: number;
  customPrompt?: string;
}

export interface GenerateComplianceTextResponse {
  response: string;
  complianceType: string;
  companyName: string;
  daysLeft: number;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GenerateTemplateRequest {
  templateType: 'email' | 'sms';
  complianceType: string;
  tone?: string;
  customPrompt?: string;
}

export interface GenerateTemplateResponse {
  template: string;
  templateType: string;
  complianceType: string;
  tone: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AnalyzeContentRequest {
  content: string;
  analysisType: 'compliance' | 'tone' | 'effectiveness';
  customPrompt?: string;
}

export interface AnalyzeContentResponse {
  analysis: string;
  analysisType: string;
  content: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class OpenAIService {
  private baseURL = '/openai';

  // OpenAI Settings Management
  async saveSettings(settings: OpenAISettingsInput): Promise<OpenAISettingsData> {
    const response = await apiClient.post<OpenAISettingsData>(`${this.baseURL}/settings`, settings);
    return response.data;
  }

  async getSettings(): Promise<OpenAISettingsData> {
    const response = await apiClient.get<OpenAISettingsData>(`${this.baseURL}/settings`);
    return response.data;
  }

  async updateSettings(id: number, settings: OpenAISettingsInput): Promise<OpenAISettingsData> {
    const response = await apiClient.put<OpenAISettingsData>(`${this.baseURL}/settings/${id}`, settings);
    return response.data;
  }

  async deleteSettings(id: number): Promise<{ id: number }> {
    const response = await apiClient.delete<{ id: number }>(`${this.baseURL}/settings/${id}`);
    return response.data;
  }

  async testApiKey(apiKey: string): Promise<TestApiKeyResponse> {
    const response = await apiClient.post<TestApiKeyResponse>(`${this.baseURL}/test-api-key`, { apiKey });
    return response.data;
  }

  async getApiKey(): Promise<ApiKeyResponse> {
    const response = await apiClient.get<ApiKeyResponse>('/api/openai-admin/api-key');
    return response.data;
  }

  // OpenAI API Endpoints
  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await apiClient.post<{success: boolean, message: string, data: ChatCompletionResponse}>(`${this.baseURL}/chat`, request);
    return response.data.data;
  }

  async generateComplianceText(request: GenerateComplianceTextRequest): Promise<GenerateComplianceTextResponse> {
    const response = await apiClient.post<{success: boolean, message: string, data: GenerateComplianceTextResponse}>(`${this.baseURL}/compliance-text`, request);
    return response.data.data;
  }

  async generateTemplate(request: GenerateTemplateRequest): Promise<GenerateTemplateResponse> {
    const response = await apiClient.post<{success: boolean, message: string, data: GenerateTemplateResponse}>(`${this.baseURL}/generate-template`, request);
    return response.data.data;
  }

  async analyzeContent(request: AnalyzeContentRequest): Promise<AnalyzeContentResponse> {
    const response = await apiClient.post<{success: boolean, message: string, data: AnalyzeContentResponse}>(`${this.baseURL}/analyze-content`, request);
    return response.data.data;
  }
}

const openAIService = new OpenAIService();
export default openAIService; 