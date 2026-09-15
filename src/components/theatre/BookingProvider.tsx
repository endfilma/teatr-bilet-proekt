import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { useCatalog, LiveShow } from '@/hooks/useCatalog';
import { createBooking, confirmPayment, BookingResult } from '@/lib/api';
import HallMap, { buildSeats, seatPrice, hallLayoutCapacity } from './HallMap';

type BookingCtx = { open: (show?: LiveShow) => void };

const Ctx = createContext<BookingCtx>({ open: () => undefined });

export const useBooking = () => useContext(Ctx);

const emptyForm = { name: '', email: '', phone: '' };
const emptyLayout = { blocks: [] };

const BookingProvider = ({ children }: { children: ReactNode }) => {
  const { sessions, occupied, halls, bookingSettings } = useCatalog();
  const queryClient = useQueryClient();

  const [isOpen, setOpen] = useState(false);
  const [show, setShow] = useState<LiveShow>(sessions[0]);
  const [selected, setSelected] = useState<string[]>([]);
  const [step, setStep] = useState<'seats' | 'form' | 'done'>('seats');
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BookingResult | null>(null);

  const current = sessions.find((s) => s.id === show?.id) ?? sessions[0];
  const hall = halls.find((h) => h.id === current?.hallId);
  const layout = hall?.layout ?? emptyLayout;
  const taken = current?.sessionId ? occupied[current.sessionId] ?? [] : [];
  const seats = useMemo(
    () => buildSeats(layout, taken),
    [layout, taken.join(',')],
  );
  const isDonation = current?.buyLabel === 'Пожертвовать';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = localStorage.getItem('helios-pending-order');
    if (params.get('paid') === '1' && code) {
      localStorage.removeItem('helios-pending-order');
      confirmPayment(code).then(() => {
        queryClient.invalidateQueries({ queryKey: ['catalog'] });
        toast({
          title: 'Оплата прошла',
          description: `Электронный билет по заказу ${code} отправлен на почту.`,
        });
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [queryClient]);

  const openDialog = useCallback((next?: LiveShow) => {
    if (next) setShow(next);
    setSelected([]);
    setStep('seats');
    setForm(emptyForm);
    setErrors({});
    setResult(null);
    setOpen(true);
  }, []);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  const picked = seats.filter((s) => selected.includes(s.id));
  const total = picked.reduce(
    (sum, s) => sum + seatPrice(current?.priceFrom ?? 800, s.priceMultiplier),
    0,
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (bookingSettings.nameRequired && form.name.trim().length < 2)
      next.name = 'Укажите имя';
    if (
      bookingSettings.emailRequired
        ? !/^[^@\s]+@[^@\s]+\.[a-zA-Zа-яА-Я]{2,}$/.test(form.email)
        : form.email && !/^[^@\s]+@[^@\s]+\.[a-zA-Zа-яА-Я]{2,}$/.test(form.email)
    )
      next.email = 'Проверьте почту';
    if (bookingSettings.phoneRequired && form.phone.replace(/\D/g, '').length < 10)
      next.phone = 'Проверьте телефон';
    setErrors(next);
    if (Object.keys(next).length) return;

    if (!current?.sessionId) {
      toast({
        title: 'Сеанс недоступен',
        description: 'Обновите страницу и попробуйте ещё раз.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const data = await createBooking({
        sessionId: current.sessionId,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        seats: picked.map((s) => ({
          id: s.id,
          row: s.row,
          num: s.num,
          price: seatPrice(current.priceFrom, s.priceMultiplier),
        })),
        total,
        returnUrl: `${window.location.origin}/?paid=1`,
      });
      setResult(data);
      setStep('done');
      if (data.paymentUrl) localStorage.setItem('helios-pending-order', data.code);
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
      if (data.paymentUrl) window.open(data.paymentUrl, '_blank', 'noopener');
      toast({
        title: data.paymentUrl ? 'Заказ создан' : 'Места забронированы',
        description: form.email
          ? `Заказ ${data.code}. Билет отправлен на ${form.email}.`
          : `Заказ ${data.code}.`,
      });
    } catch (err) {
      toast({
        title: 'Не получилось оформить',
        description: err instanceof Error ? err.message : 'Попробуйте ещё раз',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  if (!current) return <>{children}</>;

  return (
    <Ctx.Provider value={{ open: openDialog }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-3xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-head text-2xl tracking-tightest">
              {current.title}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {current.dateLabel} · {current.scene} · {hallLayoutCapacity(layout)} мест
            </DialogDescription>
          </DialogHeader>

          {step === 'seats' && (
            <div className="space-y-4">
              <HallMap layout={layout} seats={seats} selected={selected} onToggle={toggle} />

              <div className="rounded-2xl bg-secondary/60 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Цены по зонам
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {layout.blocks.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between rounded-xl bg-background px-3 py-2 text-sm"
                    >
                      <span className="text-muted-foreground">{b.label}</span>
                      <span className="font-head font-bold">
                        {seatPrice(current.priceFrom, b.priceMultiplier).toLocaleString(
                          'ru-RU',
                        )}{' '}
                        ₽
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {picked.length
                      ? picked.map((s) => `ряд ${s.row}, м. ${s.num}`).join(' · ')
                      : 'Выберите места на схеме'}
                  </p>
                  <p className="font-head text-xl font-bold">
                    {total.toLocaleString('ru-RU')} ₽
                  </p>
                </div>
                <Button
                  disabled={!picked.length}
                  onClick={() => setStep('form')}
                  className="rounded-full px-7 font-bold"
                >
                  {isDonation ? 'Перейти к пожертвованию' : 'Перейти к оплате'}
                </Button>
              </div>
            </div>
          )}

          {step === 'form' && (
            <form className="space-y-4" onSubmit={submit} noValidate>
              <div className="rounded-2xl bg-secondary/60 p-4 text-sm">
                <p className="text-muted-foreground">Ваши места</p>
                <p className="mt-1 font-medium">
                  {picked.map((s) => `ряд ${s.row}, м. ${s.num}`).join(' · ')}
                </p>
                <p className="mt-2 font-head text-xl font-bold">
                  {total.toLocaleString('ru-RU')} ₽
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="bk-name">
                    Имя
                    {!bookingSettings.nameRequired && (
                      <span className="ml-1 font-normal text-muted-foreground">
                        (необязательно)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="bk-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Анна"
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bk-email">
                    Почта
                    {!bookingSettings.emailRequired && (
                      <span className="ml-1 font-normal text-muted-foreground">
                        (необязательно)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="bk-email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="anna@mail.ru"
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bk-phone">
                    Телефон
                    {!bookingSettings.phoneRequired && (
                      <span className="ml-1 font-normal text-muted-foreground">
                        (необязательно)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="bk-phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+7 900 000-00-00"
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setStep('seats')}
                >
                  <Icon name="ChevronLeft" size={16} /> К схеме зала
                </Button>
                <Button
                  type="submit"
                  disabled={sending}
                  className="rounded-full px-7 font-bold"
                >
                  {sending
                    ? 'Оформляем…'
                    : `${isDonation ? 'Пожертвовать' : 'Оплатить'} ${total.toLocaleString('ru-RU')} ₽`}
                </Button>
              </div>
            </form>
          )}

          {step === 'done' && result && (
            <div className="space-y-4 py-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Icon name="Check" size={28} />
              </div>
              <p className="font-head text-xl font-bold">
                {isDonation ? 'Пожертвование' : 'Заказ'} {result.code} оформлен{isDonation ? 'о' : ''}
              </p>
              {result.qrUrl && (
                <img
                  src={result.qrUrl}
                  alt="QR-код электронного билета"
                  className="mx-auto h-40 w-40 rounded-xl bg-white p-2"
                />
              )}
              <p className="text-sm text-muted-foreground">
                {form.email
                  ? `Электронный билет на «${current.title}» отправлен на ${form.email}. `
                  : `Электронный билет на «${current.title}» готов. `}
                Покажите QR-код на входе.
              </p>
              {result.paymentUrl && (
                <a
                  href={result.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-full bg-primary px-7 py-3 font-bold text-primary-foreground"
                >
                  {isDonation ? 'Пожертвовать' : 'Оплатить'} {total.toLocaleString('ru-RU')} ₽ картой
                </a>
              )}
              <div>
                <Button
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setOpen(false)}
                >
                  Закрыть
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
};

export default BookingProvider;