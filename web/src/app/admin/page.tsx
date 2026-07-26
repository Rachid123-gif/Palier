"use client";

import { Icon } from "@/components/ui/Icon";
import { useAdmin } from "./AdminContext";
import { timeAgo } from "@/lib/format";

function KpiCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111c18] p-5">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon name={icon} className="h-5 w-5 text-white" />
        </span>
        <div>
          <p className="text-[12px] font-medium text-white/40">{label}</p>
          <p className="text-[24px] font-bold leading-tight text-white">{value}</p>
          {sub && <p className="text-[11px] text-emerald-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

const activityIcons: Record<string, { icon: string; color: string }> = {
  building: { icon: "Building2", color: "text-emerald-400" },
  incident: { icon: "Wrench", color: "text-amber-400" },
  post: { icon: "MessageSquare", color: "text-blue-400" },
  charge: { icon: "Banknote", color: "text-violet-400" },
};

export default function AdminDashboard() {
  const { kpis, buildings, recentActivity } = useAdmin();

  const fmt = (n: number) => new Intl.NumberFormat("fr-MA").format(n);
  const fmtMad = (n: number) => new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(n);
  const recouvrementRate = kpis.totalChargesEmitted > 0
    ? Math.round((kpis.totalChargesPaid / kpis.totalChargesEmitted) * 100)
    : 0;

  // Top 5 buildings by residents
  const topBuildings = [...buildings].sort((a, b) => b.residentsCount - a.residentsCount).slice(0, 5);

  return (
    <div className="mx-auto max-w-[1100px] space-y-8">
      <div>
        <h1 className="text-[24px] font-bold text-white">Vue d&apos;ensemble</h1>
        <p className="mt-1 text-[13px] text-white/40">Statistiques de la plateforme Palier</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon="Building2" label="Immeubles" value={kpis.totalBuildings} sub={kpis.newBuildingsThisMonth > 0 ? `+${kpis.newBuildingsThisMonth} ce mois` : undefined} color="bg-emerald-600/20" />
        <KpiCard icon="UserCheck" label="Syndics" value={kpis.totalSyndics} color="bg-blue-600/20" />
        <KpiCard icon="Users" label="Résidents actifs" value={kpis.activeResidents} sub={kpis.newResidentsThisMonth > 0 ? `+${kpis.newResidentsThisMonth} ce mois` : undefined} color="bg-violet-600/20" />
        <KpiCard icon="Wrench" label="Incidents ouverts" value={kpis.openIncidents} color="bg-amber-600/20" />
      </div>

      {/* Financial + Top Buildings */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Finances plateforme */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#111c18] p-5">
          <h2 className="mb-4 text-[15px] font-bold text-white">Charges plateforme</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-white/50">Total charges émises</span>
              <span className="text-[15px] font-bold text-white">{fmtMad(kpis.totalChargesEmitted)} MAD</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-white/50">Total encaissé</span>
              <span className="text-[15px] font-bold text-emerald-400">{fmtMad(kpis.totalChargesPaid)} MAD</span>
            </div>
            <div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-white/40">Taux de recouvrement</span>
                <span className="font-bold text-white">{recouvrementRate}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, recouvrementRate)}%` }} />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
              <span className="text-[13px] text-white/50">Publications</span>
              <span className="text-[14px] font-semibold text-white">{fmt(kpis.totalPosts)}</span>
            </div>
          </div>
        </div>

        {/* Top 5 buildings */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#111c18] p-5">
          <h2 className="mb-4 text-[15px] font-bold text-white">Top immeubles</h2>
          {topBuildings.length > 0 ? (
            <div className="space-y-3">
              {topBuildings.map((b, idx) => (
                <div key={b.id} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[12px] font-bold text-white/60">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-white">{b.name}</p>
                    <p className="text-[11px] text-white/40">{b.city} · {b.lots} lots</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-semibold text-white">{b.residentsCount}</p>
                    <p className="text-[10px] text-white/40">résidents</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-white/30">Aucun immeuble</p>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111c18] p-5">
        <h2 className="mb-4 text-[15px] font-bold text-white">Activité récente</h2>
        {recentActivity.length > 0 ? (
          <div className="space-y-2.5">
            {recentActivity.slice(0, 15).map((a, idx) => {
              const ai = activityIcons[a.type] ?? activityIcons.post;
              return (
                <div key={idx} className="flex items-center gap-3 rounded-xl bg-white/[0.02] px-3 py-2.5">
                  <Icon name={ai.icon} className={`h-4 w-4 shrink-0 ${ai.color}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-white/80">{a.title}</p>
                    <p className="text-[11px] text-white/30">{a.detail}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-white/25">{timeAgo(a.date, "fr")}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[13px] text-white/30">Aucune activité</p>
        )}
      </div>
    </div>
  );
}
