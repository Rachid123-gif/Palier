"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

const tabs = [
  { href: "/", label: "Accueil", icon: "House" },
  { href: "/charges", label: "Charges", icon: "ReceiptText" },
  { href: "/immeuble", label: "Immeuble", icon: "Building2" },
  { href: "/voisinage", label: "Voisinage", icon: "Users" },
  { href: "/services", label: "Services", icon: "Sparkles" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="safe-bottom absolute inset-x-0 bottom-0 z-40 border-t border-black/5 bg-cream-card/95 px-2 pt-2 backdrop-blur-xl">
      <ul className="flex items-stretch justify-between">
        {tabs.map((t) => {
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
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
