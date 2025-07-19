import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Company } from '../api/companyService';

interface AuthContextType {
  company: Company | null;
  token: string | null;
  login: (company: Company, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  updateCompany: (company: Company) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedCompany = localStorage.getItem('company');
    if (storedToken && storedCompany) {
      setToken(storedToken);
      setCompany(JSON.parse(storedCompany));
    }
    setLoading(false);
  }, []);

  const login = (company: Company, token: string) => {
    setCompany(company);
    setToken(token);
    localStorage.setItem('token', token);
    localStorage.setItem('company', JSON.stringify(company));
  };

  const logout = () => {
    setCompany(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('company');
  };

  const updateCompany = (updatedCompany: Company) => {
    setCompany(updatedCompany);
    localStorage.setItem('company', JSON.stringify(updatedCompany));
  };

  const value = {
    company,
    token,
    login,
    logout,
    isAuthenticated: !!token,
    updateCompany,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
