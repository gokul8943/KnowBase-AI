import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { User } from '../types/auth';
import { getAccessToken, setAccessToken, clearTokens } from '../utils/auth';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.me();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, [queryClient]);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token) {
        await refreshUser();
      } else {
        try {
          const response = await api.refresh();
          if (response.success && response.data?.accessToken) {
            setAccessToken(response.data.accessToken);
          }
          await refreshUser();
        } catch {
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const response = await api.login({ email, password });
    if (response.success && response.data) {
      setAccessToken(response.data.accessToken);
      setUser(response.data.user);
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    } else {
      throw new Error(response.error?.message || 'Login failed');
    }
  };

  const signup = async (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    const response = await api.signup(data);
    if (response.success && response.data) {
      setAccessToken(response.data.accessToken);
      setUser(response.data.user);
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    } else {
      throw new Error(response.error?.message || 'Signup failed');
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      clearTokens();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};