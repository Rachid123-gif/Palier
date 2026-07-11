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
import { useLang } from "@/lib/LangProvider";
import { createPost, createComment, fetchComments, likeComment, likePost } from "@/lib/actions";
import type { Post, PostType, Comment } from "@/lib/types";

const POST_LIMIT = 6;
const BODY_LIMIT = 160;

type TimePeriod = "tout" | "semaine" | "mois" | "3mois";

function filterByTime(posts: Post[], period: TimePeriod): Post[] {
  if (period === "tout") return posts;
  const now = new Date();
  const cutoff = new Date();
  if (period === "semaine") cutoff.setDate(now.getDate() - 7);
  else if (period === "mois") cutoff.setMonth(now.getMonth() - 1);
  else cutoff.setMonth(now.getMonth() - 3);
  return posts.filter((p) => new Date(p.createdAt) >= cutoff);
}

export default function VoisinageScreen() {
  const { posts, currentUser, buildingId } = useData();
  const { lang, i } = useLang();
  const T = i.voisinage;
  const router = useRouter();
  const isInactive = currentUser.membershipStatus === "inactive";
  const [tab, setTab] = useState<PostType | "all">("all");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("tout");
  const [composer, setComposer] = useState(false);
  const [text, setText] = useState("");
  const [postType, setPostType] = useState<PostType | null>(null);
  const [toast, setToast] = useState(false);
  const [visibleCount, setVisibleCount] = useState(POST_LIMIT);

  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const tabs: { key: PostType | "all"; label: string; icon: string }[] = [
    { key: "all", label: T.tabs.all, icon: "Sparkles" },
    { key: "announcement", label: T.tabs.announcement, icon: "Megaphone" },
    { key: "event", label: T.tabs.event, icon: "PartyPopper" },
    { key: "help", label: T.tabs.help, icon: "HeartHandshake" },
    { key: "found", label: T.tabs.found, icon: "KeyRound" },
  ];

  const timePeriods: { key: TimePeriod; label: string }[] = [
    { key: "tout", label: T.tout },
    { key: "semaine", label: T.cetteSemaine },
    { key: "mois", label: T.ceMois },
    { key: "3mois", label: T.troisMois },
  ];

  const postTypes: { key: PostType; label: string; icon: string }[] = [
    { key: "help", label: T.postTypes.help, icon: "HeartHandshake" },
    { key: "found", label: T.postTypes.found, icon: "KeyRound" },
    { key: "event", label: T.postTypes.event, icon: "PartyPopper" },
  ];

  const typeBadge: Record<PostType, { label: string; tone: "brand" | "info" | "warning" | "gold" | "success" }> = {
    announcement: { label: T.badges.announcement, tone: "brand" },
    event: { label: T.badges.event, tone: "info" },
    help: { label: T.badges.help, tone: "warning" },
    found: { label: T.badges.found, tone: "gold" },
    general: { label: T.badges.general, tone: "success" },
    service: { label: i.services.badge, tone: "brand" },
    recommendation: { label: i.services.badge, tone: "brand" },
  };

  const list = [...posts].sort((a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false));
  const byType = tab === "all" ? list : list.filter((p) => p.type === tab);
  const filtered = filterByTime(byType, timePeriod);

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

  async function publish() {
    const body = text.trim();
    if (!body) return;
    let imageUrl: string | undefined;
    if (mediaFile && mediaFile.type.startsWith("image/")) {
      const { uploadPostImage } = await import("@/lib/storage");
      imageUrl = await uploadPostImage(mediaFile);
    }
    await createPost({ buildingId: buildingId!, author: currentUser.name, avatarColor: currentUser.avatarColor, body, type: postType ?? "general", imageUrl });
    setComposer(false); setText(""); setPostType(null); setToast(true);
    clearMedia();
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
        <button onClick={() => setComposer(true)} className="tap flex w-full items-center gap-3 rounded-2xl bg-cream-card p-3 shadow-card">
          <LetterAvatar letter={currentUser.name[0]} color={currentUser.avatarColor} size={38} />
          <span className="flex-1 text-start text-[14px] text-ink-faint">{T.placeholder}</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-palier-600 text-white"><Icon name="Plus" className="h-5 w-5" /></span>
        </button>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setVisibleCount(POST_LIMIT); }}
              className={`tap flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold ${tab === t.key ? "bg-palier-600 text-white" : "border border-palier-100 bg-white text-ink-soft"}`}
            >
              <Icon name={t.icon} className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

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

        {filtered.length > 0 ? (
          <div className="space-y-3 pb-2">
            {filtered.slice(0, visibleCount).map((p) => (
              <PostCard key={p.id} p={p} onComment={() => openComments(p)} onLike={(id) => { if (!likedPosts.has(id)) { setLikedPosts((s) => new Set(s).add(id)); likePost(id); } }} typeBadge={typeBadge} lang={lang} T={T} syndicBadge={i.syndicBadge} />
            ))}
            {filtered.length > visibleCount && (
              <button
                onClick={() => setVisibleCount((v) => v + POST_LIMIT)}
                className="tap flex w-full items-center justify-center gap-1.5 rounded-full border border-palier-100 bg-white py-2.5 text-[13px] font-semibold text-palier-700"
              >
                {T.voirPlus(filtered.length - visibleCount)}
                <Icon name="ChevronDown" className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="card flex items-center gap-3 p-4">
            <Icon name="MessageCircle" className="h-5 w-5 text-ink-faint" />
            <p className="text-[13px] text-ink-soft">{T.aucunePublication}</p>
          </div>
        )}
      </div>

      <Sheet open={composer} onClose={() => { setComposer(false); clearMedia(); }} title={T.publierDans}>
        <div className="flex gap-3">
          <LetterAvatar letter={currentUser.name[0]} color={currentUser.avatarColor} size={40} />
          <div className="flex-1">
            <textarea autoFocus value={text} onChange={(e) => setText(e.target.value.slice(0, 300))} rows={4} placeholder={T.placeholder}
              className="w-full resize-none rounded-2xl border border-black/5 bg-white px-4 py-3 text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-palier-300" />
            <div className="mt-1 flex items-center justify-between px-1">
              <span className="text-[12px] text-ink-faint">{text.length}/300</span>
              <div className="flex gap-1.5">
                <label className="tap flex cursor-pointer items-center gap-1 rounded-full bg-palier-50 px-2.5 py-1 text-[11px] font-semibold text-palier-700">
                  <Icon name="Image" className="h-3.5 w-3.5" /> {T.ajouterPhoto}
                  <input type="file" accept="image/*" className="hidden" onChange={handleMediaSelect} />
                </label>
                <label className="tap flex cursor-pointer items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-[11px] font-semibold text-ink-soft">
                  <Icon name="Paperclip" className="h-3.5 w-3.5" /> {T.ajouterFichier}
                  <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleMediaSelect} />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Media preview */}
        {mediaFile && (
          <div className="mt-3 flex items-start gap-2">
            {mediaPreview ? (
              <img src={mediaPreview} alt="" className="h-20 w-20 rounded-xl object-cover" />
            ) : (
              <div className="flex h-14 items-center gap-2 rounded-xl bg-sand px-3">
                <Icon name="FileText" className="h-5 w-5 text-ink-soft" />
                <span className="max-w-[10rem] truncate text-[12px] font-medium text-ink">{mediaFile.name}</span>
              </div>
            )}
            <button onClick={clearMedia} className="tap flex h-7 w-7 items-center justify-center rounded-full bg-danger-soft text-danger">
              <Icon name="X" className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="mt-3">
          <p className="mb-2 text-[12px] font-semibold text-ink-faint">{T.categorieOptionnelle} <span className="font-normal">({T.optionnel})</span></p>
          <div className="flex flex-wrap gap-2">
            {postTypes.map((t) => (
              <button key={t.key} onClick={() => setPostType(postType === t.key ? null : t.key)}
                className={`tap inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ${postType === t.key ? "bg-palier-600 text-white" : "border border-palier-100 bg-white text-ink-soft"}`}>
                <Icon name={t.icon} className="h-3.5 w-3.5" /> {t.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={publish} disabled={!text.trim() || isInactive} className={`tap mt-4 w-full rounded-full bg-palier-600 py-3 text-sm font-semibold text-white ${!text.trim() || isInactive ? "opacity-50" : ""}`}>
          {T.publier}
        </button>
      </Sheet>

      <Sheet open={!!commentPost} onClose={() => { setCommentPost(null); setComments([]); setCommentText(""); }} title={T.commentaires}>
        {commentPost && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-sand p-3">
              <div className="flex items-center gap-2">
                <LetterAvatar letter={commentPost.author[0]} color={commentPost.avatarColor} size={28} />
                <span className="text-[13px] font-bold text-ink">{commentPost.author}</span>
                <span className="text-[11px] text-ink-faint">{timeAgo(commentPost.createdAt, lang)}</span>
              </div>
              <p className="mt-1.5 line-clamp-3 text-[13px] text-ink-soft">{commentPost.body}</p>
              <div className="mt-2 flex items-center gap-3 border-t border-black/5 pt-2">
                <button
                  onClick={() => { if (!likedPosts.has(commentPost.id)) { setLikedPosts((s) => new Set(s).add(commentPost.id)); likePost(commentPost.id); } }}
                  className={`tap flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ${likedPosts.has(commentPost.id) ? "bg-palier-100 text-palier-700" : "bg-white text-ink-soft"}`}
                >
                  <Icon name="ThumbsUp" className="h-3.5 w-3.5" />
                  {(() => {
                    const total = commentPost.reactions.like + commentPost.reactions.love + commentPost.reactions.haha + commentPost.reactions.wow + (likedPosts.has(commentPost.id) ? 1 : 0);
                    return total > 0 ? total : T.jaime;
                  })()}
                </button>
                <span className="flex items-center gap-1 text-[12px] text-ink-faint">
                  <Icon name="MessageCircle" className="h-3.5 w-3.5" />
                  {T.commentaire(comments.length)}
                </span>
              </div>
            </div>

            {commentsLoading ? (
              <p className="py-4 text-center text-[13px] text-ink-faint">{T.chargement}</p>
            ) : comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <LetterAvatar letter={c.author[0]} color={c.avatarColor} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="rounded-2xl bg-white border border-black/5 p-3">
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
              <p className="py-4 text-center text-[13px] text-ink-faint">{T.aucunCommentaire}</p>
            )}

            <div className="flex items-end gap-2.5">
              <LetterAvatar letter={currentUser.name[0]} color={currentUser.avatarColor} size={32} />
              <div className="min-w-0 flex-1">
                <textarea value={commentText} onChange={(e) => setCommentText(e.target.value.slice(0, 200))} rows={2} placeholder={T.ecrireCommentaire}
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

      <Toast open={toast} onClose={() => setToast(false)} icon="Check" title={T.publie} body={T.publieBody} />
    </div>
  );
}

function PostCard({ p, onComment, onLike, typeBadge, lang, T, syndicBadge }: {
  p: Post; onComment: () => void; onLike: (postId: string) => void;
  typeBadge: Record<PostType, { label: string; tone: "brand" | "info" | "warning" | "gold" | "success" }>;
  lang: "fr" | "ar";
  T: typeof import("@/lib/i18n").t.fr.voisinage;
  syndicBadge: string;
}) {
  const [liked, setLiked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const tb = typeBadge[p.type];
  const totalReactions = p.reactions.like + p.reactions.love + p.reactions.haha + p.reactions.wow + (liked ? 1 : 0);
  const isLong = p.body.length > BODY_LIMIT;

  return (
    <div className={`card p-4 ${p.pinned ? "ring-1 ring-palier-200" : ""}`}>
      {p.pinned && (
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-palier-600">
          <Icon name="Pin" className="h-3.5 w-3.5" /> {T.epingle}
        </p>
      )}
      <div className="flex items-center gap-3">
        <LetterAvatar letter={p.author[0]} color={p.avatarColor} size={40} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[14px] font-bold text-ink">{p.author}</span>
            {p.role === "syndic" && <Badge tone="success" icon="BadgeCheck">{syndicBadge}</Badge>}
            {p.type !== "general" && <Badge tone={tb.tone}>{tb.label}</Badge>}
          </div>
          <p className="text-[11px] text-ink-faint">{timeAgo(p.createdAt, lang)}</p>
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
        <button onClick={() => setExpanded((v) => !v)} className="tap mt-1 text-[12px] font-semibold text-palier-600">
          {expanded ? T.voirMoins : T.lireSuite}
        </button>
      )}

      {p.imageUrl && (
        <img src={p.imageUrl} alt="" className="mt-3 w-full rounded-2xl object-cover" style={{ maxHeight: 240 }} />
      )}

      <div className="mt-3 flex items-center gap-3">
        <button onClick={() => { if (!liked) { onLike(p.id); setLiked(true); } }}
          className={`tap flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold ${liked ? "bg-palier-100 text-palier-700" : "bg-sand text-ink-soft"}`}>
          <Icon name="ThumbsUp" className="h-4 w-4" /> {totalReactions > 0 ? totalReactions : T.jaime}
        </button>
        <button onClick={onComment}
          className="tap flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5 text-[13px] font-semibold text-ink-soft">
          <Icon name="MessageCircle" className="h-4 w-4" />
          {p.comments > 0 ? `${p.comments}` : T.commenter}
        </button>
      </div>
    </div>
  );
}
