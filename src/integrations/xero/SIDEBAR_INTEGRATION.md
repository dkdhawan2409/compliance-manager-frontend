# 🔗 Sidebar Integration Guide

This guide shows you exactly how to add the new plug-and-play Xero integration to your existing sidebar menu.

## 📋 Step-by-Step Sidebar Integration

### Step 1: Add Xero Integration Link to Sidebar

Update your `src/components/SidebarLayout.tsx` file:

```tsx
// src/components/SidebarLayout.tsx
// Add this import at the top of the file
import { XeroStatusBadgeCompact } from '../integrations/xero';

// Update your userNavLinks array (around line 7-41)
const userNavLinks = [
  { name: 'Dashboard', to: '/dashboard', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6m-6 0v6m0 0H7m6 0h6" /></svg>
  ) },
  { name: 'Profile', to: '/profile', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.797.657 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  ) },
  { name: 'Compliance', to: '/compliance', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 0a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2m-6 0h6" /></svg>
  ) },
  { name: 'AI Assistant', to: '/ai-chat', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
  ) },
  
  // NEW PLUG-AND-PLAY XERO INTEGRATION
  { name: '🚀 Xero Integration', to: '/xero-integration', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  ), companyOnly: true },
  
  // Keep your existing Xero links for backward compatibility
  { name: '🚀 Xero Flow', to: '/xero', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  ), companyOnly: true },
  { name: 'Xero Integration', to: '/integrations/xero', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  ), companyOnly: true },
  { name: '🔗 Xero OAuth2 (Proper)', to: '/xero-oauth2', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
  ), companyOnly: true },
  
  // ... rest of your existing links
  { name: 'Anomaly Detection', to: '/anomaly-detection', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
  ) },
  { name: 'BAS Processing', to: '/bas-processing', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  ) },
  { name: 'FAS Processing', to: '/fas-processing', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  ) },
  { name: 'Missing Attachments', to: '/missing-attachments', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
  ), companyOnly: true },
];
```

### Step 2: Add Xero Status Badge to Header

Add the Xero status badge to your header for quick connection status:

```tsx
// src/components/SidebarLayout.tsx
// In your header section (around line 194-235), update it to include the status badge:

<header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200 shadow-sm flex items-center h-14 px-4 md:px-6">
  <button
    className="md:hidden mr-4"
    onClick={() => setSidebarOpen((v) => !v)}
    aria-label="Open sidebar"
  >
    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
  </button>
  <span className="text-lg font-semibold text-indigo-700 flex-1">Compliance Management</span>
  
  {/* ADD XERO STATUS BADGE HERE */}
  <div className="mr-4">
    <XeroStatusBadgeCompact 
      onClick={() => navigate('/xero-integration')}
      className="cursor-pointer"
    />
  </div>
  
  <div className="relative" ref={avatarRef}>
    <button
      className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow focus:outline-none focus:ring-2 focus:ring-indigo-300"
      onClick={() => setAvatarDropdown((v) => !v)}
      type="button"
    >
      {company?.companyName?.[0] || '?'}
    </button>
    {avatarDropdown && (
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-2 z-50 animate-fade-in">
        <div className="px-4 py-2 text-gray-700 font-semibold border-b border-slate-100">{company?.companyName}</div>
        {navLinks.map(link => {
          // Skip company-only links for super admins in dropdown too
          if ('companyOnly' in link && link.companyOnly && userRole.isSuperAdmin) {
            return null;
          }
          
          // Skip super admin only links for non-super admins in dropdown too
          if ('superAdminOnly' in link && link.superAdminOnly && !userRole.isSuperAdmin) {
            return null;
          }
          
          return (
            <Link key={link.to} to={link.to} className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 transition" onClick={() => setAvatarDropdown(false)}>
              {link.name}
            </Link>
          );
        })}
        <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition">Logout</button>
      </div>
    )}
  </div>
</header>
```

### Step 3: Alternative - Add Xero Widget to Dashboard

If you want to add a Xero widget directly to your dashboard instead of just sidebar links:

```tsx
// src/components/XeroWidget.tsx
import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip,
  Button,
  Alert
} from '@mui/material';
import { useXero } from '../integrations/xero';
import { useNavigate } from 'react-router-dom';

interface XeroWidgetProps {
  className?: string;
}

const XeroWidget: React.FC<XeroWidgetProps> = ({ className }) => {
  const { state, loadData } = useXero();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { isConnected, selectedTenant } = state;

  useEffect(() => {
    if (isConnected && selectedTenant) {
      loadSummary();
    }
  }, [isConnected, selectedTenant]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const response = await loadData({
        resourceType: 'financial-summary',
        tenantId: selectedTenant?.id
      });
      
      if (response.success) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error('Failed to load Xero summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardContent>
          <Typography variant="h6" className="mb-3">
            Xero Integration
          </Typography>
          <Alert severity="info" className="mb-3">
            Connect your Xero account to view financial data
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => navigate('/xero-integration')}
            fullWidth
          >
            Connect Xero
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent>
        <Box className="flex justify-between items-center mb-3">
          <Typography variant="h6">
            Xero Overview
          </Typography>
          <Chip 
            label="Connected" 
            color="success" 
            size="small" 
          />
        </Box>

        {loading ? (
          <Typography>Loading...</Typography>
        ) : summary ? (
          <Box>
            <Box className="grid grid-cols-2 gap-4 mb-3">
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Revenue
                </Typography>
                <Typography variant="h6" color="green">
                  ${summary.totalRevenue}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Outstanding
                </Typography>
                <Typography variant="h6" color="orange">
                  ${summary.outstandingRevenue}
                </Typography>
              </Box>
            </Box>
            
            <Button 
              variant="outlined" 
              onClick={() => navigate('/xero-integration')}
              fullWidth
              size="small"
            >
              View Full Dashboard
            </Button>
          </Box>
        ) : (
          <Typography color="text.secondary">
            No data available
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default XeroWidget;
```

## 🎯 What You Get

After implementing these changes, your sidebar will have:

### ✅ **New Sidebar Menu Item**
- **🚀 Xero Integration** - Links to `/xero-integration`
- **Company-only access** (hidden for super admins)
- **Lightning bolt icon** for easy identification
- **Active state highlighting** when on Xero pages

### ✅ **Header Status Badge**
- **Real-time connection status** indicator
- **Clickable** - takes you to Xero integration page
- **Color-coded** - green for connected, gray for disconnected
- **Compact design** - doesn't take up much space

### ✅ **Existing Links Preserved**
- **Backward compatibility** with existing Xero links
- **All existing functionality** remains intact
- **Gradual migration** - users can use either old or new integration

## 🔧 Customization Options

### Change the Icon
```tsx
// Use a different icon for the Xero integration
{ name: '🚀 Xero Integration', to: '/xero-integration', icon: (
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
), companyOnly: true },
```

### Change the Name
```tsx
// Use a different name
{ name: 'Accounting Integration', to: '/xero-integration', icon: (
  // ... icon
), companyOnly: true },
```

### Change the Route
```tsx
// Use a different route
{ name: '🚀 Xero Integration', to: '/accounting/xero', icon: (
  // ... icon
), companyOnly: true },
```

## 🚀 Testing the Integration

1. **Start your development server**
2. **Navigate to your app** and log in as a company user
3. **Check the sidebar** - you should see "🚀 Xero Integration"
4. **Check the header** - you should see the Xero status badge
5. **Click on the Xero Integration link** - should take you to `/xero-integration`
6. **Click on the status badge** - should also take you to `/xero-integration`

## 📞 Troubleshooting

### If the sidebar link doesn't appear:
- Check that you added the link to the correct `userNavLinks` array
- Verify the `companyOnly: true` property is set
- Make sure you're logged in as a company user (not super admin)

### If the status badge doesn't appear:
- Check that you imported `XeroStatusBadgeCompact`
- Verify the import path is correct
- Make sure the component is inside the `XeroProvider`

### If clicking doesn't work:
- Check that the route `/xero-integration` is defined in your App.tsx
- Verify the `navigate` function is available in the component
- Check browser console for any JavaScript errors

Your Xero integration is now fully integrated into your sidebar menu! 🎉
