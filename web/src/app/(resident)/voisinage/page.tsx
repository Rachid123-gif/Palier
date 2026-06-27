"use client";
import { useState } from "react";
import { StatusBar } from "@/components/resident/StatusBar";
import { NotificationsBell } from "@/components/resident/NotificationsBell";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/primitives";
import { LetterAvatar } from "@/components/ui/Avatar";
import { Sheet, Toast } from "@/components/ui/Sheet";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/format";
import { useData } from "@/lib/DataProvider";
import { createPost, createComment, fetchComments, likeComment } from "@/lib/actions";
import type { Post, PostType, Comment } from "@/lib/types";

const POST_LIMIT = 6;
const BODY_LIMIT = 160; // caractères avant troncature

type TimePeriod = "tout" | "semaine" | "mois" | "3mois";
const timePeriods: { key: TimePeriod; label: string }[] = [
  { key: "tout", label: "Tout" },
  { key: "semaine", label: "Cette semaine" },
  { key: "mois", label: "Ce mois" },
  { key: "3mois", label: "3 mois" },
];

function filterByTime(posts: Post[], period: TimePeriod): Post[] {
  if (period === "tout") return posts;
  const now = new Date();
  const cutoff = new Date();
  if (period === "semaine") cutoff.setDate(now.getDate() - 7);
  else if (period === "mois") cutoff.setMonth(now.getMonth() - 1);
  else cutoff.setMonth(now.getMonth() - 3);
  return posts.filter((p) => new Date(p.createdAt) >= cutoff);
}

const tabs: { key: PostType | "all"; label: string; icon: string }[] = [
  { key: "all", label: "Tout", icon: "Sparkles" },
  { key: "announcement", label: "Annonces", icon: "Megaphone" },
  { key: "event", label: "Événements", icon: "PartyPopper" },
  { key: "help", label: "Entraide", icon: "HeartHandshake" },
  { key: "found", label: "Trouvé", icon: "KeyRound" },
];

const typeBadge: Record<PostType, { label: string; tone: "brand" | "info" | "warning" | "gold" | "success" }> = {
  announcement: { label: "Annonce", tone: "brand" },
  event: { label: "Événement", tone: "info" },
  help: { label: "Entraide", tone: "warning" },
  found: { label: "Trouvé", tone: "gold" },
  general: { label: "Général", tone: "success" },
};

const postTypes: { key: PostType; label: string; icon: string }[] = [
  { key: "help", label: "Entraide", icon: "HeartHandshake" },
  { key: "found", label: "Objet trouvé", icon: "KeyRound" },
  { key: "event", label: "Événement", icon: "PartyPopper" },
];

export default function VoisinageScreen() {
  const { posts, currentUser } = useData();
  const router = useRouter();
  const [tab, setTab] = useState<PostType | "all">("all");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("tout");
  const [composer, setComposer] = useState(false);
  const [text, setText] = useState("");
  const [postType, setPostType] = useState<PostType | null>(null);
  const [toast, setToast] = useState(false);
  const [visibleCount, setVisibleCount] = useState(POST_LIMIT);

  // Comments state
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const list = [...posts].sort((a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false));
  const byType = tab === "all" ? list : list.filter((p) => p.type === tab);
  const filtered = filterByTime(byType, timePeriod);

  async function publish() {
    const body = text.trim();
    if (!body) return;
    await createPost({ author: currentUser.name, avatarColor: currentUser.avatarColor, body, type: postType ?? "general" });
    setComposer(false); setText(""); setPostType(null); setToast(true);
    router.refresh();
  }

  async function openComments(post: Post) {
    setCommentPost(post);
    setCommentsLoading(true);
    let data = await fetchComments(post.id);
    // Fallback démo si pas de table encore
    if (data.length === 0 && post.comments > 0) {
      data = [
        { id: "demo-1", postId: post.id, author: "Fatima Z.", avatarColor: "#E8A87C", body: "Merci pour l'info, c'est noté !", likes: 2, createdAt: new Date(Date.now() - 3600_000).toISOString() },
        { id: "demo-2", postId: post.id, author: "Youssef B.", avatarColor: "#7EB5A6", body: "Bien reçu, merci 👍", likes: 1, createdAt: new Date(Date.now() - 1800_000).toISOString() },
      ];
    }
    setComments(data);
    setCommentsLoading(false);
  }

  async function submitComment() {
    if (!commentPost || !commentText.trim()) return;
    await createComment({
      postId: commentPost.id,
      author: currentUser.name,
      avatarColor: currentUser.avatarColor,
      body: commentText.trim(),
    });
    setCommentText("");
    // Refresh comments
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

  return (
    <div className="animate-[fade_0.4s_ease]">
      <StatusBar />
      <header className="flex items-end justify-between px-5 pb-2 pt-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">Voisinage</p>
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">Vie de l&apos;immeuble</h1>
        </div>
        <NotificationsBell />
      </header>

      <div className="space-y-4 px-4 pt-1">
        {/* Composer */}
        <button onClick={() => setComposer(true)} className="tap flex w-full items-center gap-3 rounded-2xl bg-cream-card p-3 shadow-card">
          <LetterAvatar letter={currentUser.name[0]} color={currentUser.avatarColor} size={38} />
          <span className="flex-1 text-left text-[14px] text-ink-faint">Quoi de neuf dans l&apos;immeuble ?</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-palier-600 text-white"><Icon name="Plus" className="h-5 w-5" /></span>
        </button>

        {/* Tabs catégorie */}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setVisibleCount(POST_LIMIT); }}
              className={`tap flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold ${tab === t.key ? "bg-ink text-white" : "bg-cream-card text-ink-soft shadow-card"}`}
            >
              <Icon name={t.icon} className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* Filtres de temps */}
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
          <Icon name="Calendar" className="mr-0.5 h-4 w-4 shrink-0 self-center text-ink-faint" />
          {timePeriods.map((tp) => (
            <button
              key={tp.key}
              onClick={() => { setTimePeriod(tp.key); setVisibleCount(POST_LIMIT); }}
              className={`tap shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold ${timePeriod === tp.key ? "bg-palier-600 text-white" : "border border-palier-100 bg-white text-ink-soft"}`}
            >
              {tp.label}
            </button>
          ))}
        </div>

        {/* Fil */}
        {filtered.length > 0 ? (
          <div className="space-y-3 pb-2">
            {filtered.slice(0, visibleCount).map((p) => (
              <PostCard key={p.id} p={p} onComment={() => openComments(p)} />
            ))}

            {filtered.length > visibleCount && (
              <button
                onClick={() => setVisibleCount((v) => v + POST_LIMIT)}
                className="tap flex w-full items-center justify-center gap-1.5 rounded-full border border-palier-100 bg-white py-2.5 text-[13px] font-semibold text-palier-700"
              >
                Voir plus ({filtered.length - visibleCount} restant{filtered.length - visibleCount > 1 ? "s" : ""})
                <Icon name="ChevronDown" className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="card flex items-center gap-3 p-4">
            <Icon name="MessageCircle" className="h-5 w-5 text-ink-faint" />
            <p className="text-[13px] text-ink-soft">Aucune publication dans cette catégorie</p>
          </div>
        )}
      </div>

      {/* Composer sheet */}
      <Sheet open={composer} onClose={() => setComposer(false)} title="Publier dans le voisinage">
        <div className="flex gap-3">
          <LetterAvatar letter={currentUser.name[0]} color={currentUser.avatarColor} size={40} />
          <div className="flex-1">
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 300))}
              rows={4}
              placeholder="Quoi de neuf dans l'immeuble ?"
              className="w-full resize-none rounded-2xl border border-black/5 bg-white px-4 py-3 text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-palier-300"
            />
            <div className="mt-1 flex items-center justify-between px-1">
              <span className="text-[12px] text-ink-faint">{text.length}/300</span>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <p className="mb-2 text-[12px] font-semibold text-ink-faint">Catégorie <span className="font-normal">(optionnel)</span></p>
          <div className="flex flex-wrap gap-2">
            {postTypes.map((t) => (
              <button
                key={t.key}
                onClick={() => setPostType(postType === t.key ? null : t.key)}
                className={`tap inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                  postType === t.key
                    ? "bg-palier-600 text-white"
                    : "border border-palier-100 bg-white text-ink-soft"
                }`}
              >
                <Icon name={t.icon} className="h-3.5 w-3.5" /> {t.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={publish} disabled={!text.trim()} className={`tap mt-4 w-full rounded-full bg-palier-600 py-3 text-sm font-semibold text-white ${!text.trim() ? "opacity-50" : ""}`}>
          Publier
        </button>
      </Sheet>

      {/* Comments sheet */}
      <Sheet open={!!commentPost} onClose={() => { setCommentPost(null); setComments([]); setCommentText(""); }} title="Commentaires">
        {commentPost && (
          <div className="space-y-4">
            {/* Post résumé + J'aime */}
            <div className="rounded-2xl bg-sand p-3">
              <div className="flex items-center gap-2">
                <LetterAvatar letter={commentPost.author[0]} color={commentPost.avatarColor} size={28} />
                <span className="text-[13px] font-bold text-ink">{commentPost.author}</span>
                <span className="text-[11px] text-ink-faint">{timeAgo(commentPost.createdAt)}</span>
              </div>
              <p className="mt-1.5 line-clamp-3 text-[13px] text-ink-soft">{commentPost.body}</p>
              <div className="mt-2 flex items-center gap-3 border-t border-black/5 pt-2">
                <button
                  onClick={() => setLikedPosts((prev) => {
                    const s = new Set(prev);
                    if (s.has(commentPost.id)) s.delete(commentPost.id); else s.add(commentPost.id);
                    return s;
                  })}
                  className={`tap flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ${likedPosts.has(commentPost.id) ? "bg-palier-100 text-palier-700" : "bg-white text-ink-soft"}`}
                >
                  <Icon name="ThumbsUp" className="h-3.5 w-3.5" />
                  {(() => {
                    const total = commentPost.reactions.like + commentPost.reactions.love + commentPost.reactions.haha + commentPost.reactions.wow + (likedPosts.has(commentPost.id) ? 1 : 0);
                    return total > 0 ? total : "J'aime";
                  })()}
                </button>
                <span className="flex items-center gap-1 text-[12px] text-ink-faint">
                  <Icon name="MessageCircle" className="h-3.5 w-3.5" />
                  {comments.length} commentaire{comments.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Liste des commentaires */}
            {commentsLoading ? (
              <p className="py-4 text-center text-[13px] text-ink-faint">Chargement...</p>
            ) : comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <LetterAvatar letter={c.author[0]} color={c.avatarColor} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="rounded-2xl bg-white border border-black/5 p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-ink">{c.author}</span>
                          <span className="text-[10px] text-ink-faint">{timeAgo(c.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-[13px] text-ink-soft">{c.body}</p>
                      </div>
                      <button
                        onClick={() => handleLikeComment(c.id)}
                        className={`tap mt-1 flex items-center gap-1 px-1 text-[11px] font-semibold ${likedComments.has(c.id) ? "text-palier-600" : "text-ink-faint"}`}
                      >
                        <Icon name="ThumbsUp" className="h-3 w-3" />
                        {c.likes + (likedComments.has(c.id) ? 1 : 0) > 0
                          ? c.likes + (likedComments.has(c.id) ? 1 : 0)
                          : "J'aime"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-[13px] text-ink-faint">Aucun commentaire pour le moment</p>
            )}

            {/* Composer commentaire */}
            <div className="flex items-end gap-2.5">
              <LetterAvatar letter={currentUser.name[0]} color={currentUser.avatarColor} size={32} />
              <div className="min-w-0 flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value.slice(0, 200))}
                  rows={2}
                  placeholder="Écrire un commentaire..."
                  className="w-full resize-none rounded-2xl border border-black/5 bg-white px-3 py-2.5 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-palier-300"
                />
              </div>
              <button
                onClick={submitComment}
                disabled={!commentText.trim()}
                className={`tap flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-palier-600 text-white ${!commentText.trim() ? "opacity-40" : ""}`}
              >
                <Icon name="Send" className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Sheet>

      <Toast open={toast} onClose={() => setToast(false)} icon="Check" title="Publié !" body="Votre message est visible par vos voisins." />
    </div>
  );
}

function PostCard({ p, onComment }: { p: Post; onComment: () => void }) {
  const [liked, setLiked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const tb = typeBadge[p.type];
  const totalReactions = p.reactions.like + p.reactions.love + p.reactions.haha + p.reactions.wow + (liked ? 1 : 0);
  const isLong = p.body.length > BODY_LIMIT;

  return (
    <div className={`card p-4 ${p.pinned ? "ring-1 ring-palier-200" : ""}`}>
      {p.pinned && (
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-palier-600">
          <Icon name="Pin" className="h-3.5 w-3.5" /> Épinglé par le syndic
        </p>
      )}
      <div className="flex items-center gap-3">
        <LetterAvatar letter={p.author[0]} color={p.avatarColor} size={40} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[14px] font-bold text-ink">{p.author}</span>
            {p.role === "syndic" && <Badge tone="success" icon="BadgeCheck">Syndic</Badge>}
            {p.type !== "general" && <Badge tone={tb.tone}>{tb.label}</Badge>}
          </div>
          <p className="text-[11px] text-ink-faint">{timeAgo(p.createdAt)}</p>
        </div>
      </div>

      {p.title && (
        <p className="mt-3 flex items-center gap-2 text-[15px] font-bold text-ink">
          {p.emoji && <span>{p.emoji}</span>}{p.title}
        </p>
      )}
      <p className="mt-1 text-[13.5px] leading-snug text-ink-soft">
        {isLong && !expanded ? p.body.slice(0, BODY_LIMIT) + "…" : p.body}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="tap mt-1 text-[12px] font-semibold text-palier-600"
        >
          {expanded ? "Voir moins" : "Lire la suite"}
        </button>
      )}

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => setLiked((v) => !v)}
          className={`tap flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold ${liked ? "bg-palier-100 text-palier-700" : "bg-sand text-ink-soft"}`}
        >
          <Icon name="ThumbsUp" className="h-4 w-4" /> {totalReactions > 0 ? totalReactions : "J'aime"}
        </button>
        <button
          onClick={onComment}
          className="tap flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5 text-[13px] font-semibold text-ink-soft"
        >
          <Icon name="MessageCircle" className="h-4 w-4" />
          {p.comments > 0 ? `${p.comments}` : "Commenter"}
        </button>
      </div>
    </div>
  );
}
