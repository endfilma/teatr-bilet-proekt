import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import Section from './Section';
import { shows, Show } from '@/data/theatre';
import { useBooking } from './BookingProvider';

const genres = ['Все', 'Драма', 'Комедия', 'Классика', 'Детям'] as const;

const Card = ({ show }: { show: Show }) => {
  const { open } = useBooking();
  return (
    <article className="flex flex-col rounded-2xl bg-card p-5 transition-colors hover:bg-secondary/70">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-foreground/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {show.genre}
        </span>
        <span className="text-sm text-muted-foreground">{show.scene}</span>
      </div>
      <h3 className="mt-4 font-head text-2xl font-extrabold tracking-tightest">
        {show.title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{show.director}</p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
        {show.annotation}
      </p>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <div>
          <p className="text-sm text-muted-foreground">{show.meta}</p>
          <p className="font-head font-bold">
            Ближайший: {show.date}, {show.time}
          </p>
        </div>
        <button
          onClick={() => open(show)}
          aria-label={`Билеты на «${show.title}»`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Icon name="ArrowRight" size={18} />
        </button>
      </div>
    </article>
  );
};

const Repertoire = () => (
  <Section
    id="repertuar"
    eyebrow="Репертуар"
    title="Двадцать три спектакля в постоянной афише"
    lede="Классика, современная драма и музыкальные сказки для детей. Каждый спектакль идёт не реже одного раза в месяц."
  >
    <Tabs defaultValue="Все">
      <TabsList className="mb-6 flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
        {genres.map((g) => (
          <TabsTrigger
            key={g}
            value={g}
            className="rounded-full bg-foreground/10 px-5 py-2.5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {g}
          </TabsTrigger>
        ))}
      </TabsList>

      {genres.map((g) => {
        const list = shows.filter((s) => g === 'Все' || s.genre === g);
        return (
          <TabsContent key={g} value={g} className="mt-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {list.map((show) => (
                <Card key={show.id} show={show} />
              ))}
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  </Section>
);

export default Repertoire;
