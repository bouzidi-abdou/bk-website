import ProductIcon from "./product-icon";
import { cn } from "@/lib/utils";

export type RoleChip = {
  key: string;
  name: string;
  icon: string;
  color: string;
};

const COLORS: Record<string, string> = {
  amber: "bg-amber-400/12 text-amber-600 ring-amber-400/30 dark:text-amber-400",
  rose: "bg-rose-500/12 text-rose-600 ring-rose-500/30 dark:text-rose-400",
  blue: "bg-blue-500/12 text-blue-600 ring-blue-500/30 dark:text-blue-400",
  violet: "bg-violet-500/12 text-violet-600 ring-violet-500/30 dark:text-violet-400",
  emerald:
    "bg-emerald-500/12 text-emerald-600 ring-emerald-500/30 dark:text-emerald-400",
  slate: "bg-slate-500/12 text-slate-600 ring-slate-500/30 dark:text-slate-300",
};

export default function RoleBadge({
  role,
  size = "md",
}: {
  role: RoleChip;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full font-black ring-1 ring-inset",
        COLORS[role.color] ?? COLORS.violet,
        size === "sm"
          ? "px-2 py-0.5 text-[9px]"
          : "px-2.5 py-1 text-[10px]"
      )}
    >
      <ProductIcon
        name={role.icon}
        className={size === "sm" ? "size-2.5" : "size-3"}
      />
      {role.name}
    </span>
  );
}
