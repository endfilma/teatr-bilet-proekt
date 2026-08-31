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

const SECTIONS: SectionDef[] = [
  { category: 'parter', rows: 5, perRow: 14 },
  { category: 'amfi', rows: 3, perRow: 16 },
  { category: 'balcony', rows: 2, perRow: 18 },
];

/** Детерминированный «занято/свободно», чтобы схема не прыгала при ре-рендере. */
const isSold = (seed: number, row: number, num: number) =>
  (seed * 7 + row * 13 + num * 29) % 11 < 3;

export const buildHall = (seed: number, taken: string[] = []): Seat[] => {
  const takenSet = new Set(taken);
  const seats: Seat[] = [];
  let rowOffset = 0;
  SECTIONS.forEach((section) => {
    for (let r = 1; r <= section.rows; r += 1) {
      for (let n = 1; n <= section.perRow; n += 1) {
        const id = `${section.category}-${r}-${n}`;
        seats.push({
          id,
          row: rowOffset + r,
          num: n,
          category: section.category,
          sold: takenSet.has(id) || isSold(seed, rowOffset + r, n),
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
};

const HallMap = ({ seats, selected, onToggle }: Props) => {
  let rowOffset = 0;

  return (
    <div className="rounded-2xl bg-secondary/60 p-4 sm:p-6">
      <div className="mx-auto mb-1 h-1.5 w-4/5 rounded-full bg-frame/60" />
      <p className="mb-5 text-center text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">
        Сцена
      </p>

      <div className="flex flex-col gap-5 overflow-x-auto">
        {SECTIONS.map((section) => {
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
                                'h-4 w-[18px] rounded transition-transform sm:h-[18px] sm:w-[22px]',
                                seat.sold
                                  ? 'cursor-not-allowed bg-seat-sold'
                                  : picked
                                    ? 'bg-primary'
                                    : 'bg-seat-free hover:scale-110 hover:bg-primary/60',
                              ].join(' ')}
                            />
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