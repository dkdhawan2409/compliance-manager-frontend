import apiClient from './client';

export interface TrainingParameters {
  contamination?: number;
  nEstimators?: number;
  randomState?: number;
  [key: string]: any;
}

export interface TrainingRequest {
  dataset: any[];
  parameters: TrainingParameters;
  name: string;
  description: string;
}

export interface TrainingResponse {
  success: boolean;
  message: string;
  data: {
    jobId: string;
    status: string;
    modelId?: string;
  };
}

export interface TrainingStatusResponse {
  success: boolean;
  message: string;
  data: {
    jobId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress?: number;
    modelId?: string;
    error?: string;
  };
}

export interface ScoringRequest {
  data: any[];
  threshold?: number;
  modelId?: string;
}

export interface ScoringResult {
  index: number;
  score: number;
  isAnomaly: boolean;
}

export interface ScoringResponse {
  success: boolean;
  message: string;
  data: {
    totalSamples: number;
    anomaliesDetected: number;
    summary: {
      anomalyRate: number;
      meanScore: number;
      stdScore: number;
    };
    results: ScoringResult[];
  };
}

export interface Model {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  parameters: TrainingParameters;
  metrics?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
  };
}

export interface ModelsResponse {
  success: boolean;
  message: string;
  data: Model[];
}

export interface ExportRequest {
  results: ScoringResult[];
  filename?: string;
}

class AnomalyDetectionService {
  // Training
  async trainModel(request: TrainingRequest): Promise<TrainingResponse> {
    const response = await apiClient.post('/anomaly-detection/train', request);
    return response.data;
  }

  async getTrainingStatus(jobId: string): Promise<TrainingStatusResponse> {
    const response = await apiClient.get(`/anomaly-detection/training/status/${jobId}`);
    return response.data;
  }

  async getTrainingJobs(): Promise<{ success: boolean; data: any[] }> {
    const response = await apiClient.get('/anomaly-detection/training/jobs');
    return response.data;
  }

  // Scoring
  async scoreData(request: ScoringRequest): Promise<ScoringResponse> {
    const response = await apiClient.post('/anomaly-detection/score', request);
    return response.data;
  }

  // Model Management
  async getAllModels(): Promise<ModelsResponse> {
    const response = await apiClient.get('/anomaly-detection/models');
    return response.data;
  }

  async activateModel(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/anomaly-detection/models/${id}/activate`);
    return response.data;
  }

  async deleteModel(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/anomaly-detection/models/${id}`);
    return response.data;
  }

  // Export
  async exportResults(request: ExportRequest): Promise<Blob> {
    const response = await apiClient.post('/anomaly-detection/export', request, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export default AnomalyDetectionService;

