import { HallBlock, HallLayout } from '@/lib/api';

export type Seat = {
  id: string;
  blockId: string;
  blockLabel: string;
  row: number;
  num: number;
  priceMultiplier: number;
  sold: boolean;
};

export const seatId = (blockId: string, row: number, num: number) =>
  `${blockId}-${row}-${num}`;

export const hallLayoutCapacity = (layout: HallLayout) =>
  layout.blocks.reduce((sum, b) => sum + b.rows * b.seatsPerRow, 0);

export const buildSeats = (layout: HallLayout, taken: string[] = []): Seat[] => {
  const takenSet = new Set(taken);
  const seats: Seat[] = [];
  layout.blocks.forEach((block) => {
    for (let r = 1; r <= block.rows; r += 1) {
      for (let n = 1; n <= block.seatsPerRow; n += 1) {
        const id = seatId(block.id, r, n);
        seats.push({
          id,
          blockId: block.id,
          blockLabel: block.label,
          row: r,
          num: n,
          priceMultiplier: block.priceMultiplier,
          sold: takenSet.has(id),
        });
      }
    }
  });
  return seats;
};

export const seatPrice = (base: number, multiplier: number) =>
  Math.round((base * multiplier) / 50) * 50;

const seatButton = (
  seat: Seat,
  picked: boolean,
  onToggle: (id: string) => void,
) => (
  <button
    key={seat.id}
    type="button"
    disabled={seat.sold}
    onClick={() => onToggle(seat.id)}
    aria-label={`${seat.blockLabel}, ряд ${seat.row}, место ${seat.num}`}
    title={`${seat.blockLabel}, ряд ${seat.row}, место ${seat.num}`}
    className={[
      'h-6 w-7 shrink-0 rounded-md text-[0.55rem] font-semibold transition-transform sm:h-7 sm:w-8',
      seat.sold
        ? 'cursor-not-allowed bg-seat-sold text-transparent'
        : picked
          ? 'bg-primary text-primary-foreground'
          : 'bg-seat-free text-background/70 hover:scale-110 hover:bg-primary/60',
    ].join(' ')}
  >
    {seat.num}
  </button>
);

const BlockView = ({
  block,
  seats,
  selected,
  onToggle,
}: {
  block: HallBlock;
  seats: Seat[];
  selected: string[];
  onToggle: (id: string) => void;
}) => {
  const rowGap = new Set(block.rowGapAfter);
  const aisle = new Set(block.aisleAfter);

  return (
    <div className="flex min-w-max flex-col items-center gap-1.5">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {block.label}
      </p>
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: block.rows }, (_, i) => i + 1).map((rowNum) => (
          <div key={rowNum} className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <span className="w-4 text-right text-[0.6rem] text-muted-foreground">
                {rowNum}
              </span>
              {Array.from({ length: block.seatsPerRow }, (_, i) => i + 1).map(
                (num) => {
                  const seat = seats.find(
                    (s) => s.blockId === block.id && s.row === rowNum && s.num === num,
                  );
                  if (!seat) return null;
                  return (
                    <span key={seat.id} className="flex items-center gap-1.5">
                      {seatButton(seat, selected.includes(seat.id), onToggle)}
                      {aisle.has(num) && <span className="w-3" />}
                    </span>
                  );
                },
              )}
            </div>
            {rowGap.has(rowNum) && <div className="h-2.5" />}
          </div>
        ))}
      </div>
    </div>
  );
};

type Props = {
  layout: HallLayout;
  seats: Seat[];
  selected: string[];
  onToggle: (id: string) => void;
};

const HallMap = ({ layout, seats, selected, onToggle }: Props) => {
  const left = layout.blocks.filter((b) => b.position === 'left');
  const right = layout.blocks.filter((b) => b.position === 'right');
  const front = layout.blocks.filter((b) => b.position === 'front');

  return (
    <div className="rounded-2xl bg-secondary/60 p-4 sm:p-6">
      <div className="mx-auto mb-1 h-1.5 w-4/5 rounded-full bg-frame/60" />
      <p className="mb-5 text-center text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">
        Сцена
      </p>

      <div className="flex flex-col items-center gap-6 overflow-x-auto">
        {(left.length > 0 || right.length > 0) && (
          <div className="flex items-start justify-center gap-8">
            {left.map((b) => (
              <BlockView
                key={b.id}
                block={b}
                seats={seats}
                selected={selected}
                onToggle={onToggle}
              />
            ))}
            {right.map((b) => (
              <BlockView
                key={b.id}
                block={b}
                seats={seats}
                selected={selected}
                onToggle={onToggle}
              />
            ))}
          </div>
        )}
        {front.map((b) => (
          <BlockView
            key={b.id}
            block={b}
            seats={seats}
            selected={selected}
            onToggle={onToggle}
          />
        ))}
        {layout.blocks.length === 0 && (
          <p className="py-6 text-sm text-muted-foreground">
            Схема зала ещё не настроена
          </p>
        )}
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-4 text-[0.72rem] text-muted-foreground">
        <span className="flex items-center gap-2">
          <i className="h-3 w-4 rounded bg-seat-free" /> свободно
        </span>
        <span className="flex items-center gap-2">
          <i className="h-3 w-4 rounded bg-primary" /> выбрано
        </span>
        <span className="flex items-center gap-2">
          <i className="h-3 w-4 rounded bg-seat-sold" /> продано
        </span>
      </div>
    </div>
  );
};

export default HallMap;
