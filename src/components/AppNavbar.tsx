import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AppNavbar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <nav className="sticky top-0 z-20 w-full bg-white/80 backdrop-blur border-b border-slate-200 shadow-sm flex items-center h-16 px-6 mb-6">
      <span className="text-xl font-bold text-indigo-700 flex-1">Super Admin Panel</span>
      <button
        className="ml-4 px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
        onClick={() => { logout(); navigate('/login'); }}
      >
        Logout
      </button>
    </nav>
  );
};

export default AppNavbar; 