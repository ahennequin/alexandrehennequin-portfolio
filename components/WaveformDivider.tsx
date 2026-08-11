type WaveformDividerProps = {
  className?: string;
};

// Irregular, organic-looking signal trace — varying peak heights and spacing,
// starting and ending near the baseline so it reads as a slice of a real waveform.
const POINTS: [number, number][] = [
  [0, 6],
  [10, 6],
  [18, 3],
  [30, 9],
  [40, 2],
  [52, 12],
  [64, 5],
  [74, 9],
  [86, 1],
  [98, 10],
  [108, 4],
  [122, 7],
  [134, 2],
  [146, 9],
  [158, 5],
  [170, 11],
  [180, 3],
  [190, 8],
  [200, 6],
];

export default function WaveformDivider({ className = "" }: WaveformDividerProps) {
  return (
    <svg
      viewBox="0 0 200 13"
      preserveAspectRatio="none"
      className={`h-[13px] w-full max-w-[38rem] ${className}`}
      role="presentation"
      aria-hidden="true"
    >
      <polyline
        points={POINTS.map(([x, y]) => `${x},${y}`).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}