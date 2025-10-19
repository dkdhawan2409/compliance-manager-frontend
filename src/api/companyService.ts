import apiClient from './client';

export interface CompanyRegistrationData {
  companyName: string;
  email: string;
  mobileNumber: string;
  countryCode: string;
  password: string;
}

export interface CompanyLoginData {
  email: string;
  password: string;
}

export interface ComplianceData {
  basFrequency: 'Monthly' | 'Quarterly' | 'Annually';
  nextBasDue: string;
  fbtApplicable: boolean;
  nextFbtDue?: string;
  iasRequired: boolean;
  iasFrequency?: 'Monthly' | 'Quarterly' | 'Annually';
  nextIasDue?: string;
  financialYearEnd: string;
}

export interface ProfileData {
  companyName: string;
  email: string;
  mobileNumber: string;
  countryCode: string;
  accountantEmail?: string;
}

export interface Company {
  id: number;
  companyName: string;
  email: string;
  accountantEmail?: string;
  mobileNumber: string;
  countryCode?: string;
  basFrequency?: 'Monthly' | 'Quarterly' | 'Annually';
  fbtApplicable?: boolean;
  financialYearEnd?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role?: string;
  superadmin?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    company: Company;
    token: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface CompanyListResponse {
  success: boolean;
  message: string;
  data: Company[];
}

export interface NotificationTemplate {
  id: number;
  type: 'email' | 'sms';
  name: string;
  subject?: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  // Add new fields for notification types and days
  notificationTypes?: string[];
  smsDays?: number[];
  emailDays?: number[];
}

export interface NotificationTemplateInput {
  type: 'email' | 'sms';
  name: string;
  subject?: string;
  body: string;
  notificationTypes: string[];
  smsDays?: number[];
  emailDays?: number[];
}

export type NotificationSettingType = 'smtp' | 'twilio' | 'sendgrid' | 'openai';

export interface NotificationSetting {
  id: number;
  type: NotificationSettingType;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  // Add these for backend compatibility
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  apiKey?: string;
  fromEmail?: string;
  fromName?: string;
}

export interface NotificationSettingInput {
  type: NotificationSettingType;
  config: Record<string, any>;
}

// Cronjob Settings Types
export interface CronjobSettings {
  id: number;
  notificationTypes: string[]; // e.g. ['BAS', 'FBT', 'IAS', 'FYEND']
  duration: number; // in days
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CronjobSettingsInput {
  notificationTypes: string[];
  duration: number;
  enabled: boolean;
}

export interface ComplianceDeadlines {
  bas: {
    monthly: string;
    quarterly: {
      q1: string;
      q2: string;
      q3: string;
      q4: string;
    };
  };
  annual: {
    standard: string;
    noTaxReturn: string;
  };
  ias: {
    monthly: string;
    quarterly: {
      q1: string;
      q2: string;
      q3: string;
      q4: string;
    };
  };
  fbt: {
    annual: {
      selfLodgement: string;
      taxAgentElectronic: string;
    };
  };
}

export const companyService = {
  async register(data: CompanyRegistrationData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/companies/register', data);
    return response.data;
  },

  async login(data: CompanyLoginData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/companies/login', data);
    return response.data;
  },

  async updateCompliance(data: ComplianceData): Promise<ApiResponse<Company>> {
    const response = await apiClient.patch<ApiResponse<Company>>('/companies/compliance', data);
    return response.data;
  },

  async updateProfile(data: ProfileData): Promise<ApiResponse<Company>> {
    const response = await apiClient.patch<ApiResponse<Company>>('/companies/profile', data);
    return response.data;
  },

  async getAllCompanies(): Promise<CompanyListResponse> {
    const response = await apiClient.get<CompanyListResponse>('/companies/all');
    return response.data;
  },

  async createTemplate(data: NotificationTemplateInput): Promise<NotificationTemplate> {
    // Use the new template service for backward compatibility
    const { templateService } = await import('./templateService');
    return templateService.createTemplate(data);
  },

  async getTemplates(): Promise<NotificationTemplate[]> {
    // Use the new template service for backward compatibility
    const { templateService } = await import('./templateService');
    return templateService.getTemplatesLegacy();
  },

  async getTemplateById(id: number): Promise<NotificationTemplate> {
    // Use the new template service for backward compatibility
    const { templateService } = await import('./templateService');
    return templateService.getTemplateById(id);
  },

  async updateTemplate(id: number, data: NotificationTemplateInput): Promise<NotificationTemplate> {
    // Use the new template service for backward compatibility
    const { templateService } = await import('./templateService');
    return templateService.updateTemplate(id, data);
  },

  async deleteTemplate(id: number): Promise<void> {
    // Use the new template service for backward compatibility
    const { templateService } = await import('./templateService');
    return templateService.deleteTemplate(id);
  },

  async createSetting(data: NotificationSettingInput): Promise<NotificationSetting> {
    const response = await apiClient.post<{ data: NotificationSetting }>('/companies/settings', data);
    return response.data.data;
  },

  async getSettings(): Promise<NotificationSetting[]> {
    const response = await apiClient.get<{ data: NotificationSetting[] }>('/companies/settings');
    return response.data.data;
  },

  async getSettingByType(type: NotificationSettingType): Promise<NotificationSetting> {
    const response = await apiClient.get<{ data: NotificationSetting }>(`/companies/settings/${type}`);
    return response.data.data;
  },

  async updateSetting(id: number, config: Record<string, any>): Promise<NotificationSetting> {
    const response = await apiClient.put<{ data: NotificationSetting }>(`/companies/settings/${id}`, { config });
    return response.data.data;
  },

  async deleteSetting(id: number): Promise<void> {
    await apiClient.delete(`/companies/settings/${id}`);
  },

  async updateComplianceDetails(data: ComplianceData): Promise<ApiResponse<Company>> {
    const response = await apiClient.patch<ApiResponse<Company>>('/companies/compliance-details', data);
    return response.data;
  },

  async updateCompanyById(companyId: number, data: Partial<Company>): Promise<ApiResponse<Company>> {
    const response = await apiClient.put<ApiResponse<Company>>(`/companies/${companyId}`, data);
    return response.data;
  },

  async getCompanyById(companyId: number): Promise<any> {
    const response = await apiClient.get(`/companies/${companyId}`);
    return response.data;
  },

  // Cronjob Settings API
  async getCronjobSettings(): Promise<CronjobSettings> {
    const response = await apiClient.get<{ data: CronjobSettings }>('/cronjob-settings');
    return response.data.data;
  },

  async updateCronjobSettings(id: number, data: CronjobSettingsInput): Promise<CronjobSettings> {
    const response = await apiClient.put<{ data: CronjobSettings }>(`/cronjob-settings/${id}`, data);
    return response.data.data;
  },

  async sendSmsToAllUsers(message: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/companies/notify/sms-all',
      { message }
    );
    return response.data;
  },

  async getComplianceDeadlines(): Promise<ComplianceDeadlines> {
    const { data } = await apiClient.get<{ success: boolean, data: ComplianceDeadlines }>('/compliance-deadlines');
    return data.data;
  },
  async updateComplianceDeadlines(payload: ComplianceDeadlines): Promise<ComplianceDeadlines> {
    const { data } = await apiClient.put<ComplianceDeadlines>('/compliance-deadlines', payload);
    return data;
  },

  // AI Chat APIs
  async getOpenAiSettings(): Promise<any> {
    const response = await apiClient.get<{ data: any }>('/api/openai-admin/settings');
    return response.data.data;
  },

  async saveOpenAiSettings(settings: {
    apiKey: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<any> {
    // Only send apiKey to backend as that's what the validation schema expects
    const response = await apiClient.post<{ data: any }>('/api/openai-admin/settings', { apiKey: settings.apiKey });
    return response.data.data;
  },

  async testOpenAiApiKey(apiKey: string): Promise<any> {
    const response = await apiClient.post<{ data: any }>('/api/openai-admin/test-key', { apiKey });
    return response.data.data;
  },

  async chatCompletion(prompt: string, model?: string, maxTokens?: number, temperature?: number): Promise<any> {
    const response = await apiClient.post<{ data: any }>('/api/openai/chat', {
      prompt,
      model,
      maxTokens,
      temperature
    });
    return response.data.data;
  },

  async generateComplianceText(complianceType: string, companyName: string, daysLeft: number, customPrompt?: string): Promise<any> {
    const response = await apiClient.post<{ data: any }>('/api/openai/compliance-text', {
      complianceType,
      companyName,
      daysLeft,
      customPrompt
    });
    return response.data.data;
  },

  async generateTemplate(templateType: string, complianceType: string, tone?: string, customPrompt?: string): Promise<any> {
    const response = await apiClient.post<{ data: any }>('/api/openai/generate-template', {
      templateType,
      complianceType,
      tone,
      customPrompt
    });
    return response.data.data;
  },

  async analyzeContent(content: string, analysisType?: string, customPrompt?: string): Promise<any> {
    const response = await apiClient.post<{ data: any }>('/api/openai/analyze-content', {
      content,
      analysisType,
      customPrompt
    });
    return response.data.data;
  },
};
