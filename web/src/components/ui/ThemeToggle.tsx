"use client";
import { useTheme } from "@/lib/ThemeProvider";
import { useLang } from "@/lib/LangProvider";
import { Icon } from "./Icon";

const labels = {
  fr: { light: "Clair", dark: "Sombre", system: "Système" },
  ar: { light: "فاتح", dark: "داكن", system: "النظام" },
};

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const { lang } = useLang();
  const l = labels[lang];

  const modes = [
    { key: "light", icon: "Sun", label: l.light },
    { key: "dark", icon: "Moon", label: l.dark },
    { key: "system", icon: "Monitor", label: l.system },
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
