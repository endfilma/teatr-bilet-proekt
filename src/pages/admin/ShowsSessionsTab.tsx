import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { ApiShow, ApiSession, ApiHall } from '@/lib/api';

export const buyLabelOptions = ['Купить', 'Пожертвовать'] as const;

export const emptyShow = {
  id: 0,
  slug: '',
  title: '',
  scene: 'Большая сцена',
  genre: 'Драма',
  meta: '',
  annotation: '',
  director: '',
  priceFrom: 800,
  isActive: true,
  sortOrder: 100,
  hallId: 0 as number | null,
  buyLabel: 'Купить',
};

export const emptySession = {
  id: 0,
  showId: 0,
  startsAt: '',
  hallCaption: 'Партер и задние ряды',
  priceFrom: '',
};

export type ShowForm = typeof emptyShow;
export type SessionForm = typeof emptySession;

type Props = {
  shows: ApiShow[];
  sessions: ApiSession[];
  halls: ApiHall[];
  showForm: ShowForm;
  setShowForm: (f: ShowForm) => void;
  sessionForm: SessionForm;
  setSessionForm: (f: SessionForm) => void;
  loading: boolean;
  run: (payload: Record<string, unknown>, ok: string) => Promise<void>;
};

const ShowsSessionsTab = ({
  shows,
  sessions,
  halls,
  showForm,
  setShowForm,
  sessionForm,
  setSessionForm,
  loading,
  run,
}: Props) => (
  <>
    <TabsContent value="shows" className="mt-0 grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        {shows.map((s) => (
          <div
            key={s.id}
            className="flex flex-wrap items-center gap-3 rounded-2xl bg-card p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="font-head text-lg font-bold tracking-tightest">
                {s.title}{' '}
                {!s.isActive && (
                  <span className="text-sm font-normal text-muted-foreground">
                    (скрыт)
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {s.scene} · {s.genre} · от {s.priceFrom} ₽ · кнопка «{s.buyLabel}»
              </p>
            </div>
            <button
              onClick={() => setShowForm({ ...s })}
              className="rounded-full bg-foreground/10 px-4 py-2 text-sm font-semibold"
            >
              Изменить
            </button>
            <button
              onClick={() => run({ action: 'archive_show', id: s.id }, 'Спектакль скрыт')}
              className="rounded-full bg-foreground/10 px-3 py-2 text-muted-foreground"
              aria-label="Скрыть"
            >
              <Icon name="EyeOff" size={16} />
            </button>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `Удалить спектакль «${s.title}» безвозвратно? Все его сеансы и заказы тоже удалятся.`,
                  )
                )
                  run({ action: 'delete_show', id: s.id }, 'Спектакль удалён');
              }}
              className="rounded-full bg-destructive/10 px-3 py-2 text-destructive"
              aria-label="Удалить"
            >
              <Icon name="Trash2" size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-2xl bg-card p-5">
        <p className="font-head text-lg font-bold tracking-tightest">
          {showForm.id ? 'Редактирование' : 'Новый спектакль'}
        </p>
        <div className="space-y-1.5">
          <Label>Название</Label>
          <Input
            value={showForm.title}
            onChange={(e) => setShowForm({ ...showForm, title: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Зал (своя схема мест для этого спектакля)</Label>
          <select
            value={showForm.hallId ?? ''}
            onChange={(e) =>
              setShowForm({ ...showForm, hallId: Number(e.target.value) })
            }
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {halls.map((h) => (
              <option key={h.id} value={h.id} disabled={!h.isActive}>
                {h.name} — {h.totalSeats} мест{!h.isActive ? ' (выключен)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Надпись на кнопке</Label>
          <select
            value={showForm.buyLabel}
            onChange={(e) => setShowForm({ ...showForm, buyLabel: e.target.value })}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {buyLabelOptions.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        {[
          ['genre', 'Жанр (Драма, Комедия, Классика, Детям)'],
          ['meta', 'Подпись (длительность, возраст)'],
          ['director', 'Режиссёр'],
        ].map(([key, label]) => (
          <div key={key} className="space-y-1.5">
            <Label>{label}</Label>
            <Input
              value={(showForm as never)[key] ?? ''}
              onChange={(e) => setShowForm({ ...showForm, [key]: e.target.value })}
            />
          </div>
        ))}
        <div className="space-y-1.5">
          <Label>Описание</Label>
          <Textarea
            rows={4}
            value={showForm.annotation}
            onChange={(e) => setShowForm({ ...showForm, annotation: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Цена от, ₽</Label>
            <Input
              type="number"
              value={showForm.priceFrom}
              onChange={(e) =>
                setShowForm({ ...showForm, priceFrom: Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Порядок</Label>
            <Input
              type="number"
              value={showForm.sortOrder}
              onChange={(e) =>
                setShowForm({ ...showForm, sortOrder: Number(e.target.value) })
              }
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            disabled={loading || !showForm.title}
            onClick={() =>
              run({ action: 'save_show', ...showForm, id: showForm.id || null }, 'Сохранено').then(
                () => setShowForm({ ...emptyShow }),
              )
            }
            className="rounded-full font-bold"
          >
            Сохранить
          </Button>
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={() => setShowForm({ ...emptyShow })}
          >
            Очистить
          </Button>
        </div>
      </div>
    </TabsContent>

    <TabsContent value="sessions" className="mt-0 grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="flex flex-wrap items-center gap-3 rounded-2xl bg-card p-4"
          >
            <div className="w-[130px] shrink-0">
              <p className="font-head font-bold">{s.date}</p>
              <p className="text-sm text-muted-foreground">{s.time}</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-head text-lg font-bold tracking-tightest">
                {s.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {s.hallCaption} · от {s.priceFrom} ₽ · свободно {s.free}
              </p>
            </div>
            <button
              onClick={() =>
                setSessionForm({
                  id: Number(s.id),
                  showId: s.showId,
                  startsAt: s.startsAt.slice(0, 16),
                  hallCaption: s.hallCaption,
                  priceFrom: String(s.priceFrom),
                })
              }
              className="rounded-full bg-foreground/10 px-4 py-2 text-sm font-semibold"
            >
              Изменить
            </button>
            <button
              onClick={() => run({ action: 'archive_session', id: Number(s.id) }, 'Сеанс снят')}
              className="rounded-full bg-foreground/10 px-3 py-2 text-muted-foreground"
              aria-label="Снять с показа"
            >
              <Icon name="EyeOff" size={16} />
            </button>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `Удалить сеанс «${s.title}» (${s.date}, ${s.time}) безвозвратно? Связанные заказы тоже удалятся.`,
                  )
                )
                  run({ action: 'delete_session', id: Number(s.id) }, 'Сеанс удалён');
              }}
              className="rounded-full bg-destructive/10 px-3 py-2 text-destructive"
              aria-label="Удалить"
            >
              <Icon name="Trash2" size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-2xl bg-card p-5">
        <p className="font-head text-lg font-bold tracking-tightest">
          {sessionForm.id ? 'Редактирование сеанса' : 'Новый сеанс'}
        </p>
        <div className="space-y-1.5">
          <Label>Спектакль</Label>
          <select
            value={sessionForm.showId}
            onChange={(e) =>
              setSessionForm({ ...sessionForm, showId: Number(e.target.value) })
            }
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {shows.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Дата и время</Label>
          <Input
            type="datetime-local"
            value={sessionForm.startsAt}
            onChange={(e) => setSessionForm({ ...sessionForm, startsAt: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Зона зала</Label>
          <Input
            value={sessionForm.hallCaption}
            onChange={(e) =>
              setSessionForm({ ...sessionForm, hallCaption: e.target.value })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label>Цена от, ₽ (пусто — как у спектакля)</Label>
          <Input
            type="number"
            value={sessionForm.priceFrom}
            onChange={(e) => setSessionForm({ ...sessionForm, priceFrom: e.target.value })}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            disabled={loading || !sessionForm.startsAt || !sessionForm.showId}
            onClick={() =>
              run(
                {
                  action: 'save_session',
                  id: sessionForm.id || null,
                  showId: sessionForm.showId,
                  startsAt: sessionForm.startsAt,
                  hallCaption: sessionForm.hallCaption,
                  priceFrom: sessionForm.priceFrom || null,
                },
                'Сеанс сохранён',
              ).then(() => setSessionForm({ ...emptySession, showId: shows[0]?.id ?? 0 }))
            }
            className="rounded-full font-bold"
          >
            Сохранить
          </Button>
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={() => setSessionForm({ ...emptySession, showId: shows[0]?.id ?? 0 })}
          >
            Очистить
          </Button>
        </div>
      </div>
    </TabsContent>
  </>
);

export default ShowsSessionsTab;
