"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import Logo from "./logo";
import ThemeToggle from "./theme-toggle";
import AuthButton from "./auth-button";
import { SoundToggle } from "./sound-provider";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/store", label: "المتجر" },
  { href: "/news", label: "الأخبار" },
  { href: "/apply", label: "التقديمات" },
  { href: "/exchange", label: "الصرف" },
  { href: "/#how", label: "كيف نعمل" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 24);
        raf = 0;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => setMenu(false), [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav
        className={cn(
          "transition-colors duration-300",
          scrolled
            ? "border-b border-neutral-900/[0.06] bg-white/95 shadow-sm dark:border-white/10 dark:bg-neutral-950/95"
            : "bg-transparent"
        )}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />

          <div className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group relative rounded-full px-4 py-2 text-sm font-bold text-neutral-600 transition hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
              >
                {l.label}
                <span className="absolute inset-x-4 -bottom-px h-px origin-center scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <SoundToggle />
            <ThemeToggle />
            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-800" />
            <AuthButton />
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <SoundToggle />
            <ThemeToggle />
            <button
              onClick={() => setMenu((v) => !v)}
              aria-expanded={menu}
              aria-label="القائمة"
              className="grid size-10 place-items-center rounded-full border border-neutral-200 bg-white/90 dark:border-neutral-800 dark:bg-neutral-900"
            >
              {menu ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </nav>

      {menu && (
        <div
          className="card-enter mx-4 mt-2 overflow-y-auto rounded-3xl border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-800 dark:bg-neutral-900 lg:hidden"
          style={{ maxHeight: "calc(100vh - 130px)" }}
          data-lenis-prevent
        >
          <div className="flex flex-col">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-2xl px-4 py-3 text-sm font-bold transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
              <AuthButton mobile />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
