"use client";

import { useState, useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import { useAdmin } from "../AdminContext";
import { timeAgo } from "@/lib/format";

const typeLabels: Record<string, string> = {
  building: "Immeuble",
  incident: "Incident",
  post: "Publication",
  charge: "Charge",
};

const typeIcons: Record<string, { icon: string; color: string; bg: string }> = {
  building: { icon: "Building2", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  incident: { icon: "Wrench", color: "text-amber-400", bg: "bg-amber-500/10" },
  post: { icon: "MessageSquare", color: "text-blue-400", bg: "bg-blue-500/10" },
  charge: { icon: "Banknote", color: "text-violet-400", bg: "bg-violet-500/10" },
};

export default function ActivitePage() {
  const { recentActivity } = useAdmin();
  const [typeFilter, setTypeFilter] = useState("");

  const filtered = useMemo(() => {
    if (!typeFilter) return recentActivity;
    return recentActivity.filter((a) => a.type === typeFilter);
  }, [recentActivity, typeFilter]);

  const types = useMemo(() => [...new Set(recentActivity.map((a) => a.type))].sort(), [recentActivity]);

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-white">Activité</h1>
        <p className="mt-1 text-[13px] text-white/40">Dernières actions sur la plateforme</p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setTypeFilter("")}
          className={`rounded-xl px-3 py-2 text-[13px] font-medium transition-colors ${
            !typeFilter ? "bg-emerald-500/10 text-emerald-400" : "text-white/40 hover:bg-white/5 hover:text-white/60"
          }`}
        >
          Tout
        </button>
        {types.map((t) => {
          const ti = typeIcons[t] ?? typeIcons.post;
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors ${
                typeFilter === t ? `${ti.bg} ${ti.color}` : "text-white/40 hover:bg-white/5 hover:text-white/60"
              }`}
            >
              <Icon name={ti.icon} className="h-3.5 w-3.5" />
              {typeLabels[t] ?? t}
            </button>
          );
        })}
      </div>

      {/* Activity list */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111c18] p-4 sm:p-5">
        {filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((a, idx) => {
              const ai = typeIcons[a.type] ?? typeIcons.post;
              return (
                <div key={idx} className="flex items-center gap-3 rounded-xl bg-white/[0.02] px-3 py-3 sm:px-4">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ai.bg}`}>
                    <Icon name={ai.icon} className={`h-4 w-4 ${ai.color}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-white/80">{a.title}</p>
                    <p className="truncate text-[11px] text-white/30">{a.detail}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium ${ai.bg} ${ai.color}`}>
                      {typeLabels[a.type] ?? a.type}
                    </span>
                    <p className="mt-0.5 text-[11px] text-white/25">{timeAgo(a.date, "fr")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-8 text-center text-[13px] text-white/30">Aucune activité</p>
        )}
      </div>
    </div>
  );
}
