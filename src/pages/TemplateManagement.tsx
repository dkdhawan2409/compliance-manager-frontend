import React from 'react';
import { Navigate } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import TemplateManager from '../components/TemplateManager';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole, requireAIToolsAccess } from '../utils/roleUtils';
import { NotificationTemplate } from '../api/templateService';
import toast from 'react-hot-toast';

const TemplateManagement: React.FC = () => {
  const { company } = useAuth();
  const userRole = useUserRole(company);
  
  // Additional protection - redirect if not super admin
  if (!requireAIToolsAccess(company)) {
    console.log('Access denied to Template Management: User does not have access');
    return <Navigate to="/dashboard" replace />;
  }

  const handleTemplateSelected = (template: NotificationTemplate) => {
    toast.success(`Template "${template.name}" selected for use`);
    // You can add additional logic here, such as navigating to a form that uses this template
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Template Management</h1>
            <p className="mt-2 text-gray-600">
              Manage notification templates with AI-powered generation and backward compatibility support.
            </p>
          </div>
          
          <TemplateManager onTemplateSelected={handleTemplateSelected} />
        </div>
      </div>
    </SidebarLayout>
  );
};

export default TemplateManagement;

