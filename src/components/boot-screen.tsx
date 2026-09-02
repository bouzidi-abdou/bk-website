"use client";

import { useEffect, useState } from "react";
import { SITE_LOGO_URL } from "@/lib/utils";

const MIN_MS = 2600; // guaranteed minimum so the reveal feels intentional
const MAX_MS = 5000; // hard cap — never block the user longer than this

/**
 * First-visit boot screen.
 * Shows the brand with a spinner while fonts, styles and data settle, then
 * fades away. Runs once per browser session.
 */
export default function BootScreen() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("bk_booted") === "1") return;

    setShow(true);
    document.documentElement.style.overflow = "hidden";
    const started = Date.now();

    const finish = () => {
      const elapsed = Date.now() - started;
      const wait = Math.max(0, MIN_MS - elapsed);
      setTimeout(() => {
        setLeaving(true);
        setTimeout(() => {
          sessionStorage.setItem("bk_booted", "1");
          document.documentElement.style.overflow = "";
          setShow(false);
        }, 550);
      }, wait);
    };

    // wait for the page load event (assets/fonts) or the hard cap
    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });

    const cap = setTimeout(finish, MAX_MS);

    return () => {
      clearTimeout(cap);
      window.removeEventListener("load", finish);
      document.documentElement.style.overflow = "";
    };
  }, []);

  if (!show) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[10000] grid place-items-center bg-neutral-50 transition-opacity duration-500 dark:bg-neutral-950 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_55%_45%_at_50%_50%,black,transparent)]" />
      <div className="pointer-events-none absolute start-1/2 top-1/2 size-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[90px]" />

      <div className="relative flex flex-col items-center">
        <div className="relative grid size-24 place-items-center">
          {/* spinning ring */}
          <span className="absolute inset-0 rounded-full border-2 border-neutral-200 dark:border-white/10" />
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent" />
          {/* brand mark */}
          <span className="grid size-14 place-items-center overflow-hidden rounded-2xl bg-neutral-900 shadow-lg dark:bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={SITE_LOGO_URL}
              alt=""
              className="size-full object-cover"
            />
          </span>
        </div>

        <p className="shine-text mt-7 font-display text-lg font-bold uppercase tracking-[0.28em]">
          BK MARKET
        </p>
        <p className="mt-2 text-[10px] font-black text-neutral-400">
          جاري تجهيز المتجر…
        </p>

        {/* progress line */}
        <span className="mt-6 block h-0.5 w-40 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10">
          <span className="boot-bar block h-full w-1/3 rounded-full bg-accent" />
        </span>
      </div>
    </div>
  );
}
