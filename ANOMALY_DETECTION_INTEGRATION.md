# Anomaly Detection Integration

## Overview

The Anomaly Detection system has been successfully integrated into the frontend application. This system allows users to upload datasets, train machine learning models for anomaly detection, score new data, and export results.

## Features

### 1. Dataset Management
- Upload JSON datasets via file upload
- Support for various data formats (amount, frequency, location, etc.)
- Real-time dataset validation and preview

### 2. Model Training
- Train anomaly detection models with customizable parameters
- Configurable contamination rate (0.01 - 0.5)
- Adjustable number of estimators (10 - 200)
- Real-time training status monitoring
- Model naming and description

### 3. Data Scoring
- Score new data against trained models
- Adjustable anomaly threshold (0 - 1)
- Support for multiple model selection
- Real-time scoring results

### 4. Model Management
- View all trained models
- Activate/deactivate models
- Delete models
- Model status tracking

### 5. Results Export
- Export scoring results as CSV
- Downloadable anomaly reports
- Comprehensive result summaries

## File Structure

```
src/
├── api/
│   └── anomalyDetectionService.ts    # API service for anomaly detection
├── hooks/
│   └── useAnomalyDetection.ts        # Custom hook for anomaly detection
├── pages/
│   └── AnomalyDetection.tsx          # Main anomaly detection page
└── components/
    └── SidebarLayout.tsx             # Updated with navigation link
```

## API Endpoints

The integration uses the following backend endpoints:

### Training
- `POST /api/anomaly-detection/train` - Train new model
- `GET /api/anomaly-detection/training/status/:jobId` - Check training progress
- `GET /api/anomaly-detection/training/jobs` - List training jobs

### Scoring
- `POST /api/anomaly-detection/score` - Score data for anomalies

### Model Management
- `GET /api/anomaly-detection/models` - List all models
- `PUT /api/anomaly-detection/models/:id/activate` - Activate model
- `DELETE /api/anomaly-detection/models/:id` - Delete model

### Export
- `POST /api/anomaly-detection/export` - Export results as CSV

## Usage Flow

### 1. Upload Dataset
1. Navigate to `/anomaly-detection`
2. Click "Upload JSON Dataset"
3. Select a JSON file containing your data
4. Verify the dataset is loaded successfully

### 2. Train Model
1. Click "Train New Model"
2. Enter model name and description
3. Adjust contamination rate and number of estimators
4. Click "Train Model"
5. Monitor training progress in the Training Jobs section

### 3. Score Data
1. Select a model (optional - uses default if none selected)
2. Adjust the anomaly threshold
3. Click "Score Data"
4. View results in the popup dialog

### 4. Export Results
1. After scoring, click "Export as CSV"
2. Download the results file

## Sample Data Format

The system accepts JSON arrays with objects containing various fields:

```json
[
  {"amount": 100, "frequency": 1, "location": "Sydney"},
  {"amount": 5000, "frequency": 1, "location": "Melbourne"},
  {"amount": 150, "frequency": 1, "location": "Brisbane"}
]
```

## Technical Implementation

### API Service (`anomalyDetectionService.ts`)
- TypeScript interfaces for all API requests/responses
- Axios-based HTTP client integration
- Error handling and response validation
- Support for file uploads and downloads

### Custom Hook (`useAnomalyDetection.ts`)
- React Query integration for caching and state management
- Mutation handling for API calls
- Real-time data synchronization
- Error state management

### Main Component (`AnomalyDetection.tsx`)
- Material-UI components for modern UI
- Responsive design for mobile and desktop
- Real-time status updates
- Interactive dialogs and forms
- Toast notifications for user feedback

## Dependencies

The integration uses the following existing dependencies:
- `@tanstack/react-query` - Data fetching and caching
- `@mui/material` - UI components
- `@mui/icons-material` - Icons
- `react-hot-toast` - Toast notifications
- `axios` - HTTP client

## Navigation

The anomaly detection page is accessible via:
- Sidebar navigation: "Anomaly Detection"
- Direct URL: `/anomaly-detection`
- Protected route requiring authentication

## Error Handling

The system includes comprehensive error handling:
- API error responses
- File upload validation
- Network connectivity issues
- User input validation
- Toast notifications for user feedback

## Testing

A sample dataset file (`sample_dataset.json`) is provided for testing the system. The dataset contains 20 samples with varying amounts, frequencies, and locations to demonstrate anomaly detection capabilities.

## Future Enhancements

Potential improvements for the anomaly detection system:
1. Batch processing for large datasets
2. Model performance metrics and visualization
3. Automated model retraining
4. Integration with existing compliance data
5. Real-time anomaly alerts
6. Advanced visualization of results

## Security

- All API calls require authentication
- Protected routes prevent unauthorized access
- Input validation prevents malicious data
- File upload restrictions (JSON only)

## Performance

- React Query caching reduces API calls
- Lazy loading of components
- Optimized re-renders
- Efficient state management
- Real-time updates with minimal overhead

