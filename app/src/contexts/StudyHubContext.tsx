import { createContext, useContext, useState, type ReactNode } from 'react';

interface StudyHubState {
  activeNotebookId: string | null;
  setActiveNotebookId: (id: string | null) => void;
}

const StudyHubContext = createContext<StudyHubState | null>(null);

export function StudyHubProvider({ children }: { children: ReactNode }) {
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);

  return (
    <StudyHubContext.Provider value={{ activeNotebookId, setActiveNotebookId }}>
      {children}
    </StudyHubContext.Provider>
  );
}

export function useStudyHub() {
  const ctx = useContext(StudyHubContext);
  if (!ctx) throw new Error('useStudyHub must be used within StudyHubProvider');
  return ctx;
}
