import { ReactNode } from 'react';

type Props = {
  id: string;
  eyebrow: string;
  title: string;
  lede?: string;
  aside?: ReactNode;
  children: ReactNode;
};

const Section = ({ id, eyebrow, title, lede, aside, children }: Props) => (
  <section id={id} className="scroll-mt-24 px-5 py-14 lg:px-[26px] lg:py-20">
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end">
      <div className="max-w-2xl">
        <p className="text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-head text-[28px] font-extrabold leading-[1.1] tracking-tightest sm:text-[36px]">
          {title}
        </h2>
        {lede && (
          <p className="mt-3 leading-relaxed text-muted-foreground">{lede}</p>
        )}
      </div>
      {aside && <div className="lg:ml-auto">{aside}</div>}
    </div>
    {children}
  </section>
);

export default Section;
