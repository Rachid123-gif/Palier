"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { useLang } from "@/lib/LangProvider";

const tabKeys = [
  { href: "/", key: "accueil" as const, icon: "House" },
  { href: "/charges", key: "charges" as const, icon: "ReceiptText" },
  { href: "/immeuble", key: "immeuble" as const, icon: "Building2" },
  { href: "/voisinage", key: "voisinage" as const, icon: "Users" },
  { href: "/services", key: "services" as const, icon: "Sparkles" },
];

export function BottomNav() {
  const path = usePathname();
  const { i } = useLang();
  return (
    <nav className="safe-bottom absolute inset-x-0 bottom-0 z-40 border-t border-black/5 bg-cream-card/95 px-2 pt-2 backdrop-blur-xl">
      <ul className="flex items-stretch justify-between">
        {tabKeys.map((t) => {
          const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={cn(
                  "tap flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[10.5px] font-medium",
                  active ? "text-palier-600" : "text-ink-faint",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                    active && "bg-palier-100",
                  )}
                >
                  <Icon name={t.icon} className="h-[18px] w-[18px]" strokeWidth={active ? 2.6 : 2} />
                </span>
                {i.nav[t.key]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
