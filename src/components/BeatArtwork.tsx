import type { ReactNode } from "react";
import type { BeatData } from "@/data/beats";
import { getCoverTheme, type CoverPattern as PatternName, type CoverTheme } from "@/lib/artwork";
import { cn } from "@/lib/utils";

type ArtworkBeat = Pick<BeatData, "id" | "title"> & {
  coverImage?: string;
  coverVariant?: number;
};

type BeatArtworkProps = {
  beat: ArtworkBeat;
  className?: string;
  playing?: boolean;
  compact?: boolean;
  priority?: boolean;
};

const LIGHT: Record<PatternName, { x: number; y: number }> = {
  arcs: { x: 28, y: 88 },
  bars: { x: 78, y: 24 },
  rings: { x: 82, y: 18 },
  split: { x: 12, y: 16 },
  type: { x: 18, y: 42 },
  grid: { x: 70, y: 72 },
  bands: { x: 50, y: 70 },
  orbits: { x: 64, y: 30 },
  wave: { x: 40, y: 82 },
  stack: { x: 22, y: 28 },
  field: { x: 86, y: 32 },
  slash: { x: 70, y: 18 },
  pulse: { x: 36, y: 20 },
  frame: { x: 18, y: 22 },
  dots: { x: 30, y: 26 },
  rise: { x: 18, y: 92 },
  crescent: { x: 38, y: 58 },
  cross: { x: 62, y: 18 },
  stroke: { x: 72, y: 28 },
  number: { x: 88, y: 48 },
  velvet: { x: 78, y: 16 },
  cocoa: { x: 76, y: 78 },
};

function CoverScene({
  uid,
  theme,
  light,
  children,
}: {
  uid: string;
  theme: CoverTheme;
  light: { x: number; y: number };
  children: ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 400 400"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <radialGradient id={`${uid}-glow`} cx={`${light.x}%`} cy={`${light.y}%`} r="78%">
          <stop offset="0%" stopColor={theme.accent} stopOpacity="0.3" />
          <stop offset="42%" stopColor={theme.bg2} stopOpacity="0.16" />
          <stop offset="100%" stopColor={theme.bg} stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}-haze`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <filter id={`${uid}-mist`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <filter id={`${uid}-soft`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <rect width="400" height="400" fill={`url(#${uid}-glow)`} />
      {children}
    </svg>
  );
}

function CoverGesture({ theme, uid }: { theme: CoverTheme; uid: string }) {
  const haze = `url(#${uid}-haze)`;
  const mist = `url(#${uid}-mist)`;
  const soft = `url(#${uid}-soft)`;

  switch (theme.pattern) {
    case "arcs":
      return (
        <ellipse
          cx="40"
          cy="430"
          rx="260"
          ry="170"
          fill="none"
          stroke={theme.accent}
          strokeWidth="54"
          opacity="0.42"
          filter={mist}
        />
      );
    case "bars":
      return (
        <g>
          <rect x="248" y="-30" width="92" height="460" fill={theme.ink} opacity="0.08" filter={mist} />
          <rect x="300" y="40" width="140" height="420" fill={theme.accent} opacity="0.2" filter={haze} />
        </g>
      );
    case "rings":
      return (
        <ellipse
          cx="340"
          cy="40"
          rx="210"
          ry="188"
          fill="none"
          stroke={theme.accent}
          strokeWidth="36"
          opacity="0.4"
          filter={mist}
        />
      );
    case "split":
      return (
        <g>
          <polygon points="-40,-20 280,-20 90,430 -40,430" fill={theme.bg2} opacity="0.55" />
          <polygon points="-20,80 210,10 140,360" fill={theme.accent} opacity="0.18" filter={mist} />
        </g>
      );
    case "type":
      return (
        <rect
          x="-40"
          y="168"
          width="360"
          height="78"
          fill={theme.ink}
          opacity="0.1"
          transform="rotate(-7 160 207)"
          filter={mist}
        />
      );
    case "grid":
      return (
        <g opacity="0.28">
          <rect x="228" y="236" width="86" height="86" fill={theme.ink} />
          <rect x="318" y="168" width="52" height="52" fill={theme.accent} opacity="0.7" />
          <rect x="196" y="318" width="118" height="38" fill={theme.muted} opacity="0.5" />
        </g>
      );
    case "bands":
      return (
        <rect x="-20" y="214" width="440" height="110" fill={theme.accent} opacity="0.22" filter={haze} />
      );
    case "orbits":
      return (
        <g>
          <ellipse
            cx="230"
            cy="170"
            rx="190"
            ry="78"
            fill="none"
            stroke={theme.muted}
            strokeWidth="2"
            opacity="0.45"
            transform="rotate(18 230 170)"
          />
          <circle cx="318" cy="148" r="7" fill={theme.accent} opacity="0.85" />
        </g>
      );
    case "wave":
      return (
        <path
          d="M-30 248 C 70 188, 130 318, 210 246 C 290 176, 340 300, 430 228 L 430 430 L -30 430 Z"
          fill={theme.accent}
          opacity="0.28"
          filter={soft}
        />
      );
    case "stack":
      return (
        <g>
          <rect x="-10" y="70" width="250" height="160" fill={theme.ink} opacity="0.08" filter={mist} />
          <rect x="90" y="168" width="280" height="150" fill={theme.accent} opacity="0.22" filter={mist} />
        </g>
      );
    case "field":
      return (
        <ellipse cx="360" cy="120" rx="150" ry="130" fill={theme.accent} opacity="0.34" filter={haze} />
      );
    case "slash":
      return (
        <polygon
          points="120,-40 460,-40 280,440 -60,440"
          fill={theme.accent}
          opacity="0.16"
          filter={mist}
        />
      );
    case "pulse":
      return (
        <g>
          <rect x="118" y="-40" width="36" height="480" fill={theme.accent} opacity="0.16" filter={haze} />
          <rect x="148" y="-20" width="10" height="440" fill={theme.ink} opacity="0.12" filter={soft} />
        </g>
      );
    case "frame":
      return (
        <g>
          <path
            d="M -16 56 H 248 V 360"
            fill="none"
            stroke={theme.ink}
            strokeWidth="1.5"
            opacity="0.5"
          />
          <rect x="188" y="214" width="270" height="230" fill={theme.accent} opacity="0.2" filter={mist} />
        </g>
      );
    case "dots":
      return (
        <g fill={theme.ink}>
          {[
            [74, 86, 7, 0.78],
            [128, 54, 3.2, 0.34],
            [176, 104, 5, 0.5],
            [98, 156, 3.4, 0.3],
            [228, 68, 8, 0.62],
            [272, 132, 4, 0.32],
            [184, 186, 3.2, 0.24],
            [56, 204, 4.4, 0.42],
            [140, 236, 2.8, 0.2],
            [308, 92, 4.2, 0.28],
          ].map(([cx, cy, r, opacity]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} opacity={opacity} />
          ))}
          <circle cx="206" cy="118" r="9" fill={theme.accent} opacity="0.85" />
        </g>
      );
    case "rise":
      return (
        <g>
          <ellipse cx="20" cy="430" rx="280" ry="210" fill={theme.accent} opacity="0.82" />
          <ellipse cx="310" cy="460" rx="150" ry="120" fill={theme.ink} opacity="0.12" filter={mist} />
        </g>
      );
    case "crescent":
      return (
        <g>
          <ellipse cx="168" cy="214" rx="156" ry="128" fill={theme.accent} opacity="0.72" filter={soft} />
          <ellipse cx="232" cy="188" rx="148" ry="118" fill={theme.bg} opacity="0.92" filter={soft} />
        </g>
      );
    case "cross":
      return (
        <g>
          <rect
            x="228"
            y="-50"
            width="88"
            height="500"
            fill={theme.accent}
            opacity="0.28"
            transform="rotate(11 272 200)"
            filter={mist}
          />
          <rect
            x="-40"
            y="64"
            width="500"
            height="78"
            fill={theme.ink}
            opacity="0.12"
            transform="rotate(-9 200 103)"
            filter={soft}
          />
        </g>
      );
    case "stroke":
      return (
        <path
          d="M -40 286 C 70 40, 150 340, 250 128 S 390 40, 460 168"
          fill="none"
          stroke={theme.accent}
          strokeWidth="58"
          strokeLinecap="round"
          opacity="0.38"
          filter={mist}
        />
      );
    case "number":
      return (
        <g>
          <rect x="236" y="-20" width="210" height="440" fill={theme.accent} opacity="0.28" filter={mist} />
          <rect x="198" y="90" width="36" height="280" fill={theme.ink} opacity="0.1" />
        </g>
      );
    case "velvet":
      return (
        <g>
          <ellipse cx="292" cy="78" rx="168" ry="142" fill={theme.accent} opacity="0.52" filter={haze} />
          <ellipse cx="118" cy="318" rx="128" ry="108" fill={theme.muted} opacity="0.28" filter={mist} />
        </g>
      );
    case "cocoa":
      return (
        <ellipse cx="318" cy="290" rx="190" ry="140" fill={theme.accent} opacity="0.36" filter={haze} />
      );
    default:
      return null;
  }
}

export default function BeatArtwork({ beat, className, playing, priority }: BeatArtworkProps) {
  const theme = getCoverTheme(beat);
  const uid = `kfi${beat.id}`;
  const light = LIGHT[theme.pattern];

  if (beat.coverImage) {
    return (
      <div className={cn("beat-art relative overflow-hidden", className)}>
        <img
          src={beat.coverImage}
          alt={`${beat.title} artwork`}
          className="h-full w-full object-cover"
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
        {playing ? <span className="beat-art-playing" style={{ background: theme.accent }} /> : null}
      </div>
    );
  }

  return (
    <div
      className={cn("beat-art relative overflow-hidden", className)}
      style={{
        backgroundImage: `radial-gradient(90% 70% at ${light.x}% ${light.y}%, ${theme.accent}40 0%, transparent 58%), linear-gradient(158deg, ${theme.bg} 0%, ${theme.bg2} 68%, ${theme.bg} 100%)`,
      }}
      role="img"
      aria-label={`${beat.title} artwork`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <CoverScene uid={uid} theme={theme} light={light}>
          <CoverGesture theme={theme} uid={uid} />
        </CoverScene>
      </div>
      {playing ? <span className="beat-art-playing" style={{ background: theme.accent }} /> : null}
    </div>
  );
}
