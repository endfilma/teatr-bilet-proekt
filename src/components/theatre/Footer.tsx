import Icon from '@/components/ui/icon';
import { ADDRESS, LOGO, PHONE, VK_URL, TG_URL } from '@/data/theatre';
import { useCatalog } from '@/hooks/useCatalog';

const Footer = () => {
  const { sections } = useCatalog();
  const navLinks = sections
    .filter((s) => s.isVisible)
    .map((s) => ({ href: `#${s.anchor}`, label: s.label }));

  return (
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
          Краснодарский театр «Гелиос». Драма, комедия и спектакли для детей в двух
          камерных залах на 100 и 50 мест.
        </p>
        <div className="mt-4 flex gap-2">
          <a
            href={VK_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="ВКонтакте"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/10 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <Icon name="Users" size={18} />
          </a>
          <a
            href={TG_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/10 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <Icon name="Send" size={18} />
          </a>
        </div>
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
};

export default Footer;