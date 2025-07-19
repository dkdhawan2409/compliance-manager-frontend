import apiClient from './client';

export interface CompanyRegistrationData {
  companyName: string;
  email: string;
  mobileNumber: string;
  password: string;
}

export interface CompanyLoginData {
  email: string;
  password: string;
}

export interface ComplianceData {
  basFrequency: 'Monthly' | 'Quarterly' | 'Annually';
  fbtApplicable: boolean;
  financialYearEnd: string;
}

export interface ProfileData {
  companyName: string;
  email: string;
  mobileNumber: string;
}

export interface Company {
  id: number;
  companyName: string;
  email: string;
  mobileNumber: string;
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
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplateInput {
  type: 'email' | 'sms';
  name: string;
  subject: string;
  body: string;
}

export type NotificationSettingType = 'smtp' | 'twilio';

export interface NotificationSetting {
  id: number;
  type: NotificationSettingType;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettingInput {
  type: NotificationSettingType;
  config: Record<string, any>;
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
    const response = await apiClient.post<{ data: NotificationTemplate }>('/companies/templates', data);
    return response.data.data;
  },

  async getTemplates(): Promise<NotificationTemplate[]> {
    const response = await apiClient.get<{ data: NotificationTemplate[] }>('/companies/templates');
    return response.data.data;
  },

  async getTemplateById(id: number): Promise<NotificationTemplate> {
    const response = await apiClient.get<{ data: NotificationTemplate }>(`/companies/templates/${id}`);
    return response.data.data;
  },

  async updateTemplate(id: number, data: NotificationTemplateInput): Promise<NotificationTemplate> {
    const response = await apiClient.put<{ data: NotificationTemplate }>(`/companies/templates/${id}`, data);
    return response.data.data;
  },

  async deleteTemplate(id: number): Promise<void> {
    await apiClient.delete(`/companies/templates/${id}`);
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
};
