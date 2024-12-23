'use client';

import { createContext } from 'react';
import { AppConfig } from '@/config/config';

interface ConfigContextType {
  appConfig: AppConfig;
  ver: string;
}

export const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ 
  children,
  appConfig,
  ver
}: { 
  children: React.ReactNode;
  appConfig: AppConfig;
  ver: string;
}) {
  return (
    <ConfigContext.Provider value={{ appConfig, ver }}>
      {children}
    </ConfigContext.Provider>
  );
} 