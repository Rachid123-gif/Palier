"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@/components/ui/Icon";
import { fetchAllFeedback, respondToFeedback, markFeedbackRead } from "@/lib/actions";

interface Feedback {
  id: string;
  buildingName: string;
  type: string;
  message: string;
  senderRole: string;
  status: string;
  adminResponse: string;
  respondedAt: string;
  attachmentUrl: string;
  createdAt: string;
}

const typeConfig: Record<string, { label: string; icon: string }> = {
  bug: { label: "Problème", icon: "Bug" },
  suggestion: { label: "Suggestion", icon: "Lightbulb" },
  autre: { label: "Autre", icon: "MessageSquare" },
};

const statusConfig: Record<string, { label: string }> = {
  new: { label: "Nouveau" },
  read: { label: "Lu" },
  responded: { label: "Répondu" },
};

export default function FeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Feedback | null>(null);
  const [response, setResponse] = useState("");
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllFeedback();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "all" ? items : items.filter((f) => f.type === filter || f.status === filter);

  const counts = {
    total: items.length,
    new: items.filter((f) => f.status === "new").length,
    responded: items.filter((f) => f.status === "responded").length,
  };

  async function handleOpen(f: Feedback) {
    setSelected(f);
    setResponse(f.adminResponse || "");
    if (f.status === "new") {
      try { await markFeedbackRead(f.id); } catch { /* ignore */ }
      setItems((prev) => prev.map((x) => x.id === f.id ? { ...x, status: "read" } : x));
    }
  }

  async function handleRespond() {
    if (!selected || !response.trim() || sending) return;
    setSending(true);
    try {
      await respondToFeedback(selected.id, response);
      setItems((prev) => prev.map((x) =>
        x.id === selected.id ? { ...x, status: "responded", adminResponse: response.trim(), respondedAt: new Date().toISOString() } : x
      ));
      setSelected(null);
      setFlash("Réponse envoyée");
      setTimeout(() => setFlash(""), 2000);
    } finally {
      setSending(false);
    }
  }

  const fmtDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-MA", { day: "numeric", month: "short", year: "numeric" });
  };

  const timeAgo = (d: string) => {
    if (!d) return "";
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `il y a ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `il y a ${days}j`;
  };

  return (
    <div className="mx-auto max-w-[900px] space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[24px] font-bold text-[var(--a-text)]">Feedback</h1>
        <p className="mt-1 text-[13px] text-[var(--a-text-4)]">Retours des utilisateurs de la plateforme</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[var(--a-border)] p-4 text-center" style={{ background: "var(--a-card)" }}>
          <p className="text-[24px] font-bold text-[var(--a-text)]">{counts.total}</p>
          <p className="text-[12px] text-[var(--a-text-4)]">Total</p>
        </div>
        <div className="rounded-2xl border border-[var(--a-border)] p-4 text-center" style={{ background: "var(--a-card)" }}>
          <p className="text-[24px] font-bold text-[var(--a-text)]">{counts.new}</p>
          <p className="text-[12px] text-[var(--a-text-4)]">Nouveaux</p>
        </div>
        <div className="rounded-2xl border border-[var(--a-border)] p-4 text-center" style={{ background: "var(--a-card)" }}>
          <p className="text-[24px] font-bold text-[var(--a-text)]">{counts.responded}</p>
          <p className="text-[12px] text-[var(--a-text-4)]">Répondus</p>
        </div>
      </div>

      {/* Flash */}
      {flash && (
        <div className="flex items-center gap-2 rounded-xl bg-[var(--a-tag)] px-4 py-3 text-[13px] font-medium text-[var(--a-text)]">
          <Icon name="Check" className="h-4 w-4 text-[var(--a-text-3)]" />{flash}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "Tout" },
          { key: "new", label: "Nouveaux" },
          { key: "bug", label: "Problèmes" },
          { key: "suggestion", label: "Suggestions" },
          { key: "responded", label: "Répondus" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-xl px-3.5 py-2 text-[12px] font-semibold transition-colors ${
              filter === f.key
                ? "bg-[var(--a-tag)] text-[var(--a-text)]"
                : "text-[var(--a-text-4)] hover:text-[var(--a-text-3)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="rounded-2xl border border-[var(--a-border)]" style={{ background: "var(--a-card)" }}>
        <div className="border-b border-[var(--a-border)] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[var(--a-text)]">
            {filtered.length} retour{filtered.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--a-border)] border-t-[var(--a-text-3)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-[var(--a-text-5)]">Aucun feedback</div>
        ) : (
          <div className="divide-y divide-[var(--a-border-2)]">
            {filtered.map((f) => {
              const tc = typeConfig[f.type] ?? typeConfig.autre;
              const sc = statusConfig[f.status] ?? statusConfig.new;
              return (
                <button
                  key={f.id}
                  onClick={() => handleOpen(f)}
                  className="flex w-full items-start gap-4 px-5 py-4 text-start transition-colors hover:bg-[var(--a-hover)]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--a-tag)]">
                    <Icon name={tc.icon} className="h-4 w-4 text-[var(--a-text-3)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        f.status === "new"
                          ? "bg-[var(--a-text-3)]/10 text-[var(--a-text-3)]"
                          : "bg-[var(--a-tag)] text-[var(--a-text-4)]"
                      }`}>{sc.label}</span>
                      <span className="rounded-full bg-[var(--a-tag)] px-2 py-0.5 text-[10px] font-semibold text-[var(--a-text-4)]">{tc.label}</span>
                      <span className="rounded-full bg-[var(--a-tag)] px-2 py-0.5 text-[10px] font-semibold text-[var(--a-text-4)]">
                        {f.senderRole === "syndic" ? "Syndic" : "Résident"}
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[13px] text-[var(--a-text-2)]">{f.message}</p>
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-[var(--a-text-5)]">
                      <span>{f.buildingName || "—"}</span>
                      <span>·</span>
                      <span>{timeAgo(f.createdAt)}</span>
                      {f.attachmentUrl && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Icon name="Paperclip" className="h-3 w-3" />Pièce jointe
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Icon name="ChevronRight" className="mt-2 h-4 w-4 shrink-0 text-[var(--a-text-5)]" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail / Response modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--a-border)] p-6" style={{ background: "var(--a-card)" }}>
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[var(--a-tag)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--a-text-3)]">
                  {(typeConfig[selected.type] ?? typeConfig.autre).label}
                </span>
                <span className="rounded-full bg-[var(--a-tag)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--a-text-4)]">
                  {selected.senderRole === "syndic" ? "Syndic" : "Résident"}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="text-[var(--a-text-4)] hover:text-[var(--a-text)]">
                <Icon name="X" className="h-5 w-5" />
              </button>
            </div>

            {/* Meta */}
            <div className="mt-3 flex items-center gap-3 text-[12px] text-[var(--a-text-5)]">
              <span>{selected.buildingName || "—"}</span>
              <span>·</span>
              <span>{fmtDate(selected.createdAt)}</span>
            </div>

            {/* Message */}
            <div className="mt-4 rounded-xl bg-[var(--a-input-bg)] p-4">
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--a-text)]">{selected.message}</p>
            </div>

            {/* Attachment */}
            {selected.attachmentUrl && (
              <a href={selected.attachmentUrl} target="_blank" rel="noopener noreferrer"
                className="mt-3 flex items-center gap-2 text-[12px] text-[var(--a-text-3)] hover:underline">
                <Icon name="Paperclip" className="h-3.5 w-3.5" />
                Voir la pièce jointe
              </a>
            )}

            {/* Existing response */}
            {selected.status === "responded" && selected.adminResponse && (
              <div className="mt-4 rounded-xl border border-[var(--a-border)] bg-[var(--a-input-bg)] p-4">
                <p className="mb-1 text-[11px] font-semibold text-[var(--a-text-3)]">Votre réponse · {fmtDate(selected.respondedAt)}</p>
                <p className="whitespace-pre-wrap text-[13px] text-[var(--a-text-2)]">{selected.adminResponse}</p>
              </div>
            )}

            {/* Response form */}
            <div className="mt-4">
              <label className="mb-1.5 block text-[12px] font-semibold text-[var(--a-text-4)]">
                {selected.status === "responded" ? "Modifier la réponse" : "Répondre"}
              </label>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Votre réponse…"
                rows={3}
                className="w-full rounded-xl border border-[var(--a-input-border)] bg-[var(--a-input-bg)] px-4 py-3 text-[13px] text-[var(--a-text)] outline-none placeholder:text-[var(--a-text-5)] focus:border-[var(--a-text-3)]"
              />
            </div>

            <div className="mt-4 flex gap-3">
              <button onClick={() => setSelected(null)}
                className="flex-1 rounded-xl border border-[var(--a-input-border)] py-2.5 text-[13px] font-medium text-[var(--a-text-3)]">
                Fermer
              </button>
              <button onClick={handleRespond} disabled={!response.trim() || sending}
                className="flex-1 rounded-xl bg-[var(--a-text-3)] py-2.5 text-[13px] font-semibold text-white disabled:opacity-50">
                {sending ? "Envoi…" : "Envoyer la réponse"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
