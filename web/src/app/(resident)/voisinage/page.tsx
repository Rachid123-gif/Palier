"use client";
import { useState } from "react";
import Link from "next/link";
import { StatusBar } from "@/components/resident/StatusBar";
import { NotificationsBell } from "@/components/resident/NotificationsBell";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/primitives";
import { LetterAvatar } from "@/components/ui/Avatar";
import { Sheet, Toast } from "@/components/ui/Sheet";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/format";
import { useData } from "@/lib/DataProvider";
import { createPost } from "@/lib/actions";
import type { Post, PostType } from "@/lib/types";

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

export default function VoisinageScreen() {
  const { posts, currentUser, incidents } = useData();
  const router = useRouter();
  const [tab, setTab] = useState<PostType | "all">("all");
  const [composer, setComposer] = useState(false);
  const [text, setText] = useState("");
  const [toast, setToast] = useState(false);
  const openIncidents = incidents.filter((i) => i.status !== "resolved");

  const list = [...posts].sort((a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false));
  const filtered = tab === "all" ? list : list.filter((p) => p.type === tab);

  async function publish() {
    const body = text.trim();
    await createPost({ author: currentUser.name, avatarColor: currentUser.avatarColor, body, type: "general" });
    setComposer(false); setText(""); setToast(true);
    router.refresh();
  }

  return (
    <div className="animate-[fade_0.4s_ease]">
      <StatusBar />
      <header className="flex items-end justify-between px-5 pb-2 pt-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">Voisinage</p>
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">Vie de l'immeuble</h1>
        </div>
        <NotificationsBell />
      </header>

      <div className="space-y-4 px-4 pt-1">
        {/* Alerte incidents */}
        {openIncidents.length > 0 && (
          <Link href="/immeuble/signaler" className="tap flex items-center gap-3 rounded-2xl border border-danger/25 bg-danger-soft p-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-danger/15">
              <Icon name="TriangleAlert" className="h-5 w-5 text-danger" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wide text-danger">{openIncidents.length} incidents en cours</p>
              <p className="truncate text-[13px] font-semibold text-ink">{openIncidents[0].title}</p>
            </div>
            <Icon name="ChevronRight" className="h-4 w-4 text-danger" />
          </Link>
        )}

        {/* Composer */}
        <button onClick={() => setComposer(true)} className="tap flex w-full items-center gap-3 rounded-2xl bg-cream-card p-3 shadow-card">
          <LetterAvatar letter={currentUser.name[0]} color={currentUser.avatarColor} size={38} />
          <span className="flex-1 text-left text-[14px] text-ink-faint">Quoi de neuf dans l'immeuble ?</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-palier-600 text-white"><Icon name="Plus" className="h-5 w-5" /></span>
        </button>

        {/* Tabs */}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`tap flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold ${tab === t.key ? "bg-ink text-white" : "bg-cream-card text-ink-soft shadow-card"}`}
            >
              <Icon name={t.icon} className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* Fil */}
        <div className="space-y-3 pb-2">
          {filtered.map((p) => <PostCard key={p.id} p={p} />)}
        </div>
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
        <div className="mt-3 flex flex-wrap gap-2">
          {tabs.slice(1).map((t) => (
            <span key={t.key} className="inline-flex items-center gap-1 rounded-full bg-sand px-3 py-1.5 text-[12px] font-semibold text-ink-soft">
              <Icon name={t.icon} className="h-3.5 w-3.5" /> {t.label}
            </span>
          ))}
        </div>
        <button onClick={publish} disabled={!text.trim()} className={`tap mt-4 w-full rounded-full bg-palier-600 py-3 text-sm font-semibold text-white ${!text.trim() ? "opacity-50" : ""}`}>
          Publier
        </button>
      </Sheet>

      <Toast open={toast} onClose={() => setToast(false)} icon="Check" title="Publié !" body="Votre message est visible par vos voisins." />
    </div>
  );
}

function PostCard({ p }: { p: Post }) {
  const [reacted, setReacted] = useState(false);
  const tb = typeBadge[p.type];
  const total = p.reactions.like + p.reactions.love + p.reactions.haha + p.reactions.wow + (reacted ? 1 : 0);
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
            <Badge tone={tb.tone}>{tb.label}</Badge>
          </div>
          <p className="text-[11px] text-ink-faint">{timeAgo(p.createdAt)}</p>
        </div>
      </div>

      {p.title && (
        <p className="mt-3 flex items-center gap-2 text-[15px] font-bold text-ink">
          {p.emoji && <span>{p.emoji}</span>}{p.title}
        </p>
      )}
      <p className="mt-1 text-[13.5px] leading-snug text-ink-soft">{p.body}</p>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {["👍", "❤️", "😂", "😮"].map((e, i) => (
            <button
              key={e}
              onClick={() => i === 0 && setReacted((v) => !v)}
              className={`tap flex h-8 items-center gap-1 rounded-full px-2.5 text-[13px] ${i === 0 && reacted ? "bg-palier-100" : "bg-sand"}`}
            >
              {e}
            </button>
          ))}
          <span className="ml-1 text-[12px] font-semibold text-ink-faint">{total}</span>
        </div>
        <button className="tap flex items-center gap-1.5 rounded-full bg-palier-600 px-3.5 py-2 text-[12px] font-semibold text-white">
          <Icon name="MessageCircle" className="h-3.5 w-3.5" /> {p.comments}
        </button>
      </div>
    </div>
  );
}
