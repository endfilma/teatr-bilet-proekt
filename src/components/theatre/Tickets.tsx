import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import Section from './Section';
import HallMap, { buildSeats, seatPrice, hallLayoutCapacity } from './HallMap';
import { useCatalog } from '@/hooks/useCatalog';
import { useBooking } from './BookingProvider';

const emptyLayout = { blocks: [] };

const Tickets = () => {
  const { sessions, occupied, halls } = useCatalog();
  const [showId, setShowId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const { open } = useBooking();

  const show = sessions.find((s) => s.id === showId) ?? sessions[0];
  const hall = halls.find((h) => h.id === show?.hallId);
  const layout = hall?.layout ?? emptyLayout;
  const taken = show?.sessionId ? occupied[show.sessionId] ?? [] : [];
  const seats = useMemo(
    () => buildSeats(layout, taken),
    [layout, taken.join(',')],
  );
  const blockOptions = layout.blocks;

  const picked = seats.filter((s) => selected.includes(s.id));
  const total = picked.reduce(
    (sum, s) => sum + seatPrice(show?.priceFrom ?? 800, s.priceMultiplier),
    0,
  );

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  if (!show) return null;

  return (
    <Section
      id="bilety"
      eyebrow="Билеты и схема зала"
      title="Выберите места прямо на схеме"
      lede="У каждого спектакля своя схема зала и вместимость. Бронь мест держится 30 минут."
      aside={
        <div className="flex flex-wrap gap-2">
          {sessions.slice(0, 4).map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setShowId(s.id);
                setSelected([]);
              }}
              className={[
                'rounded-full px-4 py-2.5 text-sm font-semibold transition-colors',
                s.id === show?.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-foreground/10 hover:bg-foreground/20',
              ].join(' ')}
            >
              {s.title}
              <span className="ml-2 font-normal opacity-70">{s.date}</span>
            </button>
          ))}
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl bg-card p-4 sm:p-5">
          <HallMap layout={layout} seats={seats} selected={selected} onToggle={toggle} />
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-card p-5">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Цены по зонам
            </p>
            <div className="mt-3 space-y-2">
              {blockOptions.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-3"
                >
                  <span className="text-sm text-muted-foreground">{b.label}</span>
                  <span className="font-head font-bold">
                    {seatPrice(show.priceFrom, b.priceMultiplier).toLocaleString(
                      'ru-RU',
                    )}{' '}
                    ₽
                  </span>
                </div>
              ))}
              {blockOptions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Схема зала для этого спектакля ещё не настроена
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col rounded-2xl bg-card p-5">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Ваш заказ
            </p>
            <p className="mt-2 font-head text-lg font-bold tracking-tightest">
              {show.title}
            </p>
            <p className="text-sm text-muted-foreground">
              {show.dateLabel} · {hallLayoutCapacity(layout)} мест
            </p>

            <div className="mt-4 flex-1 space-y-2">
              {picked.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Пока ничего не выбрано — нажмите на свободное место.
                </p>
              )}
              {picked.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-2.5 text-sm"
                >
                  <span>
                    {s.blockLabel}, ряд {s.row}, м. {s.num}
                  </span>
                  <span className="flex items-center gap-3 font-head font-bold">
                    {seatPrice(show.priceFrom, s.priceMultiplier).toLocaleString(
                      'ru-RU',
                    )}{' '}
                    ₽
                    <button
                      onClick={() => toggle(s.id)}
                      aria-label="Убрать место"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Icon name="X" size={14} />
                    </button>
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">
                  Итого · {picked.length} билета
                </span>
                <span className="font-head text-2xl font-extrabold">
                  {total.toLocaleString('ru-RU')} ₽
                </span>
              </div>
              <button
                onClick={() => open(show)}
                className="mt-4 w-full rounded-full bg-primary py-3.5 font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                {show.buyLabel === 'Пожертвовать' ? 'Пожертвовать и оформить' : 'Оформить и оплатить'}
              </button>
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Icon name="ShieldCheck" size={14} />
                Оплата картой, СБП или в кассе театра
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Tickets;
