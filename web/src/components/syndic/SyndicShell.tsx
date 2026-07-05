"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { LogoMark } from "@/components/brand/Logo";

const nav = [
  { href: "/syndic", label: "Tableau de bord", icon: "LayoutDashboard", exact: true },
  { href: "/syndic/recouvrement", label: "Recouvrement", icon: "Banknote", badgeKey: "dunning" },
  { href: "/syndic/charges", label: "Charges & appels", icon: "Receipt" },
  { href: "/syndic/incidents", label: "Incidents", icon: "Wrench", badgeKey: "incidents" },
  { href: "/syndic/residents", label: "Résidents & lots", icon: "Users" },
  { href: "/syndic/transparence", label: "Transparence", icon: "BookOpen" },
  { href: "/syndic/ag", label: "AG & votes", icon: "Calendar" },
  { href: "/syndic/documents", label: "Documents", icon: "FileText" },
  { href: "/syndic/parametres", label: "Paramètres", icon: "Settings" },
];

export function SyndicShell({
  building, badges, syndicName, children,
}: {
  building: { name: string; city: string };
  badges: { dunning: number; incidents: number };
  syndicName: string;
  children: React.ReactNode;
}) {
  const path = usePathname();
  return (
    <div className="flex min-h-dvh bg-cream text-ink">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[244px] shrink-0 flex-col border-r border-black/[0.06] bg-cream-card px-3 py-4 md:flex">
        <div className="flex items-center gap-2 px-2 pb-4">
          <LogoMark size={28} />
          <span className="text-[14px] font-semibold text-ink">Palier</span>
          <span className="rounded-md bg-palier-50 px-1.5 py-0.5 text-[10px] font-semibold text-palier-700">Syndic</span>
        </div>

        <nav className="no-scrollbar flex-1 space-y-px overflow-y-auto">
          {nav.map((n) => {
            const active = n.exact ? path === n.href : path.startsWith(n.href);
            const badge = n.badgeKey === "dunning" ? badges.dunning : n.badgeKey === "incidents" ? badges.incidents : 0;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-colors",
                  active
                    ? "bg-palier-600 text-white"
                    : "text-ink-soft hover:bg-sand/50 hover:text-ink",
                )}
              >
                <Icon name={n.icon} className="h-4 w-4" strokeWidth={1.8} />
                <span className="flex-1">{n.label}</span>
                {badge > 0 && (
                  <span className={cn(
                    "flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                    active ? "bg-white/20 text-white" : "bg-red-500 text-white",
                  )}>
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-black/[0.06] pt-3">
          <div className="rounded-lg bg-black/[0.03] px-2.5 py-2">
            <p className="text-[11px] font-medium text-ink-soft">Résidence</p>
            <p className="text-[13px] font-semibold text-ink">{building.name}</p>
            <p className="text-[11px] text-ink-soft">{building.city}</p>
          </div>
          <div className="mt-2 flex items-center gap-2.5 px-2.5 py-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-palier-600 text-[10px] font-semibold text-white">
              {syndicName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
            </span>
            <span className="flex-1 truncate text-[13px] font-medium text-ink">{syndicName}</span>
            <Link href="/" className="text-ink-faint transition-colors hover:text-ink"><Icon name="LogOut" className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-black/[0.06] bg-cream-card px-4 py-2.5 md:hidden">
          <div className="flex items-center gap-2">
            <LogoMark size={24} />
            <span className="text-[14px] font-semibold text-ink">Palier</span>
          </div>
          <Link href="/syndic/recouvrement" className="rounded-lg bg-palier-600 px-3 py-1.5 text-[12px] font-semibold text-white">
            Recouvrement
          </Link>
        </div>
        <div className="mx-auto w-full max-w-[1060px] flex-1 px-6 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
