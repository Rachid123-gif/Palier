"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { LogoMark } from "@/components/brand/Logo";

const nav = [
  { href: "/syndic", label: "Tableau de bord", icon: "LayoutDashboard", exact: true },
  { href: "/syndic/recouvrement", label: "Recouvrement", icon: "HandCoins", badgeKey: "dunning" },
  { href: "/syndic/charges", label: "Charges & appels", icon: "ReceiptText" },
  { href: "/syndic/incidents", label: "Incidents", icon: "TriangleAlert", badgeKey: "incidents" },
  { href: "/syndic/residents", label: "Résidents & lots", icon: "Users" },
  { href: "/syndic/transparence", label: "Transparence", icon: "ShieldCheck" },
  { href: "/syndic/marketplace", label: "Marketplace", icon: "Store" },
  { href: "/syndic/ag", label: "AG & votes", icon: "Vote" },
  { href: "/syndic/documents", label: "Documents", icon: "FolderOpen" },
];

export function SyndicShell({
  building, badges, children,
}: {
  building: { name: string; city: string };
  badges: { dunning: number; incidents: number };
  children: React.ReactNode;
}) {
  const path = usePathname();
  return (
    <div className="flex min-h-dvh bg-[#f3efe7] text-ink">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col bg-palier-900 p-4 text-white md:flex">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <LogoMark size={36} />
          <div>
            <p className="text-[15px] font-bold leading-none">Palier</p>
            <p className="text-[11px] text-white/50">Espace syndic</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white/8 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Immeuble géré</p>
          <p className="mt-0.5 text-[14px] font-bold leading-tight">{building.name}</p>
          <p className="text-[11px] text-white/55">{building.city}</p>
        </div>

        <nav className="mt-4 flex-1 space-y-1">
          {nav.map((n) => {
            const active = n.exact ? path === n.href : path.startsWith(n.href);
            const badge = n.badgeKey === "dunning" ? badges.dunning : n.badgeKey === "incidents" ? badges.incidents : 0;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors",
                  active ? "bg-white text-palier-800 shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon name={n.icon} className="h-[18px] w-[18px]" strokeWidth={2.2} />
                <span className="flex-1">{n.label}</span>
                {badge > 0 && (
                  <span className={cn("flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold", active ? "bg-danger text-white" : "bg-danger text-white")}>
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-2 flex items-center gap-3 rounded-2xl bg-white/8 p-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-palier-400 text-sm font-bold">KT</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">Karim Tazi</p>
            <p className="text-[11px] text-white/50">Gestionnaire</p>
          </div>
          <Link href="/" className="text-white/50 hover:text-white"><Icon name="LogOut" className="h-4 w-4" /></Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Topbar mobile */}
        <div className="flex items-center justify-between border-b border-black/5 bg-white px-4 py-3 md:hidden">
          <div className="flex items-center gap-2"><LogoMark size={28} /><span className="font-bold">Palier syndic</span></div>
          <Link href="/syndic/recouvrement" className="rounded-full bg-palier-600 px-3 py-1.5 text-xs font-semibold text-white">Recouvrement</Link>
        </div>
        <div className="mx-auto w-full max-w-[1100px] flex-1 p-5 md:p-8">{children}</div>
      </main>
    </div>
  );
}
