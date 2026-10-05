// Abstract technical visual: grid, structured lines, nodes, subtle data flow.
// The central node is a seed (nawa = core / seed / nucleus).
const nodes = [[80,70],[210,70],[80,170],[330,120],[210,230],[330,250],[470,70],[470,200],[560,140]];
const paths = [
  'M80 70 H210 V120 H330', 'M80 170 H150 V230 H210', 'M210 70 V120', 'M330 120 H400 V70 H470',
  'M330 120 V190 H470', 'M210 230 H330 V250', 'M470 200 H560 V140', 'M470 70 H560 V140',
];
export default function HeroVisual() {
  return (
    <svg className="hero-visual" viewBox="0 0 640 320" role="img" aria-label="Abstract diagram of connected nodes and data lines">
      <defs>
        <pattern id="g" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M32 0H0V32" fill="none" stroke="var(--line)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="640" height="320" fill="url(#g)" />
      {paths.map((d, i) => <path key={i} d={d} className="vl" />)}
      {paths.map((d, i) => <path key={'f' + i} d={d} className="vf" style={{ animationDelay: `${i * 0.9}s` }} />)}
      {nodes.map(([x, y], i) => <rect key={i} x={x - 4} y={y - 4} width="8" height="8" className="vn" />)}
      <g transform="translate(330 120)">
        <circle r="26" className="seed-ring" />
        <path className="seed" d="M0 -14 C12 -6 12 8 0 14 C-12 8 -12 -6 0 -14Z" />
        <path className="seed-vein" d="M0 -9 V10" />
      </g>
    </svg>
  );
}
