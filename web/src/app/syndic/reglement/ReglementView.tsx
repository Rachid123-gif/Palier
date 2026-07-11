"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { longDate } from "@/lib/format";
import { upsertCoproprieteRule } from "@/lib/actions";
import { supabase } from "@/lib/supabase";
import type { CoproprieteRule } from "@/lib/types";

const ANNEXE_TYPES = [
  { value: "plan", label: "Plan" },
  { value: "descriptif", label: "Descriptif" },
  { value: "etat", label: "État" },
];

function annexeTypeLabel(type: string) {
  return ANNEXE_TYPES.find((a) => a.value === type)?.label ?? type;
}

export function ReglementView({ rule, buildingId }: { rule: CoproprieteRule | null; buildingId: string }) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const flash = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); }, []);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [fTitle, setFTitle] = useState(rule?.title ?? "Règlement de copropriété");
  const [fAdoptedAt, setFAdoptedAt] = useState(rule?.adoptedAt ?? "");
  const [fNotes, setFNotes] = useState(rule?.notes ?? "");
  const [fFileUrl, setFFileUrl] = useState(rule?.fileUrl ?? "");
  const [fAnnexes, setFAnnexes] = useState<{ title: string; url: string; type: string }[]>(rule?.annexes ?? []);

  // File inputs
  const [mainFile, setMainFile] = useState<File | null>(null);
  const mainFileRef = useRef<HTMLInputElement>(null);

  // Annexe add state
  const [showAddAnnexe, setShowAddAnnexe] = useState(false);
  const [annexeTitle, setAnnexeTitle] = useState("");
  const [annexeType, setAnnexeType] = useState("plan");
  const [annexeFile, setAnnexeFile] = useState<File | null>(null);
  const annexeFileRef = useRef<HTMLInputElement>(null);
  const [annexeUploading, setAnnexeUploading] = useState(false);

  function resetForm() {
    setFTitle(rule?.title ?? "Règlement de copropriété");
    setFAdoptedAt(rule?.adoptedAt ?? "");
    setFNotes(rule?.notes ?? "");
    setFFileUrl(rule?.fileUrl ?? "");
    setFAnnexes(rule?.annexes ?? []);
    setMainFile(null);
  }

  function openForm() {
    resetForm();
    setShowForm(true);
  }

  // Upload helper
  async function uploadFile(file: File, prefix: string): Promise<string> {
    const ext = file.name.split(".").pop() ?? "pdf";
    const path = `${buildingId}/${prefix}-${Date.now()}.${ext}`;
    await supabase.storage.from("documents").upload(path, file, { upsert: true });
    const { data } = supabase.storage.from("documents").getPublicUrl(path);
    return data.publicUrl;
  }

  // Save
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!fTitle) return;
    setSaving(true);

    let fileUrl = fFileUrl;
    if (mainFile) {
      setUploading(true);
      fileUrl = await uploadFile(mainFile, "reglement");
      setUploading(false);
    }

    await upsertCoproprieteRule({
      buildingId,
      title: fTitle,
      fileUrl: fileUrl || undefined,
      annexes: fAnnexes,
      adoptedAt: fAdoptedAt || undefined,
      notes: fNotes || undefined,
    });

    setSaving(false);
    setShowForm(false);
    flash(rule ? "Règlement mis à jour" : "Règlement enregistré");
    router.refresh();
  }

  // Add annexe
  async function handleAddAnnexe() {
    if (!annexeTitle || !annexeFile) return;
    setAnnexeUploading(true);
    const url = await uploadFile(annexeFile, `annexe-${annexeType}`);
    const newAnnexes = [...fAnnexes, { title: annexeTitle, url, type: annexeType }];
    setFAnnexes(newAnnexes);

    // Persist immediately
    await upsertCoproprieteRule({
      buildingId,
      title: fTitle || rule?.title || "Règlement de copropriété",
      fileUrl: fFileUrl || rule?.fileUrl || undefined,
      annexes: newAnnexes,
      adoptedAt: fAdoptedAt || rule?.adoptedAt || undefined,
      notes: fNotes || rule?.notes || undefined,
    });

    setAnnexeUploading(false);
    setShowAddAnnexe(false);
    setAnnexeTitle("");
    setAnnexeType("plan");
    setAnnexeFile(null);
    flash("Annexe ajoutée");
    router.refresh();
  }

  // Remove annexe
  async function handleRemoveAnnexe(index: number) {
    const newAnnexes = fAnnexes.filter((_, i) => i !== index);
    setFAnnexes(newAnnexes);

    await upsertCoproprieteRule({
      buildingId,
      title: fTitle || rule?.title || "Règlement de copropriété",
      fileUrl: fFileUrl || rule?.fileUrl || undefined,
      annexes: newAnnexes,
      adoptedAt: fAdoptedAt || rule?.adoptedAt || undefined,
      notes: fNotes || rule?.notes || undefined,
    });

    flash("Annexe supprimée");
    router.refresh();
  }

  const inputCls = "h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20";

  return (
    <div>
      <PageHeader
        title="Règlement de copropriété"
        subtitle={rule ? `${rule.title}${rule.adoptedAt ? ` · Adopté le ${longDate(rule.adoptedAt)}` : ""}` : "Aucun règlement enregistré"}
        action={
          <button onClick={openForm} className="inline-flex items-center gap-1.5 rounded-lg bg-palier-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-palier-700">
            <Icon name={rule ? "Pencil" : "Plus"} className="h-3.5 w-3.5" /> {rule ? "Modifier" : "Ajouter le règlement"}
          </button>
        }
      />

      {/* Info banner */}
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-4 py-3">
        <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
        <p className="text-[12px] text-ink-soft">
          Art. 8-11 Loi 18-00 — Tout immeuble en copropriété doit disposer d&apos;un règlement de copropriété.
        </p>
      </div>

      {rule ? (
        <>
          {/* Main rule card */}
          <div className="mb-4 rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-palier-100">
                <Icon name="Scale" className="h-6 w-6 text-palier-600" />
              </span>
              <div className="flex-1">
                <h2 className="text-[16px] font-semibold text-ink">{rule.title}</h2>
                {rule.adoptedAt && (
                  <p className="mt-0.5 text-[12px] text-ink-soft">Adopté le {longDate(rule.adoptedAt)}</p>
                )}
              </div>
            </div>

            {rule.notes && (
              <div className="mb-4">
                <p className="text-[11px] font-semibold text-ink-soft">Notes</p>
                <p className="mt-1 whitespace-pre-wrap rounded-lg bg-white p-3 text-[13px] text-ink-soft">{rule.notes}</p>
              </div>
            )}

            {rule.fileUrl && (
              <a href={rule.fileUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-lg border border-black/[0.06] bg-white px-3 py-2 text-[12px] font-medium text-palier-600 hover:bg-sand/50">
                <Icon name="FileText" className="h-4 w-4" />
                Consulter le règlement
                <Icon name="ExternalLink" className="h-3 w-3" />
              </a>
            )}

            <div className="mt-4 flex gap-2">
              <button onClick={openForm} className="rounded-lg border border-black/[0.08] px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-sand/50">
                Modifier
              </button>
            </div>
          </div>

          {/* Annexes section */}
          <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-ink">Annexes</h3>
              <button onClick={() => setShowAddAnnexe(true)} className="inline-flex items-center gap-1 text-[12px] font-medium text-palier-600 hover:underline">
                <Icon name="Plus" className="h-3 w-3" /> Ajouter
              </button>
            </div>

            {fAnnexes.length === 0 ? (
              <div className="py-6 text-center">
                <Icon name="Paperclip" className="mx-auto h-6 w-6 text-ink-faint" />
                <p className="mt-1 text-[12px] text-ink-soft">Aucune annexe</p>
                <button onClick={() => setShowAddAnnexe(true)} className="mt-1 text-[12px] font-medium text-palier-600">Ajouter une annexe</button>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.04]">
                {fAnnexes.map((annexe, i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                      <Icon name="FileText" className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{annexe.title}</p>
                      <span className="rounded-full bg-sand/80 px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft">
                        {annexeTypeLabel(annexe.type)}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <a href={annexe.url} target="_blank" rel="noopener" className="rounded-md p-1.5 text-ink-soft transition-colors hover:bg-palier-50 hover:text-palier-600" title="Ouvrir">
                        <Icon name="ExternalLink" className="h-4 w-4" />
                      </a>
                      <button onClick={() => handleRemoveAnnexe(i)} className="rounded-md p-1.5 text-ink-soft transition-colors hover:bg-red-50 hover:text-red-500" title="Supprimer">
                        <Icon name="Trash2" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card py-12 text-center shadow-card">
          <Icon name="Scale" className="mx-auto h-8 w-8 text-ink-faint" />
          <p className="mt-2 text-[13px] text-ink-soft">Aucun règlement de copropriété enregistré</p>
          <button onClick={openForm} className="mt-1 text-[13px] font-medium text-palier-600">Ajouter le règlement</button>
        </div>
      )}

      {/* Form modal (create or edit rule) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-palier-100">
                  <Icon name="Scale" className="h-5 w-5 text-palier-600" />
                </span>
                <div>
                  <h2 className="text-[16px] font-semibold text-ink">{rule ? "Modifier le règlement" : "Ajouter le règlement"}</h2>
                  <p className="text-[12px] text-ink-soft">Règlement de copropriété</p>
                </div>
              </div>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Titre *</label>
                <input type="text" required value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="Règlement de copropriété" className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Date d&apos;adoption</label>
                <input type="date" value={fAdoptedAt} onChange={(e) => setFAdoptedAt(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Document principal (PDF)</label>
                {fFileUrl && !mainFile && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg border border-black/[0.06] bg-white px-3 py-2">
                    <Icon name="FileText" className="h-4 w-4 text-palier-600" />
                    <a href={fFileUrl} target="_blank" rel="noopener" className="flex-1 truncate text-[12px] font-medium text-palier-600 hover:underline">Fichier actuel</a>
                    <button type="button" onClick={() => setFFileUrl("")} className="text-ink-faint hover:text-red-500"><Icon name="X" className="h-3.5 w-3.5" /></button>
                  </div>
                )}
                <input ref={mainFileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setMainFile(e.target.files?.[0] ?? null)} />
                <button
                  type="button"
                  onClick={() => mainFileRef.current?.click()}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[12px] font-medium text-ink transition-colors hover:bg-sand/50"
                >
                  <Icon name="Upload" className="h-3.5 w-3.5" />
                  {mainFile ? mainFile.name : "Importer un fichier"}
                </button>
                {uploading && <p className="mt-1 text-[11px] text-ink-soft">Téléversement en cours…</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Notes</label>
                <textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} placeholder="Remarques, historique des modifications…" rows={3} className="w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20" />
              </div>
              <button type="submit" disabled={saving} className="w-full rounded-xl bg-palier-600 py-2.5 text-[13px] font-semibold text-white hover:bg-palier-700 disabled:opacity-50">
                {saving ? "Enregistrement…" : rule ? "Mettre à jour" : "Enregistrer"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add annexe modal */}
      {showAddAnnexe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => { setShowAddAnnexe(false); setAnnexeTitle(""); setAnnexeFile(null); }}>
          <div className="w-full max-w-sm rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-ink">Ajouter une annexe</h2>
              <button onClick={() => { setShowAddAnnexe(false); setAnnexeTitle(""); setAnnexeFile(null); }} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Titre *</label>
                <input type="text" value={annexeTitle} onChange={(e) => setAnnexeTitle(e.target.value)} placeholder="Ex: Plan de l'immeuble" className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Type</label>
                <select value={annexeType} onChange={(e) => setAnnexeType(e.target.value)} className={inputCls}>
                  {ANNEXE_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Fichier *</label>
                <input ref={annexeFileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setAnnexeFile(e.target.files?.[0] ?? null)} />
                <button
                  type="button"
                  onClick={() => annexeFileRef.current?.click()}
                  className="flex w-full flex-col items-center rounded-lg border-2 border-dashed border-black/10 px-6 py-4 transition-colors hover:border-palier-400 hover:bg-palier-50/30"
                >
                  {annexeFile ? (
                    <>
                      <Icon name="FileCheck" className="mb-1 h-5 w-5 text-palier-600" />
                      <p className="text-[12px] font-medium text-ink">{annexeFile.name}</p>
                      <p className="text-[10px] text-ink-soft">{(annexeFile.size / 1024).toFixed(0)} KB</p>
                    </>
                  ) : (
                    <>
                      <Icon name="Upload" className="mb-1 h-5 w-5 text-ink-soft" />
                      <p className="text-[12px] font-medium text-ink">Cliquez pour sélectionner</p>
                    </>
                  )}
                </button>
                {annexeUploading && <p className="mt-1 text-[11px] text-ink-soft">Téléversement en cours…</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowAddAnnexe(false); setAnnexeTitle(""); setAnnexeFile(null); }} className="flex-1 rounded-lg border border-black/[0.08] py-2 text-[13px] font-medium text-ink hover:bg-sand/50">
                  Annuler
                </button>
                <button
                  onClick={handleAddAnnexe}
                  disabled={!annexeTitle || !annexeFile || annexeUploading}
                  className="flex-1 rounded-lg bg-palier-600 py-2 text-[13px] font-medium text-white hover:bg-palier-700 disabled:opacity-40"
                >
                  {annexeUploading ? "Envoi…" : "Ajouter"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 animate-[rise_0.25s_ease] rounded-lg bg-palier-600 px-4 py-2.5 text-[13px] font-medium text-white shadow-lg">{toast}</div>}
    </div>
  );
}
