"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/ui/Logo";

export default function Navbar() {
  return (
    <nav
      id="landing-navbar"
      className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto"
    >
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="w-9 h-9 group-hover:-translate-y-0.5 transition-transform duration-300">
          <Logo className="w-full h-full" />
        </div>
        <h1 className="text-lg font-bold font-(family-name:--font-sora) tracking-tight">
          <span className="gradient-text">Slide</span>
          <span className="text-foreground font-semibold">ia</span>
        </h1>
      </Link>
      <ThemeToggle />
    </nav>
  );
}
