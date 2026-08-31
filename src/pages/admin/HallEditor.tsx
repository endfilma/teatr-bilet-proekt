import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import HallMap, { buildSeats } from '@/components/theatre/HallMap';
import { ApiHall, HallBlock, HallBlockPosition } from '@/lib/api';

const positionLabels: Record<HallBlockPosition, string> = {
  left: 'Слева от прохода',
  right: 'Справа от прохода',
  front: 'Перед сценой (по центру)',
};

const emptyBlock = (id: string): HallBlock => ({
  id,
  label: 'Новый блок',
  position: 'front',
  priceMultiplier: 1,
  rows: 3,
  seatsPerRow: 6,
  aisleAfter: [],
  rowGapAfter: [],
});

const parseNumList = (v: string): number[] =>
  v
    .split(',')
    .map((x) => parseInt(x.trim(), 10))
    .filter((x) => !Number.isNaN(x) && x > 0);

type Props = {
  hall: ApiHall | null;
  onSave: (payload: {
    id: number | null;
    name: string;
    isActive: boolean;
    sortOrder: number;
    blocks: HallBlock[];
  }) => void;
  onCancel: () => void;
  loading: boolean;
};

const HallEditor = ({ hall, onSave, onCancel, loading }: Props) => {
  const [name, setName] = useState(hall?.name ?? 'Новый зал');
  const [isActive, setIsActive] = useState(hall?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(hall?.sortOrder ?? 100);
  const [blocks, setBlocks] = useState<HallBlock[]>(hall?.layout.blocks ?? []);

  const capacity = blocks.reduce((sum, b) => sum + b.rows * b.seatsPerRow, 0);
  const previewSeats = buildSeats({ blocks });

  const updateBlock = (id: string, patch: Partial<HallBlock>) =>
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const addBlock = () =>
    setBlocks((prev) => [...prev, emptyBlock(`block-${Date.now()}`)]);

  const removeBlock = (id: string) =>
    setBlocks((prev) => prev.filter((b) => b.id !== id));

  return (
    <div className="space-y-4 rounded-2xl bg-card p-5">
      <p className="font-head text-lg font-bold tracking-tightest">
        {hall ? 'Редактирование зала' : 'Новый зал'}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Название зала</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Порядок в списке</Label>
          <Input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsActive((v) => !v)}
        className={[
          'flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'bg-foreground/10 text-muted-foreground',
        ].join(' ')}
      >
        <Icon name={isActive ? 'Eye' : 'EyeOff'} size={16} />
        {isActive ? 'Зал используется' : 'Зал скрыт'}
      </button>

      <div className="rounded-2xl bg-secondary/40 p-4">
        <p className="mb-3 text-sm text-muted-foreground">
          Предпросмотр · вместимость {capacity} мест
        </p>
        <HallMap
          layout={{ blocks }}
          seats={previewSeats}
          selected={[]}
          onToggle={() => undefined}
        />
      </div>

      <div className="space-y-3">
        {blocks.map((b) => (
          <div key={b.id} className="space-y-3 rounded-2xl bg-secondary/40 p-4">
            <div className="flex items-center justify-between gap-2">
              <Input
                value={b.label}
                onChange={(e) => updateBlock(b.id, { label: e.target.value })}
                className="max-w-[220px] font-semibold"
              />
              <button
                onClick={() => removeBlock(b.id)}
                aria-label="Удалить блок"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive"
              >
                <Icon name="Trash2" size={16} />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Расположение</Label>
                <select
                  value={b.position}
                  onChange={(e) =>
                    updateBlock(b.id, {
                      position: e.target.value as HallBlockPosition,
                    })
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {(Object.keys(positionLabels) as HallBlockPosition[]).map((p) => (
                    <option key={p} value={p}>
                      {positionLabels[p]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Множитель цены (1 = базовая цена)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={b.priceMultiplier}
                  onChange={(e) =>
                    updateBlock(b.id, { priceMultiplier: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Количество рядов</Label>
                <Input
                  type="number"
                  value={b.rows}
                  onChange={(e) =>
                    updateBlock(b.id, { rows: Math.max(0, Number(e.target.value)) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Мест в ряду</Label>
                <Input
                  type="number"
                  value={b.seatsPerRow}
                  onChange={(e) =>
                    updateBlock(b.id, {
                      seatsPerRow: Math.max(0, Number(e.target.value)),
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Проход после мест № (через запятую)</Label>
                <Input
                  placeholder="например: 5"
                  defaultValue={b.aisleAfter.join(', ')}
                  onBlur={(e) =>
                    updateBlock(b.id, { aisleAfter: parseNumList(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Пустое место после рядов № (через запятую)</Label>
                <Input
                  placeholder="например: 3"
                  defaultValue={b.rowGapAfter.join(', ')}
                  onBlur={(e) =>
                    updateBlock(b.id, { rowGapAfter: parseNumList(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>
        ))}

        <Button variant="ghost" className="rounded-full" onClick={addBlock}>
          <Icon name="Plus" size={16} /> Добавить блок мест
        </Button>
      </div>

      <div className="flex gap-2 border-t border-border pt-4">
        <Button
          disabled={loading || !name}
          onClick={() =>
            onSave({ id: hall?.id ?? null, name, isActive, sortOrder, blocks })
          }
          className="rounded-full font-bold"
        >
          Сохранить зал
        </Button>
        <Button variant="ghost" className="rounded-full" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </div>
  );
};

export default HallEditor;
