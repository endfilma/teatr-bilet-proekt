import { Show } from '@/data/theatre';
import SeatStrip from './SeatStrip';
import { useBooking } from './BookingProvider';

type Props = { show: Show; index: number };

const ShowWindow = ({ show, index }: Props) => {
  const { open } = useBooking();

  return (
    <article
      className="flex animate-rise flex-col overflow-hidden rounded-xl border-2 border-frame bg-card"
      style={{ animationDelay: `${0.06 * (index + 1)}s` }}
    >
      <div className="flex items-center gap-2 bg-titlebar px-3 py-2.5">
        <div className="flex gap-1.5">
          <i className="block h-2 w-2 rounded-full bg-dot" />
          <i className="block h-2 w-2 rounded-full bg-dot" />
          <i className="block h-2 w-2 rounded-full bg-dot" />
        </div>
        <div className="mx-auto rounded-md bg-foreground/10 px-3 py-1 text-[0.82em] font-semibold tracking-[0.02em]">
          {show.dateLabel}
        </div>
      </div>

      <div className="flex h-full flex-col px-4 pb-3.5 pt-4">
        <div className="text-[0.78em] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {show.scene}
        </div>
        <h2 className="mt-[7px] font-head text-[1.65em] font-extrabold leading-[1.1] tracking-tightest">
          {show.title}
        </h2>
        <p className="mt-1.5 text-[0.9em] text-muted-foreground">{show.meta}</p>

        <div className="mt-[18px] flex flex-1 flex-col">
          <div className="mb-2.5 flex items-baseline justify-between text-[0.8em] text-muted-foreground">
            <span>{show.hallCaption}</span>
            <span>свободно {show.free}</span>
          </div>
          <div className="mb-2.5 h-1 rounded-[3px] bg-frame/55" />
          <SeatStrip variant={index} />
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-foreground/10 pt-3.5">
          <div className="font-head text-[1.05em] font-bold">
            {show.priceFrom.toLocaleString('ru-RU')} ₽{' '}
            <em className="text-[0.8em] font-medium not-italic text-muted-foreground">
              и выше
            </em>
          </div>
          <button
            onClick={() => open(show)}
            className="rounded-full bg-primary px-5 py-2.5 text-[0.9em] font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Купить
          </button>
        </div>
      </div>
    </article>
  );
};

export default ShowWindow;
