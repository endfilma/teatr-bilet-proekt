import Section from './Section';
import { news } from '@/data/theatre';

const News = () => (
  <Section
    id="novosti"
    eyebrow="Новости и гастроли"
    title="Что происходит в театре"
    lede="Премьеры, выездные показы и события для зрителей. Афишу гастролей обновляем каждый месяц."
  >
    <div className="grid gap-4 md:grid-cols-2">
      {news.map((n) => (
        <article
          key={n.title}
          className="rounded-2xl bg-card p-5 transition-colors hover:bg-secondary/70"
        >
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/15 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-primary">
              {n.tag}
            </span>
            <span className="text-sm text-muted-foreground">{n.date}</span>
          </div>
          <h3 className="mt-3 font-head text-xl font-bold tracking-tightest">
            {n.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {n.text}
          </p>
        </article>
      ))}
    </div>
  </Section>
);

export default News;
