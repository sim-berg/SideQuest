/**
 * AnimatedDragon — a lightweight, dependency-free animated SVG dragon.
 *
 * The dragon idles (floating body, flapping wing, swaying tail, glowing eye)
 * and continuously breathes fire (flickering flame layers + flying sparks).
 * Body shades are derived from a single `--dg` colour via color-mix, so the
 * same markup re-skins for every dragon type. All motion lives in index.css
 * (`.dg-*` classes) and honours `prefers-reduced-motion`.
 */

interface AnimatedDragonProps {
  /** Base colour, e.g. DRAGON_META[type].color. Drives every body shade. */
  color: string;
  /** Rendered width in px (height keeps the 1.4 aspect ratio). */
  size?: number;
  /** Whether the dragon spits fire. Defaults to true. */
  breathing?: boolean;
  className?: string;
}

// Sparks shoot from the snout with slight vertical scatter + staggered timing.
const SPARKS = [
  { cx: 110, cy: 43, r: 1.6, sy: '-7px', delay: '0s' },
  { cx: 109, cy: 46, r: 1.2, sy: '4px', delay: '0.18s' },
  { cx: 111, cy: 45, r: 1.8, sy: '-2px', delay: '0.35s' },
  { cx: 110, cy: 44, r: 1.1, sy: '8px', delay: '0.55s' },
  { cx: 112, cy: 46, r: 1.4, sy: '1px', delay: '0.72s' },
];

export default function AnimatedDragon({
  color,
  size = 72,
  breathing = true,
  className,
}: AnimatedDragonProps) {
  return (
    <svg
      className={`dragon-svg${className ? ` ${className}` : ''}`}
      style={{ ['--dg' as string]: color }}
      width={size}
      height={size / 1.4}
      viewBox="0 0 140 100"
      role="img"
      aria-label="Animierter feuerspeiender Drache"
    >
      <g className="dg-float">
        {/* Wing (behind the body) */}
        <g className="dg-wing">
          <path
            className="dw"
            d="M56 50 C42 28 28 18 22 25 C29 28 28 39 35 43 C28 43 27 50 34 52 C29 55 32 61 41 58 C46 55 51 53 56 52 Z"
          />
          <path
            d="M56 50 C44 32 32 24 24 26 M37 44 C42 40 49 39 55 41 M37 53 C43 51 50 51 56 51"
            fill="none"
            stroke="color-mix(in srgb, var(--dg), #000 60%)"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.7"
          />
        </g>

        {/* Tail */}
        <g className="dg-tail">
          <path
            className="db"
            d="M30 60 C12 60 4 72 9 84 C11 88 16 87 15 81 C13 73 20 68 30 69 Z"
          />
          <path className="dk" d="M9 84 l-6 2 4 -7 z" />
        </g>

        {/* Legs */}
        <ellipse className="db" cx="40" cy="76" rx="7" ry="7" />
        <ellipse className="db" cx="60" cy="78" rx="6.5" ry="7" />

        {/* Body */}
        <ellipse className="db" cx="48" cy="60" rx="27" ry="18" />
        <ellipse className="dl" cx="50" cy="66" rx="17" ry="9" opacity="0.55" />

        {/* Back spikes */}
        <path
          className="dk"
          d="M30 47 l3 -8 4 8 z M40 43 l3 -9 4 9 z M51 42 l3 -8 4 8 z M62 45 l3 -7 3 7 z"
        />

        {/* Neck */}
        <path className="db" d="M58 50 C64 40 74 35 83 38 L88 52 C78 55 68 56 62 57 Z" />

        {/* Head */}
        <ellipse className="db" cx="89" cy="38" rx="13" ry="11" />

        {/* Horns */}
        <path className="dk" d="M84 28 C81 18 77 16 80 27 Z M92 27 C92 16 88 15 88 26 Z" />

        {/* Snout / jaws */}
        <path className="db" d="M97 33 C108 32 113 37 110 42 C105 44 99 44 96 42 Z" />
        <path className="dl" d="M97 44 C103 47 109 47 110 42 C111 48 105 51 98 49 Z" opacity="0.85" />

        {/* Nostril */}
        <circle cx="106" cy="37" r="1" fill="color-mix(in srgb, var(--dg), #000 55%)" />

        {/* Eye */}
        <circle className="de dg-eye" cx="90" cy="35" r="3.2" />
        <circle cx="91" cy="35" r="1.4" fill="#1a1226" />

        {/* Fire breath */}
        {breathing && (
          <g className="dg-breath">
            {/* soft glow */}
            <ellipse className="dg-glow" cx="120" cy="44" rx="20" ry="9" fill="#ff6a00" />
            {/* flame layers (outer → hot core) */}
            <path
              className="dg-flame"
              style={{ animationDelay: '0s' }}
              fill="#ff5a00"
              d="M105 44 C118 37 126 41 137 41 C128 46 134 50 123 51 C129 55 119 59 110 53 C115 50 108 48 105 47 Z"
            />
            <path
              className="dg-flame"
              style={{ animationDelay: '0.12s' }}
              fill="#ffa726"
              d="M106 44 C116 39 123 42 131 42 C124 46 129 49 120 50 C125 53 117 56 110 51 C114 49 109 48 106 46 Z"
            />
            <path
              className="dg-flame"
              style={{ animationDelay: '0.24s' }}
              fill="#ffe082"
              d="M107 44 C114 41 119 43 125 43 C120 46 123 48 116 49 C120 51 114 53 109 50 C112 48 109 47 107 46 Z"
            />
            <path
              className="dg-flame"
              style={{ animationDelay: '0.3s' }}
              fill="#fff7e0"
              d="M108 44 C112 42 115 43 118 44 C115 46 117 47 113 48 C115 49 111 50 109 48 Z"
            />
            {/* sparks */}
            {SPARKS.map((s, i) => (
              <circle
                key={i}
                className="dg-spark"
                cx={s.cx}
                cy={s.cy}
                r={s.r}
                fill="#ffce4d"
                style={{ ['--sy' as string]: s.sy, animationDelay: s.delay }}
              />
            ))}
          </g>
        )}
      </g>
    </svg>
  );
}
