import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  clearStoredAuthSession,
  getStoredAuthSession,
  getStoredRefreshToken,
  persistAuthSession,
} from '@/lib/authStorage';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  userType: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedSession = getStoredAuthSession();

    if (storedSession) {
      setUser(storedSession.user);
      setToken(storedSession.accessToken);
      setRefreshToken(storedSession.refreshToken);
    }
  }, []);

  const login = (userData: User, authToken: string, sessionRefreshToken: string) => {
    setUser(userData);
    setToken(authToken);
    setRefreshToken(sessionRefreshToken);
    persistAuthSession(userData, authToken, sessionRefreshToken);
  };

  const logout = () => {
    const sessionRefreshToken = refreshToken || getStoredRefreshToken();

    setUser(null);
    setToken(null);
    setRefreshToken(null);
    clearStoredAuthSession();

    if (sessionRefreshToken) {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const apiKey = import.meta.env.VITE_API_KEY || '';

      void fetch(`${apiBaseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({ refreshToken: sessionRefreshToken }),
      }).catch(error => {
        console.error('Error revoking admin session:', error);
      });
    }
  };

  const isAuthenticated = !!(user && refreshToken);

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
