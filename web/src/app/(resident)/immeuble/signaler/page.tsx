"use client";
import { useState } from "react";
import Link from "next/link";
import { StatusBar } from "@/components/resident/StatusBar";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/primitives";
import { Toast } from "@/components/ui/Sheet";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/format";
import { useData } from "@/lib/DataProvider";
import { useLang } from "@/lib/LangProvider";
import { createIncident } from "@/lib/actions";
import type { Urgency } from "@/lib/types";

const urgencyColors: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  normal: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  urgent: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

export default function SignalerScreen() {
  const { incidents, currentUser, buildingId, unitId } = useData();
  const { lang, i, isAr } = useLang();
  const T = i.signaler;
  const router = useRouter();

  const [tab, setTab] = useState<"signaler" | "suivi">("signaler");
  const [cat, setCat] = useState("");
  const [customCat, setCustomCat] = useState("");
  const [urg, setUrg] = useState("normal");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [toast, setToast] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const catSlugs = Object.keys(T.cats) as (keyof typeof T.cats)[];
  const urgKeys = Object.keys(T.urgencies) as (keyof typeof T.urgencies)[];

  const statusLabels: Record<string, string> = {
    open: T.statuses.open,
    in_progress: T.statuses.in_progress,
    resolved: T.statuses.resolved,
  };

  const openIncidents = incidents.filter((inc) => inc.status !== "resolved");
  const grouped = (["open", "in_progress", "resolved"] as const).map((s) => ({
    status: s, items: incidents.filter((inc) => inc.status === s),
  }));

  const finalCat = cat === "autre" && customCat.trim() ? customCat.trim() : cat;
  const canSubmit = finalCat && finalCat !== "autre" && title;

  async function submit() {
    setSubmitting(true);
    const reporter = currentUser.name.split(" ")[0] + " " + (currentUser.name.split(" ")[1]?.[0] ?? "") + ".";
    let imageUrl: string | undefined;
    if (photo) {
      const { uploadIncidentPhoto } = await import("@/lib/storage");
      imageUrl = await uploadIncidentPhoto(photo);
    }
    await createIncident({ buildingId: buildingId!, unitId: unitId!, category: finalCat, title, details, urgency: urg as Urgency, reporter, imageUrl });
    setToast(true);
    setCat(""); setCustomCat(""); setTitle(""); setDetails(""); setUrg("normal");
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null); setPhotoPreview(null);
    setSubmitting(false);
    router.refresh();
  }

  const tabs = [
    { key: "signaler" as const, label: T.tabSignaler },
    { key: "suivi" as const, label: `${T.tabSuivi}${openIncidents.length > 0 ? ` (${openIncidents.length})` : ""}` },
  ];

  return (
    <div className="animate-[fade_0.4s_ease] pb-4">
      <StatusBar />
      <header className="flex items-center gap-3 px-5 pb-2 pt-3">
        <Link href="/immeuble" className="tap flex h-9 w-9 items-center justify-center rounded-full bg-cream-card text-ink shadow-card">
          <Icon name={isAr ? "ChevronRight" : "ChevronLeft"} className="h-5 w-5" />
        </Link>
        <h1 className="text-[22px] font-bold tracking-tight text-ink">{T.title}</h1>
      </header>

      {/* ═══ Tabs ═══ */}
      <div className="flex border-b border-black/5 px-4">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`relative flex-1 pb-2.5 pt-1 text-center text-[14px] font-semibold ${tab === t.key ? "text-palier-700" : "text-ink-soft"}`}>
            {t.label}
            {tab === t.key && <span className="absolute bottom-0 inset-x-4 h-[2.5px] rounded-full bg-palier-600" />}
          </button>
        ))}
      </div>

      {/* ═══ Tab: Signaler ═══ */}
      {tab === "signaler" && (
        <div className="space-y-5 px-4 pt-4">
          <div className="flex items-center gap-3 rounded-2xl bg-palier-50 p-4">
            <Icon name="Wrench" className="h-7 w-7 shrink-0 text-palier-600" />
            <p className="text-[13px] leading-snug text-palier-800">{T.info} <b>{T.infoSuite}</b> {T.infoFin}</p>
          </div>

          <div>
            <h3 className="mb-2.5 px-1 text-[15px] font-bold text-ink">{T.deQuoi}</h3>
            <div className="flex flex-wrap gap-2">
              {catSlugs.map((slug) => (
                <button key={slug} onClick={() => { setCat(slug); if (slug !== "autre") setCustomCat(""); }}
                  className={`tap rounded-full border px-4 py-2 text-[13px] font-semibold ${cat === slug ? "border-palier-500 bg-palier-50 text-palier-700" : "border-black/5 bg-cream-card text-ink-soft"}`}>
                  {T.cats[slug]}
                </button>
              ))}
            </div>
            {cat === "autre" && (
              <input value={customCat} onChange={(e) => setCustomCat(e.target.value)} placeholder={T.autrePreciser}
                className="mt-2 w-full rounded-2xl border border-black/5 bg-cream-card px-4 py-3 text-[14px] text-ink shadow-card outline-none placeholder:text-ink-faint focus:border-palier-300" />
            )}
          </div>

          <div>
            <h3 className="mb-2.5 px-1 text-[15px] font-bold text-ink">{T.niveauUrgence}</h3>
            <div className="grid grid-cols-3 gap-2">
              {urgKeys.map((key) => {
                const uc = urgencyColors[key] ?? urgencyColors.normal;
                const selected = urg === key;
                return (
                  <button key={key} onClick={() => setUrg(key)}
                    className={`tap rounded-2xl border p-3 text-center text-[13px] font-semibold transition-colors ${selected ? `${uc.bg} ${uc.text} ${uc.border}` : "border-black/5 bg-cream-card text-ink-soft"}`}>
                    {T.urgencies[key]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-2 px-1 text-[15px] font-bold text-ink">{T.titreCourt}</h3>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={T.placeholder}
              className="w-full rounded-2xl border border-black/5 bg-cream-card px-4 py-3 text-[14px] text-ink shadow-card outline-none placeholder:text-ink-faint focus:border-palier-300" />
          </div>

          <div>
            <h3 className="mb-2 px-1 text-[15px] font-bold text-ink">{T.detailsLabel} <span className="font-normal text-ink-faint">({T.optionnel})</span></h3>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder={T.detailsPlaceholder}
              className="w-full resize-none rounded-2xl border border-black/5 bg-cream-card px-4 py-3 text-[14px] text-ink shadow-card outline-none placeholder:text-ink-faint focus:border-palier-300" />
          </div>

          {/* Photo */}
          <div>
            <h3 className="mb-2 px-1 text-[15px] font-bold text-ink">{T.ajouterPhoto} <span className="font-normal text-ink-faint">({T.optionnel})</span></h3>
            {photoPreview ? (
              <div className="relative inline-block">
                <img src={photoPreview} alt="" className="h-24 w-24 rounded-2xl object-cover" />
                <button onClick={() => { if (photoPreview) URL.revokeObjectURL(photoPreview); setPhoto(null); setPhotoPreview(null); }}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white shadow">
                  <Icon name="X" className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="tap flex w-fit cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-black/10 bg-cream-card px-4 py-3 text-[13px] font-semibold text-ink-soft">
                <Icon name="Camera" className="h-4 w-4" /> {T.ajouterPhoto}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setPhoto(f);
                  setPhotoPreview(URL.createObjectURL(f));
                }} />
              </label>
            )}
          </div>

          <Button full disabled={!canSubmit || submitting} onClick={submit} className={!canSubmit || submitting ? "opacity-50" : ""} icon="Send">
            {submitting ? T.envoi : T.envoyerSignalement}
          </Button>
        </div>
      )}

      {/* ═══ Tab: Suivi ═══ */}
      {tab === "suivi" && (
        <div className="space-y-4 px-4 pt-4">
          {incidents.length > 0 ? (
            grouped.filter((g) => g.items.length > 0).map((g) => (
              <div key={g.status}>
                <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-ink-faint">{statusLabels[g.status]} · {g.items.length}</p>
                <div className="space-y-2.5">
                  {g.items.map((inc) => {
                    const uc = urgencyColors[inc.urgency] ?? urgencyColors.normal;
                    const isResolved = inc.status === "resolved";
                    const isInProgress = inc.status === "in_progress";
                    return (
                      <div key={inc.id} className={`card p-3.5 ${isResolved ? "opacity-60" : ""}`}>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[14px] font-bold text-ink">{inc.title}</p>
                            {isResolved ? (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                <Icon name="Check" className="h-3 w-3" />{T.statuses.resolved}
                              </span>
                            ) : isInProgress ? (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                <Icon name="Clock" className="h-3 w-3" />{T.statuses.in_progress}
                              </span>
                            ) : (
                              <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${uc.bg} ${uc.text} ${uc.border}`}>{T.urgencies[inc.urgency as keyof typeof T.urgencies] ?? inc.urgency}</span>
                            )}
                          </div>
                          <p className="mt-1 text-[12px] text-ink-soft">{T.cats[inc.category as keyof typeof T.cats] ?? inc.category}{inc.details ? ` · ${inc.details}` : ""}</p>
                          <p className="mt-1 text-[11px] text-ink-faint">
                            {timeAgo(inc.createdAt, lang)}
                            {inc.messages > 0 && <> · <Icon name="MessageCircle" className="inline h-3 w-3" /> {inc.messages}</>}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-palier-50">
                <Icon name="CheckCircle" className="h-7 w-7 text-palier-600" />
              </span>
              <p className="mt-4 text-[15px] font-bold text-ink">{T.aucunSignalement}</p>
              <p className="mt-1 max-w-[16rem] text-[13px] text-ink-soft">{T.aucunSignalementSub}</p>
            </div>
          )}
        </div>
      )}

      <Toast open={toast} onClose={() => setToast(false)} title={T.signalementEnvoye} body={T.signalementBody} />
    </div>
  );
}
