import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { SiteContent } from '@/types/admin';

interface SiteContentContextValue {
  contentMap: Map<string, SiteContent>;
  loading: boolean;
  getContent: <T = Record<string, unknown>>(sectionKey: string) => T | null;
  isVisible: (sectionKey: string) => boolean;
}

const SiteContentContext = createContext<SiteContentContextValue | null>(null);

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [contentMap, setContentMap] = useState<Map<string, SiteContent>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('site_content')
        .select('*');
      const map = new Map((data ?? []).map((c: SiteContent) => [c.section_key, c]));
      setContentMap(map);
      setLoading(false);
    }
    fetch();
  }, []);

  function getContent<T = Record<string, unknown>>(sectionKey: string): T | null {
    const entry = contentMap.get(sectionKey);
    return entry ? (entry.content as T) : null;
  }

  function isVisible(sectionKey: string): boolean {
    const entry = contentMap.get(sectionKey);
    // Default to visible if no entry exists
    return entry ? entry.visible : true;
  }

  return (
    <SiteContentContext.Provider value={{ contentMap, loading, getContent, isVisible }}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContentData() {
  return useContext(SiteContentContext) ?? {
    contentMap: new Map(),
    loading: false,
    getContent: () => null,
    isVisible: () => true,
  };
}
