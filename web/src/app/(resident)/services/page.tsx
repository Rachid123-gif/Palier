"use client";
import { useState, useMemo, useCallback } from "react";
import { StatusBar } from "@/components/resident/StatusBar";
import { NotificationsBell } from "@/components/resident/NotificationsBell";
import { Icon } from "@/components/ui/Icon";
import { LetterAvatar } from "@/components/ui/Avatar";
import { Sheet, Toast } from "@/components/ui/Sheet";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/format";
import { useData } from "@/lib/DataProvider";
import { useLang } from "@/lib/LangProvider";
import { createPost, createComment, fetchComments, likeComment, deletePost, updatePost } from "@/lib/actions";
import { telLink, whatsappLink } from "@/lib/whatsapp";
import type { Post, Comment } from "@/lib/types";

const POST_LIMIT = 6;
const BODY_LIMIT = 160;

type Tab = "recos" | "demandes" | "prestataires";

/* ── Google Places types (no storage, display only) ── */
type GooglePlace = {
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  phone: string | null;
  mapsUrl: string | null;
  open: boolean;
};

const PLACE_CATEGORIES = [
  { key: "plomberie", label: "Plomberie", query: "plombier" },
  { key: "electricite", label: "Électricité", query: "électricien" },
  { key: "menage", label: "Ménage", query: "service ménage nettoyage" },
  { key: "climatisation", label: "Climatisation", query: "climatisation réparation" },
  { key: "peinture", label: "Peinture", query: "peintre bâtiment" },
  { key: "serrurerie", label: "Serrurerie", query: "serrurier" },
  { key: "jardinage", label: "Jardinage", query: "jardinier paysagiste" },
  { key: "demenagement", label: "Déménagement", query: "déménagement" },
  { key: "electromenager", label: "Électroménager", query: "réparation électroménager" },
  { key: "desinfection", label: "Désinfection", query: "désinfection dératisation" },
];

export default function ServicesScreen() {
  const { posts, currentUser, buildingId, profileId } = useData();
  const { lang, i } = useLang();
  const T = i.services;
  const router = useRouter();
  const isInactive = currentUser.membershipStatus === "inactive";

  const [tab, setTab] = useState<Tab>("recos");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(POST_LIMIT);

  // Composers
  const [recoSheet, setRecoSheet] = useState(false);
  const [demandeSheet, setDemandeSheet] = useState(false);
  const [toast, setToast] = useState<{ icon: string; title: string; body: string } | null>(null);

  // Reco composer state
  const [recoName, setRecoName] = useState("");
  const [recoBody, setRecoBody] = useState("");
  const [recoPhone, setRecoPhone] = useState("");
  const [recoCat, setRecoCat] = useState("");
  const [recoNewCat, setRecoNewCat] = useState("");

  // Demande composer state
  const [demandeText, setDemandeText] = useState("");

  // Google Places state
  const [placeCat, setPlaceCat] = useState(PLACE_CATEGORIES[0].key);
  const [places, setPlaces] = useState<GooglePlace[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [placesSearched, setPlacesSearched] = useState(false);

  // Edit/Delete state
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCat, setEditCat] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);

  const searchPlaces = useCallback(async (categoryKey: string) => {
    const cat = PLACE_CATEGORIES.find((c) => c.key === categoryKey);
    if (!cat) return;
    setPlacesLoading(true);
    setPlacesError(null);
    setPlacesSearched(true);
    try {
      const res = await fetch(`/api/places?q=${encodeURIComponent(cat.query)}&city=${encodeURIComponent(currentUser.cityName)}`);
      if (!res.ok) {
        if (res.status === 503) { setPlacesError(T.serviceNonConfigure); setPlaces([]); return; }
        throw new Error("fetch_failed");
      }
      const data = await res.json();
      setPlaces(data.places ?? []);
    } catch {
      setPlacesError(T.impossibleCharger);
      setPlaces([]);
    } finally {
      setPlacesLoading(false);
    }
  }, [currentUser.cityName]);

  // Comments
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  /* ── Data ── */
  const recos = posts
    .filter((p) => p.type === "recommendation")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const demandes = posts
    .filter((p) => p.type === "service")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Dynamic categories from recommendations
  const categories = useMemo(() => {
    const cats = new Map<string, number>();
    for (const r of recos) {
      if (r.category) {
        cats.set(r.category, (cats.get(r.category) ?? 0) + 1);
      }
    }
    return [...cats.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [recos]);

  const filteredRecos = activeCat
    ? recos.filter((r) => r.category === activeCat)
    : recos;

  /* ── Actions ── */
  async function publishReco() {
    const name = recoName.trim();
    const body = recoBody.trim();
    const category = (recoCat === "__new" ? recoNewCat.trim() : recoCat) || "";
    if (!name || !body) return;

    await createPost({
      buildingId: buildingId!,
      author: currentUser.name,
      avatarColor: currentUser.avatarColor,
      type: "recommendation",
      title: name,
      body,
      category: category || undefined,
      providerName: name,
      providerPhone: recoPhone.trim() || undefined,
    });
    setRecoSheet(false);
    setRecoName(""); setRecoBody(""); setRecoPhone(""); setRecoCat(""); setRecoNewCat("");
    setToast({ icon: "Check", title: T.recoPubliee, body: T.recoPublieeBody });
    router.refresh();
  }

  async function publishDemande() {
    const body = demandeText.trim();
    if (!body) return;
    await createPost({ buildingId: buildingId!, author: currentUser.name, avatarColor: currentUser.avatarColor, body, type: "service" });
    setDemandeSheet(false); setDemandeText("");
    setToast({ icon: "Check", title: T.demandePubliee, body: T.demandePublieeBody });
    router.refresh();
  }

  async function openComments(post: Post) {
    setCommentPost(post);
    setCommentsLoading(true);
    const data = await fetchComments(post.id);
    setComments(data);
    setCommentsLoading(false);
  }

  async function submitComment() {
    if (!commentPost || !commentText.trim()) return;
    await createComment({ postId: commentPost.id, author: currentUser.name, avatarColor: currentUser.avatarColor, body: commentText.trim() });
    setCommentText("");
    const data = await fetchComments(commentPost.id);
    setComments(data);
    router.refresh();
  }

  async function handleLikeComment(commentId: string) {
    if (likedComments.has(commentId)) return;
    setLikedComments((prev) => new Set(prev).add(commentId));
    await likeComment(commentId);
    setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, likes: c.likes + 1 } : c));
  }

  function openEdit(post: Post) {
    setEditPost(post);
    setEditBody(post.body);
    setEditName(post.providerName ?? post.title ?? "");
    setEditPhone(post.providerPhone ?? "");
    setEditCat(post.category ?? "");
  }

  async function submitEdit() {
    if (!editPost || !editBody.trim()) return;
    const isReco = editPost.type === "recommendation";
    await updatePost({
      postId: editPost.id,
      body: editBody.trim(),
      title: isReco ? editName.trim() || undefined : undefined,
      category: isReco ? editCat || undefined : undefined,
      providerName: isReco ? editName.trim() || undefined : undefined,
      providerPhone: isReco ? editPhone.trim() || undefined : undefined,
    });
    setEditPost(null);
    setToast({ icon: "Check", title: T.postModifie, body: T.postModifieBody });
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deletePost(deleteConfirm.id);
      setDeleteConfirm(null);
      setToast({ icon: "Trash2", title: T.postSupprime, body: T.postSupprimeBody });
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="animate-[fade_0.4s_ease]">
      <StatusBar />
      <header className="flex items-end justify-between px-5 pb-2 pt-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">{T.label}</p>
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">{T.title}</h1>
        </div>
        <NotificationsBell />
      </header>

      <div className="space-y-4 px-4 pt-1">
        {/* Info */}
        <div className="flex items-start gap-2.5 rounded-2xl border border-black/[0.06] bg-cream-card px-4 py-3">
          <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
          <p className="text-[12px] text-ink-soft">{T.info}</p>
        </div>

        {/* ═══════ Tabs ═══════ */}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {([
            { key: "recos" as Tab, label: T.tabRecos, icon: "Star" },
            { key: "demandes" as Tab, label: T.tabDemandes, icon: "Search" },
            { key: "prestataires" as Tab, label: T.tabPrestataires, icon: "MapPin" },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setActiveCat(null);
                setVisibleCount(POST_LIMIT);
                if (t.key === "prestataires" && !placesSearched) searchPlaces(placeCat);
              }}
              className={`tap flex shrink-0 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[14px] font-semibold transition-colors ${
                tab === t.key
                  ? "bg-palier-600 text-white"
                  : "border border-black/[0.06] bg-white text-ink-soft"
              }`}
            >
              <Icon name={t.icon} className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* ═══════ Tab: Recommandations ═══════ */}
        {tab === "recos" && (
          <>
            {/* Category filters */}
            {categories.length > 0 && (
              <div
                className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4"
                style={{ maskImage: "linear-gradient(to right, #000 92%, transparent)", WebkitMaskImage: "linear-gradient(to right, #000 92%, transparent)" }}
              >
                <button
                  onClick={() => { setActiveCat(null); setVisibleCount(POST_LIMIT); }}
                  className={`tap shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold ${!activeCat ? "bg-palier-600 text-white" : "border border-palier-100 bg-white text-ink-soft"}`}
                >
                  {T.toutesCategories}
                </button>
                {categories.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => { setActiveCat(activeCat === c.name ? null : c.name); setVisibleCount(POST_LIMIT); }}
                    className={`tap shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold ${activeCat === c.name ? "bg-palier-600 text-white" : "border border-palier-100 bg-white text-ink-soft"}`}
                  >
                    {c.name} <span className="opacity-60">({c.count})</span>
                  </button>
                ))}
                <span className="w-2 shrink-0" aria-hidden />
              </div>
            )}

            {/* CTA + list */}
            <button onClick={() => setRecoSheet(true)} className="tap flex w-full items-center gap-3 rounded-2xl bg-cream-card p-3 shadow-card">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-palier-50">
                <Icon name="Star" className="h-5 w-5 text-palier-600" />
              </span>
              <span className="flex-1 text-start text-[14px] font-medium text-ink-soft">{T.partagerReco}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-palier-600 text-white"><Icon name="Plus" className="h-5 w-5" /></span>
            </button>

            {filteredRecos.length > 0 ? (
              <div className="space-y-3">
                {filteredRecos.slice(0, visibleCount).map((p) => (
                  <RecoCard key={p.id} p={p} isOwn={p.authorId === profileId} onComment={() => openComments(p)} onEdit={() => openEdit(p)} onDelete={() => setDeleteConfirm(p)} lang={lang} T={T} />
                ))}
                {filteredRecos.length > visibleCount && (
                  <button onClick={() => setVisibleCount((v) => v + POST_LIMIT)} className="tap flex w-full items-center justify-center gap-1.5 rounded-full border border-palier-100 bg-white py-2.5 text-[13px] font-semibold text-palier-700">
                    {T.voirPlus(filteredRecos.length - visibleCount)} <Icon name="ChevronDown" className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <EmptyState icon="Star" text={T.aucuneReco} cta={T.partagerReco} onCta={() => setRecoSheet(true)} />
            )}
          </>
        )}

        {/* ═══════ Tab: Demandes ═══════ */}
        {tab === "demandes" && (
          <>
            <button onClick={() => setDemandeSheet(true)} className="tap flex w-full items-center gap-3 rounded-2xl bg-cream-card p-3 shadow-card">
              <LetterAvatar letter={currentUser.name[0]} color={currentUser.avatarColor} size={38} />
              <span className="flex-1 text-start text-[14px] text-ink-faint">{T.placeholder}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-palier-600 text-white"><Icon name="Plus" className="h-5 w-5" /></span>
            </button>

            {demandes.length > 0 ? (
              <div className="space-y-3">
                {demandes.slice(0, visibleCount).map((p) => (
                  <DemandeCard key={p.id} p={p} isOwn={p.authorId === profileId} onComment={() => openComments(p)} onEdit={() => openEdit(p)} onDelete={() => setDeleteConfirm(p)} lang={lang} T={T} />
                ))}
                {demandes.length > visibleCount && (
                  <button onClick={() => setVisibleCount((v) => v + POST_LIMIT)} className="tap flex w-full items-center justify-center gap-1.5 rounded-full border border-palier-100 bg-white py-2.5 text-[13px] font-semibold text-palier-700">
                    {T.voirPlus(demandes.length - visibleCount)} <Icon name="ChevronDown" className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <EmptyState icon="Search" text={T.aucuneDemande} cta={T.posterDemande} onCta={() => setDemandeSheet(true)} />
            )}
          </>
        )}

        {/* ═══════ Tab: Prestataires (Google Places) ═══════ */}
        {tab === "prestataires" && (
          <>
            {/* Category pills */}
            <div
              className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4"
              style={{ maskImage: "linear-gradient(to right, #000 92%, transparent)", WebkitMaskImage: "linear-gradient(to right, #000 92%, transparent)" }}
            >
              {PLACE_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => { setPlaceCat(cat.key); searchPlaces(cat.key); }}
                  className={`tap shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                    placeCat === cat.key
                      ? "bg-palier-600 text-white"
                      : "bg-sand/80 text-ink-soft"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Location indicator */}
            <div className="flex items-center gap-1.5 text-[12px] text-ink-faint">
              <Icon name="MapPin" className="h-3 w-3" />
              <span>{T.resultatsAutourDe(currentUser.cityName)}</span>
            </div>

            {/* Results */}
            {placesLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-palier-200 border-t-palier-600" />
              </div>
            ) : placesError ? (
              <div className="py-8 text-center">
                <Icon name="AlertCircle" className="mx-auto h-8 w-8 text-ink-faint" />
                <p className="mt-2 text-[13px] text-ink-soft">{placesError}</p>
                <button onClick={() => searchPlaces(placeCat)} className="mt-2 text-[13px] font-semibold text-palier-600">{T.reessayer}</button>
              </div>
            ) : places.length > 0 ? (
              <div className="space-y-3">
                {places.map((place, idx) => (
                  <div key={idx} className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold text-ink">{place.name}</p>
                        <p className="mt-0.5 text-[12px] text-ink-soft">{place.address}</p>
                      </div>
                      {place.open && (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{T.ouvert}</span>
                      )}
                    </div>

                    {/* Rating */}
                    {place.rating > 0 && (
                      <div className="mb-3 flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Icon key={s} name="Star" className={`h-3 w-3 ${s <= Math.round(place.rating) ? "fill-amber-400 text-amber-400" : "text-ink-faint/30"}`} />
                          ))}
                        </div>
                        <span className="text-[12px] font-medium text-ink-soft">{place.rating.toFixed(1)}</span>
                        <span className="text-[11px] text-ink-faint">({place.reviewCount} avis)</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {place.phone && (
                        <a href={telLink(place.phone)} className="tap flex flex-1 items-center justify-center gap-2 rounded-xl bg-sand/80 py-2.5 text-[13px] font-semibold text-ink">
                          <Icon name="Phone" className="h-4 w-4" /> {T.appelerBtn}
                        </a>
                      )}
                      {place.phone && (
                        <a href={whatsappLink(place.phone, T.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="tap flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 py-2.5 text-[13px] font-semibold text-[#25D366]">
                          <Icon name="MessageCircle" className="h-4 w-4" /> {T.whatsappBtn}
                        </a>
                      )}
                      {place.mapsUrl && (
                        <a href={place.mapsUrl} target="_blank" rel="noopener noreferrer" className="tap flex items-center justify-center gap-1.5 rounded-xl border border-black/[0.06] px-3 py-2.5 text-[13px] font-semibold text-ink-soft">
                          <Icon name="ExternalLink" className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}

                {/* Google Attribution — REQUIRED by Google ToS */}
                <p className="pb-2 text-center text-[10px] text-ink-faint">{T.poweredByGoogle}</p>
              </div>
            ) : placesSearched ? (
              <div className="py-8 text-center">
                <Icon name="SearchX" className="mx-auto h-8 w-8 text-ink-faint" />
                <p className="mt-2 text-[13px] text-ink-soft">{T.aucunPrestataire}</p>
                <p className="mt-0.5 text-[12px] text-ink-faint">{T.essayerAutre}</p>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* ═══════ Sheet: Recommander ═══════ */}
      <Sheet open={recoSheet} onClose={() => setRecoSheet(false)} title={T.titreRecoSheet}>
        <div className="space-y-4">
          {/* Provider name */}
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">{T.nomPrestataire}</label>
            <input
              type="text" value={recoName} onChange={(e) => setRecoName(e.target.value)}
              placeholder={T.nomPlaceholder}
              className="h-11 w-full rounded-2xl border border-black/[0.06] bg-white px-4 text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-palier-400"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">{T.categorieLabel}</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setRecoCat(recoCat === c.name ? "" : c.name)}
                  className={`tap rounded-full px-3 py-1.5 text-[12px] font-semibold ${recoCat === c.name ? "bg-palier-600 text-white" : "border border-palier-100 bg-white text-ink-soft"}`}
                >
                  {c.name}
                </button>
              ))}
              <button
                onClick={() => setRecoCat(recoCat === "__new" ? "" : "__new")}
                className={`tap flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold ${recoCat === "__new" ? "bg-palier-600 text-white" : "border border-palier-100 bg-white text-ink-soft"}`}
              >
                <Icon name="Plus" className="h-3 w-3" /> {T.categorieNouvelle}
              </button>
            </div>
            {recoCat === "__new" && (
              <input
                type="text" value={recoNewCat} onChange={(e) => setRecoNewCat(e.target.value)}
                placeholder={T.categoriePlaceholder}
                className="mt-2 h-10 w-full rounded-xl border border-black/[0.06] bg-white px-3.5 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-palier-400"
              />
            )}
          </div>

          {/* Avis */}
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">{T.avisLabel}</label>
            <textarea
              value={recoBody} onChange={(e) => setRecoBody(e.target.value.slice(0, 300))} rows={3}
              placeholder={T.avisPlaceholder}
              className="w-full resize-none rounded-2xl border border-black/[0.06] bg-white px-4 py-3 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-palier-400"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">
              {T.telephoneLabel} <span className="font-normal text-ink-faint">({T.optionnel})</span>
            </label>
            <input
              type="tel" value={recoPhone} onChange={(e) => setRecoPhone(e.target.value)}
              placeholder={T.telephonePlaceholder}
              className="h-11 w-full rounded-2xl border border-black/[0.06] bg-white px-4 text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-palier-400"
            />
          </div>

          {isInactive && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <Icon name="AlertTriangle" className="h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-[12px] font-medium text-amber-800">{i.desactive.titre} — {i.desactive.desc}</p>
            </div>
          )}
          <button
            onClick={publishReco}
            disabled={!recoName.trim() || !recoBody.trim() || isInactive}
            className="tap w-full rounded-full bg-palier-600 py-3 text-[14px] font-semibold text-white disabled:opacity-40"
          >
            {T.publier}
          </button>
        </div>
      </Sheet>

      {/* ═══════ Sheet: Demande ═══════ */}
      <Sheet open={demandeSheet} onClose={() => setDemandeSheet(false)} title={T.titreDemandeSheet}>
        <div className="flex gap-3">
          <LetterAvatar letter={currentUser.name[0]} color={currentUser.avatarColor} size={40} />
          <div className="flex-1">
            <textarea
              autoFocus value={demandeText} onChange={(e) => setDemandeText(e.target.value.slice(0, 300))} rows={4}
              placeholder={T.demandePlaceholder}
              className="w-full resize-none rounded-2xl border border-black/5 bg-white px-4 py-3 text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-palier-300"
            />
            <span className="mt-1 block px-1 text-[12px] text-ink-faint">{demandeText.length}/300</span>
          </div>
        </div>
        {isInactive && (
          <div className="mt-3 flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3">
            <Icon name="AlertTriangle" className="h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-[12px] font-medium text-amber-800">{i.desactive.titre} — {i.desactive.desc}</p>
          </div>
        )}
        <button
          onClick={publishDemande}
          disabled={!demandeText.trim() || isInactive}
          className={`tap mt-4 w-full rounded-full bg-palier-600 py-3 text-sm font-semibold text-white ${!demandeText.trim() || isInactive ? "opacity-50" : ""}`}
        >
          {T.publier}
        </button>
      </Sheet>

      {/* ═══════ Sheet: Edit post ═══════ */}
      <Sheet open={!!editPost} onClose={() => setEditPost(null)} title={editPost?.type === "recommendation" ? T.modifierReco : T.modifierDemande}>
        {editPost && (
          <div className="space-y-4">
            {/* Provider name (reco only) */}
            {editPost.type === "recommendation" && (
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">{T.nomPrestataire}</label>
                <input
                  type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-black/[0.06] bg-white px-4 text-[14px] text-ink outline-none focus:border-palier-400"
                />
              </div>
            )}

            {/* Category (reco only) */}
            {editPost.type === "recommendation" && categories.length > 0 && (
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">{T.categorieLabel}</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setEditCat(editCat === c.name ? "" : c.name)}
                      className={`tap rounded-full px-3 py-1.5 text-[12px] font-semibold ${editCat === c.name ? "bg-palier-600 text-white" : "border border-palier-100 bg-white text-ink-soft"}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Body */}
            <textarea
              autoFocus value={editBody} onChange={(e) => setEditBody(e.target.value.slice(0, 300))} rows={4}
              className="w-full resize-none rounded-2xl border border-black/5 bg-white px-4 py-3 text-[14px] text-ink outline-none focus:border-palier-300"
            />
            <span className="block px-1 text-[12px] text-ink-faint">{editBody.length}/300</span>

            {/* Phone (reco only) */}
            {editPost.type === "recommendation" && (
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">
                  {T.telephoneLabel} <span className="font-normal text-ink-faint">({T.optionnel})</span>
                </label>
                <input
                  type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-black/[0.06] bg-white px-4 text-[14px] text-ink outline-none focus:border-palier-400"
                />
              </div>
            )}

            <button
              onClick={submitEdit}
              disabled={!editBody.trim()}
              className="tap w-full rounded-full bg-palier-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {T.modifier}
            </button>
          </div>
        )}
      </Sheet>

      {/* ═══════ Sheet: Delete Confirmation ═══════ */}
      <Sheet open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={T.supprimer}>
        {deleteConfirm && (
          <div className="space-y-4">
            <p className="text-[14px] text-ink">{T.confirmerSuppression}</p>
            <p className="text-[12px] text-ink-faint">{T.confirmerSuppressionBody}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="tap flex-1 rounded-full border border-black/10 py-3 text-[13px] font-semibold text-ink-soft">
                {T.annuler}
              </button>
              <button onClick={confirmDelete} disabled={deleting} className="tap flex-1 rounded-full bg-red-600 py-3 text-[13px] font-semibold text-white disabled:opacity-50">
                {T.supprimer}
              </button>
            </div>
          </div>
        )}
      </Sheet>

      {/* ═══════ Sheet: Comments ═══════ */}
      <Sheet open={!!commentPost} onClose={() => { setCommentPost(null); setComments([]); setCommentText(""); }} title={T.commentaires}>
        {commentPost && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-sand p-3">
              <div className="flex items-center gap-2">
                <LetterAvatar letter={commentPost.author[0]} color={commentPost.avatarColor} size={28} />
                <span className="text-[13px] font-bold text-ink">{commentPost.author}</span>
                <span className="text-[11px] text-ink-faint">{timeAgo(commentPost.createdAt, lang)}</span>
              </div>
              {commentPost.providerName && (
                <p className="mt-1.5 text-[14px] font-bold text-ink">{commentPost.providerName}</p>
              )}
              <p className="mt-1 text-[13px] text-ink-soft">{commentPost.body}</p>
            </div>

            {commentsLoading ? (
              <p className="py-4 text-center text-[13px] text-ink-faint">{T.chargement}</p>
            ) : comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <LetterAvatar letter={c.author[0]} color={c.avatarColor} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="rounded-2xl border border-black/5 bg-white p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-ink">{c.author}</span>
                          <span className="text-[10px] text-ink-faint">{timeAgo(c.createdAt, lang)}</span>
                        </div>
                        <p className="mt-1 text-[13px] text-ink-soft">{c.body}</p>
                      </div>
                      <button onClick={() => handleLikeComment(c.id)}
                        className={`tap mt-1 flex items-center gap-1 px-1 text-[11px] font-semibold ${likedComments.has(c.id) ? "text-palier-600" : "text-ink-faint"}`}>
                        <Icon name="ThumbsUp" className="h-3 w-3" />
                        {c.likes + (likedComments.has(c.id) ? 1 : 0) > 0 ? c.likes + (likedComments.has(c.id) ? 1 : 0) : T.jaime}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-[13px] text-ink-faint">{T.aucuneReponse}</p>
            )}

            <div className="flex items-end gap-2.5">
              <LetterAvatar letter={currentUser.name[0]} color={currentUser.avatarColor} size={32} />
              <div className="min-w-0 flex-1">
                <textarea value={commentText} onChange={(e) => setCommentText(e.target.value.slice(0, 200))} rows={2} placeholder={T.ecrireReponse}
                  className="w-full resize-none rounded-2xl border border-black/5 bg-white px-3 py-2.5 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-palier-300" />
              </div>
              <button onClick={submitComment} disabled={!commentText.trim()}
                className={`tap flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-palier-600 text-white ${!commentText.trim() ? "opacity-40" : ""}`}>
                <Icon name="Send" className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Sheet>

      {toast && <Toast open onClose={() => setToast(null)} icon={toast.icon} title={toast.title} body={toast.body} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════ */

function PostMenu({ onEdit, onDelete, T }: { onEdit: () => void; onDelete: () => void; T: { modifier: string; supprimer: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="tap flex h-8 w-8 items-center justify-center rounded-full text-ink-faint hover:bg-sand">
        <Icon name="MoreVertical" className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute end-0 top-9 z-20 w-44 rounded-xl border border-black/[0.06] bg-white py-1 shadow-lg">
            <button onClick={() => { setOpen(false); onEdit(); }} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium text-ink hover:bg-sand">
              <Icon name="Pencil" className="h-4 w-4 text-ink-faint" /> {T.modifier}
            </button>
            <button onClick={() => { setOpen(false); onDelete(); }} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium text-red-600 hover:bg-red-50">
              <Icon name="Trash2" className="h-4 w-4" /> {T.supprimer}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function RecoCard({ p, isOwn, onComment, onEdit, onDelete, lang, T }: {
  p: Post; isOwn: boolean; onComment: () => void; onEdit: () => void; onDelete: () => void; lang: "fr" | "ar";
  T: typeof import("@/lib/i18n").t.fr.services;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = p.body.length > BODY_LIMIT;

  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <LetterAvatar letter={p.author[0]} color={p.avatarColor} size={40} />
        <div className="min-w-0 flex-1">
          <span className="text-[14px] font-bold text-ink">{p.author}</span>
          <p className="text-[11px] text-ink-faint">{timeAgo(p.createdAt, lang)}</p>
        </div>
        {p.category && (
          <span className="shrink-0 rounded-full bg-palier-50 px-2.5 py-0.5 text-[10px] font-semibold text-palier-700">
            {p.category}
          </span>
        )}
        {isOwn && <PostMenu onEdit={onEdit} onDelete={onDelete} T={T} />}
      </div>

      {/* Provider name */}
      {p.providerName && (
        <div className="mt-3 flex items-center gap-2">
          <Icon name="Star" className="h-4 w-4 text-palier-600" />
          <p className="text-[15px] font-bold text-ink">{p.providerName}</p>
        </div>
      )}

      <p className="mt-1.5 text-[13.5px] leading-snug text-ink-soft">
        {isLong && !expanded ? p.body.slice(0, BODY_LIMIT) + "…" : p.body}
      </p>
      {isLong && (
        <button onClick={() => setExpanded((v) => !v)} className="tap mt-1 text-[12px] font-semibold text-palier-600">
          {expanded ? T.voirMoins : T.lireSuite}
        </button>
      )}

      {/* Contact + comment */}
      <div className="mt-3 flex items-center gap-2">
        {p.providerPhone && (
          <>
            <a href={telLink(p.providerPhone)} className="tap flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5 text-[12px] font-semibold text-ink">
              <Icon name="Phone" className="h-3.5 w-3.5" /> {T.appeler}
            </a>
            <a href={whatsappLink(p.providerPhone, T.whatsappMessage)} target="_blank" rel="noopener noreferrer"
              className="tap flex items-center gap-1.5 rounded-full bg-[#25D366]/10 px-3 py-1.5 text-[12px] font-semibold text-[#25D366]">
              <Icon name="MessageCircle" className="h-3.5 w-3.5" /> {T.whatsapp}
            </a>
          </>
        )}
        <button onClick={onComment}
          className="tap ms-auto flex items-center gap-1.5 rounded-full bg-palier-50 px-3 py-1.5 text-[12px] font-semibold text-palier-700">
          <Icon name="MessageCircle" className="h-3.5 w-3.5" />
          {p.comments > 0 ? T.reponses(p.comments) : T.repondre}
        </button>
      </div>
    </div>
  );
}

function DemandeCard({ p, isOwn, onComment, onEdit, onDelete, lang, T }: {
  p: Post; isOwn: boolean; onComment: () => void; onEdit: () => void; onDelete: () => void; lang: "fr" | "ar";
  T: typeof import("@/lib/i18n").t.fr.services;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = p.body.length > BODY_LIMIT;

  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <LetterAvatar letter={p.author[0]} color={p.avatarColor} size={40} />
        <div className="flex-1">
          <span className="text-[14px] font-bold text-ink">{p.author}</span>
          <p className="text-[11px] text-ink-faint">{timeAgo(p.createdAt, lang)}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
          <Icon name="Search" className="h-2.5 w-2.5" /> {T.badge}
        </span>
        {isOwn && <PostMenu onEdit={onEdit} onDelete={onDelete} T={T} />}
      </div>

      <p className="mt-3 text-[13.5px] leading-snug text-ink-soft">
        {isLong && !expanded ? p.body.slice(0, BODY_LIMIT) + "…" : p.body}
      </p>
      {isLong && (
        <button onClick={() => setExpanded((v) => !v)} className="tap mt-1 text-[12px] font-semibold text-palier-600">
          {expanded ? T.voirMoins : T.lireSuite}
        </button>
      )}

      <div className="mt-3">
        <button onClick={onComment}
          className="tap flex items-center gap-1.5 rounded-full bg-palier-50 px-3 py-1.5 text-[13px] font-semibold text-palier-700">
          <Icon name="MessageCircle" className="h-4 w-4" />
          {p.comments > 0 ? T.reponses(p.comments) : T.repondre}
        </button>
      </div>
    </div>
  );
}

function EmptyState({ icon, text, cta, onCta }: { icon: string; text: string; cta: string; onCta: () => void }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-palier-50">
        <Icon name={icon} className="h-7 w-7 text-palier-600" />
      </span>
      <p className="max-w-[16rem] text-[13px] text-ink-soft">{text}</p>
      <button onClick={onCta} className="tap mt-1 rounded-full bg-palier-600 px-5 py-2.5 text-[13px] font-semibold text-white">
        {cta}
      </button>
    </div>
  );
}
