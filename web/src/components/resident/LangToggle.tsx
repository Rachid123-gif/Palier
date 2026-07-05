"use client";
import { Icon } from "@/components/ui/Icon";
import { useLang } from "@/lib/LangProvider";

export function LangToggle() {
  const { lang, toggleLang } = useLang();
  return (
    <button
      onClick={toggleLang}
      className="tap flex items-center gap-1 rounded-full border border-black/10 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-ink-soft shadow-sm"
    >
      <Icon name="Globe" className="h-3.5 w-3.5" />
      {lang === "fr" ? <span style={{ fontFamily: "var(--font-cairo), sans-serif" }}>العربية</span> : "Français"}
    </button>
  );
}
