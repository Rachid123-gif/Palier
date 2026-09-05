"use client";

import { useState, useMemo, useTransition, useCallback, useEffect } from "react";
import { PageHeader } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { timeAgo, shortDate } from "@/lib/format";
import { deletePost, fetchComments, createComment } from "@/lib/actions";
import { useLang } from "@/lib/LangProvider";

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
  file_url?: string;
  file_name?: string;
  category?: string;
  provider_name?: string;
  provider_phone?: string;
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

type Tab = "recommendations" | "demandes";

const PER_PAGE = 15;

export function ServicesView({ posts }: { posts: Post[] }) {
  const { i, lang } = useLang();
  const T = i.syndic.servicesSyndic;
  const C = i.syndic.common;

  const [localPosts, setLocalPosts] = useState<Post[]>(posts);
  useEffect(() => { setLocalPosts(posts); }, [posts]);

  const [tab, setTab] = useState<Tab>("recommendations");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Post | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [isSendingComment, startSendingComment] = useTransition();

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2500); }

  async function handleDelete(postId: string) {
    try {
      await deletePost(postId);
      setShowDeleteConfirm(null);
      setSelected(null);
      setLocalPosts((prev) => prev.filter((p) => p.id !== postId));
      flash(C.delete);
    } catch { flash(C.error); }
  }

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
      } catch { flash(C.error); }
    });
  }

  function openDetail(post: Post) {
    setSelected(post);
    setCommentsPostId(null);
    setComments([]);
    setCommentBody("");
  }

  // Split by type
  const recos = useMemo(() => localPosts.filter((p) => p.type === "recommendation"), [localPosts]);
  const demandes = useMemo(() => localPosts.filter((p) => p.type === "service"), [localPosts]);

  // Categories (from recommendations)
  const categories = useMemo(() => {
    const cats = new Map<string, number>();
    for (const r of recos) {
      if (r.category) cats.set(r.category, (cats.get(r.category) ?? 0) + 1);
    }
    return [...cats.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [recos]);

  // Top category
  const topCategory = categories.length > 0 ? categories[0].name : "—";

  // Total comments
  const totalComments = localPosts.reduce((s, p) => s + (p.comments_count ?? 0), 0);

  // Current tab data
  const currentPosts = tab === "recommendations" ? recos : demandes;

  // Filtered
  const filtered = useMemo(() => {
    let rows = [...currentPosts];
    if (tab === "recommendations" && catFilter !== "all") {
      rows = rows.filter((p) => p.category === catFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((p) =>
        p.body?.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q) ||
        p.provider_name?.toLowerCase().includes(q) ||
        p.author_name?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [currentPosts, tab, catFilter, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pages - 1);
  const rows = filtered.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);

  // Reset page on tab/filter change
  useEffect(() => { setPage(0); }, [tab, catFilter, search]);

  return (
    <div>
      <PageHeader
        title={T.title}
        subtitle={`${localPosts.length} ${T.subtitle}`}
      />

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-4 py-3">
        <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
        <p className="text-[12px] text-ink-soft">{T.infoNote}</p>
      </div>

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">{T.kpi.recommendations}</p>
          <p className="text-[28px] font-bold leading-none text-ink" dir="ltr">{recos.length}</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">{T.kpi.demandes}</p>
          <p className="text-[28px] font-bold leading-none text-ink" dir="ltr">{demandes.length}</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">{T.kpi.topCategory}</p>
          <p className="text-[18px] font-bold leading-none text-ink truncate">{topCategory}</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
          <p className="mb-2 text-[12px] font-semibold text-ink-soft">{T.kpi.comments}</p>
          <p className="text-[28px] font-bold leading-none text-ink" dir="ltr">{totalComments}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-3 flex gap-2">
        {([
          { key: "recommendations" as Tab, label: T.tabs.recommendations, icon: "Star" },
          { key: "demandes" as Tab, label: T.tabs.demandes, icon: "Search" },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setCatFilter("all"); }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-colors ${
              tab === t.key
                ? "bg-palier-600 text-white"
                : "border border-black/[0.06] bg-cream-card text-ink-soft hover:bg-sand/50"
            }`}
          >
            <Icon name={t.icon} className="h-4 w-4" />
            {t.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab === t.key ? "bg-white/20" : "bg-sand"}`}>
              {t.key === "recommendations" ? recos.length : demandes.length}
            </span>
          </button>
        ))}
      </div>

      {/* Search + category filter */}
      <div className="mb-3 space-y-2">
        <div className="relative">
          <Icon name="Search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={C.search}
            className="h-9 w-full rounded-lg border border-black/[0.08] bg-white pl-9 pr-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink">
              <Icon name="X" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {tab === "recommendations" && categories.length > 0 && (
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-ink outline-none focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20 md:w-auto"
          >
            <option value="all">{T.allCategories}</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>{c.name} ({c.count})</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-cream-card shadow-card">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Icon name="Briefcase" className="mx-auto h-8 w-8 text-ink-faint" />
            <p className="mt-2 text-[13px] text-ink-soft">
              {tab === "recommendations" ? T.noRecommendations : T.noDemandes}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full table-fixed text-left text-[13px] lg:table">
              <thead>
                <tr className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                  <th className="w-[35%] px-4 py-2.5">
                    {tab === "recommendations" ? T.table.provider : T.table.content}
                  </th>
                  {tab === "recommendations" && (
                    <th className="w-[12%] px-4 py-2.5">{T.table.category}</th>
                  )}
                  <th className="w-[14%] px-4 py-2.5">{T.table.author}</th>
                  <th className="w-[10%] px-4 py-2.5">{T.table.date}</th>
                  <th className="w-[10%] px-4 py-2.5 text-right">{T.table.comments}</th>
                  <th className="w-[10%] px-4 py-2.5 text-right">{T.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {rows.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-sand/50">
                    <td className="overflow-hidden px-4 py-2.5">
                      <button onClick={() => openDetail(p)} className="block w-full text-left">
                        <p className="truncate font-medium text-ink hover:text-palier-700 hover:underline">
                          {tab === "recommendations" ? (p.provider_name || p.title || p.body.slice(0, 80)) : (p.body.slice(0, 80))}
                        </p>
                        {tab === "recommendations" && (
                          <p className="mt-0.5 truncate text-[11px] text-ink-soft">{p.body.slice(0, 100)}</p>
                        )}
                      </button>
                    </td>
                    {tab === "recommendations" && (
                      <td className="px-4 py-2.5">
                        {p.category ? (
                          <span className="rounded-md bg-palier-50 px-2 py-0.5 text-[11px] font-semibold text-palier-700">
                            {p.category}
                          </span>
                        ) : (
                          <span className="text-[11px] text-ink-faint">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: p.avatar_color }}>
                          {p.author_name?.[0]?.toUpperCase()}
                        </span>
                        <span className="truncate text-[12px] text-ink-soft">{p.author_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-ink-soft" dir="ltr">{shortDate(p.created_at, lang)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="flex items-center justify-end gap-1 text-[12px] text-ink-soft">
                        <Icon name="MessageCircle" className="h-3 w-3" />
                        <span dir="ltr">{p.comments_count ?? 0}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => openDetail(p)}
                        className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-palier-50 hover:text-palier-700"
                      >
                        <Icon name="Eye" className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="divide-y divide-black/[0.04] lg:hidden">
              {rows.map((p) => (
                <div key={p.id} className="p-4">
                  <button onClick={() => openDetail(p)} className="block w-full text-left">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        p.type === "recommendation" ? "bg-pink-50 text-pink-700" : "bg-purple-50 text-purple-700"
                      }`}>
                        {p.type === "recommendation" ? T.tabs.recommendations : T.tabs.demandes}
                      </span>
                      {p.category && (
                        <span className="rounded-md bg-palier-50 px-2 py-0.5 text-[11px] font-semibold text-palier-700">
                          {p.category}
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] font-medium text-ink">
                      {p.provider_name || p.title || p.body.slice(0, 80)}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[12px] text-ink-soft">{p.body.slice(0, 120)}</p>
                    <div className="mt-2 flex items-center gap-3 text-[12px] text-ink-soft">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white" style={{ backgroundColor: p.avatar_color }}>
                          {p.author_name?.[0]?.toUpperCase()}
                        </span>
                        <span>{p.author_name}</span>
                      </div>
                      <span dir="ltr">{shortDate(p.created_at, lang)}</span>
                      <span className="flex items-center gap-1"><Icon name="MessageCircle" className="h-3 w-3" /><span dir="ltr">{p.comments_count ?? 0}</span></span>
                    </div>
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex flex-col items-center gap-2 border-t border-black/[0.06] px-4 py-2.5 text-[12px] text-ink-soft sm:flex-row sm:justify-between">
              <span className="shrink-0" dir="ltr">{safePage * PER_PAGE + 1}–{Math.min((safePage + 1) * PER_PAGE, filtered.length)} / {filtered.length}</span>
              {pages > 1 && (
                <div className="flex flex-wrap justify-center gap-1">
                  <button onClick={() => setPage(Math.max(0, safePage - 1))} disabled={safePage === 0} className="rounded-md px-2 py-1 hover:bg-palier-50 disabled:opacity-30">
                    <Icon name="ChevronLeft" className="h-3.5 w-3.5" />
                  </button>
                  {Array.from({ length: pages }, (_, pg) => (
                    <button key={pg} onClick={() => setPage(pg)} className={`rounded-md px-2 py-1 font-medium ${pg === safePage ? "bg-palier-50 text-palier-700" : "text-ink-soft hover:bg-palier-50"}`}>
                      <span dir="ltr">{pg + 1}</span>
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
                  <p className="text-[11px] text-ink-soft"><span dir="ltr">{shortDate(selected.created_at, lang)}</span> · <span dir="ltr">{timeAgo(selected.created_at, lang)}</span></p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink">
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 flex items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                selected.type === "recommendation" ? "bg-pink-50 text-pink-700" : "bg-purple-50 text-purple-700"
              }`}>
                {selected.type === "recommendation" ? T.tabs.recommendations : T.tabs.demandes}
              </span>
              {selected.category && (
                <span className="rounded-md bg-palier-50 px-2 py-0.5 text-[11px] font-semibold text-palier-700">
                  {selected.category}
                </span>
              )}
              {selected.role === "syndic" && (
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">{T.detail.syndic}</span>
              )}
            </div>

            {/* Provider info */}
            {selected.provider_name && (
              <div className="mb-2 flex items-center gap-2">
                <Icon name="Star" className="h-4 w-4 text-palier-600" />
                <p className="text-[15px] font-bold text-ink">{selected.provider_name}</p>
              </div>
            )}

            {selected.title && selected.title !== selected.provider_name && (
              <p className="mb-2 text-[15px] font-bold text-ink">{selected.emoji && <span className="mr-1">{selected.emoji}</span>}{selected.title}</p>
            )}
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{selected.body}</p>

            {selected.provider_phone && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-black/5 bg-sand p-3">
                <Icon name="Phone" className="h-4 w-4 text-palier-600" />
                <span className="text-[13px] font-medium text-ink" dir="ltr">{selected.provider_phone}</span>
              </div>
            )}

            {selected.image_url && (
              <img src={selected.image_url} alt="" className="mt-3 w-full rounded-xl object-cover" style={{ maxHeight: 300 }} />
            )}

            {selected.file_url && (
              <a href={selected.file_url} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-2.5 rounded-xl border border-black/5 bg-sand p-3">
                <Icon name="FileText" className="h-5 w-5 shrink-0 text-palier-600" />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{selected.file_name ?? T.detail.downloadFile}</span>
                <Icon name="Download" className="h-4 w-4 shrink-0 text-ink-faint" />
              </a>
            )}

            {/* Engagement stats */}
            <div className="mt-4 flex items-center gap-4 border-t border-black/[0.06] pt-3 text-[12px] text-ink-soft">
              <button
                onClick={() => loadComments(selected.id)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-palier-50 hover:text-palier-700"
              >
                <Icon name="MessageCircle" className="h-3.5 w-3.5" />
                <span dir="ltr">{selected.comments_count ?? 0}</span> {T.detail.comments}
              </button>
            </div>

            {/* Comments section */}
            {commentsPostId === selected.id && (
              <div className="mt-3 border-t border-black/[0.06] pt-3">
                <h4 className="mb-2 text-[13px] font-semibold text-ink">{T.detail.comments}</h4>
                {commentsLoading ? (
                  <p className="text-[12px] text-ink-soft">{C.loading}</p>
                ) : comments.length === 0 ? (
                  <p className="mb-3 text-[12px] text-ink-soft">{C.noResults}</p>
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
                            <span className="text-[10px] text-ink-faint" dir="ltr">{timeAgo(c.createdAt, lang)}</span>
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
                    placeholder={`${T.detail.reply}…`}
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
                onClick={() => setShowDeleteConfirm(selected.id)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2.5 text-[12px] font-semibold text-red-700 transition-colors hover:bg-red-100"
              >
                <Icon name="Trash2" className="h-3.5 w-3.5" />
                {T.detail.delete}
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
              <h2 className="text-[15px] font-semibold text-ink">{T.deleteConfirm.title}</h2>
            </div>
            <p className="mb-4 text-[13px] text-ink-soft">{T.deleteConfirm.msg}</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 rounded-lg border border-black/[0.08] py-2 text-[13px] font-medium text-ink hover:bg-sand/50">
                {C.cancel}
              </button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 rounded-lg bg-red-600 py-2 text-[13px] font-medium text-white hover:bg-red-700">
                {C.delete}
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
