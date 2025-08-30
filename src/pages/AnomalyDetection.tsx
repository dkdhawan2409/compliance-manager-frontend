import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Upload as UploadIcon,
  PlayArrow as TrainIcon,
  Search as ScoreIcon,
  Download as ExportIcon,
  Delete as DeleteIcon,
  CheckCircle as ActivateIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Analytics as AnalyticsIcon,
  ModelTraining as ModelIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useAnomalyDetection } from '../hooks/useAnomalyDetection';
import SidebarLayout from '../components/SidebarLayout';
import toast from 'react-hot-toast';

interface DatasetSample {
  amount?: number;
  frequency?: number;
  location?: string;
  [key: string]: any;
}

const AnomalyDetection: React.FC = () => {
  const {
    models,
    trainingJobs,
    modelsLoading,
    jobsLoading,
    isTraining,
    isScoring,
    isActivating,
    isDeleting,
    error,
    clearError,
    trainModelWithDefaults,
    scoreData,
    activateModel,
    deleteModel,
    checkTrainingStatus,
    exportResults,
    refetchModels,
    refetchJobs
  } = useAnomalyDetection();

  const [dataset, setDataset] = useState<DatasetSample[]>([]);
  const [results, setResults] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [threshold, setThreshold] = useState<number>(0.5);
  const [modelName, setModelName] = useState('');
  const [modelDescription, setModelDescription] = useState('');
  const [contamination, setContamination] = useState<number>(0.1);
  const [nEstimators, setNEstimators] = useState<number>(100);
  const [showTrainingDialog, setShowTrainingDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);

  // Auto-refresh training jobs
  useEffect(() => {
    const interval = setInterval(() => {
      refetchJobs();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [refetchJobs]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (Array.isArray(data)) {
          setDataset(data);
          toast.success(`Dataset loaded: ${data.length} samples`);
        } else {
          toast.error('Invalid file format. Please upload a JSON array.');
        }
      } catch (err) {
        toast.error('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleTrain = async () => {
    if (!dataset.length) {
      toast.error('Please upload a dataset first');
      return;
    }

    if (!modelName.trim()) {
      toast.error('Please enter a model name');
      return;
    }

    try {
      const result = await trainModelWithDefaults(
        dataset,
        modelName,
        modelDescription || 'Anomaly detection model',
        { contamination, nEstimators }
      );
      
      toast.success('Training started successfully!');
      setShowTrainingDialog(false);
      setModelName('');
      setModelDescription('');
    } catch (err) {
      toast.error('Failed to start training');
    }
  };

  const handleScore = async () => {
    if (!dataset.length) {
      toast.error('Please upload a dataset first');
      return;
    }

    try {
      const result = await scoreData({
        data: dataset.slice(0, 10), // Score first 10 samples for demo
        threshold,
        modelId: selectedModel || undefined
      });
      
      setResults(result);
      setShowResultsDialog(true);
      toast.success('Data scored successfully!');
    } catch (err) {
      toast.error('Failed to score data');
    }
  };

  const handleActivateModel = async (modelId: string) => {
    try {
      await activateModel(modelId);
      toast.success('Model activated successfully!');
    } catch (err) {
      toast.error('Failed to activate model');
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (window.confirm('Are you sure you want to delete this model?')) {
      try {
        await deleteModel(modelId);
        toast.success('Model deleted successfully!');
      } catch (err) {
        toast.error('Failed to delete model');
      }
    }
  };

  const handleExport = async () => {
    if (!results) {
      toast.error('No results to export');
      return;
    }

    try {
      await exportResults(results.results || [], 'anomaly_results.csv');
      toast.success('Results exported successfully!');
    } catch (err) {
      toast.error('Failed to export results');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'pending': return 'warning';
      case 'running': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  return (
    <SidebarLayout>
      <div className="w-full">
        {/* Header Section */}
        <div className="flex items-center gap-4 bg-white/80 rounded-xl shadow-lg p-5 mb-6 border border-white/60">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow">
            <AnalyticsIcon />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-1 text-gray-800">Anomaly Detection</h1>
            <p className="text-gray-500 text-sm">Train models and detect anomalies in your data</p>
          </div>
        </div>
        
        {error && (
          <Alert severity="error" onClose={clearError} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Main Workflow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Dataset Upload Card */}
          <div className="bg-white/90 rounded-xl shadow-md border border-white/60 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                <UploadIcon />
              </div>
              <span className="text-lg font-semibold text-gray-800">1. Upload Dataset</span>
            </div>
            <p className="text-gray-500 text-sm mb-4">Upload your JSON dataset to get started</p>
            <input
              accept=".json"
              style={{ display: 'none' }}
              id="dataset-upload"
              type="file"
              onChange={handleFileUpload}
            />
            <label htmlFor="dataset-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                fullWidth
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700"
              >
                Upload JSON Dataset
              </Button>
            </label>
            {dataset.length > 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Dataset loaded: {dataset.length} samples
              </Alert>
            )}
          </div>

          {/* Model Training Card */}
          <div className="bg-white/90 rounded-xl shadow-md border border-white/60 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                <ModelIcon />
              </div>
              <span className="text-lg font-semibold text-gray-800">2. Train Model</span>
            </div>
            <p className="text-gray-500 text-sm mb-4">Train a new anomaly detection model</p>
            <Button
              variant="contained"
              startIcon={<TrainIcon />}
              onClick={() => setShowTrainingDialog(true)}
              disabled={!dataset.length || isTraining}
              fullWidth
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              {isTraining ? 'Training...' : 'Train New Model'}
            </Button>
          </div>

          {/* Data Scoring Card */}
          <div className="bg-white/90 rounded-xl shadow-md border border-white/60 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white">
                <AssessmentIcon />
              </div>
              <span className="text-lg font-semibold text-gray-800">3. Score Data</span>
            </div>
            <p className="text-gray-500 text-sm mb-4">Score new data for anomalies</p>
            <Button
              variant="contained"
              startIcon={<ScoreIcon />}
              onClick={handleScore}
              disabled={!dataset.length || isScoring}
              fullWidth
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              {isScoring ? 'Scoring...' : 'Score Data'}
            </Button>
          </div>

          {/* Export Results Card */}
          <div className="bg-white/90 rounded-xl shadow-md border border-white/60 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white">
                <ExportIcon />
              </div>
              <span className="text-lg font-semibold text-gray-800">4. Export Results</span>
            </div>
            <p className="text-gray-500 text-sm mb-4">Export your results as CSV</p>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={handleExport}
              disabled={!results}
              fullWidth
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 hover:from-orange-600 hover:to-orange-700"
            >
              Export as CSV
            </Button>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="bg-white/90 rounded-xl shadow-md border border-white/60 p-5 mb-6">
          <Typography variant="h6" className="mb-4 text-gray-800">
            Configuration
          </Typography>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <FormControl fullWidth>
                 <InputLabel>Select Model (Optional)</InputLabel>
                 <Select
                   value={selectedModel}
                   onChange={(e) => setSelectedModel(e.target.value)}
                   label="Select Model (Optional)"
                 >
                   <MenuItem value="">Use Default Model</MenuItem>
                   {models.map((model) => (
                     <MenuItem key={model.id} value={model.id}>
                       {model.name} ({model.status})
                     </MenuItem>
                   ))}
                 </Select>
               </FormControl>
             </div>
             <div>
               <Typography gutterBottom>
                 Threshold: {threshold}
               </Typography>
               <Slider
                 value={threshold}
                 onChange={(_, value) => setThreshold(value as number)}
                 min={0}
                 max={1}
                 step={0.01}
                 marks={[
                   { value: 0, label: '0' },
                   { value: 0.5, label: '0.5' },
                   { value: 1, label: '1' }
                 ]}
                 className="mb-2"
               />
             </div>
           </div>
        </div>

        {/* Models List */}
        <div className="bg-white/90 rounded-xl shadow-md border border-white/60 p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h6" className="text-gray-800">
              Trained Models
            </Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={() => refetchModels()}
              disabled={modelsLoading}
              variant="outlined"
              size="small"
            >
              Refresh
            </Button>
          </div>
          
          {modelsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : models.length === 0 ? (
            <Alert severity="info">
              No models trained yet. Upload a dataset and train your first model!
            </Alert>
          ) : (
            <TableContainer component={Paper} className="shadow-sm">
              <Table>
                <TableHead>
                  <TableRow className="bg-gray-50">
                    <TableCell className="font-semibold">Name</TableCell>
                    <TableCell className="font-semibold">Description</TableCell>
                    <TableCell className="font-semibold">Status</TableCell>
                    <TableCell className="font-semibold">Created</TableCell>
                    <TableCell className="font-semibold">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {models.map((model) => (
                    <TableRow key={model.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{model.name}</TableCell>
                      <TableCell>{model.description}</TableCell>
                      <TableCell>
                        <Chip
                          label={model.status}
                          color={getStatusColor(model.status) as any}
                          size="small"
                          className="font-medium"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(model.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Activate Model">
                          <IconButton
                            onClick={() => handleActivateModel(model.id)}
                            disabled={isActivating || model.status === 'active'}
                            color="success"
                            size="small"
                          >
                            <ActivateIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Model">
                          <IconButton
                            onClick={() => handleDeleteModel(model.id)}
                            disabled={isDeleting}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>

        {/* Training Jobs */}
        <div className="bg-white/90 rounded-xl shadow-md border border-white/60 p-5">
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h6" className="text-gray-800">
              Training Jobs
            </Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={() => refetchJobs()}
              disabled={jobsLoading}
              variant="outlined"
              size="small"
            >
              Refresh
            </Button>
          </div>
          
          {jobsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : trainingJobs.length === 0 ? (
            <Alert severity="info">
              No training jobs found.
            </Alert>
          ) : (
            <TableContainer component={Paper} className="shadow-sm">
              <Table>
                <TableHead>
                  <TableRow className="bg-gray-50">
                    <TableCell className="font-semibold">Job ID</TableCell>
                    <TableCell className="font-semibold">Status</TableCell>
                    <TableCell className="font-semibold">Progress</TableCell>
                    <TableCell className="font-semibold">Model ID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trainingJobs.map((job: any) => (
                    <TableRow key={job.jobId} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">{job.jobId}</TableCell>
                      <TableCell>
                        <Chip
                          label={job.status}
                          color={getStatusColor(job.status) as any}
                          size="small"
                          className="font-medium"
                        />
                      </TableCell>
                      <TableCell>
                        {job.progress ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={job.progress} 
                              sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="body2" color="textSecondary">
                              {job.progress}%
                            </Typography>
                          </Box>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{job.modelId || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      </div>

      {/* Training Dialog */}
      <Dialog open={showTrainingDialog} onClose={() => setShowTrainingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          Train New Model
        </DialogTitle>
        <DialogContent className="pt-6">
          <TextField
            fullWidth
            label="Model Name"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            margin="normal"
            required
            className="mb-4"
          />
          <TextField
            fullWidth
            label="Description"
            value={modelDescription}
            onChange={(e) => setModelDescription(e.target.value)}
            margin="normal"
            multiline
            rows={2}
            className="mb-4"
          />
          <Typography gutterBottom sx={{ mt: 2 }}>
            Contamination: {contamination}
          </Typography>
          <Slider
            value={contamination}
            onChange={(_, value) => setContamination(value as number)}
            min={0.01}
            max={0.5}
            step={0.01}
            marks={[
              { value: 0.01, label: '0.01' },
              { value: 0.1, label: '0.1' },
              { value: 0.5, label: '0.5' }
            ]}
            className="mb-4"
          />
          <Typography gutterBottom sx={{ mt: 2 }}>
            Number of Estimators: {nEstimators}
          </Typography>
          <Slider
            value={nEstimators}
            onChange={(_, value) => setNEstimators(value as number)}
            min={10}
            max={200}
            step={10}
            marks={[
              { value: 10, label: '10' },
              { value: 100, label: '100' },
              { value: 200, label: '200' }
            ]}
          />
        </DialogContent>
        <DialogActions className="p-4">
          <Button onClick={() => setShowTrainingDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleTrain} 
            variant="contained" 
            disabled={!modelName.trim()}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            Train Model
          </Button>
        </DialogActions>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResultsDialog} onClose={() => setShowResultsDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          Anomaly Detection Results
        </DialogTitle>
        <DialogContent className="pt-6">
          {results ? (
            <Box>
                             <div className="grid grid-cols-4 gap-4 mb-6">
                 <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                   <Typography variant="h4" className="font-bold">{results.totalSamples || 0}</Typography>
                   <Typography variant="body2">Total Samples</Typography>
                 </Paper>
                 <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'error.light', color: 'white' }}>
                   <Typography variant="h4" className="font-bold">
                     {results.anomaliesDetected || 0}
                   </Typography>
                   <Typography variant="body2">Anomalies Detected</Typography>
                 </Paper>
                 <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                   <Typography variant="h4" className="font-bold">
                     {results.summary?.anomalyRate ? (results.summary.anomalyRate * 100).toFixed(2) : '0.00'}%
                   </Typography>
                   <Typography variant="body2">Anomaly Rate</Typography>
                 </Paper>
                 <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
                   <Typography variant="h4" className="font-bold">
                     {results.summary?.meanScore ? results.summary.meanScore.toFixed(4) : '0.0000'}
                   </Typography>
                   <Typography variant="body2">Mean Score</Typography>
                 </Paper>
               </div>
              
              <TableContainer component={Paper} className="shadow-sm">
                <Table>
                  <TableHead>
                    <TableRow className="bg-gray-50">
                      <TableCell className="font-semibold">Index</TableCell>
                      <TableCell className="font-semibold">Score</TableCell>
                      <TableCell className="font-semibold">Anomaly</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(results.results || []).map((result: any, index: number) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{result.index || index}</TableCell>
                        <TableCell className="font-mono">{result.score ? result.score.toFixed(4) : '0.0000'}</TableCell>
                        <TableCell>
                          <Chip
                            label={result.isAnomaly ? 'Yes' : 'No'}
                            color={result.isAnomaly ? 'error' : 'success'}
                            size="small"
                            className="font-medium"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No results available
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="p-4">
          <Button onClick={handleExport} startIcon={<ExportIcon />} variant="outlined">
            Export Results
          </Button>
          <Button 
            onClick={() => setShowResultsDialog(false)} 
            variant="contained"
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </SidebarLayout>
  );
};

export default AnomalyDetection;
