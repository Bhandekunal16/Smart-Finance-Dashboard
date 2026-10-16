import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getApiBaseUrl,
  setApiBaseUrl as saveBaseUrl,
  isSimulationMode,
  setSimulationMode as saveSimulationMode,
  DEFAULT_API_BASE_URL,
} from '../api/axios';
import { userApi } from '../api/userApi';

import { User } from '../types';

interface ApiConfigContextType {
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  activeUsername: string;
  setActiveUsername: (username: string) => void;
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (identifier: string, isMobile?: boolean) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => void;
  refreshCurrentUser: () => Promise<void>;
  isSimulation: boolean;
  setSimulation: (enabled: boolean) => void;
  isMasked: boolean;
  setIsMasked: (masked: boolean) => void;
  toggleMasking: () => void;
  healthStatus: 'connected' | 'disconnected' | 'checking';
  healthMessage: string;
  healthLatency: number | null;
  checkHealth: () => Promise<void>;
  resetToDefaults: () => void;
}

const ApiConfigContext = createContext<ApiConfigContextType | undefined>(undefined);

export const ApiConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [baseUrl, setBaseUrlState] = useState<string>(() => getApiBaseUrl());
  const [activeUsername, setActiveUsernameState] = useState<string>(() => {
    return localStorage.getItem('finflow_active_user') || 'asha';
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('finflow_logged_in') === 'true';
  });
  const [isSimulation, setSimulationState] = useState<boolean>(() => isSimulationMode());
  const [isMasked, setIsMaskedState] = useState<boolean>(() => {
    const saved = localStorage.getItem('finflow_mask_accounts');
    return saved !== null ? saved === 'true' : true;
  });

  const [healthStatus, setHealthStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [healthMessage, setHealthMessage] = useState<string>('');
  const [healthLatency, setHealthLatency] = useState<number | null>(null);

  const setBaseUrl = useCallback((newUrl: string) => {
    saveBaseUrl(newUrl);
    setBaseUrlState(newUrl);
  }, []);

  const setActiveUsername = useCallback((username: string) => {
    const clean = username.trim();
    setActiveUsernameState(clean);
    localStorage.setItem('finflow_active_user', clean);
  }, []);

  const setSimulation = useCallback((enabled: boolean) => {
    saveSimulationMode(enabled);
    setSimulationState(enabled);
  }, []);

  const setIsMasked = useCallback((masked: boolean) => {
    setIsMaskedState(masked);
    localStorage.setItem('finflow_mask_accounts', masked ? 'true' : 'false');
  }, []);

  const toggleMasking = useCallback(() => {
    setIsMaskedState((prev) => {
      const next = !prev;
      localStorage.setItem('finflow_mask_accounts', next ? 'true' : 'false');
      return next;
    });
  }, []);

  const checkHealth = useCallback(async () => {
    setHealthStatus('checking');
    const start = performance.now();
    try {
      const res = await userApi.checkHealth();
      const elapsed = Math.round(performance.now() - start);
      setHealthLatency(elapsed);

      if (res.success) {
        setHealthStatus('connected');
        setHealthMessage(res.message || 'API is active and reachable');
      } else {
        setHealthStatus('disconnected');
        setHealthMessage(res.message);
      }
    } catch (err: any) {
      setHealthStatus('disconnected');
      setHealthMessage(err.message || 'Cannot reach API backend');
      setHealthLatency(null);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth, baseUrl, isSimulation]);

  const refreshCurrentUser = useCallback(async () => {
    if (!activeUsername) return;
    try {
      const res = await userApi.getAccount({ username: activeUsername });
      if (res.success && res.data) {
        setCurrentUser(res.data);
      } else {
        setCurrentUser(null);
      }
    } catch {
      // ignore
    }
  }, [activeUsername]);

  useEffect(() => {
    refreshCurrentUser();
  }, [refreshCurrentUser]);

  const login = useCallback(
    async (identifier: string, isMobile = false) => {
      const clean = identifier.trim();
      const payload = isMobile ? { mobile: clean } : { username: clean.toLowerCase() };
      const res = await userApi.getAccount(payload);

      if (res.success && res.data) {
        setCurrentUser(res.data);
        setActiveUsernameState(res.data.username);
        setIsAuthenticated(true);
        localStorage.setItem('finflow_active_user', res.data.username);
        localStorage.setItem('finflow_logged_in', 'true');
        return { success: true, message: `Welcome, ${res.data.name || res.data.username}!`, user: res.data };
      } else {
        return {
          success: false,
          message: res.message || `No user found matching ${isMobile ? 'mobile' : 'username'} "${clean}".`,
        };
      }
    },
    []
  );

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    localStorage.removeItem('finflow_logged_in');
  }, []);

  const resetToDefaults = useCallback(() => {
    setBaseUrl(DEFAULT_API_BASE_URL);
    setActiveUsername('asha');
    setSimulation(false);
    setIsMasked(true);
  }, [setBaseUrl, setActiveUsername, setSimulation, setIsMasked]);

  return (
    <ApiConfigContext.Provider
      value={{
        baseUrl,
        setBaseUrl,
        activeUsername,
        setActiveUsername,
        currentUser,
        isAuthenticated,
        login,
        logout,
        refreshCurrentUser,
        isSimulation,
        setSimulation,
        isMasked,
        setIsMasked,
        toggleMasking,
        healthStatus,
        healthMessage,
        healthLatency,
        checkHealth,
        resetToDefaults,
      }}
    >
      {children}
    </ApiConfigContext.Provider>
  );
};

export function useApiConfig() {
  const context = useContext(ApiConfigContext);
  if (!context) {
    throw new Error('useApiConfig must be used within an ApiConfigProvider');
  }
  return context;
}
