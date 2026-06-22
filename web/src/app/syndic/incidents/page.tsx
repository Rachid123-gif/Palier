import { fetchSyndicData } from "@/lib/syndic";
import { PageHeader, StatusPill } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { timeAgo } from "@/lib/format";

const cols = [
  { key: "open", label: "Ouverts", accent: "text-warning" },
  { key: "in_progress", label: "En cours", accent: "text-info" },
  { key: "resolved", label: "Résolus", accent: "text-success" },
];

type Inc = { id: string; title: string; details: string; urgency: string; status: string; reporter_name: string; created_at: string; messages_count: number };

export default async function SyndicIncidents() {
  const d = await fetchSyndicData();
  const incidents = d.incidents as Inc[];
  return (
    <div className="animate-[fade_0.3s_ease]">
      <PageHeader title="Incidents" subtitle={`${d.kpis.openIncidents} en cours · signalés par les résidents en temps réel`} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cols.map((c) => {
          const items = incidents.filter((i) => i.status === c.key);
          return (
            <div key={c.key} className="rounded-2xl border border-black/5 bg-[#faf8f3] p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className={`text-[13px] font-bold uppercase tracking-wide ${c.accent}`}>{c.label}</h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-ink-soft">{items.length}</span>
              </div>
              <div className="space-y-2.5">
                {items.length === 0 && <p className="px-1 py-6 text-center text-[12px] text-ink-faint">Aucun incident</p>}
                {items.map((i) => (
                  <div key={i.id} className="rounded-xl border border-black/5 bg-white p-3 shadow-[0_1px_2px_rgba(20,32,29,0.04)]">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13.5px] font-semibold text-ink">{i.title}</p>
                      {i.urgency === "urgent" && <span className="shrink-0 rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-white">Urgent</span>}
                    </div>
                    <p className="mt-1 line-clamp-2 text-[12px] text-ink-soft">{i.details}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-ink-faint">
                      <span>{i.reporter_name} · {timeAgo(i.created_at)}</span>
                      <span className="inline-flex items-center gap-1"><Icon name="MessageCircle" className="h-3 w-3" /> {i.messages_count}</span>
                    </div>
                    <div className="mt-2.5 flex gap-2">
                      <button className="tap flex-1 rounded-lg bg-palier-50 py-1.5 text-[12px] font-semibold text-palier-700">Assigner</button>
                      {i.status !== "resolved" && <button className="tap flex-1 rounded-lg bg-success-soft py-1.5 text-[12px] font-semibold text-success">Marquer résolu</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
