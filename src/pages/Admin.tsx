import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { LOGO } from '@/data/theatre';
import {
  adminLogin,
  adminPost,
  fetchCatalog,
  ApiShow,
  ApiSession,
  Catalog,
} from '@/lib/api';

const TOKEN_KEY = 'helios-admin-token';

const emptyShow = {
  id: 0,
  slug: '',
  title: '',
  scene: 'Большая сцена',
  genre: 'Драма',
  meta: '',
  annotation: '',
  director: '',
  priceFrom: 800,
  isActive: true,
  sortOrder: 100,
};

const emptySession = {
  id: 0,
  showId: 0,
  startsAt: '',
  hallCaption: 'Партер и задние ряды',
  priceFrom: '',
};

const Admin = () => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [showForm, setShowForm] = useState({ ...emptyShow });
  const [sessionForm, setSessionForm] = useState({ ...emptySession });
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);

  const load = async () => {
    const data = await fetchCatalog();
    setCatalog(data);
    if (!sessionForm.showId && data.shows[0])
      setSessionForm((f) => ({ ...f, showId: data.shows[0].id }));
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
      <div className="flex min-h-screen items-center justify-center bg-page p-4">
        <form
          onSubmit={login}
          className="w-full max-w-sm space-y-4 rounded-3xl bg-background p-8"
        >
          <img src={LOGO} alt="Гелиос" className="h-12" />
          <h1 className="font-head text-2xl font-extrabold tracking-tightest">
            Управление театром
          </h1>
          <div className="space-y-2">
            <Label htmlFor="pwd">Пароль администратора</Label>
            <Input
              id="pwd"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full font-bold"
          >
            Войти
          </Button>
        </form>
      </div>
    );
  }

  const shows: ApiShow[] = catalog?.shows ?? [];
  const sessions: ApiSession[] = catalog?.sessions ?? [];

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

          <TabsContent value="shows" className="mt-0 grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="space-y-3">
              {shows.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl bg-card p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-head text-lg font-bold tracking-tightest">
                      {s.title}{' '}
                      {!s.isActive && (
                        <span className="text-sm font-normal text-muted-foreground">
                          (скрыт)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {s.scene} · {s.genre} · от {s.priceFrom} ₽
                    </p>
                  </div>
                  <button
                    onClick={() => setShowForm({ ...s })}
                    className="rounded-full bg-foreground/10 px-4 py-2 text-sm font-semibold"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => run({ action: 'archive_show', id: s.id }, 'Спектакль скрыт')}
                    className="rounded-full bg-foreground/10 px-3 py-2 text-muted-foreground"
                    aria-label="Скрыть"
                  >
                    <Icon name="EyeOff" size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-2xl bg-card p-5">
              <p className="font-head text-lg font-bold tracking-tightest">
                {showForm.id ? 'Редактирование' : 'Новый спектакль'}
              </p>
              <div className="space-y-1.5">
                <Label>Название</Label>
                <Input
                  value={showForm.title}
                  onChange={(e) =>
                    setShowForm({ ...showForm, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Зал</Label>
                <select
                  value={showForm.scene}
                  onChange={(e) =>
                    setShowForm({ ...showForm, scene: e.target.value })
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="Большая сцена">Большой зал — 100 мест</option>
                  <option value="Малая сцена">Малый зал — 50 мест</option>
                </select>
              </div>
              {[
                ['genre', 'Жанр (Драма, Комедия, Классика, Детям)'],
                ['meta', 'Подпись (длительность, возраст)'],
                ['director', 'Режиссёр'],
              ].map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <Label>{label}</Label>
                  <Input
                    value={(showForm as never)[key] ?? ''}
                    onChange={(e) =>
                      setShowForm({ ...showForm, [key]: e.target.value })
                    }
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label>Описание</Label>
                <Textarea
                  rows={4}
                  value={showForm.annotation}
                  onChange={(e) =>
                    setShowForm({ ...showForm, annotation: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Цена от, ₽</Label>
                  <Input
                    type="number"
                    value={showForm.priceFrom}
                    onChange={(e) =>
                      setShowForm({ ...showForm, priceFrom: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Порядок</Label>
                  <Input
                    type="number"
                    value={showForm.sortOrder}
                    onChange={(e) =>
                      setShowForm({ ...showForm, sortOrder: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  disabled={loading || !showForm.title}
                  onClick={() =>
                    run({ action: 'save_show', ...showForm, id: showForm.id || null }, 'Сохранено').then(
                      () => setShowForm({ ...emptyShow }),
                    )
                  }
                  className="rounded-full font-bold"
                >
                  Сохранить
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setShowForm({ ...emptyShow })}
                >
                  Очистить
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="sessions"
            className="mt-0 grid gap-4 lg:grid-cols-[1fr_360px]"
          >
            <div className="space-y-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl bg-card p-4"
                >
                  <div className="w-[130px] shrink-0">
                    <p className="font-head font-bold">{s.date}</p>
                    <p className="text-sm text-muted-foreground">{s.time}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-head text-lg font-bold tracking-tightest">
                      {s.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {s.hallCaption} · от {s.priceFrom} ₽ · свободно {s.free}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSessionForm({
                        id: Number(s.id),
                        showId: s.showId,
                        startsAt: s.startsAt.slice(0, 16),
                        hallCaption: s.hallCaption,
                        priceFrom: String(s.priceFrom),
                      })
                    }
                    className="rounded-full bg-foreground/10 px-4 py-2 text-sm font-semibold"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() =>
                      run({ action: 'archive_session', id: Number(s.id) }, 'Сеанс снят')
                    }
                    className="rounded-full bg-foreground/10 px-3 py-2 text-muted-foreground"
                    aria-label="Снять с показа"
                  >
                    <Icon name="EyeOff" size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-2xl bg-card p-5">
              <p className="font-head text-lg font-bold tracking-tightest">
                {sessionForm.id ? 'Редактирование сеанса' : 'Новый сеанс'}
              </p>
              <div className="space-y-1.5">
                <Label>Спектакль</Label>
                <select
                  value={sessionForm.showId}
                  onChange={(e) =>
                    setSessionForm({ ...sessionForm, showId: Number(e.target.value) })
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {shows.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Дата и время</Label>
                <Input
                  type="datetime-local"
                  value={sessionForm.startsAt}
                  onChange={(e) =>
                    setSessionForm({ ...sessionForm, startsAt: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Зона зала</Label>
                <Input
                  value={sessionForm.hallCaption}
                  onChange={(e) =>
                    setSessionForm({ ...sessionForm, hallCaption: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Цена от, ₽ (пусто — как у спектакля)</Label>
                <Input
                  type="number"
                  value={sessionForm.priceFrom}
                  onChange={(e) =>
                    setSessionForm({ ...sessionForm, priceFrom: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  disabled={loading || !sessionForm.startsAt || !sessionForm.showId}
                  onClick={() =>
                    run(
                      {
                        action: 'save_session',
                        id: sessionForm.id || null,
                        showId: sessionForm.showId,
                        startsAt: sessionForm.startsAt,
                        hallCaption: sessionForm.hallCaption,
                        priceFrom: sessionForm.priceFrom || null,
                      },
                      'Сеанс сохранён',
                    ).then(() =>
                      setSessionForm({ ...emptySession, showId: shows[0]?.id ?? 0 }),
                    )
                  }
                  className="rounded-full font-bold"
                >
                  Сохранить
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-full"
                  onClick={() =>
                    setSessionForm({ ...emptySession, showId: shows[0]?.id ?? 0 })
                  }
                >
                  Очистить
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-0 space-y-3">
            {orders.length === 0 && (
              <p className="text-muted-foreground">Заказов пока нет.</p>
            )}
            {orders.map((o) => (
              <div
                key={String(o.code)}
                className="flex flex-wrap items-center gap-3 rounded-2xl bg-card p-4"
              >
                <div className="w-[120px] shrink-0 font-head font-bold">
                  {String(o.code)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{String(o.title)}</p>
                  <p className="text-sm text-muted-foreground">
                    {String(o.customer_name)} · {String(o.email)} · {String(o.phone)}
                  </p>
                </div>
                <div className="font-head font-bold">{String(o.total)} ₽</div>
                <span
                  className={[
                    'rounded-full px-3 py-1 text-xs font-semibold',
                    o.status === 'paid'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-foreground/10 text-muted-foreground',
                  ].join(' ')}
                >
                  {o.status === 'paid' ? 'Оплачен' : 'Ожидает оплаты'}
                </span>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;