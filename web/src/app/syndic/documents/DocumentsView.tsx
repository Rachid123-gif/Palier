"use client";
import { useState } from "react";
import { PageHeader, Card } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { shortDate } from "@/lib/format";

type Doc = { id: string; title: string; type: string; date: string; size?: string; tint: string; color: string };

export function DocumentsView({ documents }: { documents: Doc[] }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <PageHeader title="Documents" subtitle="Coffre-fort partagé" action={
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-palier-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-palier-700">
          <Icon name="Upload" className="h-3.5 w-3.5" /> Téléverser
        </button>
      } />

      <Card>
        {documents.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {documents.map((doc) => (
              <button key={doc.id} className="flex items-center gap-3 rounded-lg border border-black/[0.06] p-3 text-left transition-colors hover:bg-sand/50">
                <Icon name="FileText" className="h-5 w-5 text-ink-soft" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{doc.title}</p>
                  <p className="text-[11px] text-ink-soft">{doc.type} · {shortDate(doc.date)}{doc.size ? ` · ${doc.size}` : ""}</p>
                </div>
                <Icon name="Download" className="h-4 w-4 text-ink-soft" />
              </button>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-[13px] text-ink-soft">Aucun document</p>
          </div>
        )}
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-ink">Téléverser</h2>
              <button onClick={() => setShowModal(false)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink"><Icon name="X" className="h-4 w-4" /></button>
            </div>
            <div className="mb-4 flex flex-col items-center rounded-lg border-2 border-dashed border-black/10 px-6 py-10">
              <Icon name="Upload" className="mb-2 h-8 w-8 text-ink-soft" />
              <p className="text-[13px] font-medium text-ink">Glissez vos fichiers ici</p>
              <p className="text-[12px] text-ink-soft">PDF, images, documents</p>
            </div>
            <p className="mb-4 rounded-lg bg-sand/50 px-3 py-2 text-[12px] text-ink-soft">Disponible prochainement.</p>
            <button onClick={() => setShowModal(false)} className="w-full rounded-lg border border-black/[0.08] py-2 text-[13px] font-medium text-ink hover:bg-sand/50">Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}
