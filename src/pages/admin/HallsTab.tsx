import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { ApiHall, ApiShow, HallBlock } from '@/lib/api';
import HallEditor from './HallEditor';

type Props = {
  halls: ApiHall[];
  shows: ApiShow[];
  editingHall: ApiHall | null | 'new';
  setEditingHall: (h: ApiHall | null | 'new') => void;
  loading: boolean;
  run: (payload: Record<string, unknown>, ok: string) => Promise<void>;
  saveHall: (payload: {
    id: number | null;
    name: string;
    isActive: boolean;
    sortOrder: number;
    blocks: HallBlock[];
  }) => void;
};

const HallsTab = ({ halls, shows, editingHall, setEditingHall, loading, run, saveHall }: Props) => (
  <TabsContent value="halls" className="mt-0 max-w-2xl space-y-3">
    <p className="text-sm text-muted-foreground">
      Выключенный зал нельзя выбрать для нового спектакля. Схему зала — ряды,
      места, проходы и расположение блоков — можно настроить под каждый зал
      отдельно.
    </p>

    {editingHall === null && (
      <>
        {halls.map((h) => (
          <div
            key={h.id}
            className="flex flex-wrap items-center gap-3 rounded-2xl bg-card p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="font-head text-lg font-bold tracking-tightest">
                {h.name}{' '}
                {!h.isActive && (
                  <span className="text-sm font-normal text-muted-foreground">
                    (выключен)
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {h.totalSeats} мест · {h.layout.blocks.length} блоков
              </p>
            </div>
            <button
              onClick={() => setEditingHall(h)}
              className="rounded-full bg-foreground/10 px-4 py-2 text-sm font-semibold"
            >
              Изменить
            </button>
            <button
              onClick={() =>
                run(
                  { action: 'toggle_hall', id: h.id, isActive: !h.isActive },
                  h.isActive ? 'Зал выключен' : 'Зал включён',
                )
              }
              className={[
                'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold',
                h.isActive
                  ? 'bg-foreground/10 text-muted-foreground'
                  : 'bg-primary text-primary-foreground',
              ].join(' ')}
            >
              <Icon name={h.isActive ? 'EyeOff' : 'Eye'} size={16} />
              {h.isActive ? 'Выключить' : 'Включить'}
            </button>
            <button
              onClick={() => {
                const used = shows.filter((s) => s.hallId === h.id).length;
                const warn = used
                  ? ` У ${used} спектакля(ей) сейчас выбран этот зал — у них зал сбросится.`
                  : '';
                if (window.confirm(`Удалить зал «${h.name}» безвозвратно?${warn}`))
                  run({ action: 'delete_hall', id: h.id }, 'Зал удалён');
              }}
              className="rounded-full bg-destructive/10 px-3 py-2 text-destructive"
              aria-label="Удалить"
            >
              <Icon name="Trash2" size={16} />
            </button>
          </div>
        ))}
        <Button variant="ghost" className="rounded-full" onClick={() => setEditingHall('new')}>
          <Icon name="Plus" size={16} /> Добавить зал
        </Button>
      </>
    )}

    {editingHall !== null && (
      <HallEditor
        hall={editingHall === 'new' ? null : editingHall}
        loading={loading}
        onSave={saveHall}
        onCancel={() => setEditingHall(null)}
      />
    )}
  </TabsContent>
);

export default HallsTab;
