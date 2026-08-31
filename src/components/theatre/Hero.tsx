import Header from './Header';
import ShowWindow from './ShowWindow';
import { useCatalog } from '@/hooks/useCatalog';
import { useBooking } from './BookingProvider';

const Hero = () => {
  const { open } = useBooking();
  const { sessions } = useCatalog();
  const nearest = sessions.slice(0, 3);
  const free = nearest.reduce((sum, s) => sum + s.free, 0);

  return (
    <section
      id="top"
      className="flex animate-rise flex-col gap-5 rounded-[26px] bg-background px-5 pb-6 pt-5 lg:min-h-[calc(100vh-28px)] lg:px-[26px]"
    >
      <Header />

      <div className="flex flex-col items-start gap-6 pt-1.5 lg:flex-row lg:items-end lg:gap-10">
        <h1 className="max-w-[15ch] font-head text-[34px] font-extrabold leading-[1.08] tracking-tightest sm:text-[46px]">
          Краснодарский театр «Гелиос»
        </h1>
        <div className="max-w-[380px] lg:ml-auto">
          <p className="text-[1.02em] leading-[1.5] text-muted-foreground">
            Ближайшие спектакли сентября. Место выбираете на схеме зала, билет
            приходит на почту.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => open(nearest[0])}
              className="rounded-full bg-bright px-6 py-3 text-[0.98em] font-bold text-bright-foreground transition-opacity hover:opacity-90"
            >
              Выбрать места
            </button>
            <div className="rounded-xl border border-primary/35 bg-primary/15 px-4 py-2.5 text-[0.9em] font-semibold tracking-[0.01em] text-primary">
              Свободно {free} мест
            </div>
          </div>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {nearest.map((show, i) => (
          <ShowWindow key={show.id} show={show} index={i} />
        ))}
      </div>
    </section>
  );
};

export default Hero;