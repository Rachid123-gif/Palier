"use client";

import { useState, useCallback, useRef } from "react";
import { PageHeader } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { longDate, mad } from "@/lib/format";
import { createMandate, updateMandate, deleteMandate, uploadFileAction } from "@/lib/actions";
import type { SyndicMandate } from "@/lib/types";

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

function addYears(iso: string, years: number): string {
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

function mandateProgress(electedAt: string, mandateEnd: string): number {
  const start = new Date(electedAt).getTime();
  const end = new Date(mandateEnd).getTime();
  const now = Date.now();
  if (now >= end) return 100;
  if (now <= start) return 0;
  return Math.round(((now - start) / (end - start)) * 100);
}

export function MandatView({ mandate: initialMandate, buildingId }: { mandate: SyndicMandate | null; buildingId: string }) {
  const [mandate, setMandate] = useState<SyndicMandate | null>(initialMandate);
  const [toast, setToast] = useState<string | null>(null);
  const flash = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); }, []);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [fName, setFName] = useState(mandate?.syndicName ?? "");
  const [fType, setFType] = useState<"benevole" | "professionnel">(mandate?.syndicType ?? "benevole");
  const [fDeputy, setFDeputy] = useState(mandate?.deputyName ?? "");
  const [fElectedAt, setFElectedAt] = useState(mandate?.electedAt ?? "");
  const [fMandateEnd, setFMandateEnd] = useState(mandate?.mandateEnd ?? "");
  const [fRemuneration, setFRemuneration] = useState(mandate?.remuneration?.toString() ?? "");
  const [fContractUrl, setFContractUrl] = useState(mandate?.contractUrl ?? "");
  const [contractFile, setContractFile] = useState<File | null>(null);
  const contractFileRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setFName(mandate?.syndicName ?? "");
    setFType(mandate?.syndicType ?? "benevole");
    setFDeputy(mandate?.deputyName ?? "");
    setFElectedAt(mandate?.electedAt ?? "");
    setFMandateEnd(mandate?.mandateEnd ?? "");
    setFRemuneration(mandate?.remuneration?.toString() ?? "");
    setFContractUrl(mandate?.contractUrl ?? "");
    setContractFile(null);
  }

  function openForm() {
    resetForm();
    setShowForm(true);
  }

  // Auto-calculate mandate_end when electedAt changes
  function handleElectedAtChange(val: string) {
    setFElectedAt(val);
    if (val) {
      setFMandateEnd(addYears(val, 2));
    }
  }

  // Save (create or update)
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!fName || !fElectedAt || !fMandateEnd) return;
    setSaving(true);
    try {
      // Upload contract file if provided
      let contractUrl = fContractUrl;
      if (contractFile) {
        const fd = new FormData();
        fd.append("file", contractFile);
        const uploadRes = await uploadFileAction(fd);
        if (uploadRes.url) contractUrl = uploadRes.url;
      }
      setFContractUrl(contractUrl);

      if (mandate) {
        await updateMandate(mandate.id, {
          syndic_name: fName,
          syndic_type: fType,
          deputy_name: fDeputy || null,
          elected_at: fElectedAt,
          mandate_end: fMandateEnd,
          remuneration: fRemuneration ? Number(fRemuneration) : null,
          contract_url: contractUrl || null,
        });
        flash("Mandat mis à jour");
      } else {
        await createMandate({
          buildingId,
          syndicName: fName,
          syndicType: fType,
          deputyName: fDeputy || undefined,
          electedAt: fElectedAt,
          mandateEnd: fMandateEnd,
          remuneration: fRemuneration ? Number(fRemuneration) : undefined,
          contractUrl: contractUrl || undefined,
        });
        flash("Mandat enregistré");
      }
      const updated: SyndicMandate = {
        id: mandate?.id ?? crypto.randomUUID(),
        syndicName: fName,
        syndicType: fType,
        deputyName: fDeputy || undefined,
        electedAt: fElectedAt,
        mandateEnd: fMandateEnd,
        remuneration: fRemuneration ? Number(fRemuneration) : undefined,
        contractUrl: contractUrl || undefined,
      };
      setMandate(updated);
      setShowForm(false);
    } catch {
      flash("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  // Delete
  async function handleDelete() {
    if (!mandate) return;
    await deleteMandate(mandate.id);
    setMandate(null);
    setShowDelete(false);
    flash("Mandat supprimé");
  }

  // Status helpers
  const daysRemaining = mandate ? daysUntil(mandate.mandateEnd) : 0;
  const progress = mandate ? mandateProgress(mandate.electedAt, mandate.mandateEnd) : 0;

  function statusBadge() {
    if (!mandate) return null;
    if (daysRemaining < 0) return <span className="inline-flex items-center whitespace-nowrap rounded-md bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">Mandat expiré</span>;
    if (daysRemaining <= 90) return <span className="inline-flex items-center whitespace-nowrap rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Expire dans {daysRemaining} j</span>;
    return <span className="inline-flex items-center whitespace-nowrap rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Actif · {daysRemaining} j restants</span>;
  }

  const inputCls = "h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20";

  return (
    <div>
      <PageHeader
        title="Mandat du syndic"
        subtitle={mandate ? `${mandate.syndicName} · ${mandate.syndicType === "professionnel" ? "Professionnel" : "Bénévole"}` : "Aucun mandat enregistré"}
        action={
          <button onClick={openForm} className="inline-flex items-center gap-1.5 rounded-lg bg-palier-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-palier-700">
            <Icon name={mandate ? "Pencil" : "Plus"} className="h-3.5 w-3.5" /> {mandate ? "Modifier" : "Enregistrer un mandat"}
          </button>
        }
      />

      {/* Info banner */}
      <div className="mb-3 flex items-start gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-4 py-3">
        <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
        <p className="text-[12px] text-ink-soft">
          Art. 19 Loi 18-00 — Le mandat du syndic est de 2 ans, renouvelable par vote AG à la majorité des 3/4.
        </p>
      </div>
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-palier-200 bg-palier-50 px-4 py-3">
        <Icon name="Users" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-palier-600" />
        <p className="text-[12px] text-palier-800">
          Les informations du mandat sont visibles par les résidents dans leur section <strong>Immeuble</strong>.
        </p>
      </div>

      {mandate ? (
        <>
          {/* Mandate card */}
          <div className="mb-4 rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-palier-100">
                  <Icon name="UserCheck" className="h-6 w-6 text-palier-600" />
                </span>
                <div>
                  <h2 className="text-[16px] font-semibold text-ink">{mandate.syndicName}</h2>
                  <p className="mt-0.5 text-[12px] text-ink-soft">
                    {mandate.syndicType === "professionnel" ? "Syndic professionnel" : "Syndic bénévole"}
                    {mandate.deputyName && ` · Adjoint : ${mandate.deputyName}`}
                  </p>
                </div>
              </div>
              {statusBadge()}
            </div>

            {/* Details grid */}
            <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-[11px] font-semibold text-ink-soft">Date d&apos;élection</p>
                <p className="mt-0.5 text-[13px] font-medium text-ink">{longDate(mandate.electedAt)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-ink-soft">Fin du mandat</p>
                <p className="mt-0.5 text-[13px] font-medium text-ink">{longDate(mandate.mandateEnd)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-ink-soft">Jours restants</p>
                <p className="mt-0.5 text-[13px] font-medium text-ink">{daysRemaining > 0 ? daysRemaining : 0}</p>
              </div>
              {mandate.remuneration !== undefined && mandate.remuneration !== null && (
                <div>
                  <p className="text-[11px] font-semibold text-ink-soft">Rémunération</p>
                  <p className="mt-0.5 text-[13px] font-medium text-ink">{mad(mandate.remuneration)}/an</p>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px] text-ink-soft">
                <span>Durée écoulée</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-sand/50">
                <div
                  style={{ width: `${Math.min(progress, 100)}%` }}
                  className={`h-full rounded-full transition-all ${progress >= 100 ? "bg-red-500" : progress >= 75 ? "bg-amber-500" : "bg-palier-600"}`}
                />
              </div>
            </div>

            {/* Contract link */}
            {mandate.contractUrl && (
              <div className="mt-4">
                <a href={mandate.contractUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-lg border border-black/[0.06] bg-white px-3 py-2 text-[12px] font-medium text-palier-600 hover:bg-sand/50">
                  <Icon name="FileText" className="h-4 w-4" />
                  Voir le contrat
                  <Icon name="ExternalLink" className="h-3 w-3" />
                </a>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <button onClick={openForm} className="rounded-lg border border-black/[0.08] px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-sand/50">
                Modifier
              </button>
              <button onClick={() => setShowDelete(true)} className="rounded-lg border border-red-200 px-3.5 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50">
                Supprimer
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card py-12 text-center shadow-card">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-palier-50">
            <Icon name="UserCheck" className="h-7 w-7 text-palier-400" />
          </span>
          <p className="mt-3 text-[14px] font-semibold text-ink">Aucun mandat configuré</p>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-ink-soft">Ajoutez les informations du mandat syndic pour suivre sa durée et son renouvellement.</p>
          <button onClick={openForm} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-palier-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-palier-700">
            <Icon name="Plus" className="h-3.5 w-3.5" />
            Enregistrer le mandat du syndic
          </button>
        </div>
      )}

      {/* Form modal (create or edit) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-palier-100">
                  <Icon name="UserCheck" className="h-5 w-5 text-palier-600" />
                </span>
                <div>
                  <h2 className="text-[16px] font-semibold text-ink">{mandate ? "Modifier le mandat" : "Enregistrer un mandat"}</h2>
                  <p className="text-[12px] text-ink-soft">Informations du syndic en exercice</p>
                </div>
              </div>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Nom du syndic *</label>
                <input type="text" required value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Nom complet" className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Type de syndic</label>
                <select value={fType} onChange={(e) => setFType(e.target.value as "benevole" | "professionnel")} className={inputCls}>
                  <option value="benevole">Bénévole</option>
                  <option value="professionnel">Professionnel</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Adjoint du syndic</label>
                <input type="text" value={fDeputy} onChange={(e) => setFDeputy(e.target.value)} placeholder="Nom de l'adjoint (optionnel)" className={inputCls} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Date d&apos;élection *</label>
                  <input type="date" required value={fElectedAt} onChange={(e) => handleElectedAtChange(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Fin du mandat</label>
                  <input type="date" value={fMandateEnd} onChange={(e) => setFMandateEnd(e.target.value)} className={inputCls} />
                  <p className="mt-0.5 text-[10px] text-ink-faint">Auto-calculé : élection + 2 ans</p>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Rémunération annuelle (MAD)</label>
                <input type="number" min="0" step="0.01" value={fRemuneration} onChange={(e) => setFRemuneration(e.target.value)} placeholder="0 si bénévole" className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Contrat (PDF ou image)</label>
                {fContractUrl && !contractFile && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg border border-black/[0.06] bg-white px-3 py-2">
                    <Icon name="FileText" className="h-4 w-4 text-palier-600" />
                    <a href={fContractUrl} target="_blank" rel="noopener" className="flex-1 truncate text-[12px] font-medium text-palier-600 hover:underline">Voir le contrat actuel</a>
                    <button type="button" onClick={() => setFContractUrl("")} className="text-ink-faint hover:text-red-500"><Icon name="X" className="h-3.5 w-3.5" /></button>
                  </div>
                )}
                <input ref={contractFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={(e) => setContractFile(e.target.files?.[0] ?? null)} />
                <button
                  type="button"
                  onClick={() => contractFileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[12px] font-medium text-ink transition-colors hover:bg-sand/50"
                >
                  <Icon name="Upload" className="h-3.5 w-3.5" />
                  {contractFile ? contractFile.name : "Importer un fichier"}
                </button>
              </div>
              <button type="submit" disabled={saving} className="w-full rounded-xl bg-palier-600 py-2.5 text-[13px] font-semibold text-white hover:bg-palier-700 disabled:opacity-50">
                {saving ? "Enregistrement…" : mandate ? "Mettre à jour" : "Enregistrer"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDelete && mandate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30" onClick={() => setShowDelete(false)}>
          <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                <Icon name="Trash2" className="h-4 w-4 text-red-600" />
              </div>
              <h2 className="text-[15px] font-semibold text-ink">Supprimer ce mandat ?</h2>
            </div>
            <p className="mb-4 text-[13px] text-ink-soft">
              Le mandat de « {mandate.syndicName} » sera définitivement supprimé. Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 rounded-xl border border-black/[0.08] py-2.5 text-[13px] font-semibold text-ink hover:bg-sand/50">
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
