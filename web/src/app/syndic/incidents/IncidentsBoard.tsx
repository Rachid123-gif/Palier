"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { assignIncident, resolveIncident } from "@/lib/actions";
import { PageHeader } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { timeAgo } from "@/lib/format";

type Inc = {
  id: string;
  title: string;
  details: string;
  urgency: string;
  status: string;
  reporter_name: string;
  created_at: string;
  messages_count: number;
};

const cols = [
  { key: "open", label: "Ouverts", color: "text-amber-600" },
  { key: "in_progress", label: "En cours", color: "text-blue-600" },
  { key: "resolved", label: "Résolus", color: "text-emerald-600" },
] as const;

function IncidentCard({ incident, onAssign, onResolve }: {
  incident: Inc; onAssign: (id: string) => void; onResolve: (id: string) => void;
}) {
  const [ap, startA] = useTransition();
  const [rp, startR] = useTransition();

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-3 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-ink">{incident.title}</p>
        {incident.urgency === "urgent" && (
          <span className="shrink-0 rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600">Urgent</span>
        )}
      </div>
      <p className="mt-1 line-clamp-2 text-[12px] text-ink-soft">{incident.details}</p>
      <p className="mt-2 text-[11px] text-ink-soft">{incident.reporter_name} · {timeAgo(incident.created_at)}</p>
      <div className="mt-2 flex gap-1.5">
        {incident.status === "open" && (
          <button disabled={ap} onClick={() => startA(() => onAssign(incident.id))}
            className="flex-1 rounded-md bg-palier-50 py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-[#eaeae9] disabled:opacity-50">
            {ap ? "…" : "Assigner"}
          </button>
        )}
        {incident.status !== "resolved" && (
          <button disabled={rp} onClick={() => startR(() => onResolve(incident.id))}
            className="flex-1 rounded-md bg-emerald-50 py-1.5 text-[12px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50">
            {rp ? "…" : "Résolu"}
          </button>
        )}
      </div>
    </div>
  );
}

export function IncidentsBoard({ incidents, openCount }: { incidents: Inc[]; openCount: number }) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);

  const flash = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); }, []);
  const handleAssign = useCallback(async (id: string) => { await assignIncident(id); flash("Incident assigné"); router.refresh(); }, [router, flash]);
  const handleResolve = useCallback(async (id: string) => { await resolveIncident(id); flash("Incident résolu"); router.refresh(); }, [router, flash]);

  return (
    <div>
      <PageHeader title="Incidents" subtitle={`${openCount} ouverts`} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cols.map((c) => {
          const items = incidents.filter((i) => i.status === c.key);
          return (
            <div key={c.key}>
              <div className="mb-2 flex items-center gap-2 px-0.5">
                <span className={`text-[12px] font-medium ${c.color}`}>{c.label}</span>
                <span className="text-[12px] text-ink-soft">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.length === 0 && <p className="py-8 text-center text-[12px] text-ink-soft">Aucun incident</p>}
                {items.map((i) => <IncidentCard key={i.id} incident={i} onAssign={handleAssign} onResolve={handleResolve} />)}
              </div>
            </div>
          );
        })}
      </div>

      {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 animate-[rise_0.25s_ease] rounded-lg bg-palier-600 px-4 py-2.5 text-[13px] font-medium text-white shadow-lg">{toast}</div>}
    </div>
  );
}
