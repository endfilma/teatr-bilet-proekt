import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCatalog, ApiSession } from '@/lib/api';
import { Show, shows as fallbackShows } from '@/data/theatre';

export type LiveShow = Show & { sessionId: string | null };

type CatalogValue = {
  sessions: LiveShow[];
  repertoire: LiveShow[];
  occupied: Record<string, string[]>;
  isLoading: boolean;
};

const toShow = (s: ApiSession): LiveShow => ({
  id: `${s.slug}-${s.id}`,
  sessionId: s.id,
  title: s.title,
  scene: s.scene as Show['scene'],
  genre: s.genre as Show['genre'],
  meta: s.meta,
  date: s.date,
  time: s.time,
  dateLabel: s.dateLabel,
  hallCaption: s.hallCaption,
  free: s.free,
  priceFrom: s.priceFrom,
  annotation: s.annotation,
  director: s.director,
});

const fallback: LiveShow[] = fallbackShows.map((s) => ({ ...s, sessionId: null }));

const Ctx = createContext<CatalogValue>({
  sessions: fallback,
  repertoire: fallback,
  occupied: {},
  isLoading: false,
});

export const useCatalog = () => useContext(Ctx);

export const CatalogProvider = ({ children }: { children: ReactNode }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['catalog'],
    queryFn: fetchCatalog,
    staleTime: 60_000,
  });

  const sessions = data?.sessions?.length ? data.sessions.map(toShow) : fallback;

  const seen = new Set<string>();
  const repertoire = sessions.filter((s) => {
    const key = s.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <Ctx.Provider
      value={{ sessions, repertoire, occupied: data?.occupied ?? {}, isLoading }}
    >
      {children}
    </Ctx.Provider>
  );
};

export default CatalogProvider;
