"use client";

import { useEffect } from "react";

/**
 * Client-side deterrence layer.
 * Blocks casual source-viewing / copying shortcuts and the context menu.
 * NOTE: this is deterrence only — real security lives on the server
 * (auth, rate limits, CSP, validation). Inputs stay fully usable.
 */
export default function ContentGuard() {
  useEffect(() => {
    const isEditable = (el: EventTarget | null) => {
      const n = el as HTMLElement | null;
      if (!n) return false;
      const tag = n.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        n.isContentEditable === true
      );
    };

    const onContextMenu = (e: MouseEvent) => {
      if (isEditable(e.target)) return; // keep paste menu in fields
      e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const editable = isEditable(e.target);

      // F12 — devtools
      if (e.key === "F12") {
        e.preventDefault();
        return;
      }

      // Ctrl/Cmd + Shift + I / J / C / K  — devtools & inspector
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c", "k"].includes(k)) {
        e.preventDefault();
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        // U — view source, S — save page, P — print
        if (["u", "s", "p"].includes(k)) {
          e.preventDefault();
          return;
        }
        // A / C / X only outside inputs (keep copy-paste working in fields)
        if (!editable && ["a", "c", "x"].includes(k)) {
          e.preventDefault();
          return;
        }
      }
    };

    const onDragStart = (e: DragEvent) => {
      const n = e.target as HTMLElement | null;
      if (n && n.tagName === "IMG") e.preventDefault();
    };

    const onCopy = (e: ClipboardEvent) => {
      if (isEditable(e.target)) return;
      const sel = window.getSelection()?.toString() ?? "";
      // allow copying short strings (order codes, wallet ids…)
      if (sel.length > 220) e.preventDefault();
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("copy", onCopy);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("copy", onCopy);
    };
  }, []);

  return null;
}
