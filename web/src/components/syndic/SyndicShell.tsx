"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { LogoMark } from "@/components/brand/Logo";
import { logout } from "@/lib/auth";

type NavItem = { href: string; label: string; icon: string; exact?: boolean; badgeKey?: string };
type NavSection = { title?: string; items: NavItem[] };

const navSections: NavSection[] = [
  {
    items: [
      { href: "/syndic", label: "Tableau de bord", icon: "LayoutDashboard", exact: true },
    ],
  },
  {
    title: "Gestion",
    items: [
      { href: "/syndic/recouvrement", label: "Recouvrement", icon: "Banknote", badgeKey: "dunning" },
      { href: "/syndic/incidents", label: "Incidents", icon: "Wrench", badgeKey: "incidents" },
      { href: "/syndic/residents", label: "Résidents & lots", icon: "Users" },
      { href: "/syndic/voisinage", label: "Voisinage", icon: "MessageSquare" },
      { href: "/syndic/travaux-urgents", label: "Travaux urgents", icon: "Hammer" },
    ],
  },
  {
    title: "Finances",
    items: [
      { href: "/syndic/transparence", label: "Transparence", icon: "BookOpen" },
      { href: "/syndic/budget", label: "Budget", icon: "Calculator" },
    ],
  },
  {
    title: "Conformité",
    items: [
      { href: "/syndic/ag", label: "Assemblées", icon: "Calendar" },
      { href: "/syndic/reglement", label: "Règlement", icon: "Scale" },
      { href: "/syndic/assurance", label: "Assurance", icon: "Shield" },
      { href: "/syndic/mandat", label: "Mandat syndic", icon: "Award" },
      { href: "/syndic/documents", label: "Documents", icon: "FileText" },
    ],
  },
  {
    items: [
      { href: "/syndic/parametres", label: "Paramètres", icon: "Settings" },
    ],
  },
];

// Flat nav for iteration in mobile/desktop
const nav = navSections.flatMap((s) => s.items);

export function SyndicShell({
  building, badges, syndicName, children,
}: {
  building: { name: string; city: string };
  badges: { dunning: number; incidents: number };
  syndicName: string;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [showLogout, setShowLogout] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex min-h-dvh bg-cream text-ink">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[244px] shrink-0 flex-col border-r border-black/[0.06] bg-cream-card px-3 py-4 md:flex">
        <div className="flex items-center gap-2 px-2 pb-4">
          <LogoMark size={28} />
          <span className="text-[14px] font-semibold text-ink">Palier</span>
          <span className="rounded-md bg-palier-50 px-1.5 py-0.5 text-[10px] font-semibold text-palier-700">Syndic</span>
        </div>

        <nav className="no-scrollbar flex-1 space-y-1 overflow-y-auto">
          {navSections.map((section, si) => (
            <div key={si}>
              {section.title && (
                <p className="mb-1 mt-3 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">{section.title}</p>
              )}
              {section.items.map((n) => {
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
            </div>
          ))}
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
            <button onClick={() => setShowLogout(true)} className="text-ink-faint transition-colors hover:text-ink"><Icon name="LogOut" className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </aside>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          {/* Slide-out panel */}
          <aside className="relative z-10 flex h-full w-[270px] flex-col bg-cream-card shadow-xl">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2">
                <LogoMark size={28} />
                <span className="text-[14px] font-semibold text-ink">Palier</span>
                <span className="rounded-md bg-palier-50 px-1.5 py-0.5 text-[10px] font-semibold text-palier-700">Syndic</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-sand/50 hover:text-ink">
                <Icon name="X" className="h-5 w-5" strokeWidth={1.8} />
              </button>
            </div>

            <nav className="no-scrollbar flex-1 space-y-px overflow-y-auto px-3">
              {nav.map((n) => {
                const active = n.exact ? path === n.href : path.startsWith(n.href);
                const badge = n.badgeKey === "dunning" ? badges.dunning : n.badgeKey === "incidents" ? badges.incidents : 0;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setMobileOpen(false)}
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

            <div className="border-t border-black/[0.06] px-3 pt-3 pb-4">
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
                <button onClick={() => { setMobileOpen(false); setShowLogout(true); }} className="text-ink-faint transition-colors hover:text-ink"><Icon name="LogOut" className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-black/[0.06] bg-cream-card px-4 py-2.5 md:hidden">
          <div className="flex items-center gap-2">
            <LogoMark size={24} />
            <span className="text-[14px] font-semibold text-ink">Palier</span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-sand/50 hover:text-ink">
            <Icon name="Menu" className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>
        <div className="mx-auto w-full max-w-[1060px] flex-1 px-4 py-4 md:px-8 md:py-8">{children}</div>
      </main>

      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowLogout(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                <Icon name="LogOut" className="h-4 w-4 text-red-600" />
              </div>
              <h2 className="text-[15px] font-semibold text-ink">Se déconnecter</h2>
            </div>
            <p className="mb-4 text-[13px] text-ink-soft">
              Êtes-vous sûr de vouloir vous déconnecter de l&apos;espace syndic ?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowLogout(false)} className="flex-1 rounded-lg border border-black/[0.08] py-2 text-[13px] font-medium text-ink hover:bg-sand/50">
                Annuler
              </button>
              <button onClick={async () => { await logout(); window.location.href = "/bienvenue"; }} className="flex flex-1 items-center justify-center rounded-lg bg-red-600 py-2 text-[13px] font-medium text-white hover:bg-red-700">
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
