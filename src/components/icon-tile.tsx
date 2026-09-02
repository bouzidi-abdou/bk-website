import ProductIcon from "./product-icon";
import { TINTS, cn } from "@/lib/utils";

const SIZES = {
  sm: { box: "size-10 rounded-xl", icon: "size-5" },
  md: { box: "size-14 rounded-2xl", icon: "size-7" },
  lg: { box: "size-16 rounded-[1.35rem]", icon: "size-8" },
  xl: { box: "size-24 rounded-[1.9rem]", icon: "size-12" },
} as const;

/**
 * Premium 3D icon chip — layered gradient, top gloss, tinted under-glow.
 * Animates on closest .group hover.
 */
export default function IconTile({
  name,
  tint = "violet",
  size = "md",
  glow = false,
  className,
}: {
  name: string;
  tint?: string;
  size?: keyof typeof SIZES;
  glow?: boolean;
  className?: string;
}) {
  const t = TINTS[tint] ?? TINTS.violet;
  const s = SIZES[size];

  return (
    <span className={cn("relative inline-grid shrink-0", className)}>
      {glow && (
        <span
          aria-hidden
          className={cn(
            "absolute inset-1 -z-10 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-40 blur-md",
            t.solid
          )}
        />
      )}
      <span
        className={cn(
          "relative grid place-items-center overflow-hidden bg-gradient-to-br",
          "ring-1 ring-inset ring-black/[0.05] dark:ring-white/[0.09]",
          "shadow-[inset_0_1.5px_0_rgba(255,255,255,0.7),0_10px_22px_-10px_rgba(12,12,20,0.35)]",
          "dark:shadow-[inset_0_1.5px_0_rgba(255,255,255,0.14),0_12px_26px_-10px_rgba(0,0,0,0.7)]",
          "transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-6",
          s.box,
          t.tile
        )}
      >
        {/* top gloss */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-1.5 top-0 h-1/2 rounded-b-full bg-gradient-to-b from-white/50 via-white/10 to-transparent dark:from-white/15"
        />
        <ProductIcon
          name={name}
          className={cn("relative drop-shadow-sm", s.icon)}
        />
      </span>
    </span>
  );
}
