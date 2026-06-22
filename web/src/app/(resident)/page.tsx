"use client";
import Link from "next/link";
import { StatusBar } from "@/components/resident/StatusBar";
import { NotificationsBell } from "@/components/resident/NotificationsBell";
import { Icon } from "@/components/ui/Icon";
import { Rating } from "@/components/ui/primitives";
import { LogoMark } from "@/components/brand/Logo";
import { mad, num, greeting } from "@/lib/format";
import { popular, categoryBySlug } from "@/lib/data";
import { useData } from "@/lib/DataProvider";

const quickActions = [
  { href: "/charges", label: "Payer", sub: "Charges", icon: "Wallet", tint: "bg-info-soft", color: "text-info" },
  { href: "/services", label: "Services", sub: "Ménage, plomberie…", icon: "Sparkles", tint: "bg-coral-400/20", color: "text-coral-600" },
  { href: "/immeuble/signaler", label: "Signaler", sub: "Incident", icon: "TriangleAlert", tint: "bg-warning-soft", color: "text-warning" },
];

export default function HomeScreen() {
  const { currentUser, totalDue, charges, incidents } = useData();
  const openIncidents = incidents.filter((i) => i.status !== "resolved").length;
  return (
    <div className="animate-[fade_0.4s_ease]">
      <StatusBar />

      {/* Header */}
      <header className="flex items-center justify-between px-5 pb-3 pt-2">
        <div className="flex items-center gap-3">
          <LogoMark size={42} />
          <div>
            <p className="text-[13px] text-ink-soft">{greeting()},</p>
            <p className="text-[17px] font-bold leading-tight text-ink">{currentUser.name.split(" ")[0]}</p>
          </div>
        </div>
        <NotificationsBell />
      </header>

      <div className="space-y-5 px-4">
        {/* Carte à payer */}
        <Link href="/charges" className="tap block">
          <div className="bg-paywall relative overflow-hidden rounded-3xl p-5 text-white shadow-hero">
            <div className="absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-10 right-10 h-24 w-24 rounded-full bg-white/5" />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
                <Icon name="House" className="h-3.5 w-3.5" /> À payer maintenant
              </span>
              <div className="mt-3 flex items-end gap-1.5">
                <span className="text-[44px] font-bold leading-none tracking-tight">{num(totalDue)}</span>
                <span className="mb-1.5 text-sm font-semibold opacity-80">MAD</span>
              </div>
              <p className="mt-1 text-[13px] opacity-80">{charges.length} charges de copropriété</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-palier-700">
                Payer maintenant <Icon name="ArrowRight" className="h-4 w-4" />
              </div>
            </div>
          </div>
        </Link>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href} className="tap card flex flex-col items-start gap-2 p-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-full ${a.tint}`}>
                <Icon name={a.icon} className={`h-5 w-5 ${a.color}`} strokeWidth={2.3} />
              </span>
              <div>
                <p className="text-[13px] font-bold text-ink">{a.label}</p>
                <p className="truncate text-[10.5px] text-ink-faint">{a.sub}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Vie de l'immeuble */}
        <div>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-[17px] font-bold tracking-tight text-ink">Vie de l'immeuble</h2>
            <Link href="/immeuble" className="text-sm font-semibold text-palier-600">Voir détails</Link>
          </div>
          <div className="card divide-y divide-black/5 p-0">
            <Link href="/immeuble/signaler" className="tap flex items-center gap-3 p-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-danger-soft">
                <Icon name="TriangleAlert" className="h-[18px] w-[18px] text-danger" strokeWidth={2.3} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{openIncidents} incidents en cours</p>
                <p className="truncate text-[12px] text-ink-soft">Ascenseur bloqué · Fuite parking</p>
              </div>
              <Icon name="ChevronRight" className="h-4 w-4 text-ink-faint" />
            </Link>
            <Link href="/voisinage" className="tap flex items-center gap-3 p-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-palier-100">
                <Icon name="Megaphone" className="h-[18px] w-[18px] text-palier-600" strokeWidth={2.3} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">1 annonce du syndic</p>
                <p className="truncate text-[12px] text-ink-soft">AG ordinaire prévue le 12 mai</p>
              </div>
              <Icon name="ChevronRight" className="h-4 w-4 text-ink-faint" />
            </Link>
            <Link href="/immeuble" className="tap flex items-center gap-3 p-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-info-soft">
                <Icon name="CalendarDays" className="h-[18px] w-[18px] text-info" strokeWidth={2.3} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">AG dans 13 jours</p>
                <p className="truncate text-[12px] text-ink-soft">Approbation des comptes 2025</p>
              </div>
              <Icon name="ChevronRight" className="h-4 w-4 text-ink-faint" />
            </Link>
          </div>
        </div>

        {/* Services recommandés */}
        <div>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-[17px] font-bold tracking-tight text-ink">Services recommandés</h2>
            <Link href="/services" className="text-sm font-semibold text-palier-600">Tout voir</Link>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {popular.map((p) => {
              const cat = categoryBySlug(p.categorySlug);
              return (
                <Link
                  key={p.id}
                  href={`/services/${p.categorySlug}`}
                  className={`tap w-44 shrink-0 rounded-3xl border border-black/5 p-4 ${p.tint}`}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70">
                    <Icon name={cat?.icon ?? "Sparkles"} className={`h-6 w-6 ${p.accent}`} strokeWidth={2.2} />
                  </span>
                  <div className="mt-3"><Rating value={p.rating} reviews={p.reviews} /></div>
                  <p className="mt-1 text-[15px] font-bold text-ink">{p.title}</p>
                  <p className="mt-0.5 text-[12px] text-ink-soft">dès {mad(p.price, { decimals: false })}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bandeau transparence */}
        <Link href="/immeuble" className="tap block">
          <div className="flex items-center gap-3 rounded-2xl border border-palier-100 bg-palier-50 p-3.5">
            <Icon name="ShieldCheck" className="h-6 w-6 shrink-0 text-palier-600" />
            <p className="flex-1 text-[13px] font-medium text-palier-800">
              Transparence financière : suivez où va l'argent de l'immeuble.
            </p>
            <Icon name="ChevronRight" className="h-4 w-4 text-palier-600" />
          </div>
        </Link>
      </div>
    </div>
  );
}
