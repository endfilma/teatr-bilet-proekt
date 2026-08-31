import { useState } from 'react';
import Icon from '@/components/ui/icon';
import Section from './Section';
import { shows } from '@/data/theatre';
import { useBooking } from './BookingProvider';

const scenes = ['Все сцены', 'Большая сцена', 'Малая сцена'] as const;

const Afisha = () => {
  const [scene, setScene] = useState<(typeof scenes)[number]>('Все сцены');
  const { open } = useBooking();

  const list = shows.filter((s) => scene === 'Все сцены' || s.scene === scene);

  return (
    <Section
      id="afisha"
      eyebrow="Афиша и расписание"
      title="Сентябрь на двух сценах"
      lede="Полное расписание сеансов: дата, время, сцена и количество свободных мест. Билеты продаются до начала спектакля."
      aside={
        <div className="flex flex-wrap gap-2">
          {scenes.map((s) => (
            <button
              key={s}
              onClick={() => setScene(s)}
              className={[
                'rounded-full px-5 py-2.5 text-sm font-semibold transition-colors',
                scene === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-foreground/10 text-foreground hover:bg-foreground/20',
              ].join(' ')}
            >
              {s}
            </button>
          ))}
        </div>
      }
    >
      <div className="overflow-hidden rounded-2xl bg-card">
        {list.map((show, i) => (
          <div
            key={show.id}
            className={[
              'flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:px-6',
              i ? 'border-t border-border' : '',
            ].join(' ')}
          >
            <div className="w-[112px] shrink-0">
              <p className="font-head text-lg font-extrabold tracking-tightest">
                {show.date}
              </p>
              <p className="text-sm text-muted-foreground">{show.time}</p>
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-head text-lg font-bold tracking-tightest">
                {show.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {show.scene} · {show.meta}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground sm:w-[150px]">
              <Icon name="Armchair" size={16} />
              свободно {show.free}
            </div>

            <div className="flex items-center gap-4">
              <span className="font-head font-bold">
                от {show.priceFrom.toLocaleString('ru-RU')} ₽
              </span>
              <button
                onClick={() => open(show)}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Билеты
              </button>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default Afisha;
