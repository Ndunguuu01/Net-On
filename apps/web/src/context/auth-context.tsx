'use client';

// ============================================
// Net-On — Web Authentication Context
// ============================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  customer?: {
    id: string;
    customerNumber: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const clearAuth = useCallback(() => {
    localStorage.removeItem('neton_access_token');
    localStorage.removeItem('neton_refresh_token');
    document.cookie = 'neton_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setToken(null);
    setUser(null);
  }, []);

  const handleTokenRefresh = useCallback(async (refreshTokenValue: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (!res.ok) {
        throw new Error('Refresh failed');
      }

      const data = await res.json();
      const newTokens = data.tokens || data.data?.tokens;

      if (newTokens?.accessToken) {
        localStorage.setItem('neton_access_token', newTokens.accessToken);
        localStorage.setItem('neton_refresh_token', newTokens.refreshToken);
        document.cookie = `neton_token=${newTokens.accessToken}; path=/; max-age=86400; SameSite=Lax`;
        setToken(newTokens.accessToken);

        // Fetch user profile with new access token
        const profileRes = await fetch(`${API_BASE_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${newTokens.accessToken}` },
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setUser(profileData.data || profileData);
        }
      } else {
        clearAuth();
      }
    } catch {
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth]);

  const fetchProfile = useCallback(async (accessToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await res.json();
      setUser(data.data || data);
    } catch (err) {
      const savedRefreshToken = localStorage.getItem('neton_refresh_token');
      if (savedRefreshToken) {
        await handleTokenRefresh(savedRefreshToken);
      } else {
        clearAuth();
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth, handleTokenRefresh]);

  // Load token and profile on initial render
  useEffect(() => {
    const savedToken = localStorage.getItem('neton_access_token');
    const savedRefreshToken = localStorage.getItem('neton_refresh_token');

    if (savedToken) {
      setToken(savedToken);
      fetchProfile(savedToken).catch(() => {
        setIsLoading(false);
      });
    } else if (savedRefreshToken) {
      handleTokenRefresh(savedRefreshToken);
    } else {
      setIsLoading(false);
    }
  }, [fetchProfile, handleTokenRefresh]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      const tokens = data.tokens || data.data?.tokens;
      const userData = data.user || data.data?.user;

      if (!tokens?.accessToken) {
        throw new Error('Malformed authentication response');
      }

      localStorage.setItem('neton_access_token', tokens.accessToken);
      if (tokens.refreshToken) {
        localStorage.setItem('neton_refresh_token', tokens.refreshToken);
      }
      document.cookie = `neton_token=${tokens.accessToken}; path=/; max-age=86400; SameSite=Lax`;

      setToken(tokens.accessToken);
      setUser(userData);
      router.push('/admin');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const refreshTokenValue = localStorage.getItem('neton_refresh_token');
    if (token && refreshTokenValue) {
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      }).catch(() => {});
    }

    clearAuth();
    router.push('/login');
  };

  const refreshProfile = useCallback(async () => {
    if (token) {
      await fetchProfile(token);
    }
  }, [token, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
