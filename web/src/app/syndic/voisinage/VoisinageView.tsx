"use client";

import { useState, useMemo, useTransition, useCallback, useEffect } from "react";
import { PageHeader } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { timeAgo, shortDate } from "@/lib/format";
import { deletePost, togglePinPost, createPostSyndic, likePost, fetchComments, createComment, updatePost, uploadFileAction } from "@/lib/actions";

type Post = {
  id: string;
  type: string;
  author_name: string;
  role: string;
  avatar_color: string;
  created_at: string;
  pinned: boolean;
  emoji?: string;
  title?: string;
  body: string;
  like_count?: number;
  love_count?: number;
  haha_count?: number;
  wow_count?: number;
  comments_count?: number;
  image_url?: string;
};

type Comment = {
  id: string;
  postId: string;
  author: string;
  avatarColor: string;
  body: string;
  likes: number;
  createdAt: string;
};

const DEFAULT_CATS = ["Annonce", "Événement", "Entraide", "Trouvé", "Général", "Service", "Recommandation"];

const TYPE_COLORS = [
  "bg-palier-50 text-palier-700",
  "bg-blue-50 text-blue-700",
  "bg-amber-50 text-amber-700",
  "bg-yellow-50 text-yellow-700",
  "bg-emerald-50 text-emerald-700",
  "bg-purple-50 text-purple-700",
  "bg-pink-50 text-pink-700",
];

const PER_PAGE = 15;

export function VoisinageView({ posts, buildingName, buildingId, voisinageCategories }: { posts: Post[]; buildingName: string; buildingId: string; voisinageCategories?: string[] | null }) {
  const categories = voisinageCategories ?? DEFAULT_CATS;
  const typeLabels: Record<string, string> = Object.fromEntries(categories.map((c) => [c, c]));
  const typeColors: Record<string, string> = Object.fromEntries(categories.map((c, i) => [c, TYPE_COLORS[i % TYPE_COLORS.length]]));

  const [localPosts, setLocalPosts] = useState<Post[]>(posts);
  useEffect(() => { setLocalPosts(posts); }, [posts]);

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Post | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isPinning, startPinning] = useTransition();

  // Compose form
  const [showCompose, setShowCompose] = useState(false);
  const [composeBody, setComposeBody] = useState("");
  const [composeTitle, setComposeTitle] = useState("");
  const [composeType, setComposeType] = useState<string>(categories[0] ?? "Annonce");
  const [isPosting, startPosting] = useTransition();
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  // Like
  const [isLiking, startLiking] = useTransition();

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [isSendingComment, startSendingComment] = useTransition();

  // Edit
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [isEditing, startEditing] = useTransition();

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2500); }

  async function handleDelete(postId: string) {
    try {
      await deletePost(postId);
      setShowDeleteConfirm(null);
      setSelected(null);
      setLocalPosts((prev) => prev.filter((p) => p.id !== postId));
      flash("Publication supprimée");
    } catch { flash("Erreur lors de la suppression"); }
  }

  function openEdit(post: Post) {
    setEditingPost(post);
    setEditBody(post.body);
    setEditTitle(post.title ?? "");
    setSelected(null);
  }

  function handleSaveEdit() {
    if (!editingPost || !editBody.trim()) return;
    const postId = editingPost.id;
    const newBody = editBody.trim();
    const newTitle = editTitle.trim() || undefined;
    startEditing(async () => {
      try {
        await updatePost({ postId, body: newBody, title: newTitle });
        setLocalPosts((prev) =>
          prev.map((p) => p.id === postId ? { ...p, body: newBody, title: newTitle } : p)
        );
        setEditingPost(null);
        setEditBody("");
        setEditTitle("");
        flash("Publication modifiée");
      } catch { flash("Erreur lors de la modification"); }
    });
  }

  function handleTogglePin(post: Post) {
    const newPinned = !post.pinned;
    startPinning(async () => {
      try {
        await togglePinPost(post.id, newPinned);
        setLocalPosts((prev) =>
          prev.map((p) => p.id === post.id ? { ...p, pinned: newPinned } : p)
        );
        setSelected((prev) => prev?.id === post.id ? { ...prev, pinned: newPinned } : prev);
        flash(post.pinned ? "Publication désépinglée" : "Publication épinglée");
      } catch { flash("Erreur lors de l'épinglage"); }
    });
  }

  function handleMediaSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    if (file.type.startsWith("image/")) {
      setMediaPreview(URL.createObjectURL(file));
    } else {
      setMediaPreview(null);
    }
  }

  function clearMedia() {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaFile(null);
    setMediaPreview(null);
  }

  function handlePublish() {
    if (!composeBody.trim()) return;
    const body = composeBody.trim();
    const title = composeTitle.trim() || undefined;
    const type = composeType;
    startPosting(async () => {
      try {
        let imageUrl: string | undefined;
        if (mediaFile) {
          const fd = new FormData();
          fd.append("file", mediaFile);
          const uploadResult = await uploadFileAction(fd);
          if (uploadResult.error) { flash("Erreur upload : " + uploadResult.error); return; }
          imageUrl = uploadResult.url;
        }
        await createPostSyndic({ buildingId, body, title, type, imageUrl });
        const optimisticPost: Post = {
          id: crypto.randomUUID(),
          type,
          author_name: "Syndic",
          role: "syndic",
          avatar_color: "#1e5b50",
          created_at: new Date().toISOString(),
          pinned: false,
          title,
          body,
          like_count: 0,
          love_count: 0,
          haha_count: 0,
          wow_count: 0,
          comments_count: 0,
          image_url: imageUrl,
        };
        setLocalPosts((prev) => [optimisticPost, ...prev]);
        setComposeBody("");
        setComposeTitle("");
        setComposeType(categories[0] ?? "Annonce");
        clearMedia();
        setShowCompose(false);
        flash("Publication créée");
      } catch { flash("Erreur lors de la publication"); }
    });
  }

  const handleLike = useCallback((postId: string) => {
    startLiking(async () => {
      try {
        const result = await likePost(postId);
        if (!result.alreadyLiked) {
          setLocalPosts((prev) =>
            prev.map((p) => p.id === postId ? { ...p, like_count: (p.like_count ?? 0) + 1 } : p)
          );
          setSelected((prev) => prev?.id === postId ? { ...prev, like_count: (prev.like_count ?? 0) + 1 } : prev);
        }
      } catch { flash("Erreur"); }
    });
  }, []);

  const loadComments = useCallback(async (postId: string) => {
    if (commentsPostId === postId) return;
    setCommentsLoading(true);
    setComments([]);
    setCommentsPostId(postId);
    try {
      const data = await fetchComments(postId);
      setComments(data);
    } catch { /* empty */ }
    setCommentsLoading(false);
  }, [commentsPostId]);

  function handleSendComment() {
    if (!commentBody.trim() || !selected) return;
    const postId = selected.id;
    startSendingComment(async () => {
      try {
        await createComment({ postId, author: "Syndic", avatarColor: "#1e5b50", body: commentBody.trim() });
        setCommentBody("");
        const data = await fetchComments(postId);
        setComments(data);
        setLocalPosts((prev) =>
          prev.map((p) => p.id === postId ? { ...p, comments_count: (p.comments_count ?? 0) + 1 } : p)
        );
        setSelected((prev) => prev?.id === postId ? { ...prev, comments_count: (prev.comments_count ?? 0) + 1 } : prev);
      } catch { flash("Erreur lors de l'envoi"); }
    });
  }

  function openDetail(post: Post) {
    setSelected(post);
    setCommentsPostId(null);
    setComments([]);
    setCommentBody("");
  }

  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of localPosts) map[p.type] = (map[p.type] ?? 0) + 1;
    return map;
  }, [localPosts]);

  const usedTypes = Object.keys(typeCounts).sort();

  const filtered = useMemo(() => {
    let rows = [...localPosts];
    if (typeFilter !== "all") rows = rows.filter((p) => p.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((p) =>
        p.body?.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q) ||
        p.author_name?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [localPosts, typeFilter, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pages - 1);
  const rows = filtered.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);

  const pinnedCount = localPosts.filter((p) => p.pinned).length;

  return (
    <div>
      <PageHeader
        title="Voisinage"
        subtitle={`${localPosts.length} publications · ${pinnedCount} épinglée${pinnedCount !== 1 ? "s" : ""}`}
      />

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-4 py-3">
        <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
        <p className="text-[12px] text-ink-soft">
          Visualisez les publications des résidents de {buildingName}. Vous pouvez modérer le contenu et suivre l&apos;activité communautaire.
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">Publications</p>
          <p className="text-[28px] font-bold leading-none text-ink">{localPosts.length}</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">Épinglées</p>
          <p className="text-[28px] font-bold leading-none text-ink">{pinnedCount}</p>
        </div>
      </div>

      {/* Compose button */}
      <button
        onClick={() => setShowCompose(true)}
        className="mb-3 inline-flex items-center gap-2 rounded-xl bg-palier-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-palier-700"
      >
        <Icon name="Plus" className="h-4 w-4" />
        Nouvelle publication
      </button>

      {/* Compose form */}
      {showCompose && (
        <div className="mb-4 rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-ink">Nouvelle publication</h3>
            <button onClick={() => setShowCompose(false)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
              <Icon name="X" className="h-4 w-4" />
            </button>
          </div>
          <select
            value={composeType}
            onChange={(e) => setComposeType(e.target.value)}
            className="mb-2 h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-ink outline-none focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20 md:w-auto"
          >
            {Object.entries(typeLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input
            value={composeTitle}
            onChange={(e) => setComposeTitle(e.target.value)}
            placeholder="Titre (optionnel)"
            className="mb-2 h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
          />
          <textarea
            value={composeBody}
            onChange={(e) => setComposeBody(e.target.value)}
            placeholder="Écrivez votre message…"
            rows={3}
            className="mb-2 w-full resize-none rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
          />
          {/* Media upload buttons */}
          <div className="mb-2 flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-black/[0.08] px-3 py-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:bg-palier-50 hover:text-palier-700">
              <Icon name="Image" className="h-3.5 w-3.5" /> Photo
              <input type="file" accept="image/*" className="hidden" onChange={handleMediaSelect} />
            </label>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-black/[0.08] px-3 py-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:bg-palier-50 hover:text-palier-700">
              <Icon name="Paperclip" className="h-3.5 w-3.5" /> Fichier
              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleMediaSelect} />
            </label>
          </div>
          {/* Media preview */}
          {mediaFile && (
            <div className="mb-3 flex items-start gap-2">
              {mediaPreview ? (
                <img src={mediaPreview} alt="" className="h-20 w-20 rounded-xl object-cover" />
              ) : (
                <div className="flex h-12 items-center gap-2 rounded-xl bg-sand px-3">
                  <Icon name="FileText" className="h-4 w-4 text-ink-soft" />
                  <span className="max-w-[12rem] truncate text-[12px] font-medium text-ink">{mediaFile.name}</span>
                </div>
              )}
              <button onClick={clearMedia} className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200">
                <Icon name="X" className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowCompose(false); clearMedia(); }} className="rounded-lg border border-black/[0.08] px-4 py-2 text-[12px] font-medium text-ink hover:bg-sand/50">
              Annuler
            </button>
            <button
              onClick={handlePublish}
              disabled={!composeBody.trim() || isPosting}
              className="rounded-lg bg-palier-600 px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-palier-700 disabled:opacity-50"
            >
              {isPosting ? "Publication…" : "Publier"}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-3 space-y-2">
        <div className="relative">
          <Icon name="Search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Rechercher…"
            className="h-9 w-full rounded-lg border border-black/[0.08] bg-white pl-9 pr-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
          />
          {search && (
            <button onClick={() => { setSearch(""); setPage(0); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink">
              <Icon name="X" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
          className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-ink outline-none focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20 md:w-auto"
        >
          <option value="all">Tous les types</option>
          {usedTypes.map((t) => (
            <option key={t} value={t}>{typeLabels[t] ?? t} ({typeCounts[t]})</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-cream-card shadow-card">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Icon name="MessageCircle" className="mx-auto h-8 w-8 text-ink-faint" />
            <p className="mt-2 text-[13px] text-ink-soft">Aucune publication trouvée</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full table-fixed text-left text-[13px] lg:table">
              <thead>
                <tr className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                  <th className="w-[40%] px-4 py-2.5">Publication</th>
                  <th className="w-[12%] px-4 py-2.5">Type</th>
                  <th className="w-[14%] px-4 py-2.5">Auteur</th>
                  <th className="w-[10%] px-4 py-2.5">Date</th>
                  <th className="w-[14%] px-4 py-2.5 text-right">Engagement</th>
                  <th className="w-[10%] px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {rows.map((p) => {
                  const reactions = (p.like_count ?? 0) + (p.love_count ?? 0) + (p.haha_count ?? 0) + (p.wow_count ?? 0);
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-sand/50">
                      <td className="overflow-hidden px-4 py-2.5">
                        <button onClick={() => openDetail(p)} className="block w-full text-left">
                          <div className="flex items-center gap-2">
                            {p.pinned && <Icon name="Pin" className="h-3 w-3 shrink-0 text-palier-600" />}
                            <p className="truncate font-medium text-ink hover:text-palier-700 hover:underline">
                              {p.title || p.body.slice(0, 80)}
                            </p>
                          </div>
                          {p.title && <p className="mt-0.5 truncate text-[11px] text-ink-soft">{p.body.slice(0, 100)}</p>}
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${typeColors[p.type] ?? "bg-sand text-ink-soft"}`}>
                          {typeLabels[p.type] ?? p.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: p.avatar_color }}>
                            {p.author_name?.[0]?.toUpperCase()}
                          </span>
                          <span className="truncate text-[12px] text-ink-soft">{p.author_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-ink-soft">{shortDate(p.created_at)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-3 text-[12px] text-ink-soft">
                          <span className="flex items-center gap-1"><Icon name="ThumbsUp" className="h-3 w-3" />{reactions}</span>
                          <span className="flex items-center gap-1"><Icon name="MessageCircle" className="h-3 w-3" />{p.comments_count ?? 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleLike(p.id)}
                            disabled={isLiking}
                            title="Aimer"
                            className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-palier-50 hover:text-palier-700 disabled:opacity-50"
                          >
                            <Icon name="ThumbsUp" className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openDetail(p)}
                            title="Voir"
                            className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-palier-50 hover:text-palier-700"
                          >
                            <Icon name="Eye" className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="divide-y divide-black/[0.04] lg:hidden">
              {rows.map((p) => {
                const reactions = (p.like_count ?? 0) + (p.love_count ?? 0) + (p.haha_count ?? 0) + (p.wow_count ?? 0);
                return (
                  <div key={p.id} className="p-4">
                    <button onClick={() => openDetail(p)} className="block w-full text-left">
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${typeColors[p.type] ?? "bg-sand text-ink-soft"}`}>
                          {typeLabels[p.type] ?? p.type}
                        </span>
                        {p.pinned && <Icon name="Pin" className="h-3 w-3 text-palier-600" />}
                      </div>
                      <p className="text-[14px] font-medium text-ink">{p.title || p.body.slice(0, 80)}</p>
                      {p.title && <p className="mt-0.5 line-clamp-2 text-[12px] text-ink-soft">{p.body.slice(0, 120)}</p>}
                      <div className="mt-2 flex items-center gap-3 text-[12px] text-ink-soft">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white" style={{ backgroundColor: p.avatar_color }}>
                            {p.author_name?.[0]?.toUpperCase()}
                          </span>
                          <span>{p.author_name}</span>
                        </div>
                        <span>{shortDate(p.created_at)}</span>
                      </div>
                    </button>
                    <div className="mt-2 flex items-center gap-3 text-[12px] text-ink-soft">
                      <button
                        onClick={() => handleLike(p.id)}
                        disabled={isLiking}
                        className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-palier-50 hover:text-palier-700 disabled:opacity-50"
                      >
                        <Icon name="ThumbsUp" className="h-3 w-3" />{reactions}
                      </button>
                      <span className="flex items-center gap-1"><Icon name="MessageCircle" className="h-3 w-3" />{p.comments_count ?? 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex flex-col items-center gap-2 border-t border-black/[0.06] px-4 py-2.5 text-[12px] text-ink-soft sm:flex-row sm:justify-between">
              <span className="shrink-0">{safePage * PER_PAGE + 1}–{Math.min((safePage + 1) * PER_PAGE, filtered.length)} sur {filtered.length}</span>
              {pages > 1 && (
                <div className="flex flex-wrap justify-center gap-1">
                  <button onClick={() => setPage(Math.max(0, safePage - 1))} disabled={safePage === 0} className="rounded-md px-2 py-1 hover:bg-palier-50 disabled:opacity-30">
                    <Icon name="ChevronLeft" className="h-3.5 w-3.5" />
                  </button>
                  {Array.from({ length: pages }, (_, i) => (
                    <button key={i} onClick={() => setPage(i)} className={`rounded-md px-2 py-1 font-medium ${i === safePage ? "bg-palier-50 text-palier-700" : "text-ink-soft hover:bg-palier-50"}`}>
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => setPage(Math.min(pages - 1, safePage + 1))} disabled={safePage >= pages - 1} className="rounded-md px-2 py-1 hover:bg-palier-50 disabled:opacity-30">
                    <Icon name="ChevronRight" className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-bold text-white" style={{ backgroundColor: selected.avatar_color }}>
                  {selected.author_name?.[0]?.toUpperCase()}
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-ink">{selected.author_name}</p>
                  <p className="text-[11px] text-ink-soft">{shortDate(selected.created_at)} · {timeAgo(selected.created_at)}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 flex items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${typeColors[selected.type] ?? "bg-sand text-ink-soft"}`}>
                {typeLabels[selected.type] ?? selected.type}
              </span>
              {selected.pinned && (
                <span className="flex items-center gap-1 rounded-md bg-palier-50 px-2 py-0.5 text-[11px] font-semibold text-palier-700">
                  <Icon name="Pin" className="h-3 w-3" />Épinglé
                </span>
              )}
              {selected.role === "syndic" && (
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Syndic</span>
              )}
            </div>

            {selected.title && <p className="mb-2 text-[15px] font-bold text-ink">{selected.emoji && <span className="mr-1">{selected.emoji}</span>}{selected.title}</p>}
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{selected.body}</p>

            {selected.image_url && (
              /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(selected.image_url)
                ? <img src={selected.image_url} alt="" className="mt-3 w-full rounded-xl object-cover" style={{ maxHeight: 300 }} />
                : <a href={selected.image_url} target="_blank" rel="noopener" className="mt-3 inline-flex items-center gap-2 rounded-lg border border-black/[0.08] bg-sand/50 px-4 py-3 text-[13px] font-medium text-palier-700 hover:bg-sand">
                    <Icon name="FileDown" className="h-4 w-4" />
                    Télécharger le fichier joint
                  </a>
            )}

            {/* Like + engagement stats */}
            <div className="mt-4 flex items-center gap-4 border-t border-black/[0.06] pt-3 text-[12px] text-ink-soft">
              <button
                onClick={() => handleLike(selected.id)}
                disabled={isLiking}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-palier-50 hover:text-palier-700 disabled:opacity-50"
              >
                <Icon name="ThumbsUp" className="h-3.5 w-3.5" />
                {(selected.like_count ?? 0) + (selected.love_count ?? 0) + (selected.haha_count ?? 0) + (selected.wow_count ?? 0)} réactions
              </button>
              <button
                onClick={() => loadComments(selected.id)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-palier-50 hover:text-palier-700"
              >
                <Icon name="MessageCircle" className="h-3.5 w-3.5" />
                {selected.comments_count ?? 0} commentaires
              </button>
            </div>

            {/* Comments section */}
            {commentsPostId === selected.id && (
              <div className="mt-3 border-t border-black/[0.06] pt-3">
                <h4 className="mb-2 text-[13px] font-semibold text-ink">Commentaires</h4>
                {commentsLoading ? (
                  <p className="text-[12px] text-ink-soft">Chargement…</p>
                ) : comments.length === 0 ? (
                  <p className="mb-3 text-[12px] text-ink-soft">Aucun commentaire pour le moment.</p>
                ) : (
                  <div className="mb-3 max-h-60 space-y-2.5 overflow-y-auto">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: c.avatarColor }}>
                          {c.author?.[0]?.toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-[12px] font-semibold text-ink">{c.author}</span>
                            <span className="text-[10px] text-ink-faint">{timeAgo(c.createdAt)}</span>
                          </div>
                          <p className="text-[12px] leading-snug text-ink-soft">{c.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Comment compose */}
                <div className="flex gap-2">
                  <input
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }}
                    placeholder="Écrire un commentaire…"
                    className="h-9 min-w-0 flex-1 rounded-lg border border-black/[0.08] bg-white px-3 text-[12px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
                  />
                  <button
                    onClick={handleSendComment}
                    disabled={!commentBody.trim() || isSendingComment}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-palier-600 text-white transition-colors hover:bg-palier-700 disabled:opacity-50"
                  >
                    <Icon name="Send" className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Moderation actions */}
            <div className="mt-3 flex gap-2 border-t border-black/[0.06] pt-3">
              <button
                onClick={() => openEdit(selected)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-black/[0.08] py-2.5 text-[12px] font-semibold text-ink transition-colors hover:bg-palier-50 hover:text-palier-700"
              >
                <Icon name="Pencil" className="h-3.5 w-3.5" />
                Modifier
              </button>
              <button
                onClick={() => handleTogglePin(selected)}
                disabled={isPinning}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-black/[0.08] py-2.5 text-[12px] font-semibold text-ink transition-colors hover:bg-sand/50 disabled:opacity-50"
              >
                <Icon name="Pin" className="h-3.5 w-3.5" />
                {selected.pinned ? "Désépingler" : "Épingler"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(selected.id)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2.5 text-[12px] font-semibold text-red-700 transition-colors hover:bg-red-100"
              >
                <Icon name="Trash2" className="h-3.5 w-3.5" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={() => setShowDeleteConfirm(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                <Icon name="Trash2" className="h-4 w-4 text-red-600" />
              </div>
              <h2 className="text-[15px] font-semibold text-ink">Supprimer la publication</h2>
            </div>
            <p className="mb-4 text-[13px] text-ink-soft">
              Cette action est irréversible. La publication et ses commentaires seront définitivement supprimés.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 rounded-lg border border-black/[0.08] py-2 text-[13px] font-medium text-ink hover:bg-sand/50">
                Annuler
              </button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 rounded-lg bg-red-600 py-2 text-[13px] font-medium text-white hover:bg-red-700">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30" onClick={() => { setEditingPost(null); setEditBody(""); setEditTitle(""); }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-palier-50">
                  <Icon name="Pencil" className="h-4 w-4 text-palier-600" />
                </div>
                <h2 className="text-[15px] font-semibold text-ink">Modifier la publication</h2>
              </div>
              <button onClick={() => { setEditingPost(null); setEditBody(""); setEditTitle(""); }} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Titre (optionnel)"
              className="mb-2 h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
            />
            <textarea
              autoFocus
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              placeholder="Contenu de la publication…"
              rows={5}
              className="mb-2 w-full resize-none rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setEditingPost(null); setEditBody(""); setEditTitle(""); }} className="rounded-lg border border-black/[0.08] px-4 py-2 text-[12px] font-medium text-ink hover:bg-sand/50">
                Annuler
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editBody.trim() || isEditing}
                className="rounded-lg bg-palier-600 px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-palier-700 disabled:opacity-50"
              >
                {isEditing ? "Enregistrement…" : "Enregistrer"}
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
