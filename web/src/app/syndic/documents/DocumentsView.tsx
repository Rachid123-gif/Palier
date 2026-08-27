"use client";
import { useState, useRef, useMemo, useCallback } from "react";
import { PageHeader, KpiCard, Card } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { shortDate } from "@/lib/format";
import { insertDocument, deleteDocument, uploadFileAction } from "@/lib/actions";

type Doc = { id: string; title: string; type: string; date: string; size: string; url: string };

const DOC_CATEGORIES = [
  { value: "pv", label: "PV d'assemblée", icon: "FileText", tint: "bg-palier-100", color: "text-palier-600" },
  { value: "reglement", label: "Règlement", icon: "Scale", tint: "bg-amber-100", color: "text-amber-600" },
  { value: "contrat", label: "Contrat", icon: "Handshake", tint: "bg-blue-100", color: "text-blue-600" },
  { value: "facture", label: "Facture", icon: "Receipt", tint: "bg-coral-100", color: "text-coral-600" },
  { value: "attestation", label: "Attestation", icon: "BadgeCheck", tint: "bg-emerald-100", color: "text-emerald-600" },
  { value: "appel", label: "Appel de fonds", icon: "ReceiptText", tint: "bg-orange-100", color: "text-orange-600" },
  { value: "autre", label: "Autre", icon: "File", tint: "bg-sand", color: "text-ink-soft" },
] as const;

const catMeta = new Map(DOC_CATEGORIES.map((c) => [c.value, c]));

function getCat(type: string) {
  return catMeta.get(type as typeof DOC_CATEGORIES[number]["value"]) ?? catMeta.get("autre")!;
}

export function DocumentsView({ documents: initial, buildingId }: { documents: Doc[]; buildingId: string }) {
  const [docs, setDocs] = useState(initial);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const flash = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); }, []);

  // Upload form state
  const [upTitle, setUpTitle] = useState("");
  const [upCategory, setUpCategory] = useState("autre");
  const [upFile, setUpFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Filtered docs
  const filtered = useMemo(() => {
    let list = docs;
    if (catFilter !== "all") list = list.filter((d) => d.type === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((d) => d.title.toLowerCase().includes(q) || getCat(d.type).label.toLowerCase().includes(q));
    }
    return list;
  }, [docs, catFilter, search]);

  // KPIs
  const totalDocs = docs.length;
  const categories = new Set(docs.map((d) => d.type));

  // Upload handler
  async function handleUpload() {
    if (!upFile || !upTitle.trim()) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", upFile);
      const uploadRes = await uploadFileAction(fd);
      if (uploadRes.error || !uploadRes.url) throw new Error(uploadRes.error ?? "upload_failed");
      const fileUrl = uploadRes.url;

      const sizeKB = Math.round(upFile.size / 1024);
      const sizeLabel = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

      const inserted = await insertDocument({
        buildingId,
        title: upTitle.trim(),
        docType: upCategory,
        docDate: new Date().toISOString().slice(0, 10),
        size: sizeLabel,
        url: fileUrl,
      });

      setDocs((prev) => [{
        id: inserted.id,
        title: inserted.title,
        type: inserted.doc_type,
        date: inserted.doc_date,
        size: inserted.size,
        url: inserted.url ?? "",
      }, ...prev]);

      // Reset
      setUpTitle("");
      setUpCategory("autre");
      setUpFile(null);
      setShowUpload(false);
    } catch {
      flash("Erreur lors de l'upload du document");
    } finally {
      setUploading(false);
    }
  }

  // Delete handler
  async function handleDelete(id: string) {
    try {
      await deleteDocument(id, buildingId);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {
      flash("Erreur lors de la suppression");
    }
    setShowDelete(null);
  }

  // Download handler
  function handleDownload(doc: Doc) {
    if (doc.url) window.open(doc.url, "_blank");
  }

  return (
    <div>
      <PageHeader title="Documents" subtitle="Coffre-fort numérique de la copropriété" action={
        <button onClick={() => setShowUpload(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-palier-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-palier-700">
          <Icon name="Upload" className="h-3.5 w-3.5" /> Téléverser
        </button>
      } />

      {/* Info banner */}
      <div className="mb-3 flex items-start gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-4 py-3">
        <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
        <p className="text-[12px] text-ink-soft">
          Utilisez les catégories pour organiser les PV, règlements, contrats et factures de la copropriété.
        </p>
      </div>
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-palier-200 bg-palier-50 px-4 py-3">
        <Icon name="Users" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-palier-600" />
        <p className="text-[12px] text-palier-800">
          Tous les documents ajoutés ici sont visibles par les résidents dans leur section <strong>Dossiers</strong> (Immeuble → Dossiers).
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <KpiCard label="Documents" value={String(totalDocs)} />
        <KpiCard label="Catégories" value={String(categories.size)} />
        <KpiCard label="Dernier ajout" value={docs.length > 0 ? shortDate(docs[0].date) : "—"} />
      </div>

      {/* Search + Filter */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1">
            <Icon name="Search" className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un document…"
              className="w-full rounded-lg border border-black/[0.08] bg-white py-2 pl-8 pr-3 text-[13px] text-ink placeholder:text-ink-faint focus:border-palier-400 focus:outline-none focus:ring-1 focus:ring-palier-400"
            />
          </div>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] text-ink focus:border-palier-400 focus:outline-none"
          >
            <option value="all">Toutes catégories</option>
            {DOC_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Documents table */}
      <Card>
        {filtered.length > 0 ? (
          <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                  <th className="w-[5%] pb-2 text-left" />
                  <th className="w-[35%] pb-2 text-left">Document</th>
                  <th className="w-[18%] pb-2 text-left">Catégorie</th>
                  <th className="w-[14%] pb-2 text-left">Date</th>
                  <th className="w-[10%] pb-2 text-left">Taille</th>
                  <th className="w-[18%] pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => {
                  const cat = getCat(doc.type);
                  return (
                    <tr key={doc.id} className="border-b border-black/[0.04] last:border-0">
                      <td className="py-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cat.tint}`}>
                          <Icon name={cat.icon} className={`h-4 w-4 ${cat.color}`} />
                        </div>
                      </td>
                      <td className="py-3 pr-2">
                        <p className="truncate text-[13px] font-medium text-ink">{doc.title}</p>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cat.tint} ${cat.color}`}>
                          {cat.label}
                        </span>
                      </td>
                      <td className="py-3 text-[13px] text-ink-soft">{shortDate(doc.date)}</td>
                      <td className="py-3 text-[13px] text-ink-soft">{doc.size || "—"}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {doc.url && (
                            <button
                              onClick={() => handleDownload(doc)}
                              className="rounded-md p-1.5 text-ink-soft transition-colors hover:bg-palier-50 hover:text-palier-600"
                              title="Télécharger"
                            >
                              <Icon name="Download" className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setShowDelete(doc.id)}
                            className="rounded-md p-1.5 text-ink-soft transition-colors hover:bg-red-50 hover:text-red-500"
                            title="Supprimer"
                          >
                            <Icon name="Trash2" className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-black/[0.04] lg:hidden">
            {filtered.map((doc) => {
              const cat = getCat(doc.type);
              return (
                <div key={doc.id} className="flex items-center gap-3 p-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${cat.tint}`}>
                    <Icon name={cat.icon} className={`h-5 w-5 ${cat.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-ink">{doc.title}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-[12px] text-ink-soft">
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${cat.tint} ${cat.color}`}>{cat.label}</span>
                      <span>{shortDate(doc.date)}</span>
                      {doc.size && <span>{doc.size}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    {doc.url && (
                      <button onClick={() => handleDownload(doc)} className="rounded-md p-1.5 text-ink-soft"><Icon name="Download" className="h-4 w-4" /></button>
                    )}
                    <button onClick={() => setShowDelete(doc.id)} className="rounded-md p-1.5 text-ink-soft"><Icon name="Trash2" className="h-4 w-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        ) : (
          <div className="py-10 text-center">
            <Icon name="FileText" className="mx-auto mb-2 h-8 w-8 text-ink-faint" />
            <p className="text-[13px] text-ink-soft">{search || catFilter !== "all" ? "Aucun document trouvé" : "Aucun document ajouté"}</p>
            {!search && catFilter === "all" && (
              <button onClick={() => setShowUpload(true)} className="mt-2 text-[13px] font-medium text-palier-600 hover:underline">
                Ajouter un premier document
              </button>
            )}
          </div>
        )}
      </Card>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30" onClick={() => setShowUpload(false)}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-ink">Téléverser un document</h2>
              <button onClick={() => setShowUpload(false)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>

            {/* Title */}
            <label className="mb-1 block text-[12px] font-medium text-ink-soft">Titre du document</label>
            <input
              value={upTitle}
              onChange={(e) => setUpTitle(e.target.value)}
              placeholder="Ex: PV Assemblée Juin 2025"
              className="mb-3 w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] text-ink placeholder:text-ink-faint focus:border-palier-400 focus:outline-none focus:ring-1 focus:ring-palier-400"
            />

            {/* Category */}
            <label className="mb-1 block text-[12px] font-medium text-ink-soft">Catégorie</label>
            <select
              value={upCategory}
              onChange={(e) => setUpCategory(e.target.value)}
              className="mb-3 w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] text-ink focus:border-palier-400 focus:outline-none"
            >
              {DOC_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            {/* File drop zone */}
            <label className="mb-1 block text-[12px] font-medium text-ink-soft">Fichier</label>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setUpFile(e.target.files?.[0] ?? null)} />
            <button
              onClick={() => fileRef.current?.click()}
              className="mb-4 flex w-full flex-col items-center rounded-lg border-2 border-dashed border-black/10 px-6 py-6 transition-colors hover:border-palier-400 hover:bg-palier-50/30"
            >
              {upFile ? (
                <>
                  <Icon name="FileCheck" className="mb-1 h-6 w-6 text-palier-600" />
                  <p className="text-[13px] font-medium text-ink">{upFile.name}</p>
                  <p className="text-[11px] text-ink-soft">{(upFile.size / 1024).toFixed(0)} KB</p>
                </>
              ) : (
                <>
                  <Icon name="Upload" className="mb-1 h-6 w-6 text-ink-soft" />
                  <p className="text-[13px] font-medium text-ink">Cliquez pour sélectionner</p>
                  <p className="text-[11px] text-ink-soft">PDF, Word, Excel, images</p>
                </>
              )}
            </button>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => setShowUpload(false)} className="flex-1 rounded-lg border border-black/[0.08] py-2 text-[13px] font-medium text-ink hover:bg-sand/50">
                Annuler
              </button>
              <button
                onClick={handleUpload}
                disabled={!upFile || !upTitle.trim() || uploading}
                className="flex-1 rounded-lg bg-palier-600 py-2 text-[13px] font-medium text-white hover:bg-palier-700 disabled:opacity-40"
              >
                {uploading ? "Envoi…" : "Téléverser"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30" onClick={() => setShowDelete(null)}>
          <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                <Icon name="Trash2" className="h-4 w-4 text-red-600" />
              </div>
              <h2 className="text-[15px] font-semibold text-ink">Supprimer le document</h2>
            </div>
            <p className="mb-4 text-[13px] text-ink-soft">
              Cette action est irréversible. Le document sera supprimé de la copropriété et ne sera plus accessible aux résidents.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(null)} className="flex-1 rounded-lg border border-black/[0.08] py-2 text-[13px] font-medium text-ink hover:bg-sand/50">
                Annuler
              </button>
              <button onClick={() => handleDelete(showDelete)} className="flex-1 rounded-lg bg-red-600 py-2 text-[13px] font-medium text-white hover:bg-red-700">
                Supprimer
              </button>
            </div>
          </div>
        </div>
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
