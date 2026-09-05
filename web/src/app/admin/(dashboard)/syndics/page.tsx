"use client";

import { useState, useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import { useAdmin } from "../../AdminContext";
import { shortDate } from "@/lib/format";

export default function SyndicsPage() {
  const { syndics } = useAdmin();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "buildings" | "date">("date");

  const filtered = useMemo(() => {
    let list = syndics;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.buildings.some((b) => b.name.toLowerCase().includes(q) || b.city.toLowerCase().includes(q)));
    }
    list = [...list].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "buildings") return b.buildings.length - a.buildings.length;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [syndics, search, sortKey]);

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-[var(--a-text)]">Syndics</h1>
        <p className="mt-1 text-[13px] text-[var(--a-text-4)]">{syndics.length} syndics enregistrés</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Icon name="Search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--a-text-5)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un syndic, immeuble, ville…"
            className="w-full rounded-xl border border-[var(--a-input-border)] bg-[var(--a-input-bg)] py-2.5 pl-10 pr-4 text-[13px] text-[var(--a-text)] outline-none placeholder:text-[var(--a-text-5)] focus:border-emerald-500/30" />
        </div>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
          className="rounded-xl border border-[var(--a-input-border)] bg-[var(--a-input-bg)] px-3 py-2.5 text-[13px] text-[var(--a-text)] outline-none">
          <option value="date">Plus récent</option>
          <option value="name">Nom A-Z</option>
          <option value="buildings">Nb immeubles</option>
        </select>
      </div>

      {/* Table (desktop) */}
      <div className="hidden overflow-hidden rounded-2xl border border-[var(--a-border)] lg:block" style={{ background: "var(--a-card)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--a-border)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--a-text-5)]">
                <th className="px-4 py-3">Syndic</th>
                <th className="px-4 py-3">Immeubles</th>
                <th className="px-4 py-3 text-center">Nb immeubles</th>
                <th className="px-4 py-3">Inscrit le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--a-border-2)]">
              {filtered.map((s) => (
                <tr key={s.profileId} className="transition-colors hover:bg-[var(--a-hover)]">
                  <td className="px-4 py-3 font-medium text-[var(--a-text)]">{s.name || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {s.buildings.map((b) => (
                        <span key={b.id} className="inline-flex items-center rounded-md bg-[var(--a-tag)] px-2 py-0.5 text-[11px] text-[var(--a-text-3)]">{b.name}</span>
                      ))}
                      {s.buildings.length === 0 && <span className="text-[var(--a-text-6)]">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-[var(--a-text-3)]">{s.buildings.length}</td>
                  <td className="px-4 py-3 text-[var(--a-text-5)]">{shortDate(s.createdAt, "fr")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="py-8 text-center text-[13px] text-[var(--a-text-5)]">Aucun syndic trouvé</p>}
      </div>

      {/* Cards (mobile) */}
      <div className="space-y-3 lg:hidden">
        {filtered.map((s) => (
          <div key={s.profileId} className="rounded-2xl border border-[var(--a-border)] p-4" style={{ background: "var(--a-card)" }}>
            <div className="flex items-start justify-between">
              <p className="text-[14px] font-semibold text-[var(--a-text)]">{s.name || "—"}</p>
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                {s.buildings.length} immeuble{s.buildings.length !== 1 ? "s" : ""}
              </span>
            </div>
            {s.buildings.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {s.buildings.map((b) => (
                  <span key={b.id} className="inline-flex items-center rounded-md bg-[var(--a-tag)] px-2 py-0.5 text-[11px] text-[var(--a-text-3)]">{b.name} · {b.city}</span>
                ))}
              </div>
            )}
            <p className="mt-2 text-[11px] text-[var(--a-text-5)]">Inscrit le {shortDate(s.createdAt, "fr")}</p>
          </div>
        ))}
        {filtered.length === 0 && <p className="py-8 text-center text-[13px] text-[var(--a-text-5)]">Aucun syndic trouvé</p>}
      </div>
    </div>
  );
}
