"use client";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { useData } from "@/lib/DataProvider";
import { useLang } from "@/lib/LangProvider";
import { submitFeedback } from "@/lib/actions";

type FeedbackType = "bug" | "suggestion" | "autre";

export function FeedbackCard() {
  const { currentUser, building, buildingId } = useData();
  const { i, isAr } = useLang();
  const T = i.feedback;

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [msg, setMsg] = useState("");
  const [contact, setContact] = useState<"phone" | "email">("phone");
  const [contactValue, setContactValue] = useState(currentUser.phone ?? "");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  async function handleSend() {
    if (!msg.trim()) return;
    setSending(true);
    setError(false);
    try {
      await submitFeedback({
        buildingId,
        type,
        message: msg.trim(),
        senderName: currentUser.name,
        senderPhone: contact === "phone" ? (contactValue || null) : null,
        senderEmail: contact === "email" ? (contactValue || null) : null,
        contactPreference: contact,
        buildingName: building.name,
        senderRole: "resident",
      });
      setSent(true);
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setSent(false);
    setMsg("");
    setType("suggestion");
  }

  const types: { key: FeedbackType; label: string; icon: string }[] = [
    { key: "bug", label: T.typeBug, icon: "Bug" },
    { key: "suggestion", label: T.typeSuggestion, icon: "Lightbulb" },
    { key: "autre", label: T.typeAutre, icon: "MessageSquare" },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="tap card flex w-full items-center gap-3 p-3.5 text-start"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
          <Icon name="MessageCircle" className="h-5 w-5 text-purple-600" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-ink">{T.title}</p>
          <p className="text-[12px] text-ink-faint">{T.subtitle}</p>
        </div>
        <Icon name={isAr ? "ChevronLeft" : "ChevronRight"} className="h-4 w-4 text-ink-faint" />
      </button>

      <Sheet open={open} onClose={() => { setOpen(false); if (sent) reset(); }} title={T.title}>
        {sent ? (
          <div className="flex flex-col items-center py-6">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-success-soft">
              <Icon name="CircleCheck" className="h-7 w-7 text-success" strokeWidth={2.2} />
            </div>
            <p className="text-[16px] font-bold text-ink">{T.thankYou}</p>
            <p className="mt-1 text-[13px] text-ink-soft">{T.thankYouSub}</p>
            <button
              onClick={reset}
              className="mt-4 rounded-full border border-palier-100 bg-white px-5 py-2.5 text-[13px] font-semibold text-ink-soft"
            >
              {T.sendAnother}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Type */}
            <div className="flex gap-2">
              {types.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className={`tap flex flex-1 flex-col items-center gap-1 rounded-2xl border py-3 text-[11px] font-semibold transition-colors ${
                    type === t.key
                      ? "border-palier-300 bg-palier-50 text-palier-700"
                      : "border-black/[0.06] bg-white text-ink-soft"
                  }`}
                >
                  <Icon name={t.icon} className="h-5 w-5" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Message */}
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">
                {type === "bug" ? T.descBug : type === "suggestion" ? T.descSuggestion : T.descAutre}
              </label>
              <textarea
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder={type === "bug" ? T.placeholderBug : type === "suggestion" ? T.placeholderSuggestion : T.placeholderAutre}
                rows={3}
                className="w-full rounded-2xl border border-black/[0.06] bg-white px-3.5 py-3 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-palier-400"
              />
            </div>

            {/* Contact preference */}
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">{T.contactLabel}</label>
              <div className="flex gap-2">
                {([
                  { key: "phone" as const, label: T.phone, icon: "Phone" },
                  { key: "email" as const, label: T.email, icon: "Mail" },
                ]).map((c) => (
                  <button
                    key={c.key}
                    onClick={() => {
                      setContact(c.key);
                      setContactValue(c.key === "phone" ? (currentUser.phone ?? "") : "");
                    }}
                    className={`tap flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[12px] font-semibold transition-colors ${
                      contact === c.key
                        ? "border-palier-300 bg-palier-50 text-palier-700"
                        : "border-black/[0.06] bg-white text-ink-soft"
                    }`}
                  >
                    <Icon name={c.icon} className="h-3.5 w-3.5" />
                    {c.label}
                  </button>
                ))}
              </div>
              <input
                type={contact === "email" ? "email" : "tel"}
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={contact === "phone" ? "06 XX XX XX XX" : "email@exemple.com"}
                className="mt-2 h-9 w-full rounded-xl border border-black/[0.06] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-palier-400"
              />
            </div>

            {/* Transparency */}
            <div className="rounded-2xl bg-sand/50 p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{T.transparency}</p>
              <div className="space-y-0.5 text-[12px] text-ink-soft">
                <p><span className="font-medium text-ink">{currentUser.name}</span> · {building.name}</p>
                <p>{contact === "phone" ? T.phone : T.email} : {contactValue || "—"}</p>
              </div>
              <p className="mt-1.5 text-[11px] text-ink-faint">{T.transparencyNote}</p>
            </div>

            {/* Submit */}
            <button
              onClick={handleSend}
              disabled={!msg.trim() || sending}
              className="tap w-full rounded-full bg-palier-600 py-3 text-[14px] font-semibold text-white disabled:opacity-40"
            >
              {sending ? T.sending : T.send}
            </button>
            {error && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-[13px] text-red-500">
                <Icon name="CircleAlert" className="h-4 w-4" />
                {isAr ? "حدث خطأ. أعد المحاولة." : "Une erreur est survenue. Réessayez."}
              </p>
            )}
          </div>
        )}
      </Sheet>
    </>
  );
}
