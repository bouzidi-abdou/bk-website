import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function Marquee({
  items,
  reverse = false,
  fast = false,
  className,
  itemClassName,
  separator,
}: {
  items: ReactNode[];
  reverse?: boolean;
  fast?: boolean;
  className?: string;
  itemClassName?: string;
  separator?: ReactNode;
}) {
  const sep = separator ?? <span className="size-1 shrink-0 rounded-full bg-current opacity-30" />;
  const row = (key: string) => (
    <div key={key} className="flex w-max items-center">
      {items.map((item, i) => (
        <span key={i} className={cn("flex items-center gap-6 pe-6", itemClassName)}>
          <span className="whitespace-nowrap">{item}</span>
          {sep}
        </span>
      ))}
    </div>
  );

  return (
    <div dir="ltr" className={cn("group relative overflow-hidden mask-fade-x", className)}>
      <div
        className={cn(
          "flex w-max group-hover:[animation-play-state:paused]",
          reverse ? "animate-marquee-reverse" : fast ? "animate-marquee-fast" : "animate-marquee"
        )}
      >
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
