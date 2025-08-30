import React, { useState, useEffect } from 'react';
import { 
  templateService, 
  useTemplates,
  NotificationTemplate 
} from '../api/templateService';

interface TemplateSelectorProps {
  onTemplateSelect: (template: NotificationTemplate) => void;
  selectedTemplate?: NotificationTemplate | null;
  placeholder?: string;
  className?: string;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onTemplateSelect,
  selectedTemplate,
  placeholder = "Select a template...",
  className = ""
}) => {
  const { templates, loading, error, refetch } = useTemplates();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Group templates by compliance type
  const groupedTemplates = templates.reduce((groups, template) => {
    const types = template.notificationTypes || [];
    types.forEach(type => {
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(template);
    });
    return groups;
  }, {} as Record<string, NotificationTemplate[]>);

  // Filter templates based on search term
  const filteredGroups = Object.entries(groupedTemplates).reduce((filtered, [type, templates]) => {
    const filteredTemplates = templates.filter(template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filteredTemplates.length > 0) {
      filtered[type] = filteredTemplates;
    }
    return filtered;
  }, {} as Record<string, NotificationTemplate[]>);

  const handleTemplateSelect = (template: NotificationTemplate) => {
    onTemplateSelect(template);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getComplianceTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'BAS': 'bg-blue-100 text-blue-800 border-blue-200',
      'FBT': 'bg-purple-100 text-purple-800 border-purple-200',
      'IAS': 'bg-green-100 text-green-800 border-green-200',
      'FYEND': 'bg-orange-100 text-orange-800 border-orange-200',
      'GST': 'bg-red-100 text-red-800 border-red-200',
      'PAYG': 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTemplateTypeIcon = (type: 'email' | 'sms') => {
    return type === 'email' ? '📧' : '📱';
  };

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-500">Loading templates...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-red-600 text-sm">Failed to load templates</span>
            <button
              onClick={refetch}
              className="text-red-600 hover:text-red-800 underline text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Selected Template Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm cursor-pointer hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
      >
        {selectedTemplate ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-lg">{getTemplateTypeIcon(selectedTemplate.type)}</span>
              <div>
                <div className="font-medium text-gray-900">{selectedTemplate.name}</div>
                <div className="text-sm text-gray-500">
                  {selectedTemplate.notificationTypes?.join(', ')} • {selectedTemplate.type}
                </div>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">{placeholder}</span>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              autoFocus
            />
          </div>

          {/* Template Groups */}
          <div className="max-h-80 overflow-y-auto">
            {Object.keys(filteredGroups).length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'No templates found matching your search' : 'No templates available'}
              </div>
            ) : (
              Object.entries(filteredGroups).map(([complianceType, templates]) => (
                <div key={complianceType} className="border-b border-gray-100 last:border-b-0">
                  <div className="px-4 py-2 bg-gray-50">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getComplianceTypeColor(complianceType)}`}>
                      {complianceType}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {templates.length} template{templates.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-l-4 border-transparent hover:border-indigo-400 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-lg mt-0.5">{getTemplateTypeIcon(template.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{template.name}</div>
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {template.body}
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getComplianceTypeColor(complianceType)}`}>
                              {complianceType}
                            </span>
                            <span className="text-xs text-gray-400 uppercase">{template.type}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{templates.length} total templates</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default TemplateSelector;

