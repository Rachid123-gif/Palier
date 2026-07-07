"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const modes = [
    { key: "light", icon: "Sun", label: "Clair" },
    { key: "dark", icon: "Moon", label: "Sombre" },
    { key: "system", icon: "Monitor", label: "Système" },
  ] as const;

  return (
    <div className={`flex gap-1 rounded-xl bg-sand/50 p-1 dark:bg-white/[0.06] ${className}`}>
      {modes.map((m) => (
        <button
          key={m.key}
          onClick={() => setTheme(m.key)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
            theme === m.key
              ? "bg-cream-card text-ink shadow-sm dark:bg-white/10"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          <Icon name={m.icon} className="h-3.5 w-3.5" />
          {m.label}
        </button>
      ))}
    </div>
  );
}
