/**
 * Gentle outline shapes across a page's header band: thin lines at low
 * contrast spanning the whole width and cropped by its edges, so the weight
 * is spread rather than gathered on one side, with one small filled module
 * and a few points as the only solid marks. Under the text, on the left,
 * only the faintest lines and the smallest shapes. Each page has its own
 * arrangement in the same language:
 *
 *   home        a wide arc and two overlapping circles, the statement's ∧,
 *               over a hairline pinned near the band's foot
 *   experience  one timeline across the band, circles of growing size
 *               resting on it
 *   research    a wide arc over cones, small to large
 *   education   a square, the circle inscribed in it, and the square turned,
 *               spread along one line
 *   workshop    a drawing on the bench: a faint drafting grid, a part's
 *               outline with its centre marked and a compass arc, a
 *               dimension line with its ticks, and a small title block
 *
 * Decoration only: hidden from assistive technology, never data, still.
 * From md up only: on a phone the header's text fills the band, and the
 * shapes would run through it. The section that holds it sets
 * `relative isolate overflow-hidden`, so the shapes sit behind its content
 * and inside its edges.
 */

export type HeaderShapesVariant = "home" | "experience" | "research" | "education" | "workshop";

/** Three strengths: the faintest for long lines and anything under the text. */
const FAINT = "hsl(var(--ink) / 0.07)";
const INK = "hsl(var(--ink) / 0.1)";
const IRIS = "hsl(var(--iris) / 0.2)";

/** Every outline: a 1px line at any rendered size, no fill. */
const LINE = { fill: "none", strokeWidth: 1, vectorEffect: "non-scaling-stroke" } as const;

const Module = ({ x, y }: { x: number; y: number }) => (
  <rect x={x - 4} y={y - 4} width={8} height={8} rx={2} fill="hsl(var(--ink) / 0.25)" />
);

const Point = ({ x, y }: { x: number; y: number }) => (
  <circle cx={x} cy={y} r={3} fill="hsl(var(--iris) / 0.35)" />
);

/* The drawing is 1440 × 300, sliced to the band: at 1280 wide about y 35–265
   shows, so everything that matters sits between 40 and 260. */
/* The workshop's drafting grid: every 48 units, faintest of all. */
const GRID_X = Array.from({ length: 31 }, (_, i) => i * 48);
const GRID_Y = Array.from({ length: 7 }, (_, i) => 12 + i * 48);

const SHAPES: Record<HeaderShapesVariant, React.ReactNode> = {
  workshop: (
    <>
      <g opacity={0.6}>
        {GRID_X.map((x) => (
          <line key={`x${x}`} {...LINE} x1={x} y1={0} x2={x} y2={300} stroke={FAINT} />
        ))}
        {GRID_Y.map((y) => (
          <line key={`y${y}`} {...LINE} x1={0} y1={y} x2={1440} y2={y} stroke={FAINT} />
        ))}
      </g>
      {/* A part: its outline, its bore, the centre lines through it, and the
          arc a compass left while laying it out. */}
      <circle {...LINE} cx={1068} cy={132} r={72} stroke={INK} />
      <circle {...LINE} cx={1068} cy={132} r={26} stroke={IRIS} />
      <line
        {...LINE}
        x1={976}
        y1={132}
        x2={1160}
        y2={132}
        stroke={INK}
        strokeDasharray="14 4 2 4"
      />
      <line
        {...LINE}
        x1={1068}
        y1={44}
        x2={1068}
        y2={220}
        stroke={INK}
        strokeDasharray="14 4 2 4"
      />
      <path {...LINE} d="M1172 132 A104 104 0 0 0 1068 28" stroke={IRIS} />
      {/* Its dimension: extension lines, the line between them with its
          arrowheads, and the ticks of a scale under it. */}
      <line {...LINE} x1={996} y1={196} x2={996} y2={228} stroke={FAINT} />
      <line {...LINE} x1={1140} y1={196} x2={1140} y2={228} stroke={FAINT} />
      <line {...LINE} x1={996} y1={220} x2={1140} y2={220} stroke={INK} />
      <path {...LINE} d="M1004 216 L996 220 L1004 224 M1132 216 L1140 220 L1132 224" stroke={INK} />
      {Array.from({ length: 8 }, (_, i) => (
        <line
          key={i}
          {...LINE}
          x1={600 + i * 24}
          y1={224}
          x2={600 + i * 24}
          y2={i % 4 === 0 ? 212 : 218}
          stroke={FAINT}
        />
      ))}
      {/* The title block, bottom right, as on any drawing. */}
      <rect {...LINE} x={1236} y={164} width={168} height={60} rx={2} stroke={INK} />
      <line {...LINE} x1={1236} y1={194} x2={1404} y2={194} stroke={INK} />
      <line {...LINE} x1={1320} y1={194} x2={1320} y2={224} stroke={INK} />
      <Module x={1252} y={179} />
      <Point x={1290} y={72} />
      <Point x={860} y={108} />
    </>
  ),
  home: (
    <>
      <circle {...LINE} cx={720} cy={1180} r={980} stroke={FAINT} />
      <circle {...LINE} cx={180} cy={92} r={34} stroke={FAINT} />
      {/* The two overlapping circles crossed the proof; from xl up the
          circuit's wire is the band's motif instead (see Circuit). */}
      <g className="xl:hidden">
        <circle {...LINE} cx={1080} cy={170} r={130} stroke={IRIS} />
        <circle {...LINE} cx={1200} cy={150} r={130} stroke={INK} />
      </g>
      <Point x={1360} y={60} />
    </>
  ),
  experience: (
    <>
      <line {...LINE} x1={0} y1={240} x2={1440} y2={240} stroke={INK} />
      <circle {...LINE} cx={140} cy={226} r={14} stroke={FAINT} />
      <circle {...LINE} cx={420} cy={218} r={22} stroke={FAINT} />
      <circle {...LINE} cx={760} cy={200} r={40} stroke={INK} />
      <circle {...LINE} cx={1010} cy={176} r={64} stroke={IRIS} />
      <circle {...LINE} cx={1290} cy={146} r={94} stroke={INK} />
      <Module x={880} y={240} />
      <Point x={590} y={240} />
      <Point x={1160} y={240} />
    </>
  ),
  research: (
    <>
      <circle {...LINE} cx={760} cy={1040} r={880} stroke={FAINT} />
      <path {...LINE} d="M300 168 L262 244 L338 244 Z" stroke={FAINT} />
      <path {...LINE} d="M760 118 L700 244 L820 244 Z" stroke={INK} />
      <path {...LINE} d="M1180 46 L1060 260 L1300 260 Z" stroke={IRIS} />
      <line {...LINE} x1={0} y1={244} x2={900} y2={244} stroke={FAINT} />
      <Module x={1180} y={200} />
      <Point x={520} y={84} />
      <Point x={1380} y={140} />
    </>
  ),
  education: (
    <>
      <line {...LINE} x1={0} y1={232} x2={1440} y2={232} stroke={FAINT} />
      <rect {...LINE} x={210} y={172} width={60} height={60} rx={3} stroke={FAINT} />
      {/* Clear of the lead's end from 1280 up, where it crossed "kolejności". */}
      <circle {...LINE} cx={860} cy={210} r={50} stroke={INK} />
      <rect {...LINE} x={940} y={72} width={160} height={160} rx={3} stroke={INK} />
      <circle {...LINE} cx={1020} cy={152} r={80} stroke={IRIS} />
      <rect
        {...LINE}
        x={1180}
        y={92}
        width={140}
        height={140}
        rx={3}
        stroke={INK}
        transform="rotate(20 1250 162)"
      />
      <Module x={1250} y={162} />
      <Point x={460} y={232} />
      <Point x={1390} y={64} />
    </>
  ),
};

const HeaderShapes = ({ variant }: { variant: HeaderShapesVariant }) => (
  <>
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 300"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 -z-10 hidden h-full w-full md:block"
    >
      {SHAPES[variant]}
    </svg>
    {/* The home band's hairline is pinned to the band's foot rather than
        drawn in the sliced artwork: sliced, it moved with the width and at
        some widths ran through the statement's last line. The module that
        sat in the circles' overlap went too: behind the proof it read as a
        stray copy of the proof's closing mark. */}
    {variant === "home" && (
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-5 -z-10 hidden h-px md:block"
        style={{ background: FAINT }}
      >
        <span
          className="absolute left-[29%] top-1/2 size-1.5 -translate-y-1/2 rounded-full"
          style={{ background: "hsl(var(--iris) / 0.35)" }}
        />
      </span>
    )}
  </>
);

export default HeaderShapes;
