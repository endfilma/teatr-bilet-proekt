import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from 'react';
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
import { Show, shows, seatCategories } from '@/data/theatre';
import HallMap, { buildHall, seatPrice } from './HallMap';

type BookingCtx = { open: (show?: Show) => void };

const Ctx = createContext<BookingCtx>({ open: () => undefined });

export const useBooking = () => useContext(Ctx);

const emptyForm = { name: '', email: '', phone: '' };

const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setOpen] = useState(false);
  const [show, setShow] = useState<Show>(shows[0]);
  const [selected, setSelected] = useState<string[]>([]);
  const [step, setStep] = useState<'seats' | 'form' | 'done'>('seats');
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const seed = useMemo(() => shows.findIndex((s) => s.id === show.id) + 1, [show]);
  const seats = useMemo(() => buildHall(seed), [seed]);

  const openDialog = useCallback((next?: Show) => {
    if (next) setShow(next);
    setSelected([]);
    setStep('seats');
    setForm(emptyForm);
    setErrors({});
    setOpen(true);
  }, []);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  const picked = seats.filter((s) => selected.includes(s.id));
  const total = picked.reduce(
    (sum, s) => sum + seatPrice(show.priceFrom, s.category),
    0,
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = 'Укажите имя';
    if (!/^[^@\s]+@[^@\s]+\.[a-zA-Zа-яА-Я]{2,}$/.test(form.email))
      next.email = 'Проверьте почту';
    if (form.phone.replace(/\D/g, '').length < 10) next.phone = 'Проверьте телефон';
    setErrors(next);
    if (Object.keys(next).length) return;
    setStep('done');
    toast({
      title: 'Места забронированы',
      description: `«${show.title}», ${show.dateLabel}. Билеты придут на ${form.email}.`,
    });
  };

  return (
    <Ctx.Provider value={{ open: openDialog }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-3xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-head text-2xl tracking-tightest">
              {show.title}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {show.dateLabel} · {show.scene}
            </DialogDescription>
          </DialogHeader>

          {step === 'seats' && (
            <div className="space-y-4">
              <HallMap seats={seats} selected={selected} onToggle={toggle} />

              <div className="rounded-2xl bg-secondary/60 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Цены по категориям
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {(
                    Object.keys(seatCategories) as (keyof typeof seatCategories)[]
                  ).map((cat) => (
                    <div
                      key={cat}
                      className="flex items-center justify-between rounded-xl bg-background px-3 py-2 text-sm"
                    >
                      <span className="text-muted-foreground">
                        {seatCategories[cat].label}
                      </span>
                      <span className="font-head font-bold">
                        {seatPrice(show.priceFrom, cat).toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {picked.length
                      ? picked
                          .map((s) => `ряд ${s.row}, м. ${s.num}`)
                          .join(' · ')
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
                  Перейти к оплате
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
                  <Label htmlFor="bk-name">Имя</Label>
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
                  <Label htmlFor="bk-email">Почта</Label>
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
                  <Label htmlFor="bk-phone">Телефон</Label>
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
                <Button type="submit" className="rounded-full px-7 font-bold">
                  Оплатить {total.toLocaleString('ru-RU')} ₽
                </Button>
              </div>
            </form>
          )}

          {step === 'done' && (
            <div className="space-y-4 py-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Icon name="Check" size={28} />
              </div>
              <p className="font-head text-xl font-bold">Бронь подтверждена</p>
              <p className="text-sm text-muted-foreground">
                Электронные билеты на «{show.title}» отправлены на {form.email}.
                Оплатить можно онлайн по ссылке из письма или в кассе за час до начала.
              </p>
              <Button
                className="rounded-full px-7 font-bold"
                onClick={() => setOpen(false)}
              >
                Готово
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
};

export default BookingProvider;
