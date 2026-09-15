import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { LOGO } from '@/data/theatre';
import {
  adminLogin,
  adminPost,
  fetchCatalog,
  ApiHall,
  HallBlock,
  BookingSettings,
  Catalog,
} from '@/lib/api';
import AdminLogin from './admin/AdminLogin';
import ShowsSessionsTab, {
  emptyShow,
  emptySession,
  ShowForm,
  SessionForm,
} from './admin/ShowsSessionsTab';
import HallsTab from './admin/HallsTab';
import SiteSettingsTab from './admin/SiteSettingsTab';

const TOKEN_KEY = 'helios-admin-token';

const Admin = () => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [showForm, setShowForm] = useState<ShowForm>({ ...emptyShow });
  const [sessionForm, setSessionForm] = useState<SessionForm>({ ...emptySession });
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [editingHall, setEditingHall] = useState<ApiHall | null | 'new'>(null);
  const [bookingForm, setBookingForm] = useState<BookingSettings>({
    nameRequired: true,
    emailRequired: true,
    phoneRequired: true,
  });

  const load = async () => {
    const data = await fetchCatalog();
    setCatalog(data);
    if (!sessionForm.showId && data.shows[0])
      setSessionForm((f) => ({ ...f, showId: data.shows[0].id }));
    if (!showForm.hallId && data.halls[0])
      setShowForm((f) => ({ ...f, hallId: data.halls[0].id }));
    if (data.bookingSettings) setBookingForm(data.bookingSettings);
  };

  useEffect(() => {
    if (token) load().catch(() => undefined);
  }, [token]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const next = await adminLogin(password);
      localStorage.setItem(TOKEN_KEY, next);
      setToken(next);
      setPassword('');
    } catch (err) {
      toast({
        title: 'Не удалось войти',
        description: err instanceof Error ? err.message : '',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const run = async (payload: Record<string, unknown>, ok: string) => {
    setLoading(true);
    try {
      const data = await adminPost(token, payload);
      if (data.orders) setOrders(data.orders);
      else setCatalog(data);
      toast({ title: ok });
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : '',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AdminLogin
        password={password}
        setPassword={setPassword}
        loading={loading}
        onSubmit={login}
      />
    );
  }

  const shows = catalog?.shows ?? [];
  const sessions = catalog?.sessions ?? [];
  const sections = catalog?.sections ?? [];
  const halls = catalog?.halls ?? [];

  const saveHall = (payload: {
    id: number | null;
    name: string;
    isActive: boolean;
    sortOrder: number;
    blocks: HallBlock[];
  }) =>
    run({ action: 'save_hall', ...payload }, 'Зал сохранён').then(() =>
      setEditingHall(null),
    );

  return (
    <div className="min-h-screen bg-page p-3.5">
      <div className="rounded-[26px] bg-background p-5 sm:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="Гелиос" className="h-10" />
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Театр Гелиос
              </p>
              <h1 className="font-head text-xl font-extrabold tracking-tightest">
                Управление афишей
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/"
              className="rounded-full bg-foreground/10 px-5 py-2.5 text-sm font-semibold"
            >
              На сайт
            </a>
            <button
              onClick={() => {
                localStorage.removeItem(TOKEN_KEY);
                setToken('');
              }}
              className="rounded-full bg-foreground/10 px-5 py-2.5 text-sm font-semibold"
            >
              Выйти
            </button>
          </div>
        </header>

        <Tabs defaultValue="shows">
          <TabsList className="mb-6 flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
            {[
              ['shows', 'Спектакли'],
              ['sessions', 'Даты сеансов'],
              ['halls', 'Залы'],
              ['sections', 'Разделы сайта'],
              ['booking', 'Форма заявки'],
              ['orders', 'Заказы'],
            ].map(([v, l]) => (
              <TabsTrigger
                key={v}
                value={v}
                onClick={() => v === 'orders' && run({ action: 'orders' }, 'Заказы обновлены')}
                className="rounded-full bg-foreground/10 px-5 py-2.5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {l}
              </TabsTrigger>
            ))}
          </TabsList>

          <ShowsSessionsTab
            shows={shows}
            sessions={sessions}
            halls={halls}
            showForm={showForm}
            setShowForm={setShowForm}
            sessionForm={sessionForm}
            setSessionForm={setSessionForm}
            loading={loading}
            run={run}
          />

          <HallsTab
            halls={halls}
            shows={shows}
            editingHall={editingHall}
            setEditingHall={setEditingHall}
            loading={loading}
            run={run}
            saveHall={saveHall}
          />

          <SiteSettingsTab
            sections={sections}
            bookingForm={bookingForm}
            setBookingForm={setBookingForm}
            orders={orders}
            loading={loading}
            run={run}
          />
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
