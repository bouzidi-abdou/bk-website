import type { ReactNode } from "react";
import Reveal from "./reveal";
import { cn } from "@/lib/utils";

export default function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "center",
  dark = false,
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: string;
  align?: "center" | "start";
  dark?: boolean;
}) {
  return (
    <Reveal
      className={cn(
        "mb-12 flex flex-col gap-4 md:mb-16",
        align === "center" ? "items-center text-center" : "items-start"
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-black tracking-wide",
          dark
            ? "border-white/15 text-neutral-300"
            : "border-neutral-200 text-neutral-500 dark:border-white/10 dark:text-neutral-400"
        )}
      >
        <span className="size-1.5 rounded-full bg-accent animate-pulse-soft" />
        {eyebrow}
      </span>
      <h2
        className={cn(
          "max-w-3xl text-3xl font-black leading-[1.25] md:text-[2.75rem] md:leading-[1.2]",
          dark && "text-white"
        )}
      >
        {title}
      </h2>
      {sub && (
        <p
          className={cn(
            "max-w-xl text-sm leading-7 md:text-base md:leading-8",
            dark ? "text-neutral-400" : "text-neutral-500 dark:text-neutral-400"
          )}
        >
          {sub}
        </p>
      )}
    </Reveal>
  );
}
