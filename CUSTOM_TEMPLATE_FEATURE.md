# Custom Template Feature with Anomaly Detection & GPT Integration

## Overview

The Custom Template feature allows super admins to create, manage, and test custom compliance templates (BAS, FBT, IAS, FYEND, GST, PAYG) with integrated anomaly detection and GPT analysis. The workflow follows: **Xero Data → Anomaly Detection → GPT Processing → Custom Template Application**.

## Architecture

### Workflow
1. **Data Input**: Xero financial data is collected
2. **Anomaly Detection**: Data is analyzed for unusual patterns
3. **GPT Processing**: AI analyzes the data and template context
4. **Template Application**: Custom templates are applied with processed data
5. **Results**: Comprehensive compliance guidance is provided

### Components

#### Backend
- **Custom Template Model**: Database schema and operations
- **Custom Template Routes**: API endpoints for CRUD operations
- **Anomaly Detection Integration**: Pattern analysis for financial data
- **GPT Integration**: AI-powered template analysis

#### Frontend
- **Super Admin Interface**: Template management dashboard
- **Template Editor**: Create and edit custom templates
- **Test Interface**: Test templates with sample data
- **Results Display**: Show anomaly detection and GPT analysis

## Features

### 1. Custom Template Management
- **Create Templates**: Build custom templates for each compliance type
- **Variable Support**: Dynamic content with placeholders
- **Anomaly Thresholds**: Configurable sensitivity levels
- **GPT Prompts**: Custom AI analysis instructions
- **Active/Inactive Status**: Template lifecycle management

### 2. Anomaly Detection Integration
- **Pattern Analysis**: Identify unusual financial patterns
- **Risk Scoring**: Quantify compliance risks
- **Threshold Configuration**: Adjustable sensitivity levels
- **Real-time Processing**: Immediate anomaly detection

### 3. GPT Analysis
- **Context-Aware Analysis**: AI considers template and data context
- **Compliance Guidance**: Specific regulatory advice
- **Risk Assessment**: AI-powered risk evaluation
- **Best Practices**: Automated compliance recommendations

### 4. Template Testing
- **Sample Data Testing**: Test templates with realistic data
- **Anomaly Simulation**: Simulate various anomaly scenarios
- **GPT Analysis Preview**: Preview AI-generated insights
- **Variable Processing**: Test dynamic content replacement

## Database Schema

```sql
CREATE TABLE custom_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  compliance_type VARCHAR(10) NOT NULL CHECK (compliance_type IN ('BAS', 'FBT', 'IAS', 'FYEND', 'GST', 'PAYG')),
  template_type VARCHAR(10) NOT NULL CHECK (template_type IN ('email', 'sms')),
  subject TEXT,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  anomaly_threshold DECIMAL(3,2) DEFAULT 0.5 CHECK (anomaly_threshold >= 0 AND anomaly_threshold <= 1),
  gpt_prompt TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Custom Template Management
- `GET /api/custom-templates` - Get all custom templates
- `GET /api/custom-templates/:id` - Get template by ID
- `POST /api/custom-templates` - Create new template
- `PUT /api/custom-templates/:id` - Update template
- `DELETE /api/custom-templates/:id` - Delete template

### Template Testing
- `POST /api/custom-templates/:id/test` - Test template with anomaly detection and GPT

### Analytics
- `GET /api/custom-templates/type/:complianceType` - Get templates by compliance type
- `GET /api/custom-templates/stats/overview` - Get template statistics

## Template Variables

### Standard Variables
- `{companyName}` - Company name
- `{daysLeft}` - Days until deadline
- `{amount}` - Financial amount
- `{period}` - Reporting period
- `{fbtAmount}` - FBT amount
- `{employeeCount}` - Number of employees
- `{instalmentAmount}` - IAS instalment amount
- `{totalRevenue}` - Total revenue
- `{totalExpenses}` - Total expenses
- `{netIncome}` - Net income

### Anomaly Detection Variables
- `{anomalyScore}` - Anomaly detection score
- `{riskLevel}` - Risk assessment level
- `{complianceScore}` - Compliance score
- `{anomalyDetected}` - Boolean anomaly flag

### Custom Variables
- `{customVariableName}` - User-defined variables

## Sample Templates

### Advanced BAS Alert Template
```json
{
  "name": "Advanced BAS Alert Template",
  "complianceType": "BAS",
  "templateType": "email",
  "subject": "URGENT: BAS Due - Anomaly Detected",
  "body": "Dear {companyName},\n\nOur anomaly detection system has identified unusual patterns in your BAS data that require immediate attention.\n\nKey Findings:\n- Days until due: {daysLeft}\n- Amount: ${amount}\n- Anomaly Score: {anomalyScore}\n- Risk Level: {riskLevel}\n\nPlease review your BAS calculations and ensure all data is accurate before submission.\n\nBest regards,\nYour Compliance Team",
  "variables": ["{companyName}", "{daysLeft}", "{amount}", "{anomalyScore}", "{riskLevel}"],
  "anomalyThreshold": 0.6,
  "gptPrompt": "Analyze this BAS template with anomaly detection results. Provide risk assessment and compliance recommendations."
}
```

### FBT Compliance Alert
```json
{
  "name": "FBT Compliance Alert",
  "complianceType": "FBT",
  "templateType": "email",
  "subject": "FBT Annual Return - Compliance Check Required",
  "body": "Dear {companyName},\n\nYour FBT Annual Return requires attention based on our compliance analysis.\n\nCompliance Status:\n- FBT Amount: ${fbtAmount}\n- Employee Count: {employeeCount}\n- Days Remaining: {daysLeft}\n- Compliance Score: {complianceScore}\n\nPlease ensure all fringe benefits are properly recorded and calculations are accurate.\n\nRegards,\nYour Tax Team",
  "variables": ["{companyName}", "{fbtAmount}", "{employeeCount}", "{daysLeft}", "{complianceScore}"],
  "anomalyThreshold": 0.5,
  "gptPrompt": "Analyze FBT compliance requirements and provide guidance on fringe benefits reporting."
}
```

## Implementation Guide

### 1. Database Setup
```bash
# Run the migration
cd backend
psql -d your_database -f create-custom-templates-table.sql
```

### 2. Backend Setup
```bash
# The routes and models are already created
# Ensure the server.js includes the new routes
```

### 3. Frontend Setup
```bash
# Create the SuperAdminTemplates component
# Add routing for the new page
```

### 4. Testing
```bash
# Test template creation
curl -X POST http://localhost:5000/api/custom-templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Template",
    "complianceType": "BAS",
    "templateType": "email",
    "body": "Test template content",
    "variables": ["{companyName}"],
    "isActive": true
  }'

# Test template with anomaly detection
curl -X POST http://localhost:5000/api/custom-templates/1/test \
  -H "Content-Type: application/json" \
  -d '{
    "testData": {
      "companyName": "Test Company",
      "daysLeft": 7,
      "amount": 50000,
      "period": "Q1 2024"
    }
  }'
```

## Usage Workflow

### For Super Admins

1. **Access Template Management**
   - Navigate to Super Admin section
   - Select "Custom Templates"

2. **Create Custom Template**
   - Click "Create Custom Template"
   - Select compliance type (BAS, FBT, IAS, etc.)
   - Choose template type (email/SMS)
   - Write template content with variables
   - Set anomaly threshold
   - Add custom GPT prompt
   - Save template

3. **Test Template**
   - Select a template
   - Click "Test" button
   - Provide test data
   - Review anomaly detection results
   - Analyze GPT insights
   - Adjust template as needed

4. **Deploy Template**
   - Activate template for use
   - Monitor performance
   - Update based on feedback

### For End Users

1. **Template Selection**
   - Access AI chat interface
   - Select from available templates
   - Choose compliance type

2. **Data Processing**
   - Xero data is automatically processed
   - Anomaly detection runs
   - GPT analysis is performed

3. **Results**
   - Receive processed template
   - View anomaly detection insights
   - Get AI-powered compliance guidance

## Benefits

### For Super Admins
- **Customization**: Create tailored compliance templates
- **Control**: Full control over template content and logic
- **Testing**: Comprehensive testing capabilities
- **Analytics**: Detailed usage and performance metrics

### For End Users
- **Accuracy**: AI-powered compliance guidance
- **Efficiency**: Automated anomaly detection
- **Clarity**: Clear, actionable insights
- **Compliance**: Reduced compliance risks

### For Organizations
- **Risk Management**: Proactive anomaly detection
- **Compliance**: Automated compliance monitoring
- **Efficiency**: Streamlined template management
- **Scalability**: Easy template deployment and updates

## Future Enhancements

1. **Advanced Anomaly Detection**
   - Machine learning models
   - Historical pattern analysis
   - Predictive analytics

2. **Enhanced GPT Integration**
   - Multi-modal analysis
   - Context-aware responses
   - Learning from user feedback

3. **Template Marketplace**
   - Share templates between organizations
   - Template versioning
   - Community-driven improvements

4. **Advanced Analytics**
   - Template effectiveness metrics
   - Compliance risk scoring
   - Performance optimization

## Troubleshooting

### Common Issues

1. **Template Not Saving**
   - Check database connection
   - Verify required fields
   - Check for duplicate names

2. **Anomaly Detection Not Working**
   - Verify anomaly detection service
   - Check threshold settings
   - Review data quality

3. **GPT Analysis Failing**
   - Check OpenAI API key
   - Verify prompt format
   - Review rate limits

### Debug Steps

1. **Check Logs**
   ```bash
   # Backend logs
   tail -f backend/logs/app.log
   
   # Frontend console
   # Open browser developer tools
   ```

2. **Test API Endpoints**
   ```bash
   # Test template creation
   curl -X GET http://localhost:5000/api/custom-templates
   
   # Test template testing
   curl -X POST http://localhost:5000/api/custom-templates/1/test
   ```

3. **Verify Database**
   ```sql
   -- Check template table
   SELECT * FROM custom_templates;
   
   -- Check for errors
   SELECT * FROM custom_templates WHERE is_active = false;
   ```

## Conclusion

The Custom Template feature provides a powerful, flexible system for managing compliance templates with integrated AI analysis. By combining anomaly detection, GPT processing, and custom template management, organizations can achieve higher compliance accuracy and efficiency while reducing risks and manual effort.

The system is designed to be scalable, maintainable, and user-friendly, providing both super admins and end users with the tools they need to ensure compliance excellence.


