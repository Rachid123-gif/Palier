"use client";

import { useState, useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import { useAdmin } from "../AdminContext";
import { shortDate } from "@/lib/format";

export default function ImmeublesPage() {
  const { buildings } = useAdmin();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "residents" | "balance" | "date">("date");
  const [cityFilter, setCityFilter] = useState("");

  const cities = useMemo(() => [...new Set(buildings.map((b) => b.city).filter(Boolean))].sort(), [buildings]);
  const fmt = (n: number) => new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(n);

  const filtered = useMemo(() => {
    let list = buildings;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((b) => b.name.toLowerCase().includes(q) || b.syndicName.toLowerCase().includes(q) || b.city.toLowerCase().includes(q));
    }
    if (cityFilter) list = list.filter((b) => b.city === cityFilter);
    list = [...list].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "residents") return b.residentsCount - a.residentsCount;
      if (sortKey === "balance") return b.balance - a.balance;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [buildings, search, cityFilter, sortKey]);

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-white">Immeubles</h1>
        <p className="mt-1 text-[13px] text-white/40">{buildings.length} immeubles sur la plateforme</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Icon name="Search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un immeuble, syndic, ville…"
            className="w-full rounded-xl border border-white/[0.08] bg-white/5 py-2.5 pl-10 pr-4 text-[13px] text-white outline-none placeholder:text-white/30 focus:border-emerald-500/30"
          />
        </div>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="rounded-xl border border-white/[0.08] bg-white/5 px-3 py-2.5 text-[13px] text-white outline-none"
        >
          <option value="">Toutes les villes</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
          className="rounded-xl border border-white/[0.08] bg-white/5 px-3 py-2.5 text-[13px] text-white outline-none"
        >
          <option value="date">Plus récent</option>
          <option value="name">Nom A-Z</option>
          <option value="residents">Résidents</option>
          <option value="balance">Solde</option>
        </select>
      </div>

      {/* Table (desktop) */}
      <div className="hidden overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111c18] lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-[11px] font-semibold uppercase tracking-wider text-white/30">
                <th className="px-4 py-3">Immeuble</th>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3">Syndic</th>
                <th className="px-4 py-3 text-center">Lots</th>
                <th className="px-4 py-3 text-center">Résidents</th>
                <th className="px-4 py-3 text-right">Solde</th>
                <th className="px-4 py-3 text-center">Incidents</th>
                <th className="px-4 py-3">Inscrit le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((b) => (
                <tr key={b.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-white">{b.name}</td>
                  <td className="px-4 py-3 text-white/50">{b.city}</td>
                  <td className="px-4 py-3">
                    <p className="text-white/70">{b.syndicName}</p>
                    {b.syndicPhone && <p className="text-[11px] text-white/30">{b.syndicPhone}</p>}
                  </td>
                  <td className="px-4 py-3 text-center text-white/50">{b.lots}</td>
                  <td className="px-4 py-3 text-center text-white/50">{b.residentsCount}</td>
                  <td className={`px-4 py-3 text-right font-medium ${b.balance < 0 ? "text-red-400" : "text-emerald-400"}`}>{fmt(b.balance)} MAD</td>
                  <td className="px-4 py-3 text-center">
                    {b.openIncidents > 0 ? (
                      <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-400">{b.openIncidents}</span>
                    ) : (
                      <span className="text-white/20">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/30">{shortDate(b.createdAt, "fr")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-[13px] text-white/30">Aucun immeuble trouvé</p>
        )}
      </div>

      {/* Cards (mobile) */}
      <div className="space-y-3 lg:hidden">
        {filtered.map((b) => (
          <div key={b.id} className="rounded-2xl border border-white/[0.06] bg-[#111c18] p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[14px] font-semibold text-white">{b.name}</p>
                <p className="text-[12px] text-white/40">{b.city} · {b.lots} lots</p>
              </div>
              {b.openIncidents > 0 && (
                <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-400">{b.openIncidents} incidents</span>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-[12px]">
              <span className="text-white/40">Syndic : {b.syndicName}</span>
              <span className={`font-semibold ${b.balance < 0 ? "text-red-400" : "text-emerald-400"}`}>{fmt(b.balance)} MAD</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-white/30">
              <span>{b.residentsCount} résidents</span>
              <span>{shortDate(b.createdAt, "fr")}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-[13px] text-white/30">Aucun immeuble trouvé</p>
        )}
      </div>
    </div>
  );
}
