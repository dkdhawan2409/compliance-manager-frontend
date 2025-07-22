import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import AdminComplianceDeadlines from '../pages/AdminComplianceDeadlines';

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
];

const superAdminNavLinks = [
  { name: 'Company List', to: '/admin/companies' },
  { name: 'Send Notification', to: '/admin/notify' },
  { name: 'Settings', to: '/admin/settings' },
  { name: 'Cronjob Settings', to: '/admin/cron-settings' },
];

interface SidebarLayoutProps {
  children: React.ReactNode;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children }) => {
  const { company, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarDropdown, setAvatarDropdown] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = company?.role === 'superadmin' ? superAdminNavLinks : userNavLinks;

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
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center px-3 py-2 rounded-lg font-medium transition-all duration-150 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${location.pathname === link.to ? 'bg-indigo-600 text-white shadow-lg scale-105' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                {'icon' in link ? (link as any).icon : null}
                {link.name}
              </Link>
            ))}
            {(company?.role === 'admin' || company?.role === 'superadmin') && (
              <Link
                to="/admin/compliance-deadlines"
                className={`flex items-center px-3 py-2 rounded-lg font-medium transition-all duration-150 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${location.pathname === '/admin/compliance-deadlines' ? 'bg-indigo-600 text-white shadow-lg scale-105' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Compliance Deadlines
              </Link>
            )}
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
                <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 transition">Profile</Link>
                <Link to="/compliance" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 transition">Compliance</Link>
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