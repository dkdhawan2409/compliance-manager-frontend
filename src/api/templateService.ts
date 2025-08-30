import apiClient from './client';
import { useState, useEffect } from 'react';

// Types for the new template API
export interface TemplateResponse {
  success: boolean;
  data: {
    notificationTemplates: NotificationTemplate[];
    aiTemplateExamples: AITemplateExample[];
    summary: {
      totalNotificationTemplates: number;
      emailTemplates: number;
      smsTemplates: number;
    };
  };
}

export interface NotificationTemplate {
  id: number;
  type: 'email' | 'sms';
  name: string;
  subject?: string;
  body: string;
  notificationTypes?: string[];
  smsDays?: number[];
  emailDays?: number[];
  createdAt: string;
  updatedAt: string;
}

export interface AITemplateExample {
  id: number;
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
  createdAt: string;
}

export interface TemplateStats {
  success: boolean;
  data: {
    totalTemplates: number;
    emailTemplates: number;
    smsTemplates: number;
    templatesByComplianceType: Record<string, number>;
    recentTemplates: NotificationTemplate[];
  };
}

export interface CreateNotificationTemplateRequest {
  type: 'email' | 'sms';
  name: string;
  subject?: string;
  body: string;
  notificationTypes: string[];
  smsDays?: number[];
  emailDays?: number[];
}

export interface GenerateAITemplateRequest {
  templateType: 'email' | 'sms';
  complianceType: string;
  tone?: 'professional' | 'urgent' | 'friendly';
  customPrompt?: string;
  model?: 'gpt-3.5-turbo' | 'gpt-4';
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateAITemplateResponse {
  success: boolean;
  data: {
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
  };
}

export interface TestTemplateRequest {
  companyId: number;
  channel: 'sms' | 'email';
  testData: {
    companyName: string;
    complianceType: string;
    daysLeft: number;
    date: string;
  };
}

export const templateService = {
  // Backward compatibility: Get templates from the old endpoint
  async getTemplatesLegacy(): Promise<NotificationTemplate[]> {
    try {
      const response = await apiClient.get<{ data: NotificationTemplate[] }>('/companies/templates');
      return response.data.data;
    } catch (error) {
      console.warn('Legacy templates endpoint failed, trying new endpoint...');
      // Fallback to new endpoint
      return this.getAllTemplates();
    }
  },

  // New API: Get all templates with full response structure
  async getAllTemplates(): Promise<TemplateResponse['data']> {
    const response = await apiClient.get<TemplateResponse>('/templates');
    return response.data.data;
  },

  // New API: Get templates by type
  async getTemplatesByType(type: 'email' | 'sms' | 'ai-generated'): Promise<NotificationTemplate[]> {
    const response = await apiClient.get<{ success: boolean; data: NotificationTemplate[] }>(`/templates/type/${type}`);
    return response.data.data;
  },

  // New API: Get template statistics
  async getTemplateStats(): Promise<TemplateStats['data']> {
    const response = await apiClient.get<TemplateStats>('/templates/stats');
    return response.data.data;
  },

  // New API: Create notification template
  async createNotificationTemplate(data: CreateNotificationTemplateRequest): Promise<NotificationTemplate> {
    const response = await apiClient.post<{ success: boolean; data: NotificationTemplate }>('/templates/notification', data);
    return response.data.data;
  },

  // New API: Generate AI template
  async generateAITemplate(data: GenerateAITemplateRequest): Promise<GenerateAITemplateResponse['data']> {
    const response = await apiClient.post<GenerateAITemplateResponse>('/templates/generate', data);
    return response.data.data;
  },

  // New API: Test template
  async testTemplate(templateId: number, data: TestTemplateRequest): Promise<any> {
    const response = await apiClient.post(`/templates/notification/${templateId}/test`, data);
    return response.data;
  },

  // Backward compatibility: Create template (supports both old and new endpoints)
  async createTemplate(data: CreateNotificationTemplateRequest): Promise<NotificationTemplate> {
    try {
      // Try new endpoint first
      return await this.createNotificationTemplate(data);
    } catch (error) {
      console.warn('New template endpoint failed, trying legacy endpoint...');
      // Fallback to legacy endpoint
      const response = await apiClient.post<{ data: NotificationTemplate }>('/companies/templates', data);
      return response.data.data;
    }
  },

  // Backward compatibility: Update template
  async updateTemplate(id: number, data: CreateNotificationTemplateRequest): Promise<NotificationTemplate> {
    try {
      // Try new endpoint first
      const response = await apiClient.put<{ success: boolean; data: NotificationTemplate }>(`/templates/notification/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.warn('New template update endpoint failed, trying legacy endpoint...');
      // Fallback to legacy endpoint
      const response = await apiClient.put<{ data: NotificationTemplate }>(`/companies/templates/${id}`, data);
      return response.data.data;
    }
  },

  // Backward compatibility: Delete template
  async deleteTemplate(id: number): Promise<void> {
    try {
      // Try new endpoint first
      await apiClient.delete(`/templates/notification/${id}`);
    } catch (error) {
      console.warn('New template delete endpoint failed, trying legacy endpoint...');
      // Fallback to legacy endpoint
      await apiClient.delete(`/companies/templates/${id}`);
    }
  },

  // Backward compatibility: Get template by ID
  async getTemplateById(id: number): Promise<NotificationTemplate> {
    try {
      // Try new endpoint first
      const response = await apiClient.get<{ success: boolean; data: NotificationTemplate }>(`/templates/notification/${id}`);
      return response.data.data;
    } catch (error) {
      console.warn('New template get endpoint failed, trying legacy endpoint...');
      // Fallback to legacy endpoint
      const response = await apiClient.get<{ data: NotificationTemplate }>(`/companies/templates/${id}`);
      return response.data.data;
    }
  },
};

// Hook for backward compatibility
export const useTemplates = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await templateService.getTemplatesLegacy();
      setTemplates(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return { templates, loading, error, refetch: fetchTemplates };
};

// Hook for AI template generation
export const useGenerateAITemplate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedTemplate, setGeneratedTemplate] = useState<GenerateAITemplateResponse['data'] | null>(null);

  const generateTemplate = async (params: GenerateAITemplateRequest) => {
    try {
      setLoading(true);
      setError(null);
      const result = await templateService.generateAITemplate(params);
      setGeneratedTemplate(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to generate template';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { generateTemplate, loading, error, generatedTemplate };
};

// Hook for template creation
export const useCreateTemplate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTemplate = async (templateData: CreateNotificationTemplateRequest) => {
    try {
      setLoading(true);
      setError(null);
      const result = await templateService.createTemplate(templateData);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create template';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createTemplate, loading, error };
};

