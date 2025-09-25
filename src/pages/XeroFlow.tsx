import React from 'react';
import SidebarLayout from '../components/SidebarLayout';
import XeroFlowManager from '../components/XeroFlowManager';

const XeroFlow: React.FC = () => {
  return (
    <SidebarLayout>
      <XeroFlowManager />
    </SidebarLayout>
  );
};

export default XeroFlow;
