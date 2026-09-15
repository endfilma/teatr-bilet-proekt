import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCatalog, ApiSession, ApiSection, ApiHall, BookingSettings } from '@/lib/api';
import { Show, shows as fallbackShows } from '@/data/theatre';

export type LiveShow = Show & {
  sessionId: string | null;
  hallId: number | null;
  buyLabel: string;
};

type CatalogValue = {
  sessions: LiveShow[];
  repertoire: LiveShow[];
  occupied: Record<string, string[]>;
  sections: ApiSection[];
  halls: ApiHall[];
  bookingSettings: BookingSettings;
  isVisible: (key: string) => boolean;
  isLoading: boolean;
};

const defaultBookingSettings: BookingSettings = {
  nameRequired: true,
  emailRequired: true,
  phoneRequired: true,
};

const defaultSections: ApiSection[] = [
  { key: 'afisha', label: 'Афиша', anchor: 'afisha', isVisible: true, sortOrder: 10 },
  { key: 'repertuar', label: 'Репертуар', anchor: 'repertuar', isVisible: true, sortOrder: 20 },
  { key: 'bilety', label: 'Билеты', anchor: 'bilety', isVisible: true, sortOrder: 30 },
  { key: 'truppa', label: 'Труппа', anchor: 'truppa', isVisible: true, sortOrder: 40 },
  { key: 'novosti', label: 'Новости', anchor: 'novosti', isVisible: true, sortOrder: 50 },
  { key: 'kontakty', label: 'Контакты', anchor: 'kontakty', isVisible: true, sortOrder: 60 },
];

const toShow = (s: ApiSession): LiveShow => ({
  id: `${s.slug}-${s.id}`,
  sessionId: s.id,
  hallId: s.hallId,
  buyLabel: s.buyLabel || 'Купить',
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

const fallback: LiveShow[] = fallbackShows.map((s) => ({
  ...s,
  sessionId: null,
  hallId: null,
  buyLabel: 'Купить',
}));

const Ctx = createContext<CatalogValue>({
  sessions: fallback,
  repertoire: fallback,
  occupied: {},
  sections: defaultSections,
  halls: [],
  bookingSettings: defaultBookingSettings,
  isVisible: () => true,
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

  const sections = data?.sections?.length ? data.sections : defaultSections;
  const isVisible = (key: string) =>
    sections.find((s) => s.key === key)?.isVisible ?? true;

  return (
    <Ctx.Provider
      value={{
        sessions,
        repertoire,
        occupied: data?.occupied ?? {},
        sections,
        halls: data?.halls ?? [],
        bookingSettings: data?.bookingSettings ?? defaultBookingSettings,
        isVisible,
        isLoading,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export default CatalogProvider;