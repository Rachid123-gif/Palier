"use client";

import { useState, useTransition, useMemo, useCallback, useEffect } from "react";
import { createUrgentWork, updateUrgentWorkStatus, deleteUrgentWork } from "@/lib/actions";
import { PageHeader } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { mad, timeAgo, longDate } from "@/lib/format";
import { useLang } from "@/lib/LangProvider";
import type { UrgentWork } from "@/lib/types";

/* ── Types ── */

type IncidentRow = {
  id: string;
  title: string;
  status: string;
  category: string;
  created_at: string;
};

type StatusKey = "all" | "declared" | "approved" | "in_progress" | "completed";

/* ── Constants ── */

const statusStyles: Record<string, { bg: string; text: string; icon: string }> = {
  declared: { bg: "bg-amber-50", text: "text-amber-700", icon: "FileWarning" },
  approved: { bg: "bg-blue-50", text: "text-blue-700", icon: "CircleCheck" },
  in_progress: { bg: "bg-palier-50", text: "text-palier-700", icon: "Hammer" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", icon: "CircleCheck" },
};

/* ── Main ── */

export function TravauxUrgentsView({
  urgentWorks,
  incidents,
  buildingId,
}: {
  urgentWorks: UrgentWork[];
  incidents: IncidentRow[];
  buildingId: string;
}) {
  const { i, lang } = useLang();
  const T = i.syndic.travaux;
  const C = i.syndic.common;

  const statusTabs: { key: StatusKey; label: string }[] = [
    { key: "all", label: T.tabs.all },
    { key: "declared", label: T.tabs.declared },
    { key: "approved", label: T.tabs.approved },
    { key: "in_progress", label: T.tabs.inProgress },
    { key: "completed", label: T.tabs.completed },
  ];

  const statusBadgeLabels: Record<string, string> = {
    declared: T.statuses.declared,
    approved: T.statuses.approved,
    in_progress: T.statuses.inProgress,
    completed: T.statuses.completed,
  };

  const [localWorks, setLocalWorks] = useState<UrgentWork[]>(urgentWorks);
  useEffect(() => { setLocalWorks(urgentWorks); }, [urgentWorks]);

  const [toast, setToast] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusKey>("all");
  const [search, setSearch] = useState("");

  // Modals
  const [declareOpen, setDeclareOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState<UrgentWork | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UrgentWork | null>(null);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  /* ── KPIs ── */
  const totalWorks = localWorks.length;
  const inProgressCount = localWorks.filter((w) => w.status === "in_progress" || w.status === "approved" || w.status === "declared").length;
  const completedCount = localWorks.filter((w) => w.status === "completed").length;
  const totalCost = localWorks.reduce((s, w) => s + (w.actualCost ?? w.estimatedCost ?? 0), 0);

  /* ── Filtering ── */
  const filtered = useMemo(() => {
    let rows = [...localWorks];
    if (statusFilter !== "all") rows = rows.filter((w) => w.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          w.justification.toLowerCase().includes(q) ||
          (w.supplier ?? "").toLowerCase().includes(q),
      );
    }
    return rows;
  }, [localWorks, statusFilter, search]);

  /* ── Incident lookup ── */
  const incidentById = useMemo(() => {
    const map = new Map<string, IncidentRow>();
    for (const inc of incidents) map.set(inc.id, inc);
    return map;
  }, [incidents]);

  /* ── Actions ── */
  const handleStatusChange = useCallback(
    async (id: string, newStatus: UrgentWork["status"], actualCost?: number) => {
      try {
        await updateUrgentWorkStatus(id, newStatus, actualCost);
        setLocalWorks((prev) => prev.map((w) => w.id === id ? {
          ...w,
          status: newStatus,
          ...(newStatus === "completed" ? { completedAt: new Date().toISOString(), actualCost: actualCost ?? w.actualCost } : {}),
        } : w));
        const labels: Record<string, string> = {
          approved: T.statuses.approved,
          in_progress: T.statuses.inProgress,
          completed: T.statuses.completed,
        };
        flash(labels[newStatus] ?? C.update);
      } catch { flash(C.networkError); }
    },
    [flash],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteUrgentWork(id);
        setLocalWorks((prev) => prev.filter((w) => w.id !== id));
        flash(C.delete);
        setDeleteTarget(null);
      } catch { flash(C.networkError); }
    },
    [flash],
  );

  return (
    <div>
      <PageHeader
        title={T.title}
        subtitle={`${totalWorks} ${T.title.toLowerCase()} · ${inProgressCount} ${T.kpi.inProgress.toLowerCase()}`}
        action={
          <button
            onClick={() => setDeclareOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-palier-600 px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-palier-700"
          >
            <Icon name="Plus" className="h-3.5 w-3.5" /> {T.declareBtn}
          </button>
        }
      />

      {/* Info banner */}
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-4 py-3">
        <Icon name="Scale" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
        <p className="text-[12px] text-ink-soft">
          {T.legalInfo}
        </p>
      </div>

      {/* KPI cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">{T.kpi.total}</p>
          <p className="text-[28px] font-bold leading-none text-ink" dir="ltr">{totalWorks}</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">{T.kpi.inProgress}</p>
          <p className="text-[28px] font-bold leading-none text-ink" dir="ltr">{inProgressCount}</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">{T.kpi.completed}</p>
          <p className="text-[28px] font-bold leading-none text-ink" dir="ltr">{completedCount}</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">{T.kpi.totalCost}</p>
          <p className="text-[22px] font-bold leading-none text-ink" dir="ltr">{mad(totalCost, { decimals: false })}</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="no-scrollbar mb-3 flex items-center gap-2 overflow-x-auto border-b border-black/[0.06] sm:gap-3">
        {statusTabs.map((tab) => {
          const count =
            tab.key === "all" ? localWorks.length : localWorks.filter((w) => w.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`relative whitespace-nowrap pb-2.5 text-[12px] font-semibold transition-colors sm:text-[13px] ${statusFilter === tab.key ? "text-palier-700" : "text-ink-soft hover:text-ink"}`}
            >
              {tab.label}
              <span
                className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold sm:ml-1.5 sm:text-[11px] ${statusFilter === tab.key ? "bg-palier-50 text-palier-700" : "text-ink-faint"}`}
                dir="ltr"
              >
                {count}
              </span>
              {statusFilter === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-palier-600" />
              )}
            </button>
          );
        })}
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
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
            >
              <Icon name="X" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Works list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card py-12 text-center shadow-card">
          <Icon name="HardHat" className="mx-auto h-8 w-8 text-ink-faint" />
          <p className="mt-2 text-[13px] text-ink-soft">{T.noWorks}</p>
          {(statusFilter !== "all" || search) && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setSearch("");
              }}
              className="mt-1 text-[13px] font-medium text-palier-600"
            >
              {C.resetFilters}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((work) => {
            const sty = statusStyles[work.status] ?? statusStyles.declared;
            const linkedIncident = work.incidentId ? incidentById.get(work.incidentId) : null;
            const isCompleted = work.status === "completed";

            return (
              <div
                key={work.id}
                className={`rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card transition-opacity md:p-5 ${isCompleted ? "opacity-70" : ""}`}
              >
                {/* Title + badge */}
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[14px] font-semibold text-ink md:text-[15px]">{work.title}</h3>
                    {work.description && (
                      <p className="mt-0.5 text-[12px] text-ink-soft line-clamp-2">{work.description}</p>
                    )}
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold ${sty.bg} ${sty.text}`}
                  >
                    <Icon name={sty.icon} className="h-3 w-3" />
                    {statusBadgeLabels[work.status]}
                  </span>
                </div>

                {/* Justification */}
                <div className="mb-3 rounded-xl border border-black/10 bg-white p-3">
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                    {T.card.justification}
                  </p>
                  <p className="text-[12px] leading-relaxed text-ink">{work.justification}</p>
                </div>

                {/* Details grid */}
                <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {work.supplier && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">{T.card.supplier}</p>
                      <p className="mt-0.5 text-[12px] font-medium text-ink">{work.supplier}</p>
                    </div>
                  )}
                  {work.estimatedCost !== undefined && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">{T.card.estimatedCost}</p>
                      <p className="mt-0.5 text-[12px] font-medium text-ink" dir="ltr">{mad(work.estimatedCost)}</p>
                    </div>
                  )}
                  {work.actualCost !== undefined && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">{T.card.actualCost}</p>
                      <p className="mt-0.5 text-[12px] font-medium text-ink" dir="ltr">{mad(work.actualCost)}</p>
                    </div>
                  )}
                  {linkedIncident && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">{T.card.linkedIncident}</p>
                      <p className="mt-0.5 text-[12px] font-medium text-palier-700">{linkedIncident.title}</p>
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className="mb-3 flex flex-wrap items-center gap-3 text-[12px] text-ink-soft">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="Calendar" className="h-3 w-3" />
                    {T.statuses.declared} <span dir="ltr">{longDate(work.declaredAt, lang)}</span> (<span dir="ltr">{timeAgo(work.declaredAt, lang)}</span>)
                  </span>
                  {work.completedAt && (
                    <span className="inline-flex items-center gap-1">
                      <Icon name="CalendarCheck" className="h-3 w-3" />
                      {T.statuses.completed} <span dir="ltr">{longDate(work.completedAt, lang)}</span>
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {work.status === "declared" && (
                    <StatusBtn
                      id={work.id}
                      newStatus="approved"
                      label={T.card.approve}
                      icon="CircleCheck"
                      className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                      onAction={handleStatusChange}
                    />
                  )}
                  {work.status === "approved" && (
                    <StatusBtn
                      id={work.id}
                      newStatus="in_progress"
                      label={T.card.start}
                      icon="Play"
                      className="border-palier-200 bg-palier-50 text-palier-700 hover:bg-palier-100"
                      onAction={handleStatusChange}
                    />
                  )}
                  {work.status === "in_progress" && (
                    <button
                      onClick={() => setCompleteOpen(work)}
                      className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Icon name="CircleCheck" className="h-3 w-3" />
                        {T.card.complete}
                      </span>
                    </button>
                  )}
                  {work.invoiceUrl && (
                    <a
                      href={work.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-black/[0.08] bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-soft transition-colors hover:bg-sand/50"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Icon name="FileText" className="h-3 w-3" />
                        {T.card.invoice}
                      </span>
                    </a>
                  )}
                  {!isCompleted && (
                    <button
                      onClick={() => setDeleteTarget(work)}
                      className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 transition-colors hover:bg-red-100"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Icon name="Trash2" className="h-3 w-3" />
                        {C.delete}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Declare work modal ── */}
      {declareOpen && (
        <DeclareModal
          buildingId={buildingId}
          incidents={incidents}
          onClose={() => setDeclareOpen(false)}
          onCreated={(newWork) => {
            setLocalWorks((prev) => [newWork, ...prev]);
            setDeclareOpen(false);
            flash(T.declareBtn);
          }}
        />
      )}

      {/* ── Complete work modal ── */}
      {completeOpen && (
        <CompleteModal
          work={completeOpen}
          onClose={() => setCompleteOpen(null)}
          onSuccess={(actualCost) => {
            setLocalWorks((prev) => prev.map((w) => w.id === completeOpen.id ? { ...w, status: "completed" as const, completedAt: new Date().toISOString(), actualCost } : w));
            setCompleteOpen(null);
            flash(T.statuses.completed);
          }}
        />
      )}

      {/* ── Delete confirmation ── */}
      {deleteTarget && (
        <Overlay onClose={() => setDeleteTarget(null)}>
          <div className="mb-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <Icon name="Trash2" className="h-5 w-5 text-red-600" />
              </span>
              <div>
                <h2 className="text-[16px] font-semibold text-ink">{T.deleteConfirm.title}</h2>
                <p className="text-[12px] text-ink-soft">{deleteTarget.title}</p>
              </div>
            </div>
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink"
            >
              <Icon name="X" className="h-4 w-4" />
            </button>
          </div>
          <p className="mb-5 text-[13px] text-ink-soft">
            {T.deleteConfirm.msg}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 rounded-xl border border-black/[0.08] py-2.5 text-[13px] font-semibold text-ink hover:bg-sand/50"
            >
              {C.cancel}
            </button>
            <DeleteBtn id={deleteTarget.id} onDelete={handleDelete} />
          </div>
        </Overlay>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 animate-[rise_0.25s_ease] rounded-lg bg-palier-600 px-4 py-2.5 text-[13px] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function StatusBtn({
  id,
  newStatus,
  label,
  icon,
  className,
  onAction,
}: {
  id: string;
  newStatus: UrgentWork["status"];
  label: string;
  icon: string;
  className: string;
  onAction: (id: string, status: UrgentWork["status"]) => Promise<void>;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(() => onAction(id, newStatus))}
      className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        <Icon name={icon} className="h-3 w-3" />
        {pending ? "…" : label}
      </span>
    </button>
  );
}

function DeleteBtn({ id, onDelete }: { id: string; onDelete: (id: string) => Promise<void> }) {
  const { i } = useLang();
  const C = i.syndic.common;
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(() => onDelete(id))}
      className="flex-1 rounded-xl bg-red-600 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
    >
      {pending ? "…" : C.delete}
    </button>
  );
}

function Overlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Declare Work Modal ── */

function DeclareModal({
  buildingId,
  incidents,
  onClose,
  onCreated,
}: {
  buildingId: string;
  incidents: IncidentRow[];
  onClose: () => void;
  onCreated: (work: UrgentWork) => void;
}) {
  const { i } = useLang();
  const T = i.syndic.travaux;
  const C = i.syndic.common;
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    title: "",
    description: "",
    justification: "",
    estimatedCost: "",
    supplier: "",
    incidentId: "",
  });
  const [formError, setFormError] = useState("");

  function handleSubmit() {
    if (!form.title.trim()) {
      setFormError(T.errors.titleRequired);
      return;
    }
    if (!form.justification.trim()) {
      setFormError(T.errors.justRequired);
      return;
    }
    setFormError("");
    start(async () => {
      try {
        await createUrgentWork({
          buildingId,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          justification: form.justification.trim(),
          estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : undefined,
          supplier: form.supplier.trim() || undefined,
          incidentId: form.incidentId || undefined,
        });
        const newWork: UrgentWork = {
          id: crypto.randomUUID(),
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          justification: form.justification.trim(),
          estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : undefined,
          supplier: form.supplier.trim() || undefined,
          incidentId: form.incidentId || undefined,
          status: "declared",
          declaredAt: new Date().toISOString(),
        };
        onCreated(newWork);
      } catch { setFormError(C.networkError); }
    });
  }

  const openIncidents = incidents.filter((inc) => inc.status !== "resolved");

  return (
    <Overlay onClose={onClose}>
      <div className="mb-5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-palier-100">
            <Icon name="HardHat" className="h-5 w-5 text-palier-600" />
          </span>
          <div>
            <h2 className="text-[16px] font-semibold text-ink">{T.declare.title}</h2>
            <p className="text-[12px] text-ink-soft">Art. 26 Loi 18-00</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
          <Icon name="X" className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-ink">
            {T.declare.titleLabel}
          </label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={T.declare.titlePlaceholder}
            className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-ink">{T.declare.description}</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={T.declare.descPlaceholder}
            rows={3}
            className="w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
          />
        </div>

        {/* Justification */}
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-ink">
            {T.declare.justification}
          </label>
          <textarea
            value={form.justification}
            onChange={(e) => setForm({ ...form, justification: e.target.value })}
            placeholder={T.declare.justPlaceholder}
            rows={3}
            className="w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
          />
          <p className="mt-1 text-[11px] text-ink-faint">
            {T.declare.justHint}
          </p>
        </div>

        {/* Estimated cost */}
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-ink">{T.declare.estimatedCost}</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.estimatedCost}
            onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })}
            placeholder="0.00"
            className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
          />
        </div>

        {/* Supplier */}
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-ink">{T.declare.supplier}</label>
          <input
            value={form.supplier}
            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            placeholder={T.declare.supplierPlaceholder}
            className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
          />
        </div>

        {/* Link to incident */}
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-ink">{T.declare.linkIncident}</label>
          <select
            value={form.incidentId}
            onChange={(e) => setForm({ ...form, incidentId: e.target.value })}
            className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-ink outline-none focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
          >
            <option value="">{T.declare.noIncident}</option>
            {openIncidents.map((inc) => (
              <option key={inc.id} value={inc.id}>
                {inc.title}
              </option>
            ))}
          </select>
        </div>

        {/* Error */}
        {formError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <Icon name="TriangleAlert" className="h-3.5 w-3.5 shrink-0 text-red-600" />
            <p className="text-[12px] font-medium text-red-700">{formError}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={pending}
          className="w-full rounded-xl bg-palier-600 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-palier-700 disabled:opacity-50"
        >
          {pending ? T.declare.submitting : T.declare.submit}
        </button>
      </div>
    </Overlay>
  );
}

/* ── Complete Work Modal ── */

function CompleteModal({
  work,
  onClose,
  onSuccess,
}: {
  work: UrgentWork;
  onClose: () => void;
  onSuccess: (actualCost?: number) => void;
}) {
  const { i } = useLang();
  const T = i.syndic.travaux;
  const [pending, start] = useTransition();
  const [actualCost, setActualCost] = useState(work.estimatedCost?.toString() ?? "");
  const [invoiceUrl, setInvoiceUrl] = useState("");

  function handleSubmit() {
    start(async () => {
      try {
        await updateUrgentWorkStatus(
          work.id,
          "completed",
          actualCost ? parseFloat(actualCost) : undefined,
        );
        onSuccess(actualCost ? parseFloat(actualCost) : undefined);
      } catch { onClose(); }
    });
  }

  return (
    <Overlay onClose={onClose}>
      <div className="mb-5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
            <Icon name="CircleCheck" className="h-5 w-5 text-emerald-600" />
          </span>
          <div>
            <h2 className="text-[16px] font-semibold text-ink">{T.completeModal.title}</h2>
            <p className="text-[12px] text-ink-soft">{work.title}</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
          <Icon name="X" className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Actual cost */}
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-ink">{T.completeModal.actualCost}</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={actualCost}
            onChange={(e) => setActualCost(e.target.value)}
            placeholder="0.00"
            className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
          />
          {work.estimatedCost !== undefined && (
            <p className="mt-1 text-[11px] text-ink-faint">{T.completeModal.estimatedCost} <span dir="ltr">{mad(work.estimatedCost)}</span></p>
          )}
        </div>

        {/* Invoice URL */}
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-ink">{T.completeModal.invoiceLink}</label>
          <input
            value={invoiceUrl}
            onChange={(e) => setInvoiceUrl(e.target.value)}
            placeholder="https://…"
            className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={pending}
          className="w-full rounded-xl bg-emerald-600 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? T.completeModal.confirming : T.completeModal.confirm}
        </button>
      </div>
    </Overlay>
  );
}
