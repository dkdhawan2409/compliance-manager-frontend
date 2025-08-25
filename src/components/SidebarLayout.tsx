import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../utils/roleUtils';
import toast from 'react-hot-toast';

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
  { name: 'Xero Integration', to: '/integrations/xero', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  ), companyOnly: true },
  { name: 'Anomaly Detection', to: '/anomaly-detection', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
  ) },
];

const adminNavLinks = [
  { name: 'Company List', to: '/admin/companies', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
  ) },
  { name: 'Send Notification', to: '/admin/notify', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-5 5v-5zM4 19h6a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
  ) },
  { name: 'Settings', to: '/admin/settings', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  ) },
  { name: 'Compliance Deadlines', to: '/admin/cron-settings', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  ) },
  { name: 'Cronjob Settings', to: '/admin/cronjob-settings', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ) },
  { name: 'AI Assistant', to: '/ai-chat', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
  ) },
  { name: 'AI Tools', to: '/ai-tools', superAdminOnly: true, icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
  ) },
  // Xero integration removed from admin nav - only for companies
];

function getNavLinksForRole(company: any) {
  console.log('getNavLinksForRole called with company:', company);
  
  if (!company) {
    console.log('No company, returning empty array');
    return [];
  }

  // More robust super admin detection
  const isSuperAdmin = company.superadmin === true || company.role === 'superadmin' || company.role === 'admin';
  console.log('Is super admin:', isSuperAdmin, 'superadmin:', company.superadmin, 'role:', company.role);

  if (isSuperAdmin) {
    console.log('Returning adminNavLinks for superadmin');
    return adminNavLinks;
  }

  // For company users, filter out company-only links if needed
  console.log('Returning userNavLinks for company user');
  return userNavLinks;
}

interface SidebarLayoutProps {
  children: React.ReactNode;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children }) => {
  const { company, logout } = useAuth();
  const userRole = useUserRole(company);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarDropdown, setAvatarDropdown] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  console.log('SidebarLayout: company:', company);
  console.log('SidebarLayout: company.role:', company?.role);
  console.log('SidebarLayout: company.superadmin:', company?.superadmin);
  console.log('SidebarLayout: userRole:', userRole);

  const navLinks = getNavLinksForRole(company);
  console.log('SidebarLayout: navLinks:', navLinks);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setAvatarDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-slate-50 flex">
      {/* Sidebar */}
      <aside className={`fixed z-30 inset-y-0 left-0 w-64 bg-white/90 border-r border-slate-200 shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-64'} md:translate-x-0 md:relative md:block`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 border-b border-slate-100">
            <span className="text-xl font-bold text-indigo-600 tracking-tight">Compliance</span>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navLinks.map(link => {
              console.log('Rendering link:', link.name, 'superAdminOnly:', 'superAdminOnly' in link ? link.superAdminOnly : false, 'userRole.isSuperAdmin:', userRole.isSuperAdmin);
              
              // Skip company-only links for super admins
              if ('companyOnly' in link && link.companyOnly && userRole.isSuperAdmin) {
                console.log('Skipping company-only link for super admin:', link.name);
                return null;
              }
              
              // Skip super admin only links for non-super admins
              if ('superAdminOnly' in link && link.superAdminOnly && !userRole.isSuperAdmin) {
                console.log('Skipping super admin only link for non-super admin:', link.name);
                return null;
              }
              
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center px-3 py-2 rounded-lg font-medium transition-all duration-150 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${location.pathname.startsWith(link.to) ? 'bg-indigo-600 text-white shadow-lg scale-105' : ''}`}
                  onClick={() => {
                    console.log('Navigating to:', link.to);
                    console.log('Current location:', location.pathname);
                    setSidebarOpen(false);
                  }}
                >
                  {'icon' in link ? (link as any).icon : null}
                  {link.name}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 rounded-lg font-medium text-gray-700 hover:bg-red-100 hover:text-red-600 transition w-full mt-6 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" /></svg>
              Logout
            </button>
          </nav>
        </div>
      </aside>
      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-30 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200 shadow-sm flex items-center h-14 px-4 md:px-6">
          <button
            className="md:hidden mr-4"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Open sidebar"
          >
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="text-lg font-semibold text-indigo-700 flex-1">Compliance Management</span>
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
        {/* Content */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout; 