"use client";
import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { addResident, updateResident, deactivateResident, reactivateResident, regenerateResidentCode } from "@/lib/actions";
import { useLang } from "@/lib/LangProvider";


interface Resident {
  id: string;
  name: string;
  avatarColor: string;
  phone: string;
  unit: string;
  role: string;
  status: string;
  deactivatedAt: string | null;
  tantiemes: number;
}

const PER_PAGE = 10;

export function ResidentsView({
  residents,
  kpis,
  buildingId,
}: {
  residents: Resident[];
  kpis: { lots: number; residents: number };
  buildingId: string;
}) {
  const router = useRouter();
  const { i } = useLang();
  const T = i.syndic.residents;
  const C = i.syndic.common;
  const [isPending, startTransition] = useTransition();
  const [localResidents, setLocalResidents] = useState<Resident[]>(residents);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "owner" | "tenant">("all");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive">("active");
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState<"add" | "edit" | "delete" | null>(null);
  const [addForm, setAddForm] = useState({ name: "", phone: "", unit: "", role: "owner" as "owner" | "tenant" });
  const [addResult, setAddResult] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Resident | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", role: "owner" as "owner" | "tenant" | "syndic", unit: "" });
  const [toast, setToast] = useState("");
  const [addError, setAddError] = useState("");
  const [editError, setEditError] = useState("");

  // Sync with server props when they update
  useEffect(() => { setLocalResidents(residents); }, [residents]);

  const [codeTarget, setCodeTarget] = useState<Resident | null>(null);
  const [codeValue, setCodeValue] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);

  const activeResidents = localResidents.filter((r) => (r.status ?? "active") === "active");
  const inactiveResidents = localResidents.filter((r) => (r.status ?? "active") === "inactive");
  const ownerCount = activeResidents.filter((r) => r.role === "owner" || r.role === "syndic").length;
  const tenantCount = activeResidents.filter((r) => r.role === "tenant").length;

  const filtered = useMemo(() => {
    let rows = [...localResidents]
      .filter((r) => (r.status ?? "active") === statusFilter)
      .sort((a, b) => a.unit.localeCompare(b.unit));
    if (roleFilter !== "all") rows = rows.filter((r) => r.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.unit.toLowerCase().includes(q) || r.phone.includes(q));
    }
    return rows;
  }, [localResidents, roleFilter, statusFilter, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pages - 1);
  const rows = filtered.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);

  function setFilter(role: typeof roleFilter) { setRoleFilter(role); setPage(0); }
  function setStatus(s: typeof statusFilter) { setStatusFilter(s); setPage(0); setRoleFilter("all"); }
  function setQ(v: string) { setSearch(v); setPage(0); }

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  function normalizePhone(raw: string): string {
    const digits = raw.replace(/\s/g, "");
    if (digits.startsWith("06") || digits.startsWith("07") || digits.startsWith("05")) return "+212" + digits.slice(1);
    if (digits.startsWith("00212")) return "+" + digits.slice(2);
    return digits;
  }

  function exportCSV() {
    const header = T.csv.header;
    const csvRows = filtered.map((r) =>
      `${r.unit},"${r.name.replace(/"/g, '""')}",${(r.status ?? "active") === "active" ? T.csv.active : T.csv.deactivated},${r.phone},${r.role === "tenant" ? T.roles.tenant : T.roles.owner},${r.tantiemes || ""}`
    );
    const csv = [header, ...csvRows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `palier-residents-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    flash(T.csv.downloaded);
  }

  function openAdd() { setAddForm({ name: "", phone: "", unit: "", role: "owner" }); setAddResult(null); setAddError(""); setModal("add"); }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    if (!addForm.name.trim() || !addForm.phone.trim() || !addForm.unit.trim()) return;
    const phone = normalizePhone(addForm.phone.trim());
    startTransition(async () => {
      const res = await addResident({ buildingId, name: addForm.name.trim(), phone, unit: addForm.unit.trim(), role: addForm.role });
      if (res.error) {
        const msgs: Record<string, string> = {
          unit_not_found: T.errors.unitNotFound,
          profile_error: T.errors.profileError,
          membership_error: T.errors.membershipError,
          validation_error: T.errors.validationError,
        };
        const errMsg = res.error.includes("invalid_format") || res.error.includes("Numéro invalide")
          ? msgs.validation_error
          : msgs[res.error] ?? T.errors.genericError;
        setAddError(errMsg);
      } else {
        setAddResult(res.code!);
        setAddForm({ ...addForm, phone });
        // Optimistic update — add resident to local list immediately
        const colors = ["#2c7766", "#2f74c0", "#d9961f", "#d6453f", "#8a9a4e", "#c5604f", "#45937e"];
        const newResident: Resident = {
          id: crypto.randomUUID(),
          name: addForm.name.trim(),
          avatarColor: colors[Math.floor(Math.random() * colors.length)],
          phone,
          unit: addForm.unit.trim().toUpperCase(),
          role: addForm.role,
          status: "active",
          deactivatedAt: null,
          tantiemes: 0,
        };
        setLocalResidents((prev) => [...prev, newResident]);
      }
    });
  }

  function openEdit(r: Resident) {
    setEditTarget(r);
    setEditForm({ name: r.name, phone: r.phone, role: r.role as "owner" | "tenant" | "syndic", unit: r.unit === "—" ? "" : r.unit });
    setEditError("");
    setModal("edit");
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditError("");
    if (!editTarget || !editForm.name.trim() || !editForm.phone.trim()) return;
    const phone = normalizePhone(editForm.phone.trim());
    startTransition(async () => {
      try {
        await updateResident({ profileId: editTarget.id, name: editForm.name.trim(), phone, role: editForm.role, buildingId, unit: editForm.unit.trim() || undefined });
        flash(T.toasts.residentModified);
        setLocalResidents((prev) => prev.map((r) => r.id === editTarget.id ? { ...r, name: editForm.name.trim(), phone, role: editForm.role, unit: editForm.unit.trim().toUpperCase() || r.unit } : r));
        setModal(null);
      } catch {
        setEditError(T.errors.genericError);
      }
    });
  }

  function openDelete(r: Resident) { setEditTarget(r); setModal("delete"); }

  function handleDeactivate() {
    if (!editTarget) return;
    startTransition(async () => {
      try {
        await deactivateResident(editTarget.id, buildingId);
        flash(T.toasts.residentDeactivated);
        setLocalResidents((prev) => prev.map((r) => r.id === editTarget.id ? { ...r, status: "inactive", deactivatedAt: new Date().toISOString() } : r));
        setModal(null);
      } catch { flash(T.toasts.deactivateError); }
    });
  }

  function handleReactivate(r: Resident) {
    startTransition(async () => {
      try {
        await reactivateResident(r.id, buildingId);
        flash(T.toasts.residentReactivated);
        setLocalResidents((prev) => prev.map((res) => res.id === r.id ? { ...res, status: "active", deactivatedAt: null } : res));
      } catch { flash(T.toasts.reactivateError); }
    });
  }

  async function handleRegenerateCode(r: Resident) {
    setCodeTarget(r);
    setCodeValue(null);
    setCodeLoading(true);
    try {
      const res = await regenerateResidentCode(r.id);
      if (res.error) { flash(T.toasts.codeNotFound); setCodeTarget(null); }
      else setCodeValue(res.code!);
    } catch { flash(T.toasts.codeGenError); setCodeTarget(null); }
    setCodeLoading(false);
  }

  return (
    <div>
      <PageHeader
        title={T.title}
        subtitle={T.subtitle(kpis.lots, activeResidents.length)}
        action={
          <div className="flex gap-2">
            <button onClick={exportCSV} className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3.5 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-sand/50">
              <Icon name="Download" className="h-3.5 w-3.5" /> {C.export}
            </button>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 rounded-lg bg-palier-600 px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-palier-700">
              <Icon name="Plus" className="h-3.5 w-3.5" /> {T.addResident}
            </button>
          </div>
        }
      />

      {/* Info note */}
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-4 py-3">
        <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
        <p className="text-[12px] text-ink-soft">
          {T.info}
        </p>
      </div>

      {/* Stats row */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-palier-100">
              <Icon name="Users" className="h-4 w-4 text-palier-600" />
            </span>
            <p className="text-[12px] font-semibold text-ink">{T.kpi.totalResidents}</p>
          </div>
          <p className="text-[28px] font-bold leading-none text-ink" dir="ltr">{activeResidents.length}</p>
          <p className="mt-1.5 text-[12px] font-medium text-ink-soft">{T.kpi.lotsCount(kpis.lots)} · {inactiveResidents.length > 0 ? T.kpi.deactivatedCount(inactiveResidents.length) : T.kpi.allActive}</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100">
              <Icon name="Building2" className="h-4 w-4 text-emerald-700" />
            </span>
            <p className="text-[12px] font-semibold text-ink">{T.kpi.owners}</p>
          </div>
          <p className="text-[28px] font-bold leading-none text-ink" dir="ltr">{ownerCount}</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100">
              <Icon name="Key" className="h-4 w-4 text-blue-700" />
            </span>
            <p className="text-[12px] font-semibold text-ink">{T.kpi.tenants}</p>
          </div>
          <p className="text-[28px] font-bold leading-none text-ink" dir="ltr">{tenantCount}</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="no-scrollbar mb-3 flex items-center gap-3 overflow-x-auto border-b border-black/[0.06]">
        <button
          onClick={() => setStatus("active")}
          className={`relative whitespace-nowrap pb-2.5 text-[13px] font-semibold transition-colors ${statusFilter === "active" ? "text-palier-700" : "text-ink-soft hover:text-ink"}`}
        >
          {T.statuses.active}
          <span className="ml-1.5 rounded-full bg-palier-50 px-1.5 py-0.5 text-[11px] font-bold text-palier-700" dir="ltr">{activeResidents.length}</span>
          {statusFilter === "active" && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-palier-600" />}
        </button>
        <button
          onClick={() => setStatus("inactive")}
          className={`relative whitespace-nowrap pb-2.5 text-[13px] font-semibold transition-colors ${statusFilter === "inactive" ? "text-amber-700" : "text-ink-soft hover:text-ink"}`}
        >
          {T.statuses.deactivatedPlural}
          {inactiveResidents.length > 0 && (
            <span className="ml-1.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-700" dir="ltr">{inactiveResidents.length}</span>
          )}
          {statusFilter === "inactive" && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-amber-600" />}
        </button>
      </div>

      {/* Toolbar */}
      <div className="mb-3 space-y-2">
        <div className="relative">
          <Icon name="Search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => setQ(e.target.value)}
            placeholder={T.search}
            className="h-9 w-full rounded-lg border border-black/[0.08] bg-white pl-9 pr-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
          />
          {search && (
            <button onClick={() => setQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink">
              <Icon name="X" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex rounded-lg border border-black/[0.08] bg-white p-0.5">
          {(["all", "owner", "tenant"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={`flex-1 rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors md:flex-none ${roleFilter === r ? "bg-palier-50 text-palier-700" : "text-ink hover:bg-sand/50"}`}
            >
              {r === "all" ? T.roles.all : r === "owner" ? T.roles.ownerPlural : T.roles.tenantPlural}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-cream-card shadow-card">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[13px] text-ink-soft">{C.noResults}</p>
            <button onClick={() => { setSearch(""); setRoleFilter("all"); }} className="mt-1 text-[13px] font-medium text-palier-600">
              {C.resetFilters}
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full text-left text-[13px] lg:table">
              <thead>
                <tr className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                  <th className="px-4 py-2.5">{T.table.lot}</th>
                  <th className="px-4 py-2.5">{T.table.name}</th>
                  <th className="px-4 py-2.5">{T.table.status}</th>
                  <th className="px-4 py-2.5">{T.table.phone}</th>
                  <th className="px-4 py-2.5 text-right">{T.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {rows.map((r) => {
                  const isInactive = (r.status ?? "active") === "inactive";
                  return (
                    <tr key={r.id} className={`transition-colors hover:bg-sand/50 ${isInactive ? "opacity-60" : ""}`}>
                      <td className="px-4 py-2.5 font-medium text-ink" dir="ltr">{r.unit}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-medium text-white ${isInactive ? "grayscale" : ""}`} style={{ backgroundColor: r.avatarColor }}>
                            {r.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-ink">{r.name}</span>
                            {isInactive && (
                              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">{T.statuses.deactivated}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${r.role === "tenant" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>
                          {r.role === "tenant" ? T.roles.tenant : T.roles.owner}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-ink-soft" dir="ltr">
                        {r.phone}
                        {isInactive && r.deactivatedAt && (
                          <p className="mt-0.5 text-[10px] text-amber-600">
                            {T.deactivatedOn} {new Date(r.deactivatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-0.5">
                          {isInactive ? (
                            <button
                              onClick={() => handleReactivate(r)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1.5 rounded-md bg-palier-50 px-2.5 py-1.5 text-[11px] font-semibold text-palier-700 transition-colors hover:bg-palier-100 disabled:opacity-50"
                            >
                              <Icon name="UserPlus" className="h-3.5 w-3.5" />
                              {T.reactivate}
                            </button>
                          ) : (
                            <>
                              <button onClick={() => handleRegenerateCode(r)} className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-palier-50 hover:text-palier-600" title={T.actionTitles.resendCode}>
                                <Icon name="KeyRound" className="h-3.5 w-3.5" />
                              </button>
                              <a href={`https://wa.me/${r.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-emerald-50 hover:text-emerald-600" title={T.actionTitles.whatsapp}>
                                <Icon name="MessageCircle" className="h-3.5 w-3.5" />
                              </a>
                              <button onClick={() => openEdit(r)} className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-blue-50 hover:text-blue-600" title={T.actionTitles.edit}>
                                <Icon name="Pencil" className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => openDelete(r)} className={`rounded-md p-1.5 text-ink-faint transition-colors hover:bg-red-50 hover:text-red-500 ${r.role === "syndic" ? "hidden" : ""}`} title={T.actionTitles.deactivate}>
                                <Icon name="Trash2" className="h-3.5 w-3.5" />
                              </button>
                            </>
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
              {rows.map((r) => {
                const isInactive = (r.status ?? "active") === "inactive";
                return (
                  <div key={r.id} className={`p-4 ${isInactive ? "opacity-60" : ""}`}>
                    <div className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-medium text-white ${isInactive ? "grayscale" : ""}`} style={{ backgroundColor: r.avatarColor }}>
                        {r.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-medium text-ink">{r.name}</p>
                          {isInactive && <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">{T.statuses.deactivated}</span>}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[12px] text-ink-soft">
                          <span className="font-medium text-ink">{T.table.lot} <span dir="ltr">{r.unit}</span></span>
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${r.role === "tenant" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>
                            {r.role === "tenant" ? T.roles.tenant : T.roles.owner}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[12px] text-ink-soft" dir="ltr">{r.phone}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        {isInactive ? (
                          <button onClick={() => handleReactivate(r)} disabled={isPending} className="inline-flex items-center gap-1 rounded-md bg-palier-50 px-2 py-1.5 text-[11px] font-semibold text-palier-700">
                            <Icon name="UserPlus" className="h-3.5 w-3.5" />{T.reactivate}
                          </button>
                        ) : (
                          <>
                            <button onClick={() => handleRegenerateCode(r)} className="rounded-md p-1.5 text-ink-faint" title={T.actionTitles.resendCode}><Icon name="KeyRound" className="h-4 w-4" /></button>
                            <a href={`https://wa.me/${r.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="rounded-md p-1.5 text-ink-faint"><Icon name="MessageCircle" className="h-4 w-4" /></a>
                            <button onClick={() => openEdit(r)} className="rounded-md p-1.5 text-ink-faint"><Icon name="Pencil" className="h-4 w-4" /></button>
                            <button onClick={() => openDelete(r)} className={`rounded-md p-1.5 text-ink-faint ${r.role === "syndic" ? "hidden" : ""}`}><Icon name="Trash2" className="h-4 w-4" /></button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {pages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.06] px-4 py-2.5 text-[12px] text-ink-soft">
                <span dir="ltr">{safePage * PER_PAGE + 1}–{Math.min((safePage + 1) * PER_PAGE, filtered.length)} {T.pagination.of} {filtered.length}</span>
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => setPage(Math.max(0, safePage - 1))} disabled={safePage === 0} className="rounded-md px-2 py-1 hover:bg-palier-50 disabled:opacity-30">
                    <Icon name="ChevronLeft" className="h-3.5 w-3.5" />
                  </button>
                  {Array.from({ length: pages }, (_, idx) => (
                    <button key={idx} onClick={() => setPage(idx)} className={`rounded-md px-2 py-1 font-medium ${idx === safePage ? "bg-palier-50 text-palier-700" : "text-ink-soft hover:bg-palier-50"}`}>
                      {idx + 1}
                    </button>
                  ))}
                  <button onClick={() => setPage(Math.min(pages - 1, safePage + 1))} disabled={safePage >= pages - 1} className="rounded-md px-2 py-1 hover:bg-palier-50 disabled:opacity-30">
                    <Icon name="ChevronRight" className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal: Ajouter ── */}
      {modal === "add" && (
        <Overlay onClose={() => setModal(null)}>
          {addResult ? (
            <div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                  <Icon name="Check" className="h-5 w-5 text-emerald-700" />
                </span>
                <p className="mt-3 text-[14px] font-semibold text-emerald-800">{T.addModal.success}</p>
                <p className="mt-2 text-[12px] text-ink-soft">
                  {T.addModal.codeSentTo(addForm.name.split(" ")[0])} <span className="font-semibold text-palier-700">{T.addModal.codeSentWhatsapp}</span> {T.addModal.codeSentSuffix(addForm.name.split(" ")[0])}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={openAdd} className="flex-1 rounded-lg border border-black/[0.08] py-2.5 text-[13px] font-medium text-ink hover:bg-sand/50">
                  {T.addModal.addAnother}
                </button>
                <button onClick={() => setModal(null)} className="flex-1 rounded-lg bg-palier-600 py-2.5 text-[13px] font-medium text-white hover:bg-palier-700">
                  {T.addModal.done}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="mb-5 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-palier-100">
                    <Icon name="UserPlus" className="h-5 w-5 text-palier-600" />
                  </span>
                  <div>
                    <h2 className="text-[16px] font-semibold text-ink">{T.addModal.title}</h2>
                    <p className="text-[12px] text-ink-soft">{T.addModal.subtitle}</p>
                  </div>
                </div>
                <button onClick={() => setModal(null)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                  <Icon name="X" className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-4">
                {addError && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
                    <Icon name="TriangleAlert" className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    <p className="text-[12px] font-medium text-red-800">{addError}</p>
                  </div>
                )}

                {/* Identité */}
                <div className="space-y-3 rounded-xl border border-black/10 bg-white p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink">{T.addModal.identity}</p>
                  <Field label={T.addModal.fullName} value={addForm.name} onChange={(v) => { setAddForm({ ...addForm, name: v }); setAddError(""); }} placeholder={T.addModal.namePlaceholder} required />
                  <Field label={T.addModal.phone} value={addForm.phone} onChange={(v) => { setAddForm({ ...addForm, phone: v }); setAddError(""); }} placeholder={T.addModal.phonePlaceholder} hint={T.addModal.phoneHint} type="tel" required />
                </div>

                {/* Logement */}
                <div className="space-y-3 rounded-xl border border-black/10 bg-white p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink">{T.addModal.housing}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label={T.addModal.unitNumber} value={addForm.unit} onChange={(v) => { setAddForm({ ...addForm, unit: v }); setAddError(""); }} placeholder={T.addModal.unitPlaceholder} required />
                    <div>
                      <label className="mb-1.5 block text-[12px] font-semibold text-ink">{T.addModal.statusLabel}</label>
                      <div className="flex gap-1 rounded-lg border border-black/[0.08] p-0.5">
                        <button type="button" onClick={() => setAddForm({ ...addForm, role: "owner" })} className={`flex-1 rounded-md py-2 text-[12px] font-medium transition-colors ${addForm.role === "owner" ? "bg-palier-50 text-palier-700" : "text-ink"}`}>
                          {T.roles.owner}
                        </button>
                        <button type="button" onClick={() => setAddForm({ ...addForm, role: "tenant" })} className={`flex-1 rounded-md py-2 text-[12px] font-medium transition-colors ${addForm.role === "tenant" ? "bg-palier-50 text-palier-700" : "text-ink"}`}>
                          {T.roles.tenant}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="flex items-start gap-2.5 rounded-xl border border-palier-200 bg-palier-50 px-3.5 py-3">
                  <Icon name="Send" className="mt-0.5 h-4 w-4 shrink-0 text-palier-600" />
                  <div>
                    <p className="text-[12px] font-semibold text-ink">{T.addModal.autoAccess}</p>
                    <p className="mt-0.5 text-[12px] text-ink">
                      {T.addModal.autoAccessDesc} <span className="font-bold text-palier-700">{T.addModal.autoAccessWhatsapp}</span> {T.addModal.autoAccessSuffix}
                    </p>
                  </div>
                </div>

                <button type="submit" disabled={isPending} className="w-full rounded-xl bg-palier-600 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-palier-700 disabled:opacity-50">
                  {isPending ? T.addModal.submitting : T.addModal.submitBtn}
                </button>
              </form>
            </div>
          )}
        </Overlay>
      )}

      {/* ── Modal: Modifier ── */}
      {modal === "edit" && editTarget && (
        <Overlay onClose={() => setModal(null)}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-ink">{T.editModal.title}</h2>
            <button onClick={() => setModal(null)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
              <Icon name="X" className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleEdit} className="space-y-3">
            {editError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
                <Icon name="TriangleAlert" className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <p className="text-[12px] font-medium text-red-800">{editError}</p>
              </div>
            )}
            <div className="flex items-center gap-3 rounded-lg bg-sand/50 px-3 py-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-medium text-white" style={{ backgroundColor: editTarget.avatarColor }}>
                {editTarget.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </span>
              <div>
                <p className="text-[13px] font-medium text-ink">{editTarget.name}</p>
                <p className="text-[12px] text-ink-soft">{T.table.lot} {editTarget.unit}</p>
              </div>
            </div>
            <Field label={T.addModal.fullName} value={editForm.name} onChange={(v) => { setEditForm({ ...editForm, name: v }); setEditError(""); }} required />
            {editTarget.role === "syndic" ? (
              <Field label={T.addModal.unitNumber} value={editForm.unit} onChange={(v) => { setEditForm({ ...editForm, unit: v }); setEditError(""); }} placeholder={T.addModal.unitPlaceholder} />
            ) : (
              <>
                <Field label={T.addModal.phone} value={editForm.phone} onChange={(v) => { setEditForm({ ...editForm, phone: v }); setEditError(""); }} placeholder={T.addModal.phonePlaceholder} hint={T.addModal.phoneHint} type="tel" required />
                <Field label={T.addModal.unitNumber} value={editForm.unit} onChange={(v) => { setEditForm({ ...editForm, unit: v }); setEditError(""); }} placeholder={T.addModal.unitPlaceholder} />
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-ink">{T.addModal.statusLabel}</label>
                  <div className="flex gap-1 rounded-lg border border-black/[0.08] p-0.5">
                    <button type="button" onClick={() => setEditForm({ ...editForm, role: "owner" })} className={`flex-1 rounded-md py-2 text-[12px] font-medium transition-colors ${editForm.role === "owner" ? "bg-palier-50 text-palier-700" : "text-ink"}`}>
                      {T.roles.owner}
                    </button>
                    <button type="button" onClick={() => setEditForm({ ...editForm, role: "tenant" })} className={`flex-1 rounded-md py-2 text-[12px] font-medium transition-colors ${editForm.role === "tenant" ? "bg-palier-50 text-palier-700" : "text-ink"}`}>
                      {T.roles.tenant}
                    </button>
                  </div>
                </div>
              </>
            )}
            <button type="submit" disabled={isPending} className="w-full rounded-lg bg-palier-600 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-palier-700 disabled:opacity-50">
              {isPending ? T.editModal.saving : T.editModal.saveBtn}
            </button>
          </form>
        </Overlay>
      )}

      {/* ── Modal: Retirer ── */}
      {modal === "delete" && editTarget && (
        <Overlay onClose={() => setModal(null)}>
          <div className="mb-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <Icon name="UserMinus" className="h-5 w-5 text-amber-700" />
              </span>
              <div>
                <h2 className="text-[16px] font-semibold text-ink">{T.deleteModal.title}</h2>
                <p className="text-[12px] text-ink-soft">{T.deleteModal.subtitle}</p>
              </div>
            </div>
            <button onClick={() => setModal(null)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
              <Icon name="X" className="h-4 w-4" />
            </button>
          </div>

          {/* Résident ciblé */}
          <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-medium text-white" style={{ backgroundColor: editTarget.avatarColor }}>
              {editTarget.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </span>
            <div>
              <p className="text-[14px] font-semibold text-ink">{editTarget.name}</p>
              <p className="text-[12px] text-ink-soft">{T.table.lot} {editTarget.unit} · {editTarget.role === "tenant" ? T.roles.tenant : T.roles.owner}</p>
            </div>
          </div>

          {/* Ce qui va se passer */}
          <div className="mt-4 space-y-2">
            <p className="text-[12px] font-bold uppercase tracking-wider text-ink">{T.deleteModal.whatHappens}</p>
            <div className="space-y-2 rounded-xl border border-black/10 bg-white p-3">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-red-600">{T.deleteModal.losesAccess}</p>
              <div className="flex items-start gap-2.5">
                <Icon name="X" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
                <p className="text-[12px] text-ink">{T.deleteModal.loseNeighborhood} <span className="font-semibold">{T.deleteModal.neighborhoodBold}</span></p>
              </div>
              <div className="flex items-start gap-2.5">
                <Icon name="X" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
                <p className="text-[12px] text-ink">{T.deleteModal.loseIncidents} <span className="font-semibold">{T.deleteModal.incidentsBold}</span></p>
              </div>
              <div className="flex items-start gap-2.5">
                <Icon name="X" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
                <p className="text-[12px] text-ink">{T.deleteModal.loseAG} <span className="font-semibold">{T.deleteModal.agBold}</span></p>
              </div>
              <div className="flex items-start gap-2.5">
                <Icon name="X" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
                <p className="text-[12px] text-ink">{T.deleteModal.loseDocsPrefix} <span className="font-semibold">{T.deleteModal.newDocsBold}</span> {T.deleteModal.loseDocsMiddle} <span className="font-semibold">{T.deleteModal.transparencyBold}</span></p>
              </div>
              <div className="flex items-start gap-2.5">
                <Icon name="X" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
                <p className="text-[12px] text-ink">{T.deleteModal.loseServices} <span className="font-semibold">{T.deleteModal.servicesBold}</span> {T.deleteModal.loseServicesSuffix}</p>
              </div>
              <div className="my-2 border-t border-black/[0.06]" />
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600">{T.deleteModal.kept}</p>
              <div className="flex items-start gap-2.5">
                <Icon name="Check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <p className="text-[12px] text-ink">{T.deleteModal.keepCharges} <span className="font-semibold">{T.deleteModal.chargesBold}</span> {T.deleteModal.keepChargesSuffix}</p>
              </div>
              <div className="flex items-start gap-2.5">
                <Icon name="Check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <p className="text-[12px] text-ink">{T.deleteModal.keepIncidents} <span className="font-semibold">{T.deleteModal.publicationsBold}</span> {T.deleteModal.keepIncidentsSuffix}</p>
              </div>
              <div className="flex items-start gap-2.5">
                <Icon name="Check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <p className="text-[12px] text-ink"><span className="font-semibold">{T.deleteModal.docsBold}</span> {T.deleteModal.keepDocsMiddle} <span className="font-semibold">{T.deleteModal.transparencyBold2}</span> {T.deleteModal.keepDocsSuffix}</p>
              </div>
              <div className="flex items-start gap-2.5">
                <Icon name="Check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <p className="text-[12px] text-ink">{T.deleteModal.keepExport} <span className="font-semibold">{T.deleteModal.personalDataBold}</span> {T.deleteModal.keepExportSuffix}</p>
              </div>
            </div>
          </div>

          {/* Avertissement */}
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
            <Icon name="Info" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-[12px] text-ink">
              {T.deleteModal.warning}
            </p>
          </div>

          <div className="mt-5 flex gap-2">
            <button onClick={() => setModal(null)} className="flex-1 rounded-xl border border-black/[0.08] py-2.5 text-[13px] font-semibold text-ink hover:bg-sand/50">
              {C.cancel}
            </button>
            <button onClick={handleDeactivate} disabled={isPending} className="flex-1 rounded-xl bg-amber-600 py-2.5 text-[13px] font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
              {isPending ? T.deleteModal.deactivating : T.deleteModal.confirmBtn}
            </button>
          </div>
        </Overlay>
      )}

      {/* Code d'accès modal */}
      {codeTarget && (
        <Overlay onClose={() => setCodeTarget(null)}>
          <div className="mb-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-palier-100">
                <Icon name="KeyRound" className="h-5 w-5 text-palier-600" />
              </span>
              <div>
                <h2 className="text-[16px] font-semibold text-ink">{T.codeModal.title}</h2>
                <p className="text-[12px] text-ink-soft">Lot {codeTarget.unit} · {codeTarget.name}</p>
              </div>
            </div>
            <button onClick={() => setCodeTarget(null)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
              <Icon name="X" className="h-4 w-4" />
            </button>
          </div>
          {codeLoading ? (
            <div className="py-8 text-center">
              <Icon name="LoaderCircle" className="mx-auto h-6 w-6 animate-spin text-ink-faint" />
              <p className="mt-2 text-[13px] text-ink-soft">{T.codeModal.generating}</p>
            </div>
          ) : codeValue ? (
            <div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                  <Icon name="Check" className="h-5 w-5 text-emerald-700" />
                </span>
                <p className="mt-3 text-[14px] font-semibold text-emerald-800">{T.codeModal.success}</p>
                <p className="mt-2 text-[12px] text-ink-soft">
                  {T.codeModal.codeSentDesc(codeTarget.name.split(" ")[0])} <span className="font-semibold text-palier-700">{T.codeModal.codeSentWhatsapp}</span> {T.codeModal.codeSentSuffix(codeTarget.name.split(" ")[0])}
                </p>
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                <p className="text-[11px] text-amber-800">{T.codeModal.oldCodeInvalid}</p>
              </div>
              <button onClick={() => setCodeTarget(null)} className="mt-4 w-full rounded-lg bg-palier-600 py-2.5 text-[13px] font-medium text-white hover:bg-palier-700">
                {C.close}
              </button>
            </div>
          ) : null}
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

/* ── Shared sub-components ── */

function Overlay({ onClose, wide, children }: { onClose: () => void; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30" onClick={onClose}>
      <div className={`w-full ${wide ? "max-w-lg" : "max-w-md"} max-h-[90vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", required, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-ink">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
      />
      {hint && <p className="mt-1 text-[11px] text-ink-soft">{hint}</p>}
    </div>
  );
}
