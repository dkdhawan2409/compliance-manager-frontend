/// <reference types="vite/client" />

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://compliance-manager-backend.onrender.com/api';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('company');
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          response: {
            status: response.status,
            data: errorData,
          },
        };
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<{ data: T }> {
    const data = await this.request<T>(endpoint, { method: 'GET' });
    return { data };
  }

  async post<T>(endpoint: string, data: any): Promise<{ data: T }> {
    const responseData = await this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { data: responseData };
  }

  async patch<T>(endpoint: string, data: any): Promise<{ data: T }> {
    const responseData = await this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return { data: responseData };
  }

  async put<T>(endpoint: string, data: any): Promise<{ data: T }> {
    const responseData = await this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return { data: responseData };
  }

  async delete<T>(endpoint: string): Promise<{ data: T }> {
    const data = await this.request<T>(endpoint, { method: 'DELETE' });
    return { data };
  }
}

const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
