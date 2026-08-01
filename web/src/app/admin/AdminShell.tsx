"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { LogoMark } from "@/components/brand/Logo";
import { logout } from "@/lib/auth";
import type { AdminData } from "@/lib/admin-queries";
import { AdminContext } from "./AdminContext";

const navItems = [
  { href: "/admin", label: "Vue d'ensemble", icon: "LayoutDashboard", exact: true },
  { href: "/admin/immeubles", label: "Immeubles", icon: "Building2" },
  { href: "/admin/syndics", label: "Syndics", icon: "Users" },
  { href: "/admin/activite", label: "Activité", icon: "Activity" },
  { href: "/admin/invitations", label: "Invitations", icon: "Ticket" },
];

export function AdminShell({ data, children }: { data: AdminData; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const nav = (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${
              active
                ? "bg-emerald-500/10 font-semibold text-emerald-400"
                : "text-white/50 hover:bg-white/5 hover:text-white/80"
            }`}
          >
            <Icon name={item.icon} className="h-[18px] w-[18px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <AdminContext.Provider value={data}>
      <div className="flex min-h-dvh bg-[#0a0f0d]">
        {/* Desktop sidebar */}
        <aside className="hidden w-[240px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0f1a17] lg:flex">
          <div className="flex items-center gap-2.5 px-5 py-5">
            <LogoMark className="h-7 w-7" />
            <span className="text-[15px] font-bold text-white">Palier Admin</span>
          </div>
          {nav}
          <div className="mt-auto border-t border-white/[0.06] p-3">
            <button
              onClick={() => setShowLogout(true)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/40 transition-colors hover:bg-white/5 hover:text-white/70"
            >
              <Icon name="LogOut" className="h-[18px] w-[18px]" />
              Déconnexion
            </button>
          </div>
        </aside>

        {/* Mobile header */}
        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-white/[0.06] bg-[#0f1a17] px-4 py-3 lg:hidden">
            <div className="flex items-center gap-2">
              <LogoMark className="h-6 w-6" />
              <span className="text-[14px] font-bold text-white">Palier Admin</span>
            </div>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white/60">
              <Icon name={mobileOpen ? "X" : "Menu"} className="h-5 w-5" />
            </button>
          </header>

          {/* Mobile nav dropdown */}
          {mobileOpen && (
            <div className="border-b border-white/[0.06] bg-[#0f1a17] py-2 lg:hidden">
              {nav}
            </div>
          )}

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>

        {/* Logout modal */}
        {showLogout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-xs rounded-2xl bg-[#1a2520] p-6 text-center">
              <p className="text-[15px] font-semibold text-white">Se déconnecter ?</p>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setShowLogout(false)} className="flex-1 rounded-xl border border-white/10 py-2.5 text-[13px] font-medium text-white/60">
                  Annuler
                </button>
                <button
                  onClick={async () => { try { await logout(); } finally { window.location.href = "/admin/login"; } }}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-[13px] font-medium text-white"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminContext.Provider>
  );
}
