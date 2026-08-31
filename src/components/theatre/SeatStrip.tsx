type SeatState = 'free' | 'sold' | 'pick';

const PATTERNS: SeatState[][][] = [
  [
    ['sold', 'sold', 'free', 'free', 'pick', 'pick', 'free', 'sold', 'sold', 'free', 'free', 'free'],
    ['free', 'sold', 'sold', 'free', 'free', 'free', 'free', 'free', 'sold', 'free', 'sold', 'free'],
    ['free', 'free', 'free', 'sold', 'free', 'free', 'sold', 'free', 'free', 'free', 'free', 'sold'],
    ['sold', 'free', 'free', 'free', 'free', 'sold', 'free', 'free', 'free', 'sold', 'free', 'free'],
  ],
  [
    ['free', 'sold', 'sold', 'sold', 'free', 'free', 'sold', 'free', 'sold', 'free', 'sold', 'free'],
    ['sold', 'free', 'pick', 'pick', 'pick', 'free', 'free', 'sold', 'free', 'free', 'sold', 'sold'],
    ['free', 'sold', 'free', 'free', 'sold', 'sold', 'free', 'free', 'sold', 'free', 'free', 'free'],
    ['free', 'free', 'sold', 'free', 'free', 'free', 'sold', 'sold', 'free', 'sold', 'free', 'free'],
  ],
  [
    ['sold', 'sold', 'sold', 'free', 'free', 'free', 'free', 'sold', 'free', 'free', 'sold', 'free'],
    ['free', 'free', 'sold', 'sold', 'free', 'free', 'sold', 'free', 'free', 'sold', 'free', 'free'],
    ['pick', 'pick', 'free', 'free', 'sold', 'free', 'free', 'free', 'sold', 'free', 'free', 'sold'],
    ['free', 'sold', 'free', 'free', 'free', 'sold', 'free', 'sold', 'free', 'free', 'free', 'free'],
  ],
];

const seatClass: Record<SeatState, string> = {
  free: 'bg-seat-free',
  sold: 'bg-seat-sold',
  pick: 'bg-primary',
};

const SeatStrip = ({ variant }: { variant: number }) => {
  const rows = PATTERNS[variant % PATTERNS.length];

  return (
    <div className="my-auto flex flex-col gap-2.5">
      {rows.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-2">
          {row.map((seat, si) => (
            <i
              key={si}
              className={`block h-4 w-[22px] rounded ${seatClass[seat]}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default SeatStrip;
