"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { fetchMyFeedback } from "@/lib/actions";

interface MyFeedback {
  id: string;
  type: string;
  message: string;
  status: string;
  adminResponse: string;
  respondedAt: string;
  createdAt: string;
}

const typeIcon: Record<string, { icon: string; cls: string }> = {
  bug: { icon: "Bug", cls: "bg-red-50 text-red-600" },
  suggestion: { icon: "Lightbulb", cls: "bg-amber-50 text-amber-600" },
  autre: { icon: "MessageSquare", cls: "bg-blue-50 text-blue-600" },
};

export function FeedbackHistory({ isAr }: { isAr: boolean }) {
  const [items, setItems] = useState<MyFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MyFeedback | null>(null);

  useEffect(() => {
    fetchMyFeedback()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmtDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString(isAr ? "ar-MA" : "fr-MA", { day: "numeric", month: "short", year: "numeric" });
  };

  const typeLabel = (t: string) =>
    t === "bug" ? (isAr ? "مشكلة" : "Problème")
    : t === "suggestion" ? (isAr ? "اقتراح" : "Suggestion")
    : (isAr ? "أخرى" : "Autre");

  const statusLabel = (s: string) =>
    s === "responded" ? (isAr ? "تمت الإجابة" : "Répondu")
    : s === "read" ? (isAr ? "تمت القراءة" : "Lu")
    : (isAr ? "جديد" : "En attente");

  const statusCls = (s: string) =>
    s === "responded" ? "bg-emerald-50 text-emerald-700"
    : s === "read" ? "bg-blue-50 text-blue-700"
    : "bg-gray-100 text-gray-600";

  if (loading) return null;
  if (items.length === 0) return null;

  const hasResponse = items.some((f) => f.status === "responded");

  return (
    <>
      <div className="card divide-y divide-black/5 p-0">
        <div className="px-4 py-3">
          <p className="text-[12px] font-bold uppercase tracking-wider text-ink-soft">
            {isAr ? "متابعة الملاحظات" : "Mes retours"}
          </p>
          {hasResponse && (
            <p className="mt-0.5 text-[11px] text-emerald-600 font-medium">
              <Icon name="MessageCircle" className="mr-1 inline h-3 w-3" />
              {isAr ? "لديك رد جديد" : "Vous avez une réponse"}
            </p>
          )}
        </div>
        {items.map((f) => {
          const ti = typeIcon[f.type] ?? typeIcon.autre;
          return (
            <button
              key={f.id}
              onClick={() => setSelected(f)}
              className="tap flex w-full items-center gap-3 px-4 py-3.5 text-start"
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${ti.cls}`}>
                <Icon name={ti.icon} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-ink">{typeLabel(f.type)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusCls(f.status)}`}>
                    {statusLabel(f.status)}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-soft">{f.message}</p>
              </div>
              <Icon name={isAr ? "ChevronLeft" : "ChevronRight"} className="h-4 w-4 shrink-0 text-ink-faint" />
            </button>
          );
        })}
      </div>

      {/* Detail sheet */}
      <Sheet open={!!selected} onClose={() => setSelected(null)} title={isAr ? "تفاصيل الملاحظة" : "Détail du retour"}>
        {selected && (
          <div className="space-y-4">
            {/* Type + date */}
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${(typeIcon[selected.type] ?? typeIcon.autre).cls}`}>
                {typeLabel(selected.type)}
              </span>
              <span className="text-[12px] text-ink-faint">{fmtDate(selected.createdAt)}</span>
            </div>

            {/* User message */}
            <div className="rounded-2xl bg-sand/50 p-4">
              <p className="mb-1 text-[11px] font-semibold text-ink-faint">{isAr ? "رسالتك" : "Votre message"}</p>
              <p className="whitespace-pre-wrap text-[13px] text-ink">{selected.message}</p>
            </div>

            {/* Admin response */}
            {selected.status === "responded" && selected.adminResponse ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                  {isAr ? "رد فريق Palier" : "Réponse de l'équipe Palier"} · {fmtDate(selected.respondedAt)}
                </p>
                <p className="whitespace-pre-wrap text-[13px] text-emerald-900">{selected.adminResponse}</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-sand/30 p-4 text-center">
                <Icon name="Clock" className="mx-auto mb-1 h-5 w-5 text-ink-faint" />
                <p className="text-[13px] text-ink-soft">
                  {isAr ? "في انتظار الرد…" : "En attente de réponse…"}
                </p>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </>
  );
}
