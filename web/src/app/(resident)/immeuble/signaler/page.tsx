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
import { useLang } from "@/lib/LangProvider";
import { createIncident } from "@/lib/actions";
import type { Urgency } from "@/lib/types";

const catIcons: Record<string, string> = {
  ascenseur: "ArrowUpDown", fuite: "Droplets", electricite: "Zap", securite: "ShieldAlert",
  proprete: "Trash2", nuisibles: "Bug", nuisance: "Volume2", parking: "Car",
  communes: "Building", jardinier: "Leaf", autre: "CircleEllipsis",
};

const urgencyIcons: Record<string, string> = { low: "Leaf", normal: "ThumbsUp", urgent: "Siren" };
const urgencyTones: Record<string, string> = { low: "neutral", normal: "brand", urgent: "danger" };

export default function SignalerScreen() {
  const { incidents, currentUser } = useData();
  const { lang, i, isAr } = useLang();
  const T = i.signaler;
  const router = useRouter();
  const [cat, setCat] = useState("");
  const [urg, setUrg] = useState("normal");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [toast, setToast] = useState(false);

  const catSlugs = Object.keys(T.cats) as (keyof typeof T.cats)[];
  const urgKeys = Object.keys(T.urgencies) as (keyof typeof T.urgencies)[];

  const statusMeta: Record<string, { label: string; tone: "warning" | "success" }> = {
    open: { label: T.statuses.open, tone: "warning" },
    resolved: { label: T.statuses.resolved, tone: "success" },
  };

  const grouped = (["open", "resolved"] as const).map((s) => ({
    status: s, items: incidents.filter((inc) => inc.status === s),
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
          <Icon name={isAr ? "ChevronRight" : "ChevronLeft"} className="h-5 w-5" />
        </Link>
        <h1 className="text-[22px] font-bold tracking-tight text-ink">{T.title}</h1>
      </header>

      <div className="space-y-5 px-4 pt-1">
        <div className="flex items-center gap-3 rounded-2xl bg-palier-50 p-4">
          <Icon name="Wrench" className="h-7 w-7 shrink-0 text-palier-600" />
          <p className="text-[13px] leading-snug text-palier-800">{T.info} <b>{T.infoSuite}</b> {T.infoFin}</p>
        </div>

        <div>
          <h3 className="mb-2.5 px-1 text-[15px] font-bold text-ink">{T.deQuoi}</h3>
          <div className="grid grid-cols-4 gap-2">
            {catSlugs.map((slug) => (
              <button key={slug} onClick={() => setCat(slug)}
                className={`tap flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 text-center ${cat === slug ? "border-palier-500 bg-palier-50" : "border-black/5 bg-cream-card"}`}>
                <Icon name={catIcons[slug] ?? "CircleEllipsis"} className={`h-5 w-5 ${cat === slug ? "text-palier-600" : "text-ink-soft"}`} strokeWidth={2.2} />
                <span className="text-[10px] font-semibold leading-tight text-ink">{T.cats[slug]}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2.5 px-1 text-[15px] font-bold text-ink">{T.niveauUrgence}</h3>
          <div className="grid grid-cols-2 gap-2">
            {urgKeys.map((key) => (
              <button key={key} onClick={() => setUrg(key)}
                className={`tap flex items-center gap-2 rounded-2xl border p-3 ${urg === key ? "border-palier-500 bg-palier-50" : "border-black/5 bg-cream-card"}`}>
                <Icon name={urgencyIcons[key]} className="h-4 w-4 text-ink-soft" />
                <span className="text-[13px] font-semibold text-ink">{T.urgencies[key]}</span>
              </button>
            ))}
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

        <Button full disabled={!cat || !title} onClick={submit} className={!cat || !title ? "opacity-50" : ""} icon="Send">
          {T.envoyerSignalement}
        </Button>

        <div className="pt-2">
          <h2 className="mb-3 px-1 text-[17px] font-bold tracking-tight text-ink">{T.signalementsEnCours}</h2>
          <div className="space-y-4">
            {grouped.filter((g) => g.items.length > 0).map((g) => (
              <div key={g.status}>
                <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-ink-faint">{statusMeta[g.status].label} · {g.items.length}</p>
                <div className="space-y-2.5">
                  {g.items.map((inc) => (
                    <div key={inc.id} className="card p-3.5">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sand">
                          <Icon name={catIcons[inc.category] ?? "Wrench"} className="h-4 w-4 text-ink-soft" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[14px] font-bold text-ink">{inc.title}</p>
                            <Badge tone={statusMeta[inc.status].tone}>{statusMeta[inc.status].label}</Badge>
                          </div>
                          <p className="line-clamp-1 text-[12px] text-ink-soft">{inc.details}</p>
                          <p className="mt-1 flex items-center gap-2 text-[11px] text-ink-faint">
                            <span>{timeAgo(inc.createdAt, lang)}</span>
                            <span className="inline-flex items-center gap-1"><Icon name="MessageCircle" className="h-3 w-3" /> {inc.messages}</span>
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

      <Toast open={toast} onClose={() => setToast(false)} title={T.signalementEnvoye} body={T.signalementBody} />
    </div>
  );
}
