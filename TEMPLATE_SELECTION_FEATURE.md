# Template Selection Feature for AI Chat

## Overview

The template selection feature allows users to select from saved compliance templates (BAS, FBT, IAS, FYEND, GST, PAYG) directly in the AI chat interface at `http://localhost:3001/ai-chat`. This feature provides context-aware AI assistance for specific compliance templates.

## Features

### 1. Template Selector Component
- **Location**: `src/components/TemplateSelector.tsx`
- **Features**:
  - Dropdown interface with search functionality
  - Templates grouped by compliance type (BAS, FBT, IAS, etc.)
  - Visual indicators for template type (email/SMS)
  - Color-coded compliance type badges
  - Template preview with body content

### 2. AI Chat Integration
- **Location**: `src/pages/AiChat.tsx`
- **Features**:
  - Template selection button in chat mode
  - Automatic template context injection
  - AI-powered template guidance
  - Template-specific compliance advice

### 3. Backend API Support
- **Location**: `../backend/src/routes/templateRoutes.js`
- **Endpoints**:
  - `GET /api/templates` - Get all templates
  - `GET /api/templates/type/{type}` - Get templates by type
  - `GET /api/templates/stats` - Get template statistics
  - `POST /api/templates/notification` - Create template
  - `POST /api/templates/generate` - Generate AI template

## How It Works

### 1. Template Selection Process
1. User clicks "📋 Templates" button in chat mode
2. Template selector dropdown appears
3. User can search and browse templates by compliance type
4. Selecting a template automatically:
   - Adds template content to chat
   - Sends context-aware AI request
   - Provides template-specific guidance

### 2. AI Context Integration
When a template is selected, the AI receives:
- Template name and type
- Compliance types (BAS, FBT, etc.)
- Template content
- Specific guidance requests

### 3. Template Categories
- **BAS** (Business Activity Statement) - Blue
- **FBT** (Fringe Benefits Tax) - Purple
- **IAS** (Instalment Activity Statement) - Green
- **FYEND** (Financial Year End) - Orange
- **GST** (Goods and Services Tax) - Red
- **PAYG** (Pay As You Go) - Indigo

## Implementation Details

### Frontend Components

#### TemplateSelector Component
```typescript
interface TemplateSelectorProps {
  onTemplateSelect: (template: NotificationTemplate) => void;
  selectedTemplate?: NotificationTemplate | null;
  placeholder?: string;
  className?: string;
}
```

**Key Features**:
- Search functionality
- Grouped display by compliance type
- Visual template type indicators
- Responsive design
- Error handling and loading states

#### AI Chat Integration
```typescript
const handleTemplateSelect = (template: NotificationTemplate) => {
  setSelectedTemplate(template);
  setShowTemplateSelector(false);
  
  // Create template context message
  const templateMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: `I want to use the ${template.name} template for ${template.notificationTypes?.join(', ')} compliance. Here's the template content:\n\n${template.body}`,
    timestamp: new Date(),
  };

  setMessages(prev => [...prev, templateMessage]);
  
  // Auto-send AI request with template context
  setTimeout(() => {
    handleSendMessageWithTemplate(template);
  }, 500);
};
```

### Backend API

#### Template Routes
```javascript
// Get all templates with statistics
router.get('/', async (req, res) => {
  // Returns notificationTemplates, aiTemplateExamples, and summary
});

// Get templates by type
router.get('/type/:type', async (req, res) => {
  // Returns templates filtered by type (email, sms, ai-generated)
});

// Get template statistics
router.get('/stats', async (req, res) => {
  // Returns template counts and analytics
});
```

#### Template Model
```javascript
class NotificationTemplate {
  constructor(data) {
    this.id = data.id;
    this.type = data.type; // 'email' or 'sms'
    this.name = data.name;
    this.subject = data.subject;
    this.body = data.body;
    this.notificationTypes = data.notification_types || [];
    this.smsDays = data.sms_days || [];
    this.emailDays = data.email_days || [];
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }
}
```

## Sample Templates

The system includes 8 sample templates covering different compliance types:

### Email Templates
1. **BAS Reminder Template** - Business Activity Statement reminders
2. **FBT Annual Return Template** - Fringe Benefits Tax guidance
3. **IAS Quarterly Reminder** - Instalment Activity Statement
4. **Financial Year End Template** - Year-end procedures
5. **GST Registration Reminder** - GST compliance check
6. **PAYG Withholding Reminder** - PAYG obligations

### SMS Templates
1. **BAS SMS Reminder** - Concise BAS notifications
2. **FBT SMS Alert** - FBT deadline alerts

## Usage Instructions

### For Users
1. Navigate to `http://localhost:3001/ai-chat`
2. Ensure you're in "Chat" mode (not "Analysis")
3. Click the "📋 Templates" button
4. Browse or search for templates by compliance type
5. Select a template to get AI-powered guidance
6. Ask follow-up questions about the template or compliance requirements

### For Developers
1. **Load Sample Templates**:
   ```bash
   cd backend
   node load-sample-templates.js
   ```

2. **Test Template Selection**:
   - Start the frontend: `npm run dev`
   - Start the backend: `npm run dev`
   - Navigate to AI chat and test template selection

3. **Add New Templates**:
   - Use the template management interface
   - Or add directly to the database using the NotificationTemplate model

## API Endpoints

### Template Management
- `GET /api/templates` - Get all templates with statistics
- `GET /api/templates/type/{type}` - Get templates by type
- `GET /api/templates/stats` - Get template analytics
- `POST /api/templates/notification` - Create new template
- `PUT /api/templates/notification/{id}` - Update template
- `DELETE /api/templates/notification/{id}` - Delete template
- `POST /api/templates/notification/{id}/test` - Test template

### AI Generation
- `POST /api/templates/generate` - Generate AI template
- `POST /api/templates/generate-compliance-text` - Generate compliance text

## Database Schema

```sql
CREATE TABLE notification_templates (
  id SERIAL PRIMARY KEY,
  type VARCHAR(10) NOT NULL CHECK (type IN ('email', 'sms')),
  name VARCHAR(255) NOT NULL UNIQUE,
  subject TEXT,
  body TEXT NOT NULL,
  notification_types JSONB DEFAULT '[]',
  sms_days JSONB DEFAULT '[]',
  email_days JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Benefits

### For Users
1. **Context-Aware Assistance**: AI provides specific guidance for selected templates
2. **Compliance Focus**: Templates are organized by compliance type
3. **Time Saving**: Quick access to relevant compliance templates
4. **Educational**: AI explains template usage and compliance requirements

### For Developers
1. **Modular Design**: Template selector is a reusable component
2. **Backward Compatible**: Works with existing template API
3. **Extensible**: Easy to add new template types and compliance categories
4. **Type Safe**: Full TypeScript support

## Future Enhancements

1. **Template Variables**: Support for dynamic content replacement
2. **Template Versioning**: Track template changes over time
3. **Template Analytics**: Usage statistics and effectiveness metrics
4. **Bulk Operations**: Select multiple templates for comparison
5. **Template Sharing**: Share templates between users
6. **AI Template Generation**: Generate new templates using AI

## Troubleshooting

### Common Issues
1. **Templates not loading**: Check backend API connectivity
2. **Template selection not working**: Verify template data structure
3. **AI responses not contextual**: Check template context injection

### Debug Steps
1. Check browser console for errors
2. Verify backend API responses
3. Check database for template data
4. Test template API endpoints directly

## Conclusion

The template selection feature enhances the AI chat experience by providing context-aware assistance for specific compliance templates. Users can now easily access and get guidance on BAS, FBT, IAS, and other compliance templates directly within the chat interface, making compliance management more efficient and user-friendly.

