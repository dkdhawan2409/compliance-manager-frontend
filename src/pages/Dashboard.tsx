import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import SidebarLayout from '../components/SidebarLayout';

const navLinks = [
  { name: 'Dashboard', to: '/dashboard', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6m-6 0v6m0 0H7m6 0h6" /></svg>
  ) },
  { name: 'Profile', to: '/profile', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.797.657 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  ) },
  { name: 'Compliance', to: '/compliance', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 0a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2m-6 0h6" /></svg>
  ) },
];

const Dashboard: React.FC = () => {
  const { company, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarDropdown, setAvatarDropdown] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setAvatarDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!');
  };

  return (
    <SidebarLayout>
      {/* Content previously inside <main> ... */}
      <div className="w-full">
        {/* Debug Component - Remove after testing */}
        
        {/* Welcome Section */}
        <div className="flex items-center gap-4 bg-white/80 rounded-xl shadow-lg p-5 mb-6 border border-white/60">
          <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow">
            {company?.companyName?.[0] || '?'}
          </div>
          <div>
            <h2 className="text-xl font-bold mb-1">{getGreeting()}, {company?.companyName}!</h2>
            <p className="text-gray-500 text-sm">Manage your compliance details</p>
          </div>
        </div>
        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white/90 rounded-xl shadow-md border border-white/60 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.797.657 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <span className="text-lg font-semibold">Profile</span>
                </div>
                <p className="text-gray-500 text-sm mb-4">View and update your profile information.</p>
                <Link to="/profile" className="block w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold text-center shadow hover:from-blue-600 hover:to-indigo-500 transition">Go to Profile</Link>
              </div>
              
              <div className="bg-white/90 rounded-xl shadow-md border border-white/60 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 0a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2m-6 0h6" /></svg>
                  </div>
                  <span className="text-lg font-semibold">Compliance Details</span>
                </div>
                <p className="text-gray-500 text-sm mb-4">Update your compliance-related details.</p>
                <Link to="/compliance" className="block w-full py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold text-center shadow hover:from-blue-600 hover:to-green-500 transition">Update Compliance</Link>
              </div>
              
              <div className="bg-white/90 rounded-xl shadow-md border border-white/60 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <span className="text-lg font-semibold">Xero Integration</span>
                </div>
                <p className="text-gray-500 text-sm mb-4">Connect and manage your Xero account.</p>
                <Link to="/integrations/xero" className="block w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold text-center shadow hover:from-indigo-600 hover:to-purple-500 transition">Go to Xero</Link>
              </div>
            </div>
            
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-white/90 rounded-xl shadow border border-white/60 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 0a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2m-6 0h6" /></svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Compliance Status</div>
                  <div className="text-base font-bold text-green-600">Up to date</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white/90 rounded-xl shadow border border-white/60 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Recent Activity</div>
                  <div className="text-sm text-gray-500">No new notifications</div>
                </div>
              </div>
            </div>
          </div>
    </SidebarLayout>
  );
};

export default Dashboard;


