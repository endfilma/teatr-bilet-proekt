import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { LOGO, PHONE } from '@/data/theatre';
import { navLinks } from './nav';

const Header = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 -mx-1 rounded-2xl bg-background/90 px-1 py-3 backdrop-blur-md">
      <div className="flex items-center gap-7">
        <a href="#top" className="flex items-center gap-2.5">
          <img src={LOGO} alt="Гелиос" className="h-[34px] w-[34px] object-contain" />
          <span className="font-head text-[1.15em] font-extrabold tracking-tightest">
            Гелиос
          </span>
        </a>

        <nav className="hidden items-center gap-[22px] lg:flex">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[0.95em] font-medium text-foreground transition-colors hover:text-primary"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2.5 md:flex">
          <div className="flex items-center gap-2 rounded-full bg-foreground/10 px-4 py-2.5 text-[0.9em] font-semibold">
            Касса <span className="font-normal text-muted-foreground">{PHONE}</span>
          </div>
          <a
            href="#bilety"
            className="flex items-center gap-2 rounded-full bg-foreground/10 px-4 py-2.5 text-[0.9em] font-semibold transition-colors hover:bg-foreground/20"
          >
            Мои билеты
          </a>
        </div>

        <button
          aria-label="Меню"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto flex h-11 w-11 items-center justify-center rounded-full bg-foreground/10 lg:hidden"
        >
          <Icon name={open ? 'X' : 'Menu'} size={20} />
        </button>
      </div>

      {open && (
        <nav className="mt-3 grid gap-1 rounded-2xl bg-card p-3 lg:hidden">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-foreground/10"
            >
              {l.label}
            </a>
          ))}
          <a
            href={`tel:${PHONE.replace(/[^+\d]/g, '')}`}
            className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground"
          >
            Касса {PHONE}
          </a>
        </nav>
      )}
    </header>
  );
};

export default Header;
