import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, VisitorRegisterRequest } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password?: string) => Promise<User>;
  registerVisitor: (data: VisitorRegisterRequest) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('wesal_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('wesal_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    // If token exists but user profile not loaded, fetch profile
    if (token && !user) {
      api.getMe()
        .then((userData) => {
          setUser(userData);
          localStorage.setItem('wesal_user', JSON.stringify(userData));
        })
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  const login = async (username: string, password?: string): Promise<User> => {
    const res = await api.login(username, password || 'wesal123');
    setToken(res.access_token);
    localStorage.setItem('wesal_token', res.access_token);

    const currentUser: User = {
      id: 1,
      username: res.username,
      full_name: res.full_name,
      role: res.role as UserRole,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    setUser(currentUser);
    localStorage.setItem('wesal_user', JSON.stringify(currentUser));
    return currentUser;
  };

  const registerVisitor = async (data: VisitorRegisterRequest) => {
    const res = await api.registerVisitor(data);
    setToken(res.access_token);
    localStorage.setItem('wesal_token', res.access_token);

    const currentUser: User = {
      id: 1,
      username: res.username,
      full_name: res.full_name,
      role: res.role as UserRole,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    setUser(currentUser);
    localStorage.setItem('wesal_user', JSON.stringify(currentUser));
  };

  const switchRole = async (role: UserRole) => {
    await login(role.toLowerCase());
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('wesal_token');
    localStorage.removeItem('wesal_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        login,
        registerVisitor,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
