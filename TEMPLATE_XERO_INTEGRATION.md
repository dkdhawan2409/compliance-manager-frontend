# Template Selection with Xero Data Collection

This feature allows users to select compliance templates and automatically collect relevant data from Xero to generate personalized AI-powered compliance insights.

## Overview

The template selection with Xero data collection feature provides:

1. **Template Selection**: Choose from available compliance templates (BAS, FBT, IAS, FYEND, GST, PAYG)
2. **Automatic Data Collection**: Fetch company information, financial data, and compliance details from Xero
3. **Template Processing**: Replace template variables with real data from Xero
4. **AI Analysis**: Generate intelligent insights and recommendations based on the collected data

## Components

### TemplateDataCollector

The main component that handles template selection and Xero data collection.

**Location**: `src/components/TemplateDataCollector.tsx`

**Features**:
- Template selection using the existing TemplateSelector component
- Automatic Xero data fetching based on compliance type
- Template variable replacement with real data
- AI analysis generation using the template service
- Real-time data refresh capabilities

### TemplateWithXeroData

A dedicated page that demonstrates the template selection with Xero data collection functionality.

**Location**: `src/pages/TemplateWithXeroData.tsx`

**Route**: `/admin/template-with-xero-data`

**Features**:
- Full-screen template data collection interface
- Real-time data display and AI analysis
- Step-by-step instructions for users
- Feature overview and benefits

## How It Works

### 1. Template Selection

Users can select from available compliance templates:
- **BAS** (Business Activity Statement)
- **FBT** (Fringe Benefits Tax)
- **IAS** (Instalment Activity Statement)
- **FYEND** (Financial Year End)
- **GST** (Goods and Services Tax)
- **PAYG** (Pay As You Go)

### 2. Data Collection from Xero

The system automatically fetches relevant data from Xero based on the selected compliance type:

#### Common Data Fields:
- Company name
- Total revenue
- GST amount
- Period (quarter/year)
- BAS number
- Net income

#### Compliance-Specific Data:
- **FBT**: FBT amount, FBT year, FBT number, employee count
- **IAS**: Instalment amount, quarter, year, IAS number
- **FYEND**: Financial year
- **PAYG**: PAYG amount, employee count, PAYG number
- **GST**: GST number, registration status

### 3. Template Processing

Template variables are automatically replaced with real data:

```javascript
// Example template
"Dear {companyName}, your BAS for {period} is due in {daysLeft} days. Amount: ${amount}, GST: ${gstAmount}"

// Processed template
"Dear ABC Company, your BAS for Q1 2024 is due in 7 days. Amount: $50,000, GST: $5,000"
```

### 4. AI Analysis

The system generates comprehensive AI analysis including:
- Template effectiveness analysis
- Compliance requirements covered
- Suggested improvements
- Best practices for usage
- Risk assessment and mitigation strategies
- Additional recommendations based on financial data

## Usage

### For Super Admins

1. Navigate to `/admin/template-with-xero-data`
2. Select a compliance template from the dropdown
3. The system automatically fetches Xero data
4. Review the processed template and AI analysis
5. Use the results in your compliance workflow

### For Developers

#### Using TemplateDataCollector Component

```jsx
import TemplateDataCollector from '../components/TemplateDataCollector';

const MyComponent = () => {
  const handleDataCollected = (template, data, processedTemplate) => {
    console.log('Template:', template);
    console.log('Xero Data:', data);
    console.log('Processed Template:', processedTemplate);
  };

  const handleAIGenerated = (aiResponse) => {
    console.log('AI Analysis:', aiResponse);
  };

  return (
    <TemplateDataCollector
      onDataCollected={handleDataCollected}
      onAIGenerated={handleAIGenerated}
    />
  );
};
```

#### Using with ComplianceTextGenerator

```jsx
import ComplianceTextGenerator from '../components/ComplianceTextGenerator';

const MyComponent = () => {
  return (
    <ComplianceTextGenerator
      useTemplateDataCollector={true}
      onTextGenerated={(text) => console.log('Generated text:', text)}
    />
  );
};
```

## Data Flow

1. **User selects template** → TemplateDataCollector component
2. **Fetch Xero data** → getXeroCompanyInfo, getFinancialSummary, getAllInvoices
3. **Process template** → Replace variables with real data
4. **Generate AI analysis** → templateService.generateAITemplate
5. **Display results** → Show processed template and AI insights

## Xero Integration

The feature integrates with the following Xero endpoints:

- `/xero/company-info` - Company information and enrollment status
- `/xero/financial-summary` - Financial summary data
- `/xero/all-invoices` - Invoice data for GST calculations

## Error Handling

- Xero connection status is displayed to users
- Graceful fallbacks when Xero data is unavailable
- Toast notifications for success/error states
- Loading states during data fetching and processing

## Security

- Requires super admin access (`requireAIToolsAccess`)
- Protected routes with authentication
- Xero data access through authenticated API calls

## Future Enhancements

- Support for custom template variables
- Batch processing for multiple templates
- Export functionality for processed templates
- Integration with notification systems
- Advanced AI analysis with machine learning models

