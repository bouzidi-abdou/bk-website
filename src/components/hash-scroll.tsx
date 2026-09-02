"use client";

import { useEffect } from "react";

/**
 * Keeps deep links (#orders, #tickets…) anchored while async sections finish
 * loading. Without this the browser scrolls once, then late-mounting content
 * pushes the layout and the user lands on the wrong section.
 */
export default function HashScroll() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;

    let cancelled = false;
    const id = decodeURIComponent(hash.slice(1));

    const jump = () => {
      if (cancelled) return;
      const el = document.getElementById(id);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top, behavior: "auto" });
    };

    // re-anchor a few times while the page settles
    jump();
    const timers = [120, 350, 700, 1200].map((d) => setTimeout(jump, d));

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  return null;
}
