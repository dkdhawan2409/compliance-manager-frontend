# Template API Backward Compatibility Implementation

## Overview

This implementation provides backward compatibility for the `/api/companies/templates` endpoint while introducing new enhanced template API features. The system automatically falls back between old and new endpoints to ensure seamless operation.

## Architecture

### 1. Template Service (`src/api/templateService.ts`)

The new template service provides a unified interface that handles both legacy and new API endpoints:

```typescript
export const templateService = {
  // Backward compatibility: Get templates from the old endpoint
  async getTemplatesLegacy(): Promise<NotificationTemplate[]> {
    try {
      const response = await apiClient.get<{ data: NotificationTemplate[] }>('/companies/templates');
      return response.data.data;
    } catch (error) {
      console.warn('Legacy templates endpoint failed, trying new endpoint...');
      // Fallback to new endpoint
      return this.getAllTemplates();
    }
  },

  // New API: Get all templates with full response structure
  async getAllTemplates(): Promise<TemplateResponse['data']> {
    const response = await apiClient.get<TemplateResponse>('/templates');
    return response.data.data;
  },

  // Backward compatibility: Create template (supports both old and new endpoints)
  async createTemplate(data: CreateNotificationTemplateRequest): Promise<NotificationTemplate> {
    try {
      // Try new endpoint first
      return await this.createNotificationTemplate(data);
    } catch (error) {
      console.warn('New template endpoint failed, trying legacy endpoint...');
      // Fallback to legacy endpoint
      const response = await apiClient.post<{ data: NotificationTemplate }>('/companies/templates', data);
      return response.data.data;
    }
  },
  // ... other methods
};
```

### 2. Updated Company Service (`src/api/companyService.ts`)

The existing company service has been updated to use the new template service for backward compatibility:

```typescript
export const companyService = {
  async getTemplates(): Promise<NotificationTemplate[]> {
    // Use the new template service for backward compatibility
    const { templateService } = await import('./templateService');
    return templateService.getTemplatesLegacy();
  },

  async createTemplate(data: NotificationTemplateInput): Promise<NotificationTemplate> {
    // Use the new template service for backward compatibility
    const { templateService } = await import('./templateService');
    return templateService.createTemplate(data);
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

  async getTemplateById(id: number): Promise<NotificationTemplate> {
    // Use the new template service for backward compatibility
    const { templateService } = await import('./templateService');
    return templateService.getTemplateById(id);
  },
};
```

## API Endpoints

### Legacy Endpoints (Still Supported)

- `GET /api/companies/templates` - Get all templates
- `POST /api/companies/templates` - Create template
- `PUT /api/companies/templates/:id` - Update template
- `DELETE /api/companies/templates/:id` - Delete template
- `GET /api/companies/templates/:id` - Get template by ID

### New Enhanced Endpoints

- `GET /api/templates` - Get all templates with statistics
- `GET /api/templates/type/{type}` - Get templates by type
- `GET /api/templates/stats` - Get template statistics
- `POST /api/templates/notification` - Create notification template
- `POST /api/templates/generate` - Generate AI template
- `POST /api/templates/notification/{id}/test` - Test template

## Type Definitions

### Updated NotificationTemplate Interface

```typescript
export interface NotificationTemplate {
  id: number;
  type: 'email' | 'sms';
  name: string;
  subject?: string; // Now optional for SMS templates
  body: string;
  createdAt: string;
  updatedAt: string;
  // New fields for enhanced functionality
  notificationTypes?: string[];
  smsDays?: number[];
  emailDays?: number[];
}
```

### New Template Request Interfaces

```typescript
export interface CreateNotificationTemplateRequest {
  type: 'email' | 'sms';
  name: string;
  subject?: string;
  body: string;
  notificationTypes: string[]; // Required for new API
  smsDays?: number[];
  emailDays?: number[];
}

export interface GenerateAITemplateRequest {
  templateType: 'email' | 'sms';
  complianceType: string;
  tone?: 'professional' | 'urgent' | 'friendly';
  customPrompt?: string;
  model?: 'gpt-3.5-turbo' | 'gpt-4';
  maxTokens?: number;
  temperature?: number;
}
```

## React Hooks

### useTemplates Hook

```typescript
export const useTemplates = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await templateService.getTemplatesLegacy();
      setTemplates(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return { templates, loading, error, refetch: fetchTemplates };
};
```

### useGenerateAITemplate Hook

```typescript
export const useGenerateAITemplate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedTemplate, setGeneratedTemplate] = useState<GenerateAITemplateResponse['data'] | null>(null);

  const generateTemplate = async (params: GenerateAITemplateRequest) => {
    try {
      setLoading(true);
      setError(null);
      const result = await templateService.generateAITemplate(params);
      setGeneratedTemplate(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to generate template';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { generateTemplate, loading, error, generatedTemplate };
};
```

## Components

### TemplateManager Component

A comprehensive template management component that demonstrates all features:

```typescript
const TemplateManager: React.FC<TemplateManagerProps> = ({ onTemplateSelected }) => {
  const { templates, loading, error, refetch } = useTemplates();
  const { generateTemplate, loading: generating, error: generateError, generatedTemplate } = useGenerateAITemplate();
  const { createTemplate, loading: creating, error: createError } = useCreateTemplate();
  
  // ... component implementation
};
```

### TemplateServiceExample Component

An example component showing how to use the new service:

```typescript
const TemplateServiceExample: React.FC = () => {
  const { templates, loading, error, refetch } = useTemplates();
  const { generateTemplate, loading: generating, error: generateError } = useGenerateAITemplate();
  const { createTemplate, loading: creating, error: createError } = useCreateTemplate();
  
  // ... example implementations
};
```

## Migration Guide

### For Existing Code

1. **No Changes Required**: Existing code using `companyService.getTemplates()` will continue to work
2. **Enhanced Features**: New features are available through the `templateService`
3. **Gradual Migration**: You can gradually migrate to use the new service

### For New Code

1. **Use the new template service**:
   ```typescript
   import { templateService, useTemplates, useGenerateAITemplate } from '../api/templateService';
   ```

2. **Use the new hooks**:
   ```typescript
   const { templates, loading, error, refetch } = useTemplates();
   const { generateTemplate, loading: generating } = useGenerateAITemplate();
   ```

3. **Use the new components**:
   ```typescript
   import TemplateManager from '../components/TemplateManager';
   ```

## Error Handling

The implementation includes comprehensive error handling:

```typescript
// Automatic fallback between endpoints
try {
  // Try new endpoint first
  return await this.createNotificationTemplate(data);
} catch (error) {
  console.warn('New template endpoint failed, trying legacy endpoint...');
  // Fallback to legacy endpoint
  const response = await apiClient.post<{ data: NotificationTemplate }>('/companies/templates', data);
  return response.data.data;
}
```

## Testing

### Backward Compatibility Test

```typescript
// This should work with both old and new endpoints
const templates = await companyService.getTemplates();
console.log('Templates loaded:', templates);
```

### New Features Test

```typescript
// Test AI template generation
const result = await templateService.generateAITemplate({
  templateType: 'email',
  complianceType: 'BAS',
  tone: 'professional'
});
console.log('Generated template:', result.template);
```

### Template Statistics Test

```typescript
// Test new statistics endpoint
const stats = await templateService.getTemplateStats();
console.log('Template statistics:', stats);
```

## Benefits

1. **Zero Breaking Changes**: Existing code continues to work
2. **Enhanced Features**: AI generation, statistics, testing
3. **Automatic Fallback**: Seamless operation even if one endpoint fails
4. **Type Safety**: Full TypeScript support for both old and new APIs
5. **React Integration**: Ready-to-use hooks and components
6. **Future-Proof**: Easy migration path to new features

## Usage Examples

### Basic Template Fetching

```typescript
// Legacy way (still works)
const templates = await companyService.getTemplates();

// New way (with enhanced features)
const { templates, loading, error } = useTemplates();
```

### AI Template Generation

```typescript
const { generateTemplate, loading, generatedTemplate } = useGenerateAITemplate();

const handleGenerate = async () => {
  const result = await generateTemplate({
    templateType: 'email',
    complianceType: 'BAS',
    tone: 'professional',
    customPrompt: 'Include specific lodgement requirements'
  });
  console.log('Generated:', result.template);
};
```

### Template Creation

```typescript
const { createTemplate, loading } = useCreateTemplate();

const handleCreate = async () => {
  const result = await createTemplate({
    type: 'email',
    name: 'BAS Reminder',
    subject: 'BAS Due Soon',
    body: 'Dear {companyName}, your BAS is due in {daysLeft} days.',
    notificationTypes: ['BAS'],
    emailDays: [1, 7, 14]
  });
  console.log('Created:', result);
};
```

This implementation ensures that your existing template functionality continues to work while providing access to new enhanced features through a clean, type-safe API.

