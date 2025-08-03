# OpenAI Integration for Compliance Management System

## Overview

This document describes the OpenAI API integration implemented in the Compliance Management System frontend. The integration provides AI-powered tools for generating compliance text, creating templates, and analyzing content quality.

## Features

### 1. OpenAI Settings Management
- **API Key Configuration**: Secure storage and management of OpenAI API keys
- **Key Validation**: Test API keys before saving
- **Settings Persistence**: Store settings securely on the backend
- **Status Monitoring**: Real-time status of OpenAI configuration

### 2. Compliance Text Generator
- **Compliance Types**: Support for BAS, FBT, IAS, FYEND, GST, PAYG
- **Company Customization**: Generate text for specific companies
- **Days Remaining**: Dynamic content based on deadline proximity
- **Custom Prompts**: Advanced customization options
- **Model Selection**: Choose between GPT-3.5 Turbo, GPT-4, and GPT-4 Turbo

### 3. Template Generator
- **Email Templates**: Professional email templates with subjects and bodies
- **SMS Templates**: Concise SMS templates for mobile notifications
- **Tone Selection**: Professional, friendly, urgent, formal, casual
- **Compliance Integration**: Templates specific to compliance types
- **Advanced Options**: Custom instructions and model parameters

### 4. Content Analyzer
- **Compliance Analysis**: Evaluate regulatory compliance
- **Tone Analysis**: Assess professionalism and appropriateness
- **Effectiveness Analysis**: Measure communication effectiveness
- **Detailed Feedback**: Comprehensive analysis reports
- **Model Selection**: Choose appropriate AI models for analysis

## API Endpoints

### Base URL
```
http://localhost:3000/api/openai
```

### Authentication
All endpoints require JWT authentication:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Settings Management
- `POST /api/openai/settings` - Save OpenAI settings
- `GET /api/openai/settings` - Get current settings
- `PUT /api/openai/settings/:id` - Update settings
- `DELETE /api/openai/settings/:id` - Delete settings
- `POST /api/openai/test-api-key` - Test API key validity

#### AI Generation
- `POST /api/openai/chat` - General chat completion
- `POST /api/openai/generate-compliance-text` - Generate compliance text
- `POST /api/openai/generate-template` - Generate email/SMS templates
- `POST /api/openai/analyze-content` - Analyze content quality

## Frontend Components

### 1. OpenAISettings Component
**Location**: `src/components/OpenAISettings.tsx`

**Features**:
- API key input with validation
- Test API key functionality
- Save/update/delete settings
- Status indicators
- Advanced options toggle

**Usage**:
```jsx
<OpenAISettings onSettingsChange={handleSettingsChange} />
```

### 2. ComplianceTextGenerator Component
**Location**: `src/components/ComplianceTextGenerator.tsx`

**Features**:
- Compliance type selection
- Company name input
- Days remaining input
- Custom prompt support
- Model selection
- Advanced parameters

**Usage**:
```jsx
<ComplianceTextGenerator 
  onTextGenerated={handleTextGenerated}
  defaultCompanyName="Company Name"
/>
```

### 3. TemplateGenerator Component
**Location**: `src/components/TemplateGenerator.tsx`

**Features**:
- Email/SMS template generation
- Tone selection
- Compliance type integration
- Custom instructions
- Template preview

**Usage**:
```jsx
<TemplateGenerator onTemplateGenerated={handleTemplateGenerated} />
```

### 4. ContentAnalyzer Component
**Location**: `src/components/ContentAnalyzer.tsx`

**Features**:
- Multiple analysis types
- Content input
- Custom analysis instructions
- Detailed feedback
- Copy analysis results

**Usage**:
```jsx
<ContentAnalyzer 
  onAnalysisComplete={handleAnalysisComplete}
  defaultContent="Content to analyze"
/>
```

## Integration Points

### 1. AdminNotify Page Integration
The AI tools are integrated into the AdminNotify page with:
- Toggle button to show/hide AI tools
- Tabbed interface for different AI features
- Status indicators for OpenAI configuration
- Seamless integration with existing template management

### 2. Standalone AI Tools Page
**Location**: `src/pages/AITools.tsx`

A dedicated page for AI tools with:
- Comprehensive tabbed interface
- Quick action buttons
- Usage tips and guidance
- Status monitoring

### 3. Navigation Integration
Added to sidebar navigation:
- User navigation: AI Tools link
- Admin navigation: AI Tools link
- Route protection with authentication

## API Service

### OpenAIService Class
**Location**: `src/api/openaiService.ts`

**Features**:
- TypeScript interfaces for all API responses
- Comprehensive error handling
- Authentication integration
- Request/response typing

**Key Methods**:
```typescript
// Settings management
saveSettings(settings: OpenAISettingsInput): Promise<OpenAISettings>
getSettings(): Promise<OpenAISettings>
testApiKey(apiKey: string): Promise<TestApiKeyResponse>

// AI generation
generateComplianceText(request: GenerateComplianceTextRequest): Promise<GenerateComplianceTextResponse>
generateTemplate(request: GenerateTemplateRequest): Promise<GenerateTemplateResponse>
analyzeContent(request: AnalyzeContentRequest): Promise<AnalyzeContentResponse>
```

## Error Handling

### Common Error Scenarios
1. **Invalid API Key**: Clear error messages with validation
2. **Network Errors**: Graceful fallback with user feedback
3. **Rate Limiting**: Informative messages about usage limits
4. **Authentication Errors**: Automatic redirect to login
5. **Server Errors**: User-friendly error messages

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Security Considerations

### API Key Security
- API keys are never stored in frontend code
- Keys are transmitted securely to backend
- Backend handles key storage and validation
- Keys are validated before use

### Authentication
- All OpenAI endpoints require JWT authentication
- Token validation on every request
- Automatic logout on authentication failure

### Data Privacy
- User content is processed securely
- No sensitive data is logged
- Compliance with data protection regulations

## Usage Examples

### 1. Generate Compliance Text
```javascript
const request = {
  complianceType: 'BAS',
  companyName: 'ABC Company',
  daysLeft: 30,
  customPrompt: 'Include specific GST requirements',
  model: 'gpt-4',
  maxTokens: 1000,
  temperature: 0.7
};

const response = await openAIService.generateComplianceText(request);
console.log(response.response);
```

### 2. Create Email Template
```javascript
const request = {
  templateType: 'email',
  complianceType: 'FBT',
  tone: 'professional',
  customPrompt: 'Include deadline information',
  model: 'gpt-4-turbo'
};

const response = await openAIService.generateTemplate(request);
console.log(response.template);
```

### 3. Analyze Content
```javascript
const request = {
  content: 'Your compliance message here',
  analysisType: 'compliance',
  customPrompt: 'Focus on regulatory requirements',
  model: 'gpt-4'
};

const response = await openAIService.analyzeContent(request);
console.log(response.analysis);
```

## Configuration

### Environment Variables
```bash
VITE_API_URL=http://localhost:3000/api
```

### Default Values
- **Model**: `gpt-3.5-turbo`
- **Max Tokens**: `1000`
- **Temperature**: `0.7`

## Testing

### API Key Testing
1. Enter API key in settings
2. Click "Test" button
3. Verify validation response
4. Save settings if valid

### Text Generation Testing
1. Select compliance type
2. Enter company name
3. Set days remaining
4. Generate text
5. Review and copy results

### Template Testing
1. Choose template type (email/SMS)
2. Select compliance type
3. Choose tone
4. Generate template
5. Preview and use template

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify key format (starts with `sk-`)
   - Check key validity in OpenAI dashboard
   - Ensure sufficient credits

2. **Generation Fails**
   - Check network connection
   - Verify API key is saved
   - Review error messages

3. **Slow Responses**
   - Try different AI models
   - Reduce max tokens
   - Check API rate limits

### Debug Information
- Console logs for API requests
- Network tab for request/response details
- Error messages in UI
- Status indicators for configuration

## Future Enhancements

### Planned Features
1. **Batch Processing**: Generate multiple texts at once
2. **Template Library**: Save and reuse templates
3. **Custom Models**: Support for fine-tuned models
4. **Analytics**: Usage tracking and insights
5. **Multi-language**: Support for different languages

### Integration Opportunities
1. **Email Integration**: Direct email sending
2. **SMS Integration**: Direct SMS sending
3. **Calendar Integration**: Automatic scheduling
4. **CRM Integration**: Customer data integration
5. **Reporting**: AI-powered compliance reports

## Support

For technical support or questions about the OpenAI integration:
1. Check the console for error messages
2. Review the API documentation
3. Test with different parameters
4. Contact the development team

## License

This integration follows the same license as the main Compliance Management System. 