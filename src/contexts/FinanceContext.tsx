import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import type { FinanceData } from '@/hooks/useFinanceData';

const FinanceContext = createContext<FinanceData | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const data = useFinanceData();
  return (
    <FinanceContext.Provider value={data}>{children}</FinanceContext.Provider>
  );
}

export function useFinance(): FinanceData {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
