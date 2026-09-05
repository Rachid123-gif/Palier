"use client";

import { Icon } from "@/components/ui/Icon";
import { useAdmin } from "../AdminContext";

function KpiCard({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--a-border)] p-5" style={{ background: "var(--a-card)" }}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--a-tag)]">
          <Icon name={icon} className="h-5 w-5 text-[var(--a-text-3)]" />
        </span>
        <div>
          <p className="text-[12px] font-medium text-[var(--a-text-4)]">{label}</p>
          <p className="text-[24px] font-bold leading-tight text-[var(--a-text)]">{value}</p>
          {sub && <p className="text-[11px] text-[var(--a-text-3)]">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { kpis, buildings } = useAdmin();

  const fmt = (n: number) => new Intl.NumberFormat("fr-MA").format(n);

  const topBuildings = [...buildings].sort((a, b) => b.residentsCount - a.residentsCount).slice(0, 5);

  return (
    <div className="mx-auto max-w-[1100px] space-y-8">
      <div>
        <h1 className="text-[24px] font-bold text-[var(--a-text)]">Vue d&apos;ensemble</h1>
        <p className="mt-1 text-[13px] text-[var(--a-text-4)]">Statistiques de la plateforme Palier</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard icon="Building2" label="Immeubles" value={kpis.totalBuildings} sub={kpis.newBuildingsThisMonth > 0 ? `+${kpis.newBuildingsThisMonth} ce mois` : undefined} />
        <KpiCard icon="UserCheck" label="Syndics" value={kpis.totalSyndics} />
        <KpiCard icon="Users" label="Résidents actifs" value={kpis.activeResidents} sub={kpis.newResidentsThisMonth > 0 ? `+${kpis.newResidentsThisMonth} ce mois` : undefined} />
        <KpiCard icon="FileText" label="Publications" value={fmt(kpis.totalPosts)} />
        <KpiCard icon="UserPlus" label="Demandes en attente" value={kpis.pendingRequests} />
        <KpiCard icon="MessageCircle" label="Feedback non lu" value={kpis.unreadFeedback} />
      </div>

      {/* Top immeubles */}
      <div className="rounded-2xl border border-[var(--a-border)] p-5" style={{ background: "var(--a-card)" }}>
        <h2 className="mb-4 text-[15px] font-bold text-[var(--a-text)]">Top immeubles</h2>
        {topBuildings.length > 0 ? (
          <div className="space-y-3">
            {topBuildings.map((b, idx) => (
              <div key={b.id} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--a-tag)] text-[12px] font-bold text-[var(--a-text-3)]">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[var(--a-text)]">{b.name}</p>
                  <p className="text-[11px] text-[var(--a-text-4)]">{b.city} · {b.lots} lots</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-semibold text-[var(--a-text)]">{b.residentsCount}</p>
                  <p className="text-[10px] text-[var(--a-text-4)]">résidents</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-[var(--a-text-5)]">Aucun immeuble</p>
        )}
      </div>
    </div>
  );
}
