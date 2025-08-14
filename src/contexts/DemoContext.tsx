import React, { createContext, useContext, useState, ReactNode } from 'react';
import { WalletRiskResponse } from '@/services/api';

interface DemoContextType {
  demoData: WalletRiskResponse | null;
  setDemoData: (data: WalletRiskResponse | null) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [demoData, setDemoData] = useState<WalletRiskResponse | null>(null);

  return (
    <DemoContext.Provider value={{ demoData, setDemoData }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoContext() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemoContext must be used within a DemoProvider');
  }
  return context;
}