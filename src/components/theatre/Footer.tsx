import { ADDRESS, LOGO, PHONE } from '@/data/theatre';
import { navLinks } from './nav';

const Footer = () => (
  <footer className="mt-6 rounded-[26px] bg-card px-5 py-10 lg:px-[26px]">
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className="max-w-xs">
        <div className="flex items-center gap-2.5">
          <img src={LOGO} alt="Гелиос" className="h-9 w-9 object-contain" />
          <span className="font-head text-lg font-extrabold tracking-tightest">
            Гелиос
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Краснодарский театр «Гелиос». Драма, комедия и спектакли для детей на двух
          сценах с 1987 года.
        </p>
      </div>

      <nav className="grid gap-2 sm:grid-cols-2 lg:ml-auto">
        {navLinks.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {l.label}
          </a>
        ))}
      </nav>

      <div className="text-sm text-muted-foreground lg:text-right">
        <p>{ADDRESS}</p>
        <p className="mt-1 font-head font-bold text-foreground">{PHONE}</p>
        <p className="mt-1">hello@helios-teatr.ru</p>
      </div>
    </div>

    <div className="mt-8 border-t border-border pt-5 text-xs text-muted-foreground">
      © {new Date().getFullYear()} Театр «Гелиос». Возрастные ограничения указаны в
      афише.
    </div>
  </footer>
);

export default Footer;
