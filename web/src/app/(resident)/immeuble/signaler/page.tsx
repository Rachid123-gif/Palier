"use client";
import { useState } from "react";
import Link from "next/link";
import { StatusBar } from "@/components/resident/StatusBar";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/primitives";
import { Sheet, Toast } from "@/components/ui/Sheet";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/format";
import { useData } from "@/lib/DataProvider";
import { useLang } from "@/lib/LangProvider";
import { createIncident, createIncidentComment, fetchIncidentComments } from "@/lib/actions";
import { LetterAvatar } from "@/components/ui/Avatar";
import type { Urgency, IncidentComment } from "@/lib/types";

const urgencyColors: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  normal: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  urgent: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

export default function SignalerScreen() {
  const { incidents, currentUser, buildingId, unitId, profileId, incidentCategories } = useData();
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
  const [photoError, setPhotoError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [selectedInc, setSelectedInc] = useState<typeof incidents[0] | null>(null);
  const [incComments, setIncComments] = useState<IncidentComment[]>([]);
  const [incCommentsLoading, setIncCommentsLoading] = useState(false);
  const [incCommentText, setIncCommentText] = useState("");

  const isInactive = currentUser.membershipStatus === "inactive";

  // Use syndic-configured categories if available, otherwise i18n defaults
  const configuredCats = incidentCategories ?? Object.values(T.cats);
  const categories: string[] = configuredCats.includes(T.cats.autre) ? configuredCats : [...configuredCats, T.cats.autre];
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

  const isAutre = cat === T.cats.autre;
  const finalCat = isAutre && customCat.trim() ? customCat.trim() : cat;
  const canSubmit = cat && (!isAutre || customCat.trim()) && title;

  async function submit() {
    setSubmitting(true);
    const reporter = currentUser.name.split(" ")[0] + " " + (currentUser.name.split(" ")[1]?.[0] ?? "") + ".";
    let imageUrl: string | undefined;
    if (photo) {
      const fd = new FormData();
      fd.append("file", photo);
      const { uploadFileAction } = await import("@/lib/actions");
      const result = await uploadFileAction(fd);
      if (result.url) imageUrl = result.url;
    }
    await createIncident({ buildingId: buildingId!, unitId: unitId!, category: finalCat, title, details, urgency: urg as Urgency, reporter, imageUrl });
    setToast(true);
    setCat(""); setCustomCat(""); setTitle(""); setDetails(""); setUrg("normal");
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null); setPhotoPreview(null);
    setSubmitting(false);
    router.refresh();
  }

  async function openIncident(inc: typeof incidents[0]) {
    setSelectedInc(inc);
    setIncCommentsLoading(true);
    const data = await fetchIncidentComments(inc.id);
    setIncComments(data);
    setIncCommentsLoading(false);
  }

  async function submitIncidentComment() {
    if (!selectedInc || !incCommentText.trim()) return;
    await createIncidentComment({
      incidentId: selectedInc.id,
      author: currentUser.name,
      avatarColor: currentUser.avatarColor,
      body: incCommentText.trim(),
      role: "resident",
    });
    setIncCommentText("");
    const data = await fetchIncidentComments(selectedInc.id);
    setIncComments(data);
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
          {isInactive && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <Icon name="TriangleAlert" className="h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-[12px] font-medium text-amber-800">{i.desactive.titre} — {i.desactive.desc}</p>
            </div>
          )}
          <div className="flex items-center gap-3 rounded-2xl bg-palier-50 p-4">
            <Icon name="Wrench" className="h-7 w-7 shrink-0 text-palier-600" />
            <p className="text-[13px] leading-snug text-palier-800">{T.info} <b>{T.infoSuite}</b> {T.infoFin}</p>
          </div>

          <div>
            <h3 className="mb-2.5 px-1 text-[15px] font-bold text-ink">{T.deQuoi}</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button key={c} onClick={() => { setCat(c); if (c !== T.cats.autre) setCustomCat(""); }}
                  className={`tap rounded-full border px-4 py-2 text-[13px] font-semibold ${cat === c ? "border-palier-500 bg-palier-50 text-palier-700" : "border-black/5 bg-cream-card text-ink-soft"}`}>
                  {c}
                </button>
              ))}
            </div>
            {cat === T.cats.autre && (
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
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setPhotoError("");
                  if (f.size > 5 * 1024 * 1024) { setPhotoError("Image trop volumineuse (max 5 Mo)"); return; }
                  if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { setPhotoError("Format non supporté (JPG, PNG, WebP)"); return; }
                  setPhoto(f);
                  setPhotoPreview(URL.createObjectURL(f));
                }} />
              </label>
            )}
          </div>

          {photoError && <p className="px-1 text-[12px] font-medium text-red-600">{photoError}</p>}
          {!cat && <p className="px-1 text-center text-[12px] text-ink-faint">{T.selectCategorie}</p>}
          <Button full disabled={!canSubmit || submitting || isInactive} onClick={submit} className={!canSubmit || submitting || isInactive ? "opacity-50" : ""} icon="Send">
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
                      <button key={inc.id} onClick={() => openIncident(inc)} className={`card p-3.5 w-full text-left ${isResolved ? "opacity-60" : ""}`}>
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
                          {inc.imageUrl && (
                            <img src={inc.imageUrl} alt="" className="mt-2 h-20 w-full rounded-xl object-cover" />
                          )}
                          <p className="mt-1 text-[11px] text-ink-faint">
                            {timeAgo(inc.createdAt, lang)}
                            {inc.messages > 0 && <> · <Icon name="MessageCircle" className="inline h-3 w-3" /> {inc.messages}</>}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-palier-50">
                <Icon name="CircleCheck" className="h-7 w-7 text-palier-600" />
              </span>
              <p className="mt-4 text-[15px] font-bold text-ink">{T.aucunSignalement}</p>
              <p className="mt-1 max-w-[16rem] text-[13px] text-ink-soft">{T.aucunSignalementSub}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ Incident detail Sheet ═══ */}
      <Sheet open={!!selectedInc} onClose={() => { setSelectedInc(null); setIncComments([]); setIncCommentText(""); }} title={selectedInc?.title ?? ""}>
        {selectedInc && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-sand p-3.5">
              <div className="flex items-center gap-2">
                <p className="flex-1 text-[14px] font-bold text-ink">{selectedInc.title}</p>
                {selectedInc.status === "resolved" ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    <Icon name="Check" className="h-3 w-3" />{T.statuses.resolved}
                  </span>
                ) : selectedInc.status === "in_progress" ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    <Icon name="Clock" className="h-3 w-3" />{T.statuses.in_progress}
                  </span>
                ) : (
                  <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${(urgencyColors[selectedInc.urgency] ?? urgencyColors.normal).bg} ${(urgencyColors[selectedInc.urgency] ?? urgencyColors.normal).text} ${(urgencyColors[selectedInc.urgency] ?? urgencyColors.normal).border}`}>
                    {T.urgencies[selectedInc.urgency as keyof typeof T.urgencies] ?? selectedInc.urgency}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[12px] text-ink-soft">{T.cats[selectedInc.category as keyof typeof T.cats] ?? selectedInc.category}</p>
              {selectedInc.details && <p className="mt-2 text-[13px] text-ink-soft">{selectedInc.details}</p>}
              {selectedInc.imageUrl && (
                <img src={selectedInc.imageUrl} alt="" className="mt-2 w-full rounded-xl object-cover" style={{ maxHeight: 200 }} />
              )}
              <p className="mt-2 text-[11px] text-ink-faint">{timeAgo(selectedInc.createdAt, lang)}</p>
            </div>

            {incCommentsLoading ? (
              <p className="py-4 text-center text-[13px] text-ink-faint">{i.voisinage.chargement}</p>
            ) : incComments.length > 0 ? (
              <div className="space-y-3">
                {incComments.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <LetterAvatar letter={c.author[0]} color={c.avatarColor} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="rounded-2xl border border-black/5 bg-white p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-ink">{c.author}</span>
                          {c.role === "syndic" && <span className="rounded-md bg-palier-50 px-1.5 py-0.5 text-[10px] font-semibold text-palier-700">{i.syndicBadge}</span>}
                          <span className="text-[10px] text-ink-faint">{timeAgo(c.createdAt, lang)}</span>
                        </div>
                        <p className="mt-1 text-[13px] text-ink-soft">{c.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-[13px] text-ink-faint">{i.voisinage.aucunCommentaire}</p>
            )}

            {!isInactive && (
              <div className="flex items-end gap-2.5">
                <div className="min-w-0 flex-1">
                  <textarea value={incCommentText} onChange={(e) => setIncCommentText(e.target.value.slice(0, 500))} rows={2} placeholder={i.voisinage.ecrireCommentaire}
                    className="w-full resize-none rounded-2xl border border-black/5 bg-white px-3 py-2.5 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-palier-300" />
                </div>
                <button onClick={submitIncidentComment} disabled={!incCommentText.trim()}
                  className={`tap flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-palier-600 text-white ${!incCommentText.trim() ? "opacity-40" : ""}`}>
                  <Icon name="Send" className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </Sheet>

      <Toast open={toast} onClose={() => setToast(false)} title={T.signalementEnvoye} body={T.signalementBody} />
    </div>
  );
}
