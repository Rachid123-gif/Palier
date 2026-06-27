"use client";
import { useState } from "react";
import Link from "next/link";
import { StatusBar } from "@/components/resident/StatusBar";
import { Icon } from "@/components/ui/Icon";
import { Badge, Button } from "@/components/ui/primitives";
import { Toast } from "@/components/ui/Sheet";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/format";
import { useData } from "@/lib/DataProvider";
import { createIncident } from "@/lib/actions";
import type { Urgency } from "@/lib/types";

const cats = [
  { slug: "ascenseur", label: "Ascenseur", icon: "ArrowUpDown" },
  { slug: "fuite", label: "Fuite d'eau", icon: "Droplets" },
  { slug: "electricite", label: "Électricité", icon: "Zap" },
  { slug: "securite", label: "Sécurité", icon: "ShieldAlert" },
  { slug: "proprete", label: "Propreté", icon: "Trash2" },
  { slug: "nuisibles", label: "Nuisibles", icon: "Bug" },
  { slug: "nuisance", label: "Nuisance sonore", icon: "Volume2" },
  { slug: "parking", label: "Parking", icon: "Car" },
  { slug: "communes", label: "Parties communes", icon: "Building" },
  { slug: "jardinier", label: "Jardinage", icon: "Leaf" },
  { slug: "autre", label: "Autre", icon: "CircleEllipsis" },
];

const urgencies = [
  { key: "low", label: "Pas urgent", icon: "Leaf", tone: "neutral" },
  { key: "normal", label: "Normal", icon: "ThumbsUp", tone: "brand" },
  { key: "high", label: "Important", icon: "TriangleAlert", tone: "warning" },
  { key: "urgent", label: "Urgent", icon: "Siren", tone: "danger" },
] as const;

const statusMeta = {
  open: { label: "Ouvert", tone: "warning" as const },
  in_progress: { label: "En cours", tone: "info" as const },
  resolved: { label: "Résolu", tone: "success" as const },
};

export default function SignalerScreen() {
  const { incidents, currentUser } = useData();
  const router = useRouter();
  const [cat, setCat] = useState("");
  const [urg, setUrg] = useState("normal");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [toast, setToast] = useState(false);

  const grouped = (["open", "in_progress", "resolved"] as const).map((s) => ({
    status: s, items: incidents.filter((i) => i.status === s),
  }));

  async function submit() {
    const reporter = currentUser.name.split(" ")[0] + " " + (currentUser.name.split(" ")[1]?.[0] ?? "") + ".";
    await createIncident({ category: cat, title, details, urgency: urg as Urgency, reporter });
    setToast(true);
    setCat(""); setTitle(""); setDetails(""); setUrg("normal");
    router.refresh();
  }

  return (
    <div className="animate-[fade_0.4s_ease] pb-4">
      <StatusBar />
      <header className="flex items-center gap-3 px-5 pb-2 pt-3">
        <Link href="/immeuble" className="tap flex h-9 w-9 items-center justify-center rounded-full bg-cream-card text-ink shadow-card">
          <Icon name="ChevronLeft" className="h-5 w-5" />
        </Link>
        <h1 className="text-[22px] font-bold tracking-tight text-ink">Signaler</h1>
      </header>

      <div className="space-y-5 px-4 pt-1">
        {/* Bandeau */}
        <div className="flex items-center gap-3 rounded-2xl bg-palier-50 p-4">
          <Icon name="Wrench" className="h-7 w-7 shrink-0 text-palier-600" />
          <p className="text-[13px] leading-snug text-palier-800">Ascenseur, fuite, panne… <b>le syndic est notifié immédiatement</b> et vous suivez la résolution en temps réel.</p>
        </div>

        {/* Catégorie */}
        <div>
          <h3 className="mb-2.5 px-1 text-[15px] font-bold text-ink">De quoi s'agit-il ?</h3>
          <div className="grid grid-cols-4 gap-2">
            {cats.map((c) => (
              <button
                key={c.slug}
                onClick={() => setCat(c.slug)}
                className={`tap flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 text-center ${cat === c.slug ? "border-palier-500 bg-palier-50" : "border-black/5 bg-cream-card"}`}
              >
                <Icon name={c.icon} className={`h-5 w-5 ${cat === c.slug ? "text-palier-600" : "text-ink-soft"}`} strokeWidth={2.2} />
                <span className="text-[10px] font-semibold leading-tight text-ink">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Urgence */}
        <div>
          <h3 className="mb-2.5 px-1 text-[15px] font-bold text-ink">Niveau d'urgence</h3>
          <div className="grid grid-cols-2 gap-2">
            {urgencies.map((u) => (
              <button
                key={u.key}
                onClick={() => setUrg(u.key)}
                className={`tap flex items-center gap-2 rounded-2xl border p-3 ${urg === u.key ? "border-palier-500 bg-palier-50" : "border-black/5 bg-cream-card"}`}
              >
                <Icon name={u.icon} className="h-4 w-4 text-ink-soft" />
                <span className="text-[13px] font-semibold text-ink">{u.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Titre */}
        <div>
          <h3 className="mb-2 px-1 text-[15px] font-bold text-ink">Titre court</h3>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Ascenseur bloqué au 3e"
            className="w-full rounded-2xl border border-black/5 bg-cream-card px-4 py-3 text-[14px] text-ink shadow-card outline-none placeholder:text-ink-faint focus:border-palier-300"
          />
        </div>

        {/* Détails */}
        <div>
          <h3 className="mb-2 px-1 text-[15px] font-bold text-ink">Détails <span className="font-normal text-ink-faint">(optionnel)</span></h3>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            placeholder="Décrivez ce qui se passe en quelques lignes…"
            className="w-full resize-none rounded-2xl border border-black/5 bg-cream-card px-4 py-3 text-[14px] text-ink shadow-card outline-none placeholder:text-ink-faint focus:border-palier-300"
          />
          {/* Photo upload — v2 */}
        </div>

        <Button full disabled={!cat || !title} onClick={submit} className={!cat || !title ? "opacity-50" : ""} icon="Send">
          Envoyer le signalement
        </Button>

        {/* Incidents existants */}
        <div className="pt-2">
          <h2 className="mb-3 px-1 text-[17px] font-bold tracking-tight text-ink">Signalements en cours</h2>
          <div className="space-y-4">
            {grouped.filter((g) => g.items.length > 0).map((g) => (
              <div key={g.status}>
                <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-ink-faint">{statusMeta[g.status].label} · {g.items.length}</p>
                <div className="space-y-2.5">
                  {g.items.map((i) => (
                    <div key={i.id} className="card p-3.5">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sand">
                          <Icon name={cats.find((c) => c.slug === i.category)?.icon ?? "Wrench"} className="h-4 w-4 text-ink-soft" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[14px] font-bold text-ink">{i.title}</p>
                            <Badge tone={statusMeta[i.status].tone}>{statusMeta[i.status].label}</Badge>
                          </div>
                          <p className="line-clamp-1 text-[12px] text-ink-soft">{i.details}</p>
                          <p className="mt-1 flex items-center gap-2 text-[11px] text-ink-faint">
                            <span>{timeAgo(i.createdAt)}</span>
                            <span className="inline-flex items-center gap-1"><Icon name="MessageCircle" className="h-3 w-3" /> {i.messages}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Toast open={toast} onClose={() => setToast(false)} title="Signalement envoyé" body="Le syndic et les voisins concernés sont notifiés. Vous suivez la résolution en temps réel." />
    </div>
  );
}
