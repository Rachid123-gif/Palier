"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { longDate, shortDate } from "@/lib/format";
import { createAssembly, updateAssembly, deleteAssembly, notifyAssembly } from "@/lib/actions";
import { supabase } from "@/lib/supabase";
import type { AssemblyRow } from "@/lib/syndic";

const statusTabs: { key: "all" | "upcoming" | "past"; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "upcoming", label: "À venir" },
  { key: "past", label: "Passées" },
];

type AgendaItem = { n: number; t: string; d: string };

export function AgView({ assemblies, buildingId, residentProfileIds }: {
  assemblies: AssemblyRow[];
  buildingId: string;
  residentProfileIds: string[];
}) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "past">("all");
  const [search, setSearch] = useState("");

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<AssemblyRow | null>(null);
  const [showResults, setShowResults] = useState<AssemblyRow | null>(null);
  const [showDelete, setShowDelete] = useState<AssemblyRow | null>(null);

  // Create form
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [place, setPlace] = useState("");
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([{ n: 1, t: "", d: "" }]);

  // Results form
  const [resQuorum, setResQuorum] = useState("");
  const [resVotes, setResVotes] = useState<{ q: string; pour: string; contre: string; abst: string }[]>([]);
  const [resSummary, setResSummary] = useState("");
  const [resPvFile, setResPvFile] = useState<File | null>(null);
  const [resPvUrl, setResPvUrl] = useState("");
  const [resSaving, setResSaving] = useState(false);
  const [pvUploading, setPvUploading] = useState(false);

  const flash = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); }, []);

  const now = new Date();
  const isUpcoming = (ag: AssemblyRow) => new Date(ag.date) >= now;
  const isPast = (ag: AssemblyRow) => new Date(ag.date) < now;

  // KPIs
  const totalAgs = assemblies.length;
  const pastAgs = assemblies.filter(isPast);
  const avgQuorum = pastAgs.length > 0 ? Math.round(pastAgs.reduce((s, a) => s + a.quorum, 0) / pastAgs.length) : 0;
  const nextAg = assemblies.find(isUpcoming);

  // Counts
  const counts = useMemo(() => ({
    all: assemblies.length,
    upcoming: assemblies.filter(isUpcoming).length,
    past: assemblies.filter(isPast).length,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [assemblies]);

  // Filtered
  const filtered = useMemo(() => {
    let result = [...assemblies];
    if (statusFilter === "upcoming") result = result.filter(isUpcoming);
    if (statusFilter === "past") result = result.filter(isPast);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((ag) =>
        ag.place.toLowerCase().includes(q) ||
        ag.agenda.some((a) => a.t.toLowerCase().includes(q))
      );
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assemblies, statusFilter, search]);

  // Create AG
  function resetCreate() { setDate(""); setTime("18:00"); setPlace(""); setAgendaItems([{ n: 1, t: "", d: "" }]); }
  function addItem() { setAgendaItems((p) => [...p, { n: p.length + 1, t: "", d: "" }]); }
  function removeItem(i: number) { setAgendaItems((p) => p.filter((_, j) => j !== i).map((item, j) => ({ ...item, n: j + 1 }))); }
  function updateItem(i: number, f: "t" | "d", v: string) { setAgendaItems((p) => p.map((item, j) => (j === i ? { ...item, [f]: v } : item))); }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !place || agendaItems.some((a) => !a.t)) return;
    setSaving(true);
    await createAssembly({ buildingId, date, time, place, agenda: agendaItems });
    setSaving(false);
    setShowCreate(false);
    resetCreate();
    flash("Assemblée convoquée");
    router.refresh();
  }

  // Results
  function openResults(ag: AssemblyRow) {
    setResQuorum(ag.quorum > 0 ? ag.quorum.toString() : "");
    setResVotes(ag.agenda.map((a) => {
      const existing = ag.votes.find((v) => v.q === a.t);
      return {
        q: a.t,
        pour: existing ? existing.pour.toString() : "",
        contre: existing ? existing.contre.toString() : "",
        abst: existing ? existing.abst.toString() : "",
      };
    }));
    setResSummary(ag.summary);
    setResPvUrl(ag.pvUrl);
    setResPvFile(null);
    setShowResults(ag);
  }

  async function uploadPv(file: File, assemblyId: string): Promise<string> {
    const ext = file.name.split(".").pop() ?? "pdf";
    const path = `pv/${assemblyId}.${ext}`;
    await supabase.storage.from("documents").upload(path, file, { upsert: true });
    const { data } = supabase.storage.from("documents").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleResults(e: React.FormEvent) {
    e.preventDefault();
    if (!showResults) return;
    setResSaving(true);
    let pvUrl = resPvUrl;
    if (resPvFile) {
      setPvUploading(true);
      pvUrl = await uploadPv(resPvFile, showResults.id);
      setPvUploading(false);

      // Also register in documents table so it appears in Documents page
      const sizeKB = Math.round(resPvFile.size / 1024);
      const sizeLabel = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
      await supabase.from("documents").upsert({
        building_id: buildingId,
        title: `PV Assemblée du ${longDate(showResults.date)}`,
        doc_type: "pv",
        doc_date: showResults.date,
        size: sizeLabel,
        url: pvUrl,
        ref_id: showResults.id,
      }, { onConflict: "ref_id" });
    }
    const votes = resVotes
      .filter((v) => v.pour || v.contre || v.abst)
      .map((v) => ({
        q: v.q,
        pour: Number(v.pour) || 0,
        contre: Number(v.contre) || 0,
        abst: Number(v.abst) || 0,
      }));
    await updateAssembly({ assemblyId: showResults.id, quorum: Number(resQuorum) || 0, votes, summary: resSummary, pvUrl });
    setResSaving(false);
    setShowResults(null);
    flash("Résultats enregistrés");
    router.refresh();
  }

  // Notify
  async function handleNotify(ag: AssemblyRow) {
    if (residentProfileIds.length === 0) { flash("Aucun résident à notifier"); return; }
    await notifyAssembly({ profileIds: residentProfileIds, date: longDate(ag.date), place: ag.place });
    flash(`${residentProfileIds.length} résidents notifiés`);
  }

  // Delete
  async function handleDelete() {
    if (!showDelete) return;
    await deleteAssembly(showDelete.id);
    setShowDelete(null);
    flash("Assemblée annulée");
    router.refresh();
  }

  // Export CSV
  function exportCSV() {
    const header = "Date,Heure,Lieu,Points à l'ordre du jour,Quorum,Résolutions";
    const csvRows = filtered.map((ag) =>
      `${ag.date},${ag.time},"${ag.place.replace(/"/g, '""')}",${ag.agenda.length},${ag.quorum}%,${ag.votes.length}`
    );
    const csv = [header, ...csvRows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `palier-ag-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    flash("Export CSV téléchargé");
  }

  const inputCls = "h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20";

  return (
    <div>
      <PageHeader
        title="Assemblées générales"
        subtitle={`${totalAgs} assemblée${totalAgs > 1 ? "s" : ""}${nextAg ? ` · Prochaine le ${shortDate(nextAg.date)}` : ""}`}
        action={
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-palier-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-palier-700">
            <Icon name="Plus" className="h-3.5 w-3.5" /> Convoquer une assemblée
          </button>
        }
      />

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-4 py-3">
        <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
        <p className="text-[12px] text-ink-soft">
          Les résidents voient les assemblées convoquées, l&apos;ordre du jour et les résultats des votes dans leur application. Ils sont notifiés automatiquement lorsque vous cliquez sur « Notifier ».
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">Total assemblées</p>
          <p className="text-[28px] font-bold leading-none text-ink">{totalAgs}</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">Quorum moyen</p>
          <p className="text-[28px] font-bold leading-none text-ink">{avgQuorum}%</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">Prochaine assemblée</p>
          <p className="text-[16px] font-bold leading-none text-ink">{nextAg ? longDate(nextAg.date) : "—"}</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="no-scrollbar mb-3 flex items-center gap-3 overflow-x-auto border-b border-black/[0.06]">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`relative whitespace-nowrap pb-2.5 text-[13px] font-semibold transition-colors ${statusFilter === tab.key ? "text-palier-700" : "text-ink-soft hover:text-ink"}`}
          >
            {tab.label}
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold ${statusFilter === tab.key ? "bg-palier-50 text-palier-700" : "text-ink-faint"}`}>{counts[tab.key]}</span>
            {statusFilter === tab.key && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-palier-600" />}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-3 space-y-2">
        <div className="relative">
          <Icon name="Search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="h-9 w-full rounded-lg border border-black/[0.08] bg-white pl-9 pr-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink">
              <Icon name="X" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-cream-card shadow-card">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Icon name="CalendarDays" className="mx-auto h-8 w-8 text-ink-faint" />
            <p className="mt-2 text-[13px] text-ink-soft">{assemblies.length === 0 ? "Aucune assemblée programmée" : "Aucun résultat"}</p>
            {assemblies.length === 0 ? (
              <button onClick={() => setShowCreate(true)} className="mt-1 text-[13px] font-medium text-palier-600">Convoquer une assemblée</button>
            ) : (
              <button onClick={() => { setStatusFilter("all"); setSearch(""); }} className="mt-1 text-[13px] font-medium text-palier-600">Réinitialiser les filtres</button>
            )}
          </div>
        ) : (
          <>
          <table className="hidden w-full table-fixed text-left text-[13px] md:table">
            <thead>
              <tr className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                <th className="w-[22%] px-4 py-2.5">Date</th>
                <th className="w-[18%] px-4 py-2.5">Lieu</th>
                <th className="w-[12%] px-4 py-2.5">Agenda</th>
                <th className="w-[12%] px-4 py-2.5">Quorum</th>
                <th className="w-[12%] px-4 py-2.5">Votes</th>
                <th className="w-[24%] px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {filtered.map((ag) => {
                const upcoming = isUpcoming(ag);
                const hasResults = ag.quorum > 0 || ag.votes.length > 0;
                return (
                  <tr key={ag.id} className={`transition-colors hover:bg-sand/50 ${isPast(ag) && !hasResults ? "opacity-60" : ""}`}>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-ink">{longDate(ag.date)}</p>
                      <span className={`mt-0.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${upcoming ? "bg-palier-50 text-palier-700" : "bg-sand/80 text-ink-soft"}`}>
                        {upcoming ? "À venir" : "Passée"}
                      </span>
                    </td>
                    <td className="overflow-hidden px-4 py-2.5">
                      <p className="truncate text-ink-soft">{ag.place || "—"}</p>
                      <p className="text-[11px] text-ink-faint">{ag.time}</p>
                    </td>
                    <td className="px-4 py-2.5 text-ink-soft">{ag.agenda.length} point{ag.agenda.length > 1 ? "s" : ""}</td>
                    <td className="px-4 py-2.5">
                      {ag.quorum > 0 ? (
                        <span className="font-medium text-ink">{ag.quorum}%</span>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-ink-soft">{ag.votes.length > 0 ? `${ag.votes.length} résol.` : "—"}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setSelected(ag)} className="text-[11px] font-semibold text-palier-600 hover:underline">
                          Détails
                        </button>
                        {upcoming && (
                          <>
                            <button onClick={() => handleNotify(ag)} className="rounded-md bg-palier-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-palier-700">
                              Notifier
                            </button>
                            <button onClick={() => setShowDelete(ag)} className="text-[11px] font-semibold text-red-500 hover:underline">
                              Annuler
                            </button>
                          </>
                        )}
                        {!upcoming && !hasResults && (
                          <button onClick={() => openResults(ag)} className="rounded-md bg-palier-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-palier-700">
                            Saisir résultats
                          </button>
                        )}
                        {!upcoming && hasResults && (
                          <button onClick={() => openResults(ag)} className="text-[11px] font-semibold text-ink-soft hover:underline">
                            Modifier
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="divide-y divide-black/[0.04] md:hidden">
            {filtered.map((ag) => {
              const upcoming = isUpcoming(ag);
              const hasResults = ag.quorum > 0 || ag.votes.length > 0;
              return (
                <div key={ag.id} className={`p-4 ${isPast(ag) && !hasResults ? "opacity-60" : ""}`}>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[14px] font-medium text-ink">{longDate(ag.date)}</p>
                      <p className="mt-0.5 text-[12px] text-ink-soft">{ag.time} · {ag.place || "—"}</p>
                    </div>
                    <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${upcoming ? "bg-palier-50 text-palier-700" : "bg-sand/80 text-ink-soft"}`}>
                      {upcoming ? "À venir" : "Passée"}
                    </span>
                  </div>
                  <div className="mb-2.5 flex items-center gap-3 text-[12px] text-ink-soft">
                    <span>{ag.agenda.length} point{ag.agenda.length > 1 ? "s" : ""}</span>
                    {ag.quorum > 0 && <span>Quorum {ag.quorum}%</span>}
                    {ag.votes.length > 0 && <span>{ag.votes.length} résol.</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelected(ag)} className="text-[12px] font-semibold text-palier-600">Détails</button>
                    {upcoming && (
                      <>
                        <button onClick={() => handleNotify(ag)} className="rounded-md bg-palier-600 px-2.5 py-1 text-[11px] font-semibold text-white">Notifier</button>
                        <button onClick={() => setShowDelete(ag)} className="text-[11px] font-semibold text-red-500">Annuler</button>
                      </>
                    )}
                    {!upcoming && !hasResults && (
                      <button onClick={() => openResults(ag)} className="rounded-md bg-palier-600 px-2.5 py-1 text-[11px] font-semibold text-white">Saisir résultats</button>
                    )}
                    {!upcoming && hasResults && (
                      <button onClick={() => openResults(ag)} className="text-[11px] font-semibold text-ink-soft">Modifier</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-[16px] font-semibold text-ink">Assemblée du {longDate(selected.date)}</h2>
                <p className="mt-0.5 text-[12px] text-ink-soft">{selected.time} · {selected.place}</p>
                <span className={`mt-1.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${isUpcoming(selected) ? "bg-palier-50 text-palier-700" : "bg-sand/80 text-ink-soft"}`}>
                  {isUpcoming(selected) ? "À venir" : "Passée"}{selected.quorum > 0 ? ` · Quorum ${selected.quorum}%` : ""}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>

            {selected.agenda.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 text-[13px] font-semibold text-ink">Ordre du jour</h3>
                <ol className="space-y-2">
                  {selected.agenda.map((a, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-palier-50 text-[11px] font-medium text-ink-soft">{a.n || i + 1}</span>
                      <div>
                        <p className="text-[13px] text-ink">{a.t}</p>
                        {a.d && <p className="text-[12px] text-ink-soft">{a.d}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {selected.votes.length > 0 && (
              <div>
                <h3 className="mb-2 text-[13px] font-semibold text-ink">Résultats des votes</h3>
                <div className="space-y-3">
                  {selected.votes.map((v, i) => (
                    <div key={i}>
                      <p className="mb-1.5 text-[13px] font-medium text-ink">{v.q}</p>
                      <div className="flex h-2 overflow-hidden rounded-full bg-sand/50">
                        <div style={{ width: `${v.pour}%` }} className="bg-emerald-500" />
                        <div style={{ width: `${v.contre}%` }} className="bg-red-400" />
                        <div style={{ width: `${v.abst}%` }} className="bg-gray-300" />
                      </div>
                      <div className="mt-1 flex gap-3 text-[11px] text-ink-soft">
                        <span className="text-emerald-600">Pour {v.pour}%</span>
                        <span className="text-red-500">Contre {v.contre}%</span>
                        <span>Abst. {v.abst}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.summary && (
              <div className="mb-4">
                <h3 className="mb-2 text-[13px] font-semibold text-ink">Compte-rendu</h3>
                <p className="whitespace-pre-wrap rounded-lg bg-white p-3 text-[13px] text-ink-soft">{selected.summary}</p>
              </div>
            )}

            {selected.pvUrl && (
              <div className="mb-4">
                <h3 className="mb-2 text-[13px] font-semibold text-ink">Procès-verbal</h3>
                <a href={selected.pvUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-lg border border-black/[0.06] bg-white px-3 py-2 text-[12px] font-medium text-palier-600 hover:bg-sand/50">
                  <Icon name="FileText" className="h-4 w-4" />
                  Voir le PV
                  <Icon name="ExternalLink" className="h-3 w-3" />
                </a>
              </div>
            )}

            <div className="mt-5 flex gap-2">
              {isUpcoming(selected) && (
                <button onClick={() => { setSelected(null); handleNotify(selected); }} className="flex-1 rounded-xl bg-palier-600 py-2.5 text-[13px] font-semibold text-white hover:bg-palier-700">
                  Notifier les résidents
                </button>
              )}
              {isPast(selected) && (
                <button onClick={() => { setSelected(null); openResults(selected); }} className="flex-1 rounded-xl bg-palier-600 py-2.5 text-[13px] font-semibold text-white hover:bg-palier-700">
                  {selected.quorum > 0 ? "Modifier les résultats" : "Saisir les résultats"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results modal */}
      {showResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowResults(null)}>
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-palier-100">
                  <Icon name="ClipboardCheck" className="h-5 w-5 text-palier-600" />
                </span>
                <div>
                  <h2 className="text-[16px] font-semibold text-ink">Résultats de l&apos;assemblée</h2>
                  <p className="text-[12px] text-ink-soft">{longDate(showResults.date)}</p>
                </div>
              </div>
              <button onClick={() => setShowResults(null)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleResults} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Quorum atteint (%)</label>
                <input type="number" min="0" max="100" value={resQuorum} onChange={(e) => setResQuorum(e.target.value)} placeholder="67" className={inputCls} />
              </div>

              {resVotes.length > 0 && (
                <div>
                  <p className="mb-2 text-[12px] font-semibold text-ink">Votes par résolution</p>
                  <div className="max-h-64 space-y-3 overflow-y-auto">
                    {resVotes.map((v, i) => (
                      <div key={i} className="rounded-lg border border-black/[0.06] p-3">
                        <p className="mb-2 text-[12px] font-medium text-ink">{v.q}</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-emerald-600">Pour %</label>
                            <input type="number" min="0" max="100" value={v.pour} onChange={(e) => { const n = [...resVotes]; n[i].pour = e.target.value; setResVotes(n); }} className={inputCls} />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-red-500">Contre %</label>
                            <input type="number" min="0" max="100" value={v.contre} onChange={(e) => { const n = [...resVotes]; n[i].contre = e.target.value; setResVotes(n); }} className={inputCls} />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-ink-soft">Abst. %</label>
                            <input type="number" min="0" max="100" value={v.abst} onChange={(e) => { const n = [...resVotes]; n[i].abst = e.target.value; setResVotes(n); }} className={inputCls} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Compte-rendu</label>
                <textarea
                  value={resSummary}
                  onChange={(e) => setResSummary(e.target.value)}
                  placeholder="Résumé des discussions, décisions prises, remarques…"
                  rows={4}
                  className="w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Procès-verbal (PDF ou image)</label>
                {resPvUrl && !resPvFile && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg border border-black/[0.06] bg-white px-3 py-2">
                    <Icon name="FileText" className="h-4 w-4 text-palier-600" />
                    <a href={resPvUrl} target="_blank" rel="noopener" className="flex-1 truncate text-[12px] font-medium text-palier-600 hover:underline">Voir le PV actuel</a>
                    <button type="button" onClick={() => setResPvUrl("")} className="text-ink-faint hover:text-red-500"><Icon name="X" className="h-3.5 w-3.5" /></button>
                  </div>
                )}
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[12px] font-medium text-ink transition-colors hover:bg-sand/50">
                  <Icon name="Upload" className="h-3.5 w-3.5" />
                  {resPvFile ? resPvFile.name : "Importer un fichier"}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setResPvFile(e.target.files?.[0] ?? null)} className="hidden" />
                </label>
                {pvUploading && <p className="mt-1 text-[11px] text-ink-soft">Téléversement en cours…</p>}
              </div>

              <button type="submit" disabled={resSaving} className="w-full rounded-xl bg-palier-600 py-2.5 text-[13px] font-semibold text-white hover:bg-palier-700 disabled:opacity-50">
                {resSaving ? "Enregistrement…" : "Enregistrer les résultats"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create AG modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => { setShowCreate(false); resetCreate(); }}>
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-palier-100">
                  <Icon name="CalendarDays" className="h-5 w-5 text-palier-600" />
                </span>
                <div>
                  <h2 className="text-[16px] font-semibold text-ink">Convoquer une assemblée</h2>
                  <p className="text-[12px] text-ink-soft">Définir la date, le lieu et l&apos;ordre du jour</p>
                </div>
              </div>
              <button onClick={() => { setShowCreate(false); resetCreate(); }} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Date</label><input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} /></div>
                <div><label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Heure</label><input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} /></div>
              </div>
              <div><label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Lieu</label><input type="text" required placeholder="Hall de l'immeuble" value={place} onChange={(e) => setPlace(e.target.value)} className={inputCls} /></div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-ink-soft">Ordre du jour</span>
                  <button type="button" onClick={addItem} className="text-[12px] font-medium text-palier-600">+ Ajouter</button>
                </div>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {agendaItems.map((item, i) => (
                    <div key={i} className="rounded-lg border border-black/[0.06] p-2.5">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-ink-soft">Point {item.n}</span>
                        {agendaItems.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-ink-faint hover:text-red-500"><Icon name="Trash2" className="h-3 w-3" /></button>}
                      </div>
                      <input type="text" required placeholder="Titre" value={item.t} onChange={(e) => updateItem(i, "t", e.target.value)} className={`mb-1 ${inputCls}`} />
                      <input type="text" placeholder="Description (optionnel)" value={item.d} onChange={(e) => updateItem(i, "d", e.target.value)} className={inputCls} />
                    </div>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full rounded-xl bg-palier-600 py-2.5 text-[13px] font-semibold text-white hover:bg-palier-700 disabled:opacity-50">
                {saving ? "Envoi…" : "Convoquer l'assemblée"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[16px] font-semibold text-ink">Annuler cette assemblée ?</h2>
            <p className="mt-1 text-[13px] text-ink-soft">L&apos;assemblée du {longDate(showDelete.date)} à {showDelete.place} sera définitivement supprimée.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowDelete(null)} className="flex-1 rounded-xl border border-black/[0.08] py-2.5 text-[13px] font-semibold text-ink hover:bg-sand/50">
                Non, garder
              </button>
              <button onClick={handleDelete} className="flex-1 rounded-xl bg-red-600 py-2.5 text-[13px] font-semibold text-white hover:bg-red-700">
                Oui, annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 animate-[rise_0.25s_ease] rounded-lg bg-palier-600 px-4 py-2.5 text-[13px] font-medium text-white shadow-lg">{toast}</div>}
    </div>
  );
}
