"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isSoundEnabled, setSoundEnabled, sfx } from "@/lib/sounds";

type SoundCtx = { on: boolean; toggle: () => void };
const Ctx = createContext<SoundCtx>({ on: true, toggle: () => {} });

export const useSound = () => useContext(Ctx);

export default function SoundProvider({ children }: { children: ReactNode }) {
  const [on, setOn] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = isSoundEnabled();
    setOn(stored);
    setSoundEnabled(stored);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const arm = () => {
      if (isSoundEnabled()) sfx.tick();
    };
    window.addEventListener("pointerdown", arm, { once: true, passive: true });
    return () => window.removeEventListener("pointerdown", arm);
  }, [ready]);

  const toggle = useCallback(() => {
    setOn((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      if (next) sfx.tick();
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ on, toggle }}>{children}</Ctx.Provider>;
}

export function SoundToggle() {
  const { on, toggle } = useSound();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <button
      onClick={toggle}
      aria-label={on ? "كتم الصوت" : "تشغيل الصوت"}
      title={on ? "كتم المؤثرات الصوتية" : "تشغيل المؤثرات الصوتية"}
      className="grid size-10 place-items-center rounded-full border border-neutral-200 bg-white/90 text-neutral-700 transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
    >
      {!mounted ? (
        <span className="size-[18px]" />
      ) : on ? (
        <Volume2 className="size-[18px] text-accent" />
      ) : (
        <VolumeX className="size-[18px]" />
      )}
    </button>
  );
}
