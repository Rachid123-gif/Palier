"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { PageHeader } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { longDate, shortDate, mad } from "@/lib/format";
import { useLang } from "@/lib/LangProvider";
import { createAssembly, updateAssembly, deleteAssembly, notifyAssembly, createResolution, updateResolutionResult, deleteResolution, fetchVoteTallies, updateBudgetStatus, createPostSyndic } from "@/lib/actions";
import { uploadFileAction } from "@/lib/actions";
import { upsertDocument } from "@/lib/actions";
import type { AssemblyRow } from "@/lib/syndic";
import type { Resolution, MajorityType } from "@/lib/types";

/* ═══ Constants ═══ */

const RESULT_COLORS: Record<string, string> = {
  adoptee: "text-emerald-600",
  rejetee: "text-red-600",
  reportee: "text-amber-600",
};

const MIN_NOTICE_DAYS = 15;

type AgendaItem = { n: number; t: string; d: string };

/* ═══ Props ═══ */

interface Resident {
  id: string;
  name: string;
  unit: string;
  unitId: string;
  tantiemes: number;
}

interface BudgetOption {
  id: string;
  fiscalYear: number;
  status: string;
  totalAmount: number;
}

export function AgView({ assemblies, buildingId, residentProfileIds, residents, totalTantiemes, budgets = [] }: {
  assemblies: AssemblyRow[];
  buildingId: string;
  residentProfileIds: string[];
  residents: Resident[];
  totalTantiemes: number;
  budgets?: BudgetOption[];
}) {
  const { i, lang } = useLang();
  const T = i.syndic.ag;
  const C = i.syndic.common;

  const statusTabs: { key: "all" | "upcoming" | "past"; label: string }[] = [
    { key: "all", label: T.tabs.all },
    { key: "upcoming", label: T.tabs.upcoming },
    { key: "past", label: T.tabs.past },
  ];

  const MAJORITY_LABELS: Record<MajorityType, string> = {
    simple: T.majority.simple,
    trois_quarts: T.majority.threeQuarters,
    unanimite: T.majority.unanimity,
  };

  const RESULT_LABELS: Record<string, string> = {
    adoptee: T.results.adopted,
    rejetee: T.results.rejected,
    reportee: T.results.postponed,
  };

  const [localAssemblies, setLocalAssemblies] = useState<AssemblyRow[]>(assemblies);
  useEffect(() => { setLocalAssemblies(assemblies); }, [assemblies]);

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
  const [agType, setAgType] = useState<"ordinaire" | "extraordinaire">("ordinaire");
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([{ n: 1, t: "", d: "" }]);
  const [dateError, setDateError] = useState("");

  // Results form
  const [resSaving, setResSaving] = useState(false);
  const [resSummary, setResSummary] = useState("");
  const [resPvFile, setResPvFile] = useState<File | null>(null);
  const [resPvUrl, setResPvUrl] = useState("");
  const [pvUploading, setPvUploading] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState("");

  // Attendance (feuille de présence)
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set());
  const [proxyMap, setProxyMap] = useState<Map<string, string>>(new Map()); // absent profileId → present profileId

  // Resolutions
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [showAddResolution, setShowAddResolution] = useState(false);
  const [newResTitle, setNewResTitle] = useState("");
  const [newResDesc, setNewResDesc] = useState("");
  const [newResMajority, setNewResMajority] = useState<MajorityType>("simple");
  const [resolutionResults, setResolutionResults] = useState<Map<string, { result: string; pour: number; contre: number; abst: number }>>(new Map());

  // Vote tallies from residents
  type VoteTally = Record<string, { total: number; choices: Record<string, number> }>;
  const [voteTallies, setVoteTallies] = useState<VoteTally>({});
  const [talliesLoading, setTalliesLoading] = useState(false);
  const [talliesAssemblyId, setTalliesAssemblyId] = useState<string | null>(null);

  const flash = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); }, []);

  const now = new Date();
  const isUpcoming = (ag: AssemblyRow) => new Date(ag.date) >= now;
  const isPast = (ag: AssemblyRow) => new Date(ag.date) < now;

  // KPIs
  const totalAgs = localAssemblies.length;
  const pastAgs = localAssemblies.filter(isPast);
  const avgQuorum = pastAgs.length > 0 ? Math.round(pastAgs.reduce((s, a) => s + a.quorum, 0) / pastAgs.length) : 0;
  const nextAg = localAssemblies.find(isUpcoming);

  // Counts
  const counts = useMemo(() => ({
    all: localAssemblies.length,
    upcoming: localAssemblies.filter(isUpcoming).length,
    past: localAssemblies.filter(isPast).length,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [localAssemblies]);

  // Filtered
  const filtered = useMemo(() => {
    let result = [...localAssemblies];
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
  }, [localAssemblies, statusFilter, search]);

  // ───── Quorum calculation ─────
  const presentTantiemes = useMemo(() => {
    let total = 0;
    for (const r of residents) {
      if (presentIds.has(r.id)) {
        total += r.tantiemes;
        // Add tantièmes of residents who delegated to this person
        for (const [absentId, delegateId] of proxyMap) {
          if (delegateId === r.id) {
            const absent = residents.find((x) => x.id === absentId);
            if (absent) total += absent.tantiemes;
          }
        }
      }
    }
    return total;
  }, [presentIds, proxyMap, residents]);

  const quorumPct = totalTantiemes > 0 ? Math.round((presentTantiemes / totalTantiemes) * 100) : 0;
  const quorumMet = presentTantiemes >= Math.ceil(totalTantiemes / 4); // ≥ 1/4

  // ───── Create AG ─────
  function resetCreate() {
    setDate(""); setTime("18:00"); setPlace(""); setAgType("ordinaire");
    setAgendaItems([{ n: 1, t: "", d: "" }]); setDateError("");
  }
  function addItem() { setAgendaItems((p) => [...p, { n: p.length + 1, t: "", d: "" }]); }
  function removeItem(i: number) { setAgendaItems((p) => p.filter((_, j) => j !== i).map((item, j) => ({ ...item, n: j + 1 }))); }
  function updateItem(i: number, f: "t" | "d", v: string) { setAgendaItems((p) => p.map((item, j) => (j === i ? { ...item, [f]: v } : item))); }

  function validateDate(d: string): boolean {
    if (!d) return false;
    const selected = new Date(d);
    const min = new Date();
    min.setDate(min.getDate() + MIN_NOTICE_DAYS);
    min.setHours(0, 0, 0, 0);
    if (selected < min) {
      setDateError(T.create.dateError(MIN_NOTICE_DAYS));
      return false;
    }
    setDateError("");
    return true;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !place || agendaItems.some((a) => !a.t)) return;
    if (!validateDate(date)) return;
    setSaving(true);
    try {
      await createAssembly({ buildingId, date, time, place, type: agType, agenda: agendaItems });
      const optimistic: AssemblyRow = {
        id: crypto.randomUUID(),
        date,
        time,
        place,
        type: agType,
        status: "convoquee",
        agenda: agendaItems,
        votes: [],
        resolutions: [],
        quorum: 0,
        summary: "",
        pvUrl: "",
        convocationSentAt: null,
        pvSentAt: null,
        pvDistributed: false,
      };
      setLocalAssemblies((prev) => [optimistic, ...prev]);
      setShowCreate(false);
      resetCreate();
      flash(T.flash.convoked);
    } catch {
      flash(T.flash.createError);
    } finally {
      setSaving(false);
    }
  }

  // ───── Results modal ─────
  function openResults(ag: AssemblyRow) {
    setResSummary(ag.summary);
    setResPvUrl(ag.pvUrl);
    setResPvFile(null);
    setResolutions(ag.resolutions);

    // Init attendance: if quorum already recorded, estimate from it
    setPresentIds(new Set());
    setProxyMap(new Map());

    // Init resolution results from existing data
    const rMap = new Map<string, { result: string; pour: number; contre: number; abst: number }>();
    for (const r of ag.resolutions) {
      if (r.result) {
        rMap.set(r.id, {
          result: r.result,
          pour: r.pourTantiemes,
          contre: r.contreTantiemes,
          abst: r.abstentionTantiemes,
        });
      }
    }
    setResolutionResults(rMap);
    setShowResults(ag);
  }

  async function uploadPv(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadFileAction(fd);
    if (res.error || !res.url) throw new Error(res.error ?? "upload_failed");
    return res.url;
  }

  // Add resolution
  async function handleAddResolution() {
    if (!showResults || !newResTitle.trim()) return;
    const num = resolutions.length + 1;
    try {
      await createResolution({
        assemblyId: showResults.id,
        number: num,
        title: newResTitle.trim(),
        description: newResDesc.trim() || undefined,
        majorityType: newResMajority,
      });
      const optimisticRes: Resolution = {
        id: crypto.randomUUID(),
        assemblyId: showResults.id,
        number: num,
        title: newResTitle.trim(),
        description: newResDesc.trim() || undefined,
        majorityType: newResMajority,
        pourTantiemes: 0,
        contreTantiemes: 0,
        abstentionTantiemes: 0,
        pourCount: 0,
        contreCount: 0,
        abstentionCount: 0,
      };
      setResolutions((prev) => [...prev, optimisticRes]);
      // Also update the assembly in local state and the showResults reference
      const updatedResolutions = [...showResults.resolutions, optimisticRes];
      setShowResults({ ...showResults, resolutions: updatedResolutions });
      setLocalAssemblies((prev) =>
        prev.map((a) => a.id === showResults.id ? { ...a, resolutions: updatedResolutions } : a)
      );
      setNewResTitle(""); setNewResDesc(""); setNewResMajority("simple");
      setShowAddResolution(false);
      flash(T.flash.resolutionAdded);
    } catch {
      flash(T.flash.resolutionAddError);
    }
  }

  // Delete resolution
  async function handleDeleteResolution(resId: string) {
    try {
      await deleteResolution(resId);
      setResolutions((prev) => prev.filter((r) => r.id !== resId));
      if (showResults) {
        const updatedResolutions = showResults.resolutions.filter((r) => r.id !== resId);
        setShowResults({ ...showResults, resolutions: updatedResolutions });
        setLocalAssemblies((prev) =>
          prev.map((a) => a.id === showResults.id ? { ...a, resolutions: updatedResolutions } : a)
        );
      }
      flash(T.flash.resolutionDeleted);
    } catch {
      flash(T.flash.resolutionDeleteError);
    }
  }

  // Save results
  async function handleResults(e: React.FormEvent) {
    e.preventDefault();
    if (!showResults) return;
    setResSaving(true);

    try {
      // Upload PV if provided
      let pvUrl = resPvUrl;
      if (resPvFile) {
        setPvUploading(true);
        pvUrl = await uploadPv(resPvFile);
        setPvUploading(false);
        const sizeKB = Math.round(resPvFile.size / 1024);
        const sizeLabel = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
        await upsertDocument({
          buildingId,
          title: T.pvDocTitle(longDate(showResults.date, lang)),
          docType: "pv",
          docDate: showResults.date,
          size: sizeLabel,
          url: pvUrl,
          refId: showResults.id,
        });
      }

      // Save each resolution result
      for (const [resId, data] of resolutionResults) {
        if (data.result) {
          await updateResolutionResult(resId, {
            result: data.result as "adoptee" | "rejetee" | "reportee",
            pourTantiemes: data.pour,
            contreTantiemes: data.contre,
            abstentionTantiemes: data.abst,
            pourCount: 0, contreCount: 0, abstentionCount: 0,
          });
        }
      }

      const updatedQuorum = quorumPct || Number(showResults.quorum) || 0;

      // Save assembly summary + quorum
      await updateAssembly({
        assemblyId: showResults.id,
        quorum: updatedQuorum,
        votes: [],
        summary: resSummary,
        pvUrl,
      });

      // Optimistic: update assembly in local state with new results
      const updatedResolutions = showResults.resolutions.map((r) => {
        const rd = resolutionResults.get(r.id);
        if (rd?.result) {
          return {
            ...r,
            result: rd.result as "adoptee" | "rejetee" | "reportee",
            pourTantiemes: rd.pour,
            contreTantiemes: rd.contre,
            abstentionTantiemes: rd.abst,
          };
        }
        return r;
      });

      // Approve linked budget if selected
      if (selectedBudgetId) {
        try { await updateBudgetStatus(selectedBudgetId, "approved", showResults.id); } catch { /* ignore */ }
      }

      setLocalAssemblies((prev) =>
        prev.map((a) =>
          a.id === showResults.id
            ? { ...a, quorum: updatedQuorum, summary: resSummary, pvUrl, resolutions: updatedResolutions }
            : a
        )
      );

      setShowResults(null);
      setSelectedBudgetId("");
      flash(selectedBudgetId ? T.flash.resultsBudgetSaved : T.flash.resultsSaved);
    } catch {
      flash(T.flash.resultsError);
    } finally {
      setResSaving(false);
    }
  }

  // ───── Notify ─────
  async function handleNotify(ag: AssemblyRow) {
    if (residentProfileIds.length === 0) { flash(T.flash.notifyNoResident); return; }
    try {
      await notifyAssembly({ profileIds: residentProfileIds, date: longDate(ag.date, lang), place: ag.place });

      // Create pinned post in voisinage
      const typeLabel = ag.type === "extraordinaire" ? T.type.extraordinary.toLowerCase() : T.type.ordinary.toLowerCase();
      const agendaText = ag.agenda.map((a) => `${a.n}. ${a.t}${a.d ? ` — ${a.d}` : ""}`).join("\n");
      const body = `${T.notifyBody.intro(typeLabel, longDate(ag.date, lang), ag.time)}\n\n${T.notifyBody.location} : ${ag.place}\n\n${T.notifyBody.agendaTitle} :\n${agendaText}`;
      await createPostSyndic({ buildingId, body, type: "announcement", title: T.notifyBody.convocationTitle(longDate(ag.date, lang)), pinned: true });

      flash(T.flash.notified(residentProfileIds.length));
    } catch {
      flash(T.flash.notifyError);
    }
  }

  // ───── Load vote tallies ─────
  async function loadTallies(assemblyId: string) {
    if (talliesAssemblyId === assemblyId && Object.keys(voteTallies).length > 0) return; // already loaded
    setTalliesLoading(true);
    try {
      const data = await fetchVoteTallies(assemblyId);
      setVoteTallies(data);
      setTalliesAssemblyId(assemblyId);
    } catch {
      flash(T.flash.votesError);
    } finally {
      setTalliesLoading(false);
    }
  }

  // ───── Delete ─────
  async function handleDelete() {
    if (!showDelete) return;
    const deleteId = showDelete.id;
    try {
      await deleteAssembly(deleteId);
      setLocalAssemblies((prev) => prev.filter((a) => a.id !== deleteId));
      setShowDelete(null);
      flash(T.flash.deleted);
    } catch {
      flash(T.flash.deleteError);
    }
  }

  const inputCls = "h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20";

  return (
    <div>
      <PageHeader
        title={T.titlePlural}
        subtitle={T.subtitle(totalAgs, nextAg ? shortDate(nextAg.date, lang) : "")}
        action={
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-palier-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-palier-700">
            <Icon name="Plus" className="h-3.5 w-3.5" /> {T.convokeBtn}
          </button>
        }
      />

      {/* Legal info */}
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-palier-200 bg-palier-50/50 px-4 py-3">
        <Icon name="Scale" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-palier-700" />
        <p className="text-[12px] text-palier-700">
          {T.legalInfo(MIN_NOTICE_DAYS)}
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">{T.kpi.totalAssemblies}</p>
          <p className="text-[28px] font-bold leading-none text-ink" dir="ltr">{totalAgs}</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">{T.kpi.avgQuorum}</p>
          <p className="text-[28px] font-bold leading-none text-ink" dir="ltr">{avgQuorum}%</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">{T.kpi.nextAssembly}</p>
          <p className="text-[16px] font-bold leading-none text-ink">{nextAg ? longDate(nextAg.date, lang) : "—"}</p>
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
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold ${statusFilter === tab.key ? "bg-palier-50 text-palier-700" : "text-ink-faint"}`} dir="ltr">{counts[tab.key]}</span>
            {statusFilter === tab.key && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-palier-600" />}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-3">
        <div className="relative">
          <Icon name="Search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={C.search}
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
      <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-cream-card shadow-card">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Icon name="CalendarDays" className="mx-auto h-8 w-8 text-ink-faint" />
            <p className="mt-2 text-[13px] text-ink-soft">{localAssemblies.length === 0 ? T.noAssemblies : C.noResults}</p>
            {localAssemblies.length === 0 ? (
              <button onClick={() => setShowCreate(true)} className="mt-1 text-[13px] font-medium text-palier-600">{T.convokeBtn}</button>
            ) : (
              <button onClick={() => { setStatusFilter("all"); setSearch(""); }} className="mt-1 text-[13px] font-medium text-palier-600">{C.resetFilters}</button>
            )}
          </div>
        ) : (
          <>
          {/* Desktop */}
          <table className="hidden w-full table-fixed text-left text-[13px] lg:table">
            <thead>
              <tr className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                <th className="w-[20%] px-4 py-2.5">{T.table.date}</th>
                <th className="w-[15%] px-4 py-2.5">{T.table.type}</th>
                <th className="w-[15%] px-4 py-2.5">{T.table.place}</th>
                <th className="w-[10%] px-4 py-2.5">{T.table.agenda}</th>
                <th className="w-[10%] px-4 py-2.5">{T.table.resolutions}</th>
                <th className="w-[10%] px-4 py-2.5">{T.table.quorum}</th>
                <th className="w-[20%] px-4 py-2.5 text-right">{T.table.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {filtered.map((ag) => {
                const upcoming = isUpcoming(ag);
                const hasResults = ag.quorum > 0 || ag.resolutions.some((r) => r.result);
                return (
                  <tr key={ag.id} className={`transition-colors hover:bg-sand/50 ${isPast(ag) && !hasResults ? "opacity-60" : ""}`}>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-ink">{longDate(ag.date, lang)}</p>
                      <span className={`mt-0.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${upcoming ? "bg-palier-50 text-palier-700" : "bg-sand/80 text-ink-soft"}`}>
                        {upcoming ? T.status.upcoming : T.status.past}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${ag.type === "extraordinaire" ? "bg-amber-50 text-amber-700" : "bg-palier-50 text-palier-700"}`}>
                        {ag.type === "extraordinaire" ? T.type.extraordinary : T.type.ordinary}
                      </span>
                    </td>
                    <td className="overflow-hidden px-4 py-2.5">
                      <p className="truncate text-ink-soft">{ag.place || "—"}</p>
                      <p className="text-[11px] text-ink-faint">{ag.time}</p>
                    </td>
                    <td className="px-4 py-2.5 text-ink-soft">{T.agendaPoints(ag.agenda.length)}</td>
                    <td className="px-4 py-2.5 text-ink-soft">{T.resolutionCount(ag.resolutions.length)}</td>
                    <td className="px-4 py-2.5">
                      {ag.quorum > 0 ? (
                        <span className="font-medium text-ink" dir="ltr">{ag.quorum}%</span>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setSelected(ag)} className="text-[11px] font-semibold text-palier-600 hover:underline">{T.details}</button>
                        {upcoming && (
                          <>
                            <button onClick={() => handleNotify(ag)} className="rounded-md bg-palier-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-palier-700">{T.notify}</button>
                            <button onClick={() => setShowDelete(ag)} className="text-[11px] font-semibold text-red-600 hover:underline">{T.cancelAssembly}</button>
                          </>
                        )}
                        {!upcoming && !hasResults && (
                          <button onClick={() => openResults(ag)} className="rounded-md bg-palier-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-palier-700">{T.enterResults}</button>
                        )}
                        {!upcoming && hasResults && (
                          <button onClick={() => openResults(ag)} className="text-[11px] font-semibold text-ink-soft hover:underline">{C.modify}</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="divide-y divide-black/[0.04] lg:hidden">
            {filtered.map((ag) => {
              const upcoming = isUpcoming(ag);
              const hasResults = ag.quorum > 0 || ag.resolutions.some((r) => r.result);
              return (
                <div key={ag.id} className={`p-4 ${isPast(ag) && !hasResults ? "opacity-60" : ""}`}>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[14px] font-medium text-ink">{longDate(ag.date, lang)}</p>
                      <p className="mt-0.5 text-[12px] text-ink-soft">{ag.time} · {ag.place || "—"}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${upcoming ? "bg-palier-50 text-palier-700" : "bg-sand/80 text-ink-soft"}`}>
                        {upcoming ? T.status.upcoming : T.status.past}
                      </span>
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${ag.type === "extraordinaire" ? "bg-amber-50 text-amber-700" : "bg-palier-50/50 text-palier-600"}`}>
                        {ag.type === "extraordinaire" ? T.type.extraordinaryShort : T.type.ordinaryShort}
                      </span>
                    </div>
                  </div>
                  <div className="mb-2.5 flex items-center gap-3 text-[12px] text-ink-soft">
                    <span>{T.agendaPointsFull(ag.agenda.length)}</span>
                    {ag.resolutions.length > 0 && <span>{T.resolutionCount(ag.resolutions.length)}</span>}
                    {ag.quorum > 0 && <span>{T.table.quorum} <span dir="ltr">{ag.quorum}%</span></span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelected(ag)} className="text-[12px] font-semibold text-palier-600">{T.details}</button>
                    {upcoming && (
                      <>
                        <button onClick={() => handleNotify(ag)} className="rounded-md bg-palier-600 px-2.5 py-1 text-[11px] font-semibold text-white">{T.notify}</button>
                        <button onClick={() => setShowDelete(ag)} className="text-[11px] font-semibold text-red-600">{T.cancelAssembly}</button>
                      </>
                    )}
                    {!upcoming && !hasResults && (
                      <button onClick={() => openResults(ag)} className="rounded-md bg-palier-600 px-2.5 py-1 text-[11px] font-semibold text-white">{T.enterResults}</button>
                    )}
                    {!upcoming && hasResults && (
                      <button onClick={() => openResults(ag)} className="text-[11px] font-semibold text-ink-soft">{C.modify}</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          DETAIL MODAL
          ═══════════════════════════════════════════ */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-[16px] font-semibold text-ink">{T.assemblyOf} {longDate(selected.date, lang)}</h2>
                <p className="mt-0.5 text-[12px] text-ink-soft">{selected.time} · {selected.place}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${isUpcoming(selected) ? "bg-palier-50 text-palier-700" : "bg-sand/80 text-ink-soft"}`}>
                    {isUpcoming(selected) ? "À venir" : "Passée"}
                  </span>
                  <span className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${selected.type === "extraordinaire" ? "bg-amber-50 text-amber-700" : "bg-palier-50 text-palier-700"}`}>
                    {selected.type === "extraordinaire" ? "Extraordinaire" : "Ordinaire"}
                  </span>
                  {selected.quorum > 0 && <span className="text-[11px] font-medium text-ink-soft">Quorum <span dir="ltr">{selected.quorum}%</span></span>}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>

            {/* Agenda */}
            {selected.agenda.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 text-[13px] font-semibold text-ink">{T.agenda}</h3>
                <ol className="space-y-2">
                  {selected.agenda.map((a, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-palier-50 text-[11px] font-medium text-ink-soft" dir="ltr">{a.n || i + 1}</span>
                      <div>
                        <p className="text-[13px] text-ink">{a.t}</p>
                        {a.d && <p className="text-[12px] text-ink-soft">{a.d}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Résolutions */}
            {selected.resolutions.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 text-[13px] font-semibold text-ink">Résolutions</h3>
                <div className="space-y-2">
                  {selected.resolutions.map((r) => (
                    <div key={r.id} className="rounded-lg border border-black/[0.06] p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[13px] font-medium text-ink">
                            <span className="mr-1.5 text-[11px] text-ink-soft" dir="ltr">n°{r.number}</span>
                            {r.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-ink-faint">{MAJORITY_LABELS[r.majorityType]}</p>
                        </div>
                        {r.result && (
                          <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${r.result === "adoptee" ? "text-emerald-700 bg-emerald-50" : r.result === "rejetee" ? "text-red-700 bg-red-50" : "text-amber-700 bg-amber-50"}`}>
                            {RESULT_LABELS[r.result]}
                          </span>
                        )}
                      </div>
                      {r.result && r.pourTantiemes + r.contreTantiemes + r.abstentionTantiemes > 0 && (
                        <div className="mt-2">
                          <div className="flex h-2 overflow-hidden rounded-full bg-sand/50">
                            <div style={{ width: `${Math.round((r.pourTantiemes / (r.pourTantiemes + r.contreTantiemes + r.abstentionTantiemes)) * 100)}%` }} className="bg-emerald-500" />
                            <div style={{ width: `${Math.round((r.contreTantiemes / (r.pourTantiemes + r.contreTantiemes + r.abstentionTantiemes)) * 100)}%` }} className="bg-red-400" />
                            <div style={{ width: `${Math.round((r.abstentionTantiemes / (r.pourTantiemes + r.contreTantiemes + r.abstentionTantiemes)) * 100)}%` }} className="bg-gray-300" />
                          </div>
                          <div className="mt-1 flex gap-3 text-[11px] text-ink-soft">
                            <span className="text-emerald-600">Pour <span dir="ltr">{r.pourTantiemes}t</span></span>
                            <span className="text-red-600">Contre <span dir="ltr">{r.contreTantiemes}t</span></span>
                            <span>Abst. <span dir="ltr">{r.abstentionTantiemes}t</span></span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Votes des résidents */}
            {selected.votes.length > 0 && selected.votes.some((v) => v.id) && (
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-ink">{T.votes.title}</h3>
                  {talliesAssemblyId !== selected.id && (
                    <button
                      type="button"
                      onClick={() => loadTallies(selected.id)}
                      disabled={talliesLoading}
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-palier-600 hover:underline disabled:opacity-50"
                    >
                      <Icon name="BarChart3" className="h-3.5 w-3.5" />
                      {talliesLoading ? C.loading : T.votes.seeVotes}
                    </button>
                  )}
                </div>
                {talliesAssemblyId === selected.id && (
                  <div className="space-y-2">
                    {selected.votes.filter((v) => v.id).map((v) => {
                      const tally = voteTallies[v.id!];
                      return (
                        <div key={v.id} className="rounded-lg border border-black/[0.06] bg-white p-3">
                          <p className="text-[13px] font-medium text-ink">{v.q}</p>
                          {!tally || tally.total === 0 ? (
                            <p className="mt-1.5 text-[12px] text-ink-faint">{T.votes.noVote}</p>
                          ) : (
                            <div className="mt-2 space-y-1.5">
                              <p className="text-[11px] font-semibold text-ink-soft"><span dir="ltr">{tally.total}</span> vote{tally.total > 1 ? "s" : ""}</p>
                              {(v.options ?? Object.keys(tally.choices)).map((option) => {
                                const count = tally.choices[option] ?? 0;
                                const pct = tally.total > 0 ? Math.round((count / tally.total) * 100) : 0;
                                return (
                                  <div key={option}>
                                    <div className="flex items-center justify-between text-[12px]">
                                      <span className="text-ink">{option}</span>
                                      <span className="font-semibold text-ink-soft" dir="ltr">{count} ({pct}%)</span>
                                    </div>
                                    <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-sand/50">
                                      <div style={{ width: `${pct}%` }} className="h-full rounded-full bg-palier-500 transition-all" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Summary */}
            {selected.summary && (
              <div className="mb-4">
                <h3 className="mb-2 text-[13px] font-semibold text-ink">Compte-rendu</h3>
                <p className="whitespace-pre-wrap rounded-lg bg-white p-3 text-[13px] text-ink-soft">{selected.summary}</p>
              </div>
            )}

            {/* PV */}
            {selected.pvUrl && (
              <div className="mb-4">
                <h3 className="mb-2 text-[13px] font-semibold text-ink">Procès-verbal</h3>
                <a href={selected.pvUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-black/[0.06] bg-white px-3 py-2 text-[12px] font-medium text-palier-600 hover:bg-sand/50">
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
                  {selected.quorum > 0 ? T.modifyResults : T.enterResults}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          RESULTS MODAL (with attendance + resolutions)
          ═══════════════════════════════════════════ */}
      {showResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30" onClick={() => setShowResults(null)}>
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-palier-100">
                  <Icon name="ClipboardCheck" className="h-5 w-5 text-palier-600" />
                </span>
                <div>
                  <h2 className="text-[16px] font-semibold text-ink">{T.resultsModal.title}</h2>
                  <p className="text-[12px] text-ink-soft">{longDate(showResults.date, lang)}</p>
                </div>
              </div>
              <button onClick={() => setShowResults(null)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleResults} className="space-y-5">

              {/* ─── SECTION 1: Feuille de présence ─── */}
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[13px] font-semibold text-ink">{T.resultsModal.attendance}</h3>
                  <div className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${quorumMet ? "bg-emerald-50 text-emerald-700" : presentIds.size > 0 ? "bg-red-50 text-red-600" : "bg-sand/50 text-ink-faint"}`}>
                    <span dir="ltr">{presentTantiemes}/{totalTantiemes}</span> tantièmes (<span dir="ltr">{quorumPct}%</span>)
                    {presentIds.size > 0 && (quorumMet ? " — Quorum atteint" : " — Quorum non atteint")}
                  </div>
                </div>

                {/* Legal minimum */}
                <div className="mb-2 flex items-center gap-1.5 text-[11px] text-ink-faint">
                  <Icon name="Info" className="h-3 w-3" />
                  Minimum requis : <span dir="ltr">{Math.ceil(totalTantiemes / 4)}</span> tantièmes (1/4 du total)
                </div>

                <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-black/[0.06] bg-white p-2">
                  {residents.map((r) => {
                    const isPresent = presentIds.has(r.id);
                    const isProxy = proxyMap.has(r.id);
                    const delegateName = isProxy ? residents.find((x) => x.id === proxyMap.get(r.id))?.name : undefined;
                    return (
                      <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-sand/30">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            onClick={() => {
                              const next = new Set(presentIds);
                              if (isPresent) next.delete(r.id); else next.add(r.id);
                              // If marking present, remove from proxy map
                              if (!isPresent) { const pm = new Map(proxyMap); pm.delete(r.id); setProxyMap(pm); }
                              setPresentIds(next);
                            }}
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${isPresent ? "border-palier-600 bg-palier-600" : "border-ink-faint/30"}`}
                          >
                            {isPresent && <Icon name="Check" className="h-3 w-3 text-white" strokeWidth={3} />}
                          </button>
                          <div className="min-w-0">
                            <p className={`truncate text-[12px] font-medium ${isPresent ? "text-ink" : isProxy ? "text-ink-soft" : "text-ink-faint"}`}>{r.name}</p>
                            <p className="text-[10px] text-ink-faint"><span dir="ltr">{r.unit}</span> · <span dir="ltr">{r.tantiemes}t</span></p>
                          </div>
                        </div>
                        {!isPresent && !isProxy && (
                          <select
                            value=""
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const pm = new Map(proxyMap);
                              pm.set(r.id, e.target.value);
                              setProxyMap(pm);
                            }}
                            className="h-6 rounded border border-black/[0.08] bg-white px-1 text-[10px] text-ink-soft"
                          >
                            <option value="">Procuration…</option>
                            {residents.filter((x) => x.id !== r.id && (presentIds.has(x.id) || proxyMap.get(r.id) === x.id)).map((x) => (
                              <option key={x.id} value={x.id}>{x.name}</option>
                            ))}
                          </select>
                        )}
                        {isProxy && delegateName && (
                          <div className="flex items-center gap-1">
                            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">Procuration → {delegateName}</span>
                            <button type="button" onClick={() => { const pm = new Map(proxyMap); pm.delete(r.id); setProxyMap(pm); }} className="text-ink-faint hover:text-red-500">
                              <Icon name="X" className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ─── SECTION 2: Résolutions ─── */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-ink">Résolutions ({showResults.resolutions.length + (showAddResolution ? 0 : 0)})</h3>
                  <button type="button" onClick={() => setShowAddResolution(true)} className="text-[12px] font-medium text-palier-600 hover:underline">
                    + Ajouter une résolution
                  </button>
                </div>

                {/* Add resolution inline */}
                {showAddResolution && (
                  <div className="mb-3 rounded-lg border border-palier-200 bg-palier-50/30 p-3 space-y-2">
                    <input type="text" value={newResTitle} onChange={(e) => setNewResTitle(e.target.value)} placeholder={T.resultsModal.resolutionTitle} className={inputCls} />
                    <input type="text" value={newResDesc} onChange={(e) => setNewResDesc(e.target.value)} placeholder={T.resultsModal.resolutionDesc} className={inputCls} />
                    <select value={newResMajority} onChange={(e) => setNewResMajority(e.target.value as MajorityType)} className={inputCls}>
                      <option value="simple">{T.majority.simple}</option>
                      <option value="trois_quarts">{T.majority.threeQuarters}</option>
                      <option value="unanimite">{T.majority.unanimity}</option>
                    </select>
                    <div className="flex gap-2">
                      <button type="button" onClick={handleAddResolution} disabled={!newResTitle.trim()} className="rounded-lg bg-palier-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-palier-700 disabled:opacity-50">{C.add}</button>
                      <button type="button" onClick={() => { setShowAddResolution(false); setNewResTitle(""); setNewResDesc(""); }} className="text-[12px] text-ink-soft hover:underline">{C.cancel}</button>
                    </div>
                  </div>
                )}

                {/* Resolution list with vote entry */}
                <div className="space-y-2">
                  {showResults.resolutions.map((r) => {
                    const rd = resolutionResults.get(r.id) ?? { result: r.result ?? "", pour: r.pourTantiemes, contre: r.contreTantiemes, abst: r.abstentionTantiemes };
                    return (
                      <div key={r.id} className="rounded-lg border border-black/[0.06] p-3">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[12px] font-medium text-ink"><span className="mr-1 text-ink-soft" dir="ltr">n°{r.number}</span>{r.title}</p>
                            <p className="text-[10px] text-ink-faint">{MAJORITY_LABELS[r.majorityType]}</p>
                          </div>
                          <button type="button" onClick={() => handleDeleteResolution(r.id)} className="text-ink-faint hover:text-red-500">
                            <Icon name="Trash2" className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Tantièmes vote entry */}
                        <div className="grid grid-cols-2 gap-2 mb-2 sm:grid-cols-3">
                          <div>
                            <label className="mb-0.5 block text-[10px] font-semibold text-emerald-600">Pour (tantièmes)</label>
                            <input type="number" min="0" value={rd.pour || ""} onChange={(e) => {
                              const m = new Map(resolutionResults);
                              m.set(r.id, { ...rd, pour: Number(e.target.value) || 0 });
                              setResolutionResults(m);
                            }} className={inputCls} />
                          </div>
                          <div>
                            <label className="mb-0.5 block text-[10px] font-semibold text-red-600">Contre (tantièmes)</label>
                            <input type="number" min="0" value={rd.contre || ""} onChange={(e) => {
                              const m = new Map(resolutionResults);
                              m.set(r.id, { ...rd, contre: Number(e.target.value) || 0 });
                              setResolutionResults(m);
                            }} className={inputCls} />
                          </div>
                          <div>
                            <label className="mb-0.5 block text-[10px] font-semibold text-ink-soft">Abstention (tant.)</label>
                            <input type="number" min="0" value={rd.abst || ""} onChange={(e) => {
                              const m = new Map(resolutionResults);
                              m.set(r.id, { ...rd, abst: Number(e.target.value) || 0 });
                              setResolutionResults(m);
                            }} className={inputCls} />
                          </div>
                        </div>

                        {/* Result selector */}
                        <div className="flex flex-wrap gap-1.5">
                          {(["adoptee", "rejetee", "reportee"] as const).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                const m = new Map(resolutionResults);
                                m.set(r.id, { ...rd, result: opt });
                                setResolutionResults(m);
                              }}
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${rd.result === opt
                                ? opt === "adoptee" ? "bg-emerald-600 text-white" : opt === "rejetee" ? "bg-red-600 text-white" : "bg-amber-500 text-white"
                                : "border border-black/[0.08] bg-white text-ink-soft hover:bg-sand/50"
                              }`}
                            >
                              {RESULT_LABELS[opt]}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {showResults.resolutions.length === 0 && !showAddResolution && (
                  <p className="text-[12px] text-ink-faint">{T.resultsModal.noResolutions}</p>
                )}
              </div>

              {/* ─── SECTION 2b: Votes des résidents (depuis l'app) ─── */}
              {showResults.votes.length > 0 && showResults.votes.some((v) => v.id) && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-[13px] font-semibold text-ink">{T.votes.titleViaApp}</h3>
                    {talliesAssemblyId !== showResults.id && (
                      <button
                        type="button"
                        onClick={() => loadTallies(showResults.id)}
                        disabled={talliesLoading}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-palier-600 hover:underline disabled:opacity-50"
                      >
                        <Icon name="BarChart3" className="h-3.5 w-3.5" />
                        {talliesLoading ? C.loading : T.votes.seeVotes}
                      </button>
                    )}
                    {talliesAssemblyId === showResults.id && (
                      <button
                        type="button"
                        onClick={() => loadTallies(showResults.id)}
                        disabled={talliesLoading}
                        className="inline-flex items-center gap-1 text-[11px] text-ink-faint hover:text-palier-600"
                      >
                        <Icon name="RefreshCw" className="h-3 w-3" />
                        Actualiser
                      </button>
                    )}
                  </div>
                  {talliesAssemblyId === showResults.id && (
                    <div className="space-y-2 rounded-lg border border-palier-100 bg-palier-50/30 p-3">
                      {showResults.votes.filter((v) => v.id).map((v) => {
                        const tally = voteTallies[v.id!];
                        return (
                          <div key={v.id} className="rounded-lg bg-white p-3 border border-black/[0.06]">
                            <p className="text-[12px] font-medium text-ink">{v.q}</p>
                            {!tally || tally.total === 0 ? (
                              <p className="mt-1 text-[11px] text-ink-faint">{T.votes.noVote}</p>
                            ) : (
                              <div className="mt-2 space-y-1">
                                <p className="text-[10px] font-semibold text-ink-soft"><span dir="ltr">{tally.total}</span> vote{tally.total > 1 ? "s" : ""} enregistré{tally.total > 1 ? "s" : ""}</p>
                                {(v.options ?? Object.keys(tally.choices)).map((option) => {
                                  const count = tally.choices[option] ?? 0;
                                  const pct = tally.total > 0 ? Math.round((count / tally.total) * 100) : 0;
                                  return (
                                    <div key={option}>
                                      <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-ink">{option}</span>
                                        <span className="font-semibold text-ink-soft" dir="ltr">{count} ({pct}%)</span>
                                      </div>
                                      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-sand/50">
                                        <div style={{ width: `${pct}%` }} className="h-full rounded-full bg-palier-500 transition-all" />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ─── SECTION 3: Compte-rendu ─── */}
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-ink">Compte-rendu</label>
                <textarea
                  value={resSummary}
                  onChange={(e) => setResSummary(e.target.value)}
                  placeholder="Résumé des discussions, décisions prises, remarques…"
                  rows={4}
                  className="w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
                />
              </div>

              {/* ─── SECTION 4: PV upload ─── */}
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-ink">Procès-verbal (PDF ou image)</label>
                {resPvUrl && !resPvFile && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg border border-black/[0.06] bg-white px-3 py-2">
                    <Icon name="FileText" className="h-4 w-4 text-palier-600" />
                    <a href={resPvUrl} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-[12px] font-medium text-palier-600 hover:underline">{T.resultsModal.viewCurrentPv}</a>
                    <button type="button" onClick={() => setResPvUrl("")} className="text-ink-faint hover:text-red-500"><Icon name="X" className="h-3.5 w-3.5" /></button>
                  </div>
                )}
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[12px] font-medium text-ink transition-colors hover:bg-sand/50">
                  <Icon name="Upload" className="h-3.5 w-3.5" />
                  {resPvFile ? resPvFile.name : T.resultsModal.importFile}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setResPvFile(e.target.files?.[0] ?? null)} className="hidden" />
                </label>
                {pvUploading && <p className="mt-1 text-[11px] text-ink-soft">{T.resultsModal.uploading}</p>}
              </div>

              {/* Budget à approuver */}
              {budgets.filter((b) => b.status === "draft" || b.status === "vote").length > 0 && (
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-ink">{T.resultsModal.budgetApproval}</label>
                  <p className="mb-2 text-[11px] text-ink-faint">{T.resultsModal.budgetApprovalHint}</p>
                  <select
                    value={selectedBudgetId}
                    onChange={(e) => setSelectedBudgetId(e.target.value)}
                    className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
                  >
                    <option value="">{T.resultsModal.noBudget}</option>
                    {budgets.filter((b) => b.status === "draft" || b.status === "vote").map((b) => (
                      <option key={b.id} value={b.id}>Budget {b.fiscalYear} — {mad(b.totalAmount, { decimals: false })}</option>
                    ))}
                  </select>
                </div>
              )}

              <button type="submit" disabled={resSaving} className="w-full rounded-xl bg-palier-600 py-2.5 text-[13px] font-semibold text-white hover:bg-palier-700 disabled:opacity-50">
                {resSaving ? T.resultsModal.saving : T.resultsModal.saveResults}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          CREATE AG MODAL
          ═══════════════════════════════════════════ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30" onClick={() => { setShowCreate(false); resetCreate(); }}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-palier-100">
                  <Icon name="CalendarDays" className="h-5 w-5 text-palier-600" />
                </span>
                <div>
                  <h2 className="text-[16px] font-semibold text-ink">{T.create.title}</h2>
                  <p className="text-[12px] text-ink-soft">Minimum {MIN_NOTICE_DAYS} jours de préavis (Loi 18-00)</p>
                </div>
              </div>
              <button onClick={() => { setShowCreate(false); resetCreate(); }} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              {/* Type selection */}
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">{T.create.typeLabel}</label>
                <div className="flex gap-2">
                  {(["ordinaire", "extraordinaire"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAgType(t)}
                      className={`flex-1 rounded-lg border py-2 text-[12px] font-semibold transition-colors ${agType === t ? "border-palier-600 bg-palier-50 text-palier-700" : "border-black/[0.08] bg-white text-ink-soft hover:bg-sand/50"}`}
                    >
                      {t === "ordinaire" ? "Ordinaire" : "Extraordinaire"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => { setDate(e.target.value); validateDate(e.target.value); }}
                    min={(() => { const d = new Date(); d.setDate(d.getDate() + MIN_NOTICE_DAYS); return d.toISOString().split("T")[0]; })()}
                    className={`${inputCls} ${dateError ? "border-red-300" : ""}`}
                  />
                  {dateError && <p className="mt-1 text-[10px] text-red-500">{dateError}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Heure</label>
                  <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">{T.create.place}</label>
                <input type="text" required placeholder={T.create.placePlaceholder} value={place} onChange={(e) => setPlace(e.target.value)} className={inputCls} />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-ink-soft">{T.create.agendaLabel}</span>
                  <button type="button" onClick={addItem} className="text-[12px] font-medium text-palier-600">{T.create.addItem}</button>
                </div>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {agendaItems.map((item, i) => (
                    <div key={i} className="rounded-lg border border-black/[0.06] p-2.5">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-ink-soft">{T.create.itemPoint} {item.n}</span>
                        {agendaItems.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-ink-faint hover:text-red-500"><Icon name="Trash2" className="h-3 w-3" /></button>}
                      </div>
                      <input type="text" required placeholder={T.create.itemTitle} value={item.t} onChange={(e) => updateItem(i, "t", e.target.value)} className={`mb-1 ${inputCls}`} />
                      <input type="text" placeholder={T.resultsModal.resolutionDesc} value={item.d} onChange={(e) => updateItem(i, "d", e.target.value)} className={inputCls} />
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={saving || !!dateError} className="w-full rounded-xl bg-palier-600 py-2.5 text-[13px] font-semibold text-white hover:bg-palier-700 disabled:opacity-50">
                {saving ? T.create.submitting : T.create.submit}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30" onClick={() => setShowDelete(null)}>
          <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[16px] font-semibold text-ink">{T.deleteConfirm.title}</h2>
            <p className="mt-1 text-[13px] text-ink-soft">{T.deleteConfirm.msg(longDate(showDelete.date, lang), showDelete.place)}</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowDelete(null)} className="flex-1 rounded-xl border border-black/[0.08] py-2.5 text-[13px] font-semibold text-ink hover:bg-sand/50">Non, garder</button>
              <button onClick={handleDelete} className="flex-1 rounded-xl bg-red-600 py-2.5 text-[13px] font-semibold text-white hover:bg-red-700">Oui, annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 animate-[rise_0.25s_ease] rounded-lg bg-palier-600 px-4 py-2.5 text-[13px] font-medium text-white shadow-lg">{toast}</div>}
    </div>
  );
}
