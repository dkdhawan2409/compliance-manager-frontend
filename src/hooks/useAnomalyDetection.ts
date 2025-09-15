import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AnomalyDetectionService, {
  TrainingRequest,
  ScoringRequest,

  
  TrainingParameters,
  Model,
  ScoringResponse
} from '../api/anomalyDetectionService';

const anomalyDetectionService = new AnomalyDetectionService();

export const useAnomalyDetection = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Query for getting all models
  const {
    data: models,
    isLoading: modelsLoading,
    error: modelsError,
    refetch: refetchModels
  } = useQuery({
    queryKey: ['anomaly-detection-models'],
    queryFn: async () => {
      const response = await anomalyDetectionService.getAllModels();
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query for getting training jobs
  const {
    data: trainingJobs,
    isLoading: jobsLoading,
    refetch: refetchJobs
  } = useQuery({
    queryKey: ['anomaly-detection-jobs'],
    queryFn: async () => {
      const response = await anomalyDetectionService.getTrainingJobs();
      if (!response.success) {
        throw new Error('Failed to fetch training jobs');
      }
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // Mutation for training a model
  const trainModelMutation = useMutation({
    mutationFn: async (request: TrainingRequest) => {
      const response = await anomalyDetectionService.trainModel(request);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomaly-detection-models'] });
      queryClient.invalidateQueries({ queryKey: ['anomaly-detection-jobs'] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  // Mutation for scoring data
  const scoreDataMutation = useMutation({
    mutationFn: async (request: ScoringRequest) => {
      const response = await anomalyDetectionService.scoreData(request);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  // Mutation for activating a model
  const activateModelMutation = useMutation({
    mutationFn: async (modelId: string) => {
      const response = await anomalyDetectionService.activateModel(modelId);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomaly-detection-models'] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  // Mutation for deleting a model
  const deleteModelMutation = useMutation({
    mutationFn: async (modelId: string) => {
      const response = await anomalyDetectionService.deleteModel(modelId);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomaly-detection-models'] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  // Function to check training status
  const checkTrainingStatus = useCallback(async (jobId: string) => {
    try {
      const response = await anomalyDetectionService.getTrainingStatus(jobId);
      if (response.success && response.data.status === 'completed') {
        queryClient.invalidateQueries({ queryKey: ['anomaly-detection-models'] });
        queryClient.invalidateQueries({ queryKey: ['anomaly-detection-jobs'] });
      }
      return response.data;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to check training status');
      throw error;
    }
  }, [queryClient]);

  // Function to export results
  const exportResults = useCallback(async (results: any[], filename?: string) => {
    try {
      const blob = await anomalyDetectionService.exportResults({ results, filename });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'anomaly_results.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to export results');
      throw error;
    }
  }, []);

  // Function to train model with default parameters
  const trainModelWithDefaults = useCallback(async (
    dataset: any[],
    name: string,
    description: string,
    parameters?: Partial<TrainingParameters>
  ) => {
    const defaultParameters: TrainingParameters = {
      contamination: 0.1,
      nEstimators: 100,
      randomState: 42,
      ...parameters
    };

    const request: TrainingRequest = {
      dataset,
      parameters: defaultParameters,
      name,
      description
    };

    return trainModelMutation.mutateAsync(request);
  }, [trainModelMutation]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Data
    models: models || [],
    trainingJobs: trainingJobs || [],
    
    // Loading states
    modelsLoading,
    jobsLoading,
    isTraining: trainModelMutation.isPending,
    isScoring: scoreDataMutation.isPending,
    isActivating: activateModelMutation.isPending,
    isDeleting: deleteModelMutation.isPending,
    
    // Error handling
    error,
    clearError,
    
    // Actions
    trainModel: trainModelMutation.mutateAsync,
    trainModelWithDefaults,
    scoreData: scoreDataMutation.mutateAsync,
    activateModel: activateModelMutation.mutateAsync,
    deleteModel: deleteModelMutation.mutateAsync,
    checkTrainingStatus,
    exportResults,
    
    // Refetch functions
    refetchModels,
    refetchJobs
  };
};

