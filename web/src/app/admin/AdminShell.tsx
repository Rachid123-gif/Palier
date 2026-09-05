"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { LogoMark } from "@/components/brand/Logo";
import { logout } from "@/lib/auth";
import type { AdminData } from "@/lib/admin-queries";
import { AdminContext } from "./AdminContext";

const navItems = [
  { href: "/admin", label: "Vue d'ensemble", icon: "LayoutDashboard", exact: true },
  { href: "/admin/demandes", label: "Demandes", icon: "UserPlus" },
  { href: "/admin/immeubles", label: "Immeubles", icon: "Building2" },
  { href: "/admin/syndics", label: "Syndics", icon: "Users" },
  { href: "/admin/invitations", label: "Invitations", icon: "Ticket" },
  { href: "/admin/feedback", label: "Feedback", icon: "MessageCircle" },
];

const darkVars = {
  "--a-bg": "#0a0f0d",
  "--a-sidebar": "#0f1a17",
  "--a-card": "#111c18",
  "--a-modal": "#1a2520",
  "--a-text": "#ffffff",
  "--a-text-2": "rgba(255,255,255,0.7)",
  "--a-text-3": "rgba(255,255,255,0.5)",
  "--a-text-4": "rgba(255,255,255,0.4)",
  "--a-text-5": "rgba(255,255,255,0.3)",
  "--a-text-6": "rgba(255,255,255,0.2)",
  "--a-border": "rgba(255,255,255,0.06)",
  "--a-border-2": "rgba(255,255,255,0.04)",
  "--a-input-bg": "rgba(255,255,255,0.05)",
  "--a-input-border": "rgba(255,255,255,0.08)",
  "--a-hover": "rgba(255,255,255,0.02)",
  "--a-tag": "rgba(255,255,255,0.06)",
} as React.CSSProperties;

const lightVars = {
  "--a-bg": "#f4f5f2",
  "--a-sidebar": "#ffffff",
  "--a-card": "#ffffff",
  "--a-modal": "#ffffff",
  "--a-text": "#111815",
  "--a-text-2": "#374151",
  "--a-text-3": "#6b7280",
  "--a-text-4": "#9ca3af",
  "--a-text-5": "#9ca3af",
  "--a-text-6": "#d1d5db",
  "--a-border": "rgba(0,0,0,0.08)",
  "--a-border-2": "rgba(0,0,0,0.04)",
  "--a-input-bg": "rgba(0,0,0,0.03)",
  "--a-input-border": "rgba(0,0,0,0.10)",
  "--a-hover": "rgba(0,0,0,0.02)",
  "--a-tag": "rgba(0,0,0,0.05)",
} as React.CSSProperties;

export function AdminShell({ data, children }: { data: AdminData; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("palier_admin_theme");
    if (saved === "light") setIsDark(false);
  }, []);

  function toggleTheme() {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("palier_admin_theme", next ? "dark" : "light");
      return next;
    });
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const vars = isDark ? darkVars : lightVars;

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
                : "text-[var(--a-text-4)] hover:bg-[var(--a-hover)] hover:text-[var(--a-text-2)]"
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
    <AdminContext.Provider value={{ ...data, isDark, toggleTheme }}>
      <div className="flex min-h-dvh" style={{ background: "var(--a-bg)", ...vars }}>
        {/* Desktop sidebar */}
        <aside className="hidden w-[240px] shrink-0 flex-col border-r border-[var(--a-border)] lg:flex" style={{ background: "var(--a-sidebar)" }}>
          <div className="flex items-center gap-2.5 px-5 py-5">
            <LogoMark className="h-7 w-7" />
            <span className="text-[15px] font-bold text-[var(--a-text)]">Palier Admin</span>
          </div>
          {nav}
          <div className="mt-auto border-t border-[var(--a-border)] p-3">
            <button
              onClick={toggleTheme}
              className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[var(--a-text-4)] transition-colors hover:bg-[var(--a-hover)] hover:text-[var(--a-text-2)]"
            >
              <Icon name={isDark ? "Sun" : "Moon"} className="h-[18px] w-[18px]" />
              {isDark ? "Mode clair" : "Mode sombre"}
            </button>
            <button
              onClick={() => setShowLogout(true)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[var(--a-text-4)] transition-colors hover:bg-[var(--a-hover)] hover:text-[var(--a-text-2)]"
            >
              <Icon name="LogOut" className="h-[18px] w-[18px]" />
              Déconnexion
            </button>
          </div>
        </aside>

        {/* Mobile header */}
        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-[var(--a-border)] px-4 py-3 lg:hidden" style={{ background: "var(--a-sidebar)" }}>
            <div className="flex items-center gap-2">
              <LogoMark className="h-6 w-6" />
              <span className="text-[14px] font-bold text-[var(--a-text)]">Palier Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme} className="text-[var(--a-text-4)]">
                <Icon name={isDark ? "Sun" : "Moon"} className="h-5 w-5" />
              </button>
              <button onClick={() => setMobileOpen(!mobileOpen)} className="text-[var(--a-text-3)]">
                <Icon name={mobileOpen ? "X" : "Menu"} className="h-5 w-5" />
              </button>
            </div>
          </header>

          {/* Mobile nav dropdown */}
          {mobileOpen && (
            <div className="border-b border-[var(--a-border)] py-2 lg:hidden" style={{ background: "var(--a-sidebar)" }}>
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
            <div className="w-full max-w-xs rounded-2xl p-6 text-center" style={{ background: "var(--a-modal)" }}>
              <p className="text-[15px] font-semibold text-[var(--a-text)]">Se déconnecter ?</p>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setShowLogout(false)} className="flex-1 rounded-xl border border-[var(--a-input-border)] py-2.5 text-[13px] font-medium text-[var(--a-text-3)]">
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
