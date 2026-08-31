import Section from './Section';
import { troupe, theatreFacts } from '@/data/theatre';

const Troupe = () => (
  <Section
    id="truppa"
    eyebrow="Труппа и о театре"
    title="Люди, которые выходят на сцену"
    lede="«Гелиос» работает с 1987 года. Сегодня в труппе 28 актёров, три режиссёра и собственные цеха декораций и костюмов."
  >
    <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {theatreFacts.map((f) => (
        <div key={f.label} className="rounded-2xl bg-card p-5">
          <p className="font-head text-3xl font-extrabold tracking-tightest text-primary">
            {f.value}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{f.label}</p>
        </div>
      ))}
    </div>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {troupe.map((p) => (
        <div
          key={p.name}
          className="flex items-center gap-4 rounded-2xl bg-card p-5 transition-colors hover:bg-secondary/70"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 font-head text-lg font-extrabold text-primary">
            {p.initials}
          </div>
          <div className="min-w-0">
            <p className="font-head text-lg font-bold tracking-tightest">{p.name}</p>
            <p className="text-sm text-primary">{p.role}</p>
            <p className="text-sm text-muted-foreground">{p.note}</p>
          </div>
        </div>
      ))}
    </div>
  </Section>
);

export default Troupe;
