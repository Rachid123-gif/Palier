"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { shortDate, mad } from "@/lib/format";
import { createInsurancePolicy, updateInsurancePolicy, deleteInsurancePolicy } from "@/lib/actions";
import type { InsurancePolicy } from "@/lib/types";

const COVERAGE_TYPES = [
  { value: "multirisque", label: "Multirisque immeuble" },
  { value: "rc", label: "Responsabilité civile" },
  { value: "incendie", label: "Incendie" },
  { value: "autre", label: "Autre" },
];

function coverageLabel(type: string) {
  return COVERAGE_TYPES.find((c) => c.value === type)?.label ?? type;
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export function AssuranceView({ policies, buildingId }: { policies: InsurancePolicy[]; buildingId: string }) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const flash = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); }, []);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<InsurancePolicy | null>(null);
  const [showDelete, setShowDelete] = useState<InsurancePolicy | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [fInsurer, setFInsurer] = useState("");
  const [fPolicyNumber, setFPolicyNumber] = useState("");
  const [fCoverageType, setFCoverageType] = useState("multirisque");
  const [fPremium, setFPremium] = useState("");
  const [fStartDate, setFStartDate] = useState("");
  const [fEndDate, setFEndDate] = useState("");
  const [fAlertDays, setFAlertDays] = useState("30");
  const [fNotes, setFNotes] = useState("");

  function resetForm() {
    setFInsurer(""); setFPolicyNumber(""); setFCoverageType("multirisque");
    setFPremium(""); setFStartDate(""); setFEndDate(""); setFAlertDays("30"); setFNotes("");
  }

  function openEdit(p: InsurancePolicy) {
    setFInsurer(p.insurer);
    setFPolicyNumber(p.policyNumber ?? "");
    setFCoverageType(p.coverageType);
    setFPremium(p.premiumAmount.toString());
    setFStartDate(p.startDate);
    setFEndDate(p.endDate);
    setFAlertDays(p.renewalAlertDays.toString());
    setFNotes(p.notes ?? "");
    setEditing(p);
  }

  // KPIs
  const now = new Date();
  const activePolicies = useMemo(() => policies.filter((p) => new Date(p.endDate) >= now), [policies]);
  const totalPremiums = useMemo(() => policies.reduce((s, p) => s + p.premiumAmount, 0), [policies]);
  const nextExpiry = useMemo(() => {
    const future = policies.filter((p) => new Date(p.endDate) >= now).sort((a, b) => a.endDate.localeCompare(b.endDate));
    return future.length > 0 ? future[0].endDate : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policies]);

  // Create
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!fInsurer || !fStartDate || !fEndDate) return;
    setSaving(true);
    await createInsurancePolicy({
      buildingId,
      insurer: fInsurer,
      policyNumber: fPolicyNumber || undefined,
      coverageType: fCoverageType,
      premiumAmount: Number(fPremium) || 0,
      startDate: fStartDate,
      endDate: fEndDate,
      renewalAlertDays: Number(fAlertDays) || 30,
      notes: fNotes || undefined,
    });
    setSaving(false);
    setShowCreate(false);
    resetForm();
    flash("Police ajoutée");
    router.refresh();
  }

  // Update
  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !fInsurer || !fStartDate || !fEndDate) return;
    setSaving(true);
    await updateInsurancePolicy(editing.id, {
      insurer: fInsurer,
      policy_number: fPolicyNumber || null,
      coverage_type: fCoverageType,
      premium_amount: Number(fPremium) || 0,
      start_date: fStartDate,
      end_date: fEndDate,
      renewal_alert_days: Number(fAlertDays) || 30,
      notes: fNotes || null,
    });
    setSaving(false);
    setEditing(null);
    resetForm();
    flash("Police mise à jour");
    router.refresh();
  }

  // Delete
  async function handleDelete() {
    if (!showDelete) return;
    await deleteInsurancePolicy(showDelete.id);
    setShowDelete(null);
    flash("Police supprimée");
    router.refresh();
  }

  const inputCls = "h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20";

  // Renewal badge
  function renewalBadge(p: InsurancePolicy) {
    const days = daysUntil(p.endDate);
    if (days < 0) return <span className="inline-flex items-center whitespace-nowrap rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">Expirée</span>;
    if (days <= p.renewalAlertDays) return <span className="inline-flex items-center whitespace-nowrap rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">Renouvellement dans {days} j</span>;
    return null;
  }

  const formContent = (onSubmit: (e: React.FormEvent) => void, isEdit: boolean) => (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Assureur *</label>
        <input type="text" required value={fInsurer} onChange={(e) => setFInsurer(e.target.value)} placeholder="Ex: Wafa Assurance" className={inputCls} />
      </div>
      <div>
        <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">N° de police</label>
        <input type="text" value={fPolicyNumber} onChange={(e) => setFPolicyNumber(e.target.value)} placeholder="Ex: POL-2024-001" className={inputCls} />
      </div>
      <div>
        <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Type de couverture</label>
        <select value={fCoverageType} onChange={(e) => setFCoverageType(e.target.value)} className={inputCls}>
          {COVERAGE_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Prime annuelle (MAD)</label>
        <input type="number" min="0" step="0.01" value={fPremium} onChange={(e) => setFPremium(e.target.value)} placeholder="0" className={inputCls} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Date début *</label>
          <input type="date" required value={fStartDate} onChange={(e) => setFStartDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Date fin *</label>
          <input type="date" required value={fEndDate} onChange={(e) => setFEndDate(e.target.value)} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Alerte renouvellement (jours avant expiration)</label>
        <input type="number" min="1" value={fAlertDays} onChange={(e) => setFAlertDays(e.target.value)} placeholder="30" className={inputCls} />
      </div>
      <div>
        <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Notes</label>
        <textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} placeholder="Remarques, clauses spéciales…" rows={3} className="w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20" />
      </div>
      <button type="submit" disabled={saving} className="w-full rounded-xl bg-palier-600 py-2.5 text-[13px] font-semibold text-white hover:bg-palier-700 disabled:opacity-50">
        {saving ? "Enregistrement…" : isEdit ? "Mettre à jour" : "Ajouter la police"}
      </button>
    </form>
  );

  return (
    <div>
      <PageHeader
        title="Assurance"
        subtitle={`${activePolicies.length} police${activePolicies.length > 1 ? "s" : ""} active${activePolicies.length > 1 ? "s" : ""}`}
        action={
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-palier-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-palier-700">
            <Icon name="Plus" className="h-3.5 w-3.5" /> Ajouter une police
          </button>
        }
      />

      {/* Info banner */}
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-4 py-3">
        <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
        <p className="text-[12px] text-ink-soft">
          Art. 26 Loi 18-00 — Le syndic doit souscrire et maintenir l&apos;assurance de l&apos;immeuble.
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">Polices actives</p>
          <p className="text-[28px] font-bold leading-none text-ink">{activePolicies.length}</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">Prochaine échéance</p>
          <p className="text-[16px] font-bold leading-none text-ink">{nextExpiry ? shortDate(nextExpiry) : "—"}</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">Primes annuelles</p>
          <p className="text-[16px] font-bold leading-none text-ink">{mad(totalPremiums)}</p>
        </div>
      </div>

      {/* Policy cards */}
      <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-cream-card shadow-card">
        {policies.length === 0 ? (
          <div className="py-12 text-center">
            <Icon name="Shield" className="mx-auto h-8 w-8 text-ink-faint" />
            <p className="mt-2 text-[13px] text-ink-soft">Aucune police d&apos;assurance</p>
            <button onClick={() => setShowCreate(true)} className="mt-1 text-[13px] font-medium text-palier-600">Ajouter une police</button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full table-fixed text-left text-[13px] lg:table">
              <thead>
                <tr className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                  <th className="w-[22%] px-4 py-2.5">Assureur</th>
                  <th className="w-[14%] px-4 py-2.5">N° police</th>
                  <th className="w-[16%] px-4 py-2.5">Couverture</th>
                  <th className="w-[14%] px-4 py-2.5">Période</th>
                  <th className="w-[12%] px-4 py-2.5">Prime</th>
                  <th className="w-[22%] px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {policies.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-sand/50">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-ink">{p.insurer}</p>
                      {renewalBadge(p)}
                    </td>
                    <td className="px-4 py-2.5 text-ink-soft">{p.policyNumber || "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center rounded-full bg-palier-50 px-2 py-0.5 text-[11px] font-semibold text-palier-700">
                        {coverageLabel(p.coverageType)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-ink-soft">
                      {shortDate(p.startDate)} → {shortDate(p.endDate)}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-ink">{mad(p.premiumAmount)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.fileUrl && (
                          <a href={p.fileUrl} target="_blank" rel="noopener" className="text-[11px] font-semibold text-palier-600 hover:underline">
                            Fichier
                          </a>
                        )}
                        <button onClick={() => openEdit(p)} className="text-[11px] font-semibold text-palier-600 hover:underline">
                          Modifier
                        </button>
                        <button onClick={() => setShowDelete(p)} className="text-[11px] font-semibold text-red-600 hover:underline">
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="divide-y divide-black/[0.04] lg:hidden">
              {policies.map((p) => (
                <div key={p.id} className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[14px] font-medium text-ink">{p.insurer}</p>
                      <p className="mt-0.5 text-[12px] text-ink-soft">{p.policyNumber || "Sans numéro"} · {coverageLabel(p.coverageType)}</p>
                    </div>
                    {renewalBadge(p)}
                  </div>
                  <div className="mb-2.5 flex items-center gap-3 text-[12px] text-ink-soft">
                    <span>{shortDate(p.startDate)} → {shortDate(p.endDate)}</span>
                    <span className="font-medium text-ink">{mad(p.premiumAmount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.fileUrl && (
                      <a href={p.fileUrl} target="_blank" rel="noopener" className="text-[12px] font-semibold text-palier-600">Fichier</a>
                    )}
                    <button onClick={() => openEdit(p)} className="text-[12px] font-semibold text-palier-600">Modifier</button>
                    <button onClick={() => setShowDelete(p)} className="text-[11px] font-semibold text-red-600">Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30" onClick={() => { setShowCreate(false); resetForm(); }}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-palier-100">
                  <Icon name="Shield" className="h-5 w-5 text-palier-600" />
                </span>
                <div>
                  <h2 className="text-[16px] font-semibold text-ink">Ajouter une police</h2>
                  <p className="text-[12px] text-ink-soft">Assurance de l&apos;immeuble</p>
                </div>
              </div>
              <button onClick={() => { setShowCreate(false); resetForm(); }} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>
            {formContent(handleCreate, false)}
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30" onClick={() => { setEditing(null); resetForm(); }}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-palier-100">
                  <Icon name="Shield" className="h-5 w-5 text-palier-600" />
                </span>
                <div>
                  <h2 className="text-[16px] font-semibold text-ink">Modifier la police</h2>
                  <p className="text-[12px] text-ink-soft">{editing.insurer}</p>
                </div>
              </div>
              <button onClick={() => { setEditing(null); resetForm(); }} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>
            {formContent(handleUpdate, true)}
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30" onClick={() => setShowDelete(null)}>
          <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                <Icon name="Trash2" className="h-4 w-4 text-red-600" />
              </div>
              <h2 className="text-[15px] font-semibold text-ink">Supprimer cette police ?</h2>
            </div>
            <p className="mb-4 text-[13px] text-ink-soft">
              La police « {showDelete.insurer} » ({showDelete.policyNumber || "sans numéro"}) sera définitivement supprimée.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(null)} className="flex-1 rounded-xl border border-black/[0.08] py-2.5 text-[13px] font-semibold text-ink hover:bg-sand/50">
                Annuler
              </button>
              <button onClick={handleDelete} className="flex-1 rounded-xl bg-red-600 py-2.5 text-[13px] font-semibold text-white hover:bg-red-700">
                Supprimer
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
