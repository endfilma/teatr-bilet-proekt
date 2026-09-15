import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { ApiSection, BookingSettings } from '@/lib/api';

type Props = {
  sections: ApiSection[];
  bookingForm: BookingSettings;
  setBookingForm: (f: BookingSettings | ((prev: BookingSettings) => BookingSettings)) => void;
  orders: Record<string, unknown>[];
  loading: boolean;
  run: (payload: Record<string, unknown>, ok: string) => Promise<void>;
};

const SiteSettingsTab = ({
  sections,
  bookingForm,
  setBookingForm,
  orders,
  loading,
  run,
}: Props) => (
  <>
    <TabsContent value="sections" className="mt-0 max-w-2xl space-y-3">
      <p className="text-sm text-muted-foreground">
        Выключенный раздел исчезает со страницы и из меню сайта. Данные при
        этом сохраняются — можно включить обратно в любой момент.
      </p>
      {sections.map((s) => (
        <div key={s.key} className="flex items-center gap-4 rounded-2xl bg-card p-4">
          <div className="min-w-0 flex-1">
            <p className="font-head text-lg font-bold tracking-tightest">{s.label}</p>
            <p className="text-sm text-muted-foreground">
              {s.isVisible ? 'Показывается на сайте' : 'Скрыт от посетителей'}
            </p>
          </div>
          <button
            onClick={() =>
              run(
                { action: 'toggle_section', key: s.key, isVisible: !s.isVisible },
                s.isVisible ? `Раздел «${s.label}» скрыт` : `Раздел «${s.label}» показан`,
              )
            }
            disabled={loading}
            className={[
              'flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors',
              s.isVisible
                ? 'bg-primary text-primary-foreground'
                : 'bg-foreground/10 text-muted-foreground',
            ].join(' ')}
          >
            <Icon name={s.isVisible ? 'Eye' : 'EyeOff'} size={16} />
            {s.isVisible ? 'Включён' : 'Выключен'}
          </button>
        </div>
      ))}
    </TabsContent>

    <TabsContent value="booking" className="mt-0 max-w-lg space-y-3">
      <p className="text-sm text-muted-foreground">
        Выберите, какие поля зритель обязан заполнить при оформлении заказа.
        Отключённое поле останется в форме, но пропустить его можно будет без
        ошибки.
      </p>
      <div className="space-y-3 rounded-2xl bg-card p-5">
        {(
          [
            ['nameRequired', 'Имя обязательно'],
            ['emailRequired', 'Почта обязательна'],
            ['phoneRequired', 'Телефон обязателен'],
          ] as [keyof BookingSettings, string][]
        ).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <p className="font-medium">{label}</p>
            <button
              onClick={() => setBookingForm((f) => ({ ...f, [key]: !f[key] }))}
              className={[
                'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                bookingForm[key]
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-foreground/10 text-muted-foreground',
              ].join(' ')}
            >
              <Icon name={bookingForm[key] ? 'Check' : 'X'} size={16} />
              {bookingForm[key] ? 'Обязательно' : 'Необязательно'}
            </button>
          </div>
        ))}
        <Button
          disabled={loading}
          onClick={() =>
            run({ action: 'save_booking_settings', ...bookingForm }, 'Настройки формы сохранены')
          }
          className="rounded-full font-bold"
        >
          Сохранить
        </Button>
      </div>
    </TabsContent>

    <TabsContent value="orders" className="mt-0 space-y-3">
      {orders.length === 0 && <p className="text-muted-foreground">Заказов пока нет.</p>}
      {orders.map((o) => (
        <div
          key={String(o.code)}
          className="flex flex-wrap items-center gap-3 rounded-2xl bg-card p-4"
        >
          <div className="w-[120px] shrink-0 font-head font-bold">{String(o.code)}</div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              {String(o.title)}{' '}
              {Boolean(o.is_donation) && (
                <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  Пожертвование
                </span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {String(o.customer_name || '—')} · {String(o.email || '—')} ·{' '}
              {String(o.phone || '—')}
            </p>
          </div>
          <div className="font-head font-bold">{String(o.total)} ₽</div>
          <span
            className={[
              'rounded-full px-3 py-1 text-xs font-semibold',
              o.status === 'paid'
                ? 'bg-primary text-primary-foreground'
                : 'bg-foreground/10 text-muted-foreground',
            ].join(' ')}
          >
            {o.status === 'paid'
              ? o.is_donation
                ? 'Получено'
                : 'Оплачен'
              : o.is_donation
                ? 'Ожидает пожертвования'
                : 'Ожидает оплаты'}
          </span>
        </div>
      ))}
    </TabsContent>
  </>
);

export default SiteSettingsTab;
