"use client";

import { useState, useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import { useAdmin } from "../../AdminContext";
import { shortDate } from "@/lib/format";

export default function ImmeublesPage() {
  const { buildings } = useAdmin();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "residents" | "date">("date");
  const [cityFilter, setCityFilter] = useState("");

  const cities = useMemo(() => [...new Set(buildings.map((b) => b.city).filter(Boolean))].sort(), [buildings]);

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
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [buildings, search, cityFilter, sortKey]);

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-[var(--a-text)]">Immeubles</h1>
        <p className="mt-1 text-[13px] text-[var(--a-text-4)]">{buildings.length} immeubles sur la plateforme</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Icon name="Search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--a-text-5)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un immeuble, syndic, ville…"
            className="w-full rounded-xl border border-[var(--a-input-border)] bg-[var(--a-input-bg)] py-2.5 pl-10 pr-4 text-[13px] text-[var(--a-text)] outline-none placeholder:text-[var(--a-text-5)] focus:border-emerald-500/30" />
        </div>
        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
          className="rounded-xl border border-[var(--a-input-border)] bg-[var(--a-input-bg)] px-3 py-2.5 text-[13px] text-[var(--a-text)] outline-none">
          <option value="">Toutes les villes</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
          className="rounded-xl border border-[var(--a-input-border)] bg-[var(--a-input-bg)] px-3 py-2.5 text-[13px] text-[var(--a-text)] outline-none">
          <option value="date">Plus récent</option>
          <option value="name">Nom A-Z</option>
          <option value="residents">Résidents</option>
        </select>
      </div>

      {/* Table (desktop) */}
      <div className="hidden overflow-hidden rounded-2xl border border-[var(--a-border)] lg:block" style={{ background: "var(--a-card)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--a-border)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--a-text-5)]">
                <th className="px-4 py-3">Immeuble</th>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3">Syndic</th>
                <th className="px-4 py-3 text-center">Lots</th>
                <th className="px-4 py-3 text-center">Résidents</th>
                <th className="px-4 py-3">Inscrit le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--a-border-2)]">
              {filtered.map((b) => (
                <tr key={b.id} className="transition-colors hover:bg-[var(--a-hover)]">
                  <td className="px-4 py-3 font-medium text-[var(--a-text)]">{b.name}</td>
                  <td className="px-4 py-3 text-[var(--a-text-3)]">{b.city}</td>
                  <td className="px-4 py-3 text-[var(--a-text-2)]">{b.syndicName}</td>
                  <td className="px-4 py-3 text-center text-[var(--a-text-3)]">{b.lots}</td>
                  <td className="px-4 py-3 text-center text-[var(--a-text-3)]">{b.residentsCount}</td>
                  <td className="px-4 py-3 text-[var(--a-text-5)]">{shortDate(b.createdAt, "fr")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="py-8 text-center text-[13px] text-[var(--a-text-5)]">Aucun immeuble trouvé</p>}
      </div>

      {/* Cards (mobile) */}
      <div className="space-y-3 lg:hidden">
        {filtered.map((b) => (
          <div key={b.id} className="rounded-2xl border border-[var(--a-border)] p-4" style={{ background: "var(--a-card)" }}>
            <p className="text-[14px] font-semibold text-[var(--a-text)]">{b.name}</p>
            <p className="text-[12px] text-[var(--a-text-4)]">{b.city} · {b.lots} lots</p>
            <div className="mt-2 flex items-center justify-between text-[12px]">
              <span className="text-[var(--a-text-4)]">Syndic : {b.syndicName}</span>
              <span className="text-[var(--a-text-3)]">{b.residentsCount} résidents</span>
            </div>
            <p className="mt-1 text-[11px] text-[var(--a-text-5)]">{shortDate(b.createdAt, "fr")}</p>
          </div>
        ))}
        {filtered.length === 0 && <p className="py-8 text-center text-[13px] text-[var(--a-text-5)]">Aucun immeuble trouvé</p>}
      </div>
    </div>
  );
}
