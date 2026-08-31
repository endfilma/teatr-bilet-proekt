import { SeatCategory, seatCategories } from '@/data/theatre';

export type Seat = {
  id: string;
  row: number;
  num: number;
  category: SeatCategory;
  sold: boolean;
};

type SectionDef = {
  category: SeatCategory;
  rows: number;
  perRow: number;
};

export type HallSize = 'big' | 'small';

/** Большой зал — 100 мест, малый — 50. */
export const HALL_LAYOUTS: Record<HallSize, SectionDef[]> = {
  big: [
    { category: 'parter', rows: 6, perRow: 10 },
    { category: 'amfi', rows: 4, perRow: 10 },
  ],
  small: [
    { category: 'parter', rows: 4, perRow: 8 },
    { category: 'amfi', rows: 2, perRow: 9 },
  ],
};

export const hallSizeOf = (scene: string): HallSize =>
  scene === 'Малая сцена' ? 'small' : 'big';

export const hallCapacity = (size: HallSize) =>
  HALL_LAYOUTS[size].reduce((sum, s) => sum + s.rows * s.perRow, 0);

export const buildHall = (size: HallSize, taken: string[] = []): Seat[] => {
  const takenSet = new Set(taken);
  const seats: Seat[] = [];
  let rowOffset = 0;
  HALL_LAYOUTS[size].forEach((section) => {
    for (let r = 1; r <= section.rows; r += 1) {
      for (let n = 1; n <= section.perRow; n += 1) {
        const id = `${section.category}-${rowOffset + r}-${n}`;
        seats.push({
          id,
          row: rowOffset + r,
          num: n,
          category: section.category,
          sold: takenSet.has(id),
        });
      }
    }
    rowOffset += section.rows;
  });
  return seats;
};

export const seatPrice = (base: number, category: SeatCategory) =>
  Math.round((base * seatCategories[category].multiplier) / 50) * 50;

type Props = {
  seats: Seat[];
  selected: string[];
  onToggle: (id: string) => void;
  size?: HallSize;
};

const HallMap = ({ seats, selected, onToggle, size = 'big' }: Props) => {
  let rowOffset = 0;
  const sections = HALL_LAYOUTS[size];

  return (
    <div className="rounded-2xl bg-secondary/60 p-4 sm:p-6">
      <div className="mx-auto mb-1 h-1.5 w-4/5 rounded-full bg-frame/60" />
      <p className="mb-5 text-center text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">
        Сцена
      </p>

      <div className="flex flex-col gap-5 overflow-x-auto">
        {sections.map((section) => {
          const start = rowOffset;
          rowOffset += section.rows;
          const sectionSeats = seats.filter((s) => s.category === section.category);

          return (
            <div key={section.category} className="min-w-max">
              <p className="mb-2 text-center text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {seatCategories[section.category].label}
              </p>
              <div className="flex flex-col items-center gap-1.5">
                {Array.from({ length: section.rows }, (_, i) => start + i + 1).map(
                  (rowNum) => (
                    <div key={rowNum} className="flex items-center gap-1.5">
                      <span className="w-4 text-right text-[0.62rem] text-muted-foreground">
                        {rowNum}
                      </span>
                      {sectionSeats
                        .filter((s) => s.row === rowNum)
                        .map((seat) => {
                          const picked = selected.includes(seat.id);
                          return (
                            <button
                              key={seat.id}
                              type="button"
                              disabled={seat.sold}
                              onClick={() => onToggle(seat.id)}
                              aria-label={`Ряд ${seat.row}, место ${seat.num}`}
                              title={`Ряд ${seat.row}, место ${seat.num}`}
                              className={[
                                'h-6 w-7 rounded-md text-[0.55rem] font-semibold transition-transform sm:h-7 sm:w-8',
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
                        })}
                    </div>
                  ),
                )}
              </div>
            </div>
          );
        })}
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