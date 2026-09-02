"use client";

import { useState } from "react";
import { BadgeCheck, Crown, Palette } from "lucide-react";
import CosmeticsStore from "./cosmetics-store";
import PlanPicker from "./plan-picker";
import { cn } from "@/lib/utils";

type Tab = "cosmetics" | "plans";

export default function AppearanceSection({
  avatar,
  name,
  verified,
}: {
  avatar: string;
  name: string;
  verified: boolean;
}) {
  const [tab, setTab] = useState<Tab>("cosmetics");

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-neutral-200/80 bg-white dark:border-white/[0.07] dark:bg-neutral-900/70">
      {/* tabs */}
      <div className="flex border-b border-neutral-100 dark:border-white/[0.06]">
        {(
          [
            { id: "cosmetics" as Tab, label: "الإطارات والتأثيرات", Icon: Palette },
            { id: "plans" as Tab, label: "خطط العضوية", Icon: Crown },
          ]
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-2 px-4 py-4 text-xs font-black transition sm:text-sm",
              tab === id
                ? "text-accent"
                : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            )}
          >
            <Icon className="size-4" />
            {label}
            {tab === id && (
              <span className="absolute inset-x-6 bottom-0 h-[3px] rounded-full bg-accent" />
            )}
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-6">
        {tab === "cosmetics" ? (
          <CosmeticsStore avatar={avatar} name={name} verified={verified} />
        ) : (
          <>
            <p className="mb-5 flex items-start gap-2 rounded-2xl bg-accent/[0.06] px-4 py-3 text-[11px] font-bold leading-6 text-neutral-600 dark:text-neutral-300">
              <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-accent" />
              اشترك للحصول على علامة توثيق، خصومات دائمة على كل مشترياتك،
              وتأثيرات حصرية لملفك الشخصي.
            </p>
            <PlanPicker />
          </>
        )}
      </div>
    </div>
  );
}
