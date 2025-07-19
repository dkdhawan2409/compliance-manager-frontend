import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-slate-50 flex relative overflow-x-hidden">
      {/* Decorative SVG background */}
      <svg className="absolute left-0 top-0 w-96 h-96 opacity-20 -z-10" viewBox="0 0 400 400" fill="none"><circle cx="200" cy="200" r="200" fill="url(#paint0_radial)" /><defs><radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientTransform="translate(200 200) scale(200)" gradientUnits="userSpaceOnUse"><stop stopColor="#6366f1" /><stop offset="1" stopColor="#f8fafc" stopOpacity="0" /></radialGradient></defs></svg>
      <svg className="absolute right-0 bottom-0 w-96 h-96 opacity-10 -z-10" viewBox="0 0 400 400" fill="none"><circle cx="200" cy="200" r="200" fill="url(#paint1_radial)" /><defs><radialGradient id="paint1_radial" cx="0" cy="0" r="1" gradientTransform="translate(200 200) scale(200)" gradientUnits="userSpaceOnUse"><stop stopColor="#1976d2" /><stop offset="1" stopColor="#f8fafc" stopOpacity="0" /></radialGradient></defs></svg>
      {/* Sidebar */}
      <aside className={`fixed z-30 inset-y-0 left-0 w-64 bg-white/90 border-r border-slate-200 shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-64'} md:translate-x-0 md:static md:block`}>        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-20 border-b border-slate-100">
            <span className="text-2xl font-bold text-indigo-600 tracking-tight">Compliance</span>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-150 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${location.pathname === link.to ? 'bg-indigo-600 text-white shadow-lg scale-105' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-red-100 hover:text-red-600 transition w-full mt-8 focus:outline-none focus:ring-2 focus:ring-red-200"
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
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        {/* Navbar */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200 shadow-sm flex items-center h-16 px-4 md:px-8">
          <button className="md:hidden mr-4" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="text-lg font-semibold text-indigo-700 flex-1">Dashboard</span>
          <div className="relative" ref={avatarRef}>
            <button
              className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow focus:outline-none focus:ring-2 focus:ring-indigo-300"
              onClick={() => setAvatarDropdown((v) => !v)}
              type="button"
            >
              {company?.companyName?.[0] || '?'}
            </button>
            {avatarDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-2 z-50 animate-fade-in">
                <div className="px-4 py-2 text-gray-700 font-semibold border-b border-slate-100">{company?.companyName}</div>
                <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 transition">Profile</Link>
                <Link to="/compliance" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 transition">Compliance</Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition">Logout</button>
              </div>
            )}
          </div>
        </header>
        {/* Content */}
        <main className="flex-1 p-4 md:p-8 bg-transparent">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 bg-white/80 rounded-2xl shadow-lg p-6 mb-8 border border-white/60">
              <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-3xl shadow animate-bounce-slow">
            {company?.companyName?.[0] || '?'}
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">{getGreeting()}, {company?.companyName}!</h2>
                <p className="text-gray-500">Manage your compliance details</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/90 rounded-xl shadow-md border border-white/60 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 group cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.797.657 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                  <span className="text-lg font-semibold">Profile</span>
                </div>
                <p className="text-gray-500 text-sm mb-4">View and update your profile information.</p>
                <Link to="/profile" className="block w-full py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold text-center shadow hover:from-blue-600 hover:to-indigo-500 transition">Go to Profile</Link>
              </div>
              <div className="bg-white/90 rounded-xl shadow-md border border-white/60 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 group cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 0a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2m-6 0h6" /></svg></div>
                  <span className="text-lg font-semibold">Compliance Details</span>
                </div>
                <p className="text-gray-500 text-sm mb-4">Update your compliance-related details.</p>
                <Link to="/compliance" className="block w-full py-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold text-center shadow hover:from-blue-600 hover:to-green-500 transition">Update Compliance</Link>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-center gap-3 bg-white/90 rounded-xl shadow border border-white/60 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 0a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2m-6 0h6" /></svg></div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Compliance Status</div>
                  <div className="text-lg font-bold text-green-600">Up to date</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/90 rounded-xl shadow border border-white/60 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg></div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Recent Activity</div>
                  <div className="text-sm text-gray-500">No new notifications</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

