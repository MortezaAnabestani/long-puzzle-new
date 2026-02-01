/**
 * Backend Mode Context
 *
 * مدیریت حالت ارتباط با Backend (JSON Mode vs All Mode)
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { BackendMode } from '../types';
import { contentApi } from '../services/api/contentApi';
import { smartFetcher } from '../services/smartFetcher';

interface BackendModeContextType {
  mode: BackendMode;
  isConnected: boolean;
  setMode: (mode: BackendMode) => void;
  checkConnection: () => Promise<boolean>;
}

const BackendModeContext = createContext<BackendModeContextType | undefined>(undefined);

export const BackendModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<BackendMode>(BackendMode.ALL);
  const [isConnected, setIsConnected] = useState(false);

  const checkConnection = useCallback(async () => {
    const connected = await contentApi.checkConnection();
    setIsConnected(connected);
    return connected;
  }, []);

  const setMode = useCallback((newMode: BackendMode) => {
    console.log(`🔄 [BackendMode] Switching to ${newMode.toUpperCase()} mode`);
    setModeState(newMode);
    smartFetcher.setMode(newMode);
  }, []);

  // بررسی اتصال و تنظیم smartFetcher در ابتدا
  React.useEffect(() => {
    checkConnection();
    smartFetcher.setMode(mode);
  }, [checkConnection, mode]);

  return (
    <BackendModeContext.Provider value={{ mode, isConnected, setMode, checkConnection }}>
      {children}
    </BackendModeContext.Provider>
  );
};

export const useBackendMode = () => {
  const context = useContext(BackendModeContext);
  if (!context) {
    throw new Error('useBackendMode must be used within BackendModeProvider');
  }
  return context;
};
