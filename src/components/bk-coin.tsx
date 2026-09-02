import { cn } from "@/lib/utils";

/**
 * BK COIN — the store currency mark.
 * A minted coin with the BK monogram, drawn as inline SVG so it scales
 * perfectly and costs nothing to load.
 */
export default function BkCoin({
  className,
  title = "BK COIN",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={cn("inline-flex shrink-0 align-middle", className)}
      title={title}
      aria-label={title}
    >
      <svg viewBox="0 0 32 32" className="size-full" aria-hidden="true">
        <defs>
          <linearGradient id="bkCoinFace" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="45%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="bkCoinRim" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#92400e" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
        </defs>

        <circle cx="16" cy="16" r="15" fill="url(#bkCoinRim)" />
        <circle cx="16" cy="16" r="12.5" fill="url(#bkCoinFace)" />
        <circle
          cx="16"
          cy="16"
          r="12.5"
          fill="none"
          stroke="rgba(255,255,255,.45)"
          strokeWidth="0.9"
        />
        {/* top gloss */}
        <path
          d="M6 12a11 11 0 0 1 20-2.4A12.5 12.5 0 0 0 6 12Z"
          fill="rgba(255,255,255,.35)"
        />
        {/* BK monogram */}
        <text
          x="16"
          y="20.6"
          textAnchor="middle"
          fontSize="11"
          fontWeight="900"
          fontFamily="Unbounded, Arial, sans-serif"
          fill="#7c2d12"
          letterSpacing="0.4"
        >
          BK
        </text>
      </svg>
    </span>
  );
}
