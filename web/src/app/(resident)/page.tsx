"use client";
import Link from "next/link";
import { StatusBar } from "@/components/resident/StatusBar";
import { NotificationsBell } from "@/components/resident/NotificationsBell";
import { Icon } from "@/components/ui/Icon";
import { Rating } from "@/components/ui/primitives";
import { LogoMark } from "@/components/brand/Logo";
import { mad, num, greeting } from "@/lib/format";
import { categories } from "@/lib/data";
import { useData } from "@/lib/DataProvider";
import { useLang } from "@/lib/LangProvider";
import { LangToggle } from "@/components/resident/LangToggle";

/* ───────── Helper: catégorie icon lookup ───────── */
function catIcon(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export default function HomeScreen() {
  const {
    currentUser, building, totalDue, charges,
    incidents, posts, providers,
  } = useData();
  const { lang, i, isAr } = useLang();

  const quickActions = [
    { href: "/voisinage", label: i.home.voisinage, sub: i.home.voisinageSub, icon: "MessageCircle", tint: "bg-palier-100", color: "text-palier-600" },
    { href: "/services", label: i.home.services, sub: i.home.servicesSub, icon: "Sparkles", tint: "bg-coral-400/20", color: "text-coral-600" },
    { href: "/immeuble/signaler", label: i.home.signaler, sub: i.home.signalerSub, icon: "TriangleAlert", tint: "bg-warning-soft", color: "text-warning" },
  ];

  /* ── Données dynamiques ── */
  const openIncidents = incidents.filter((inc) => inc.status !== "resolved");
  const syndicAnnouncements = posts.filter((p) => p.role === "syndic" && p.type === "announcement");
  const latestAnnouncement = syndicAnnouncements[0];
  const nextEvent = posts.find((p) => p.type === "event");

  const cityProviders = providers
    .filter((p) => p.city === currentUser.city)
    .sort((a, b) => Number(b.topNeighbor ?? false) - Number(a.topNeighbor ?? false) || b.rating - a.rating)
    .slice(0, 6);

  return (
    <div className="animate-[fade_0.4s_ease]">
      <StatusBar />

      {/* Header */}
      <header className="flex items-center justify-between px-5 pb-2 pt-3">
        <Link href="/profil" className="tap flex items-center gap-3">
          <LogoMark size={42} />
          <div>
            <p className="text-[13px] text-ink-soft">{greeting(lang)},</p>
            <p className="text-[17px] font-bold leading-tight text-ink">{currentUser.name.split(" ")[0]}</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <LangToggle />
          <NotificationsBell />
        </div>
      </header>

      <div className="space-y-5 px-4">

        {/* ═══════ Carte à payer / à jour ═══════ */}
        {totalDue > 0 ? (
          <Link href="/charges" className="tap block">
            <div className="bg-paywall relative overflow-hidden rounded-3xl p-5 text-white shadow-hero">
              <div className="absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-10 right-10 h-24 w-24 rounded-full bg-white/5" />
              <div className="relative">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
                  <Icon name="House" className="h-3.5 w-3.5" /> {i.home.aPayerMaintenant}
                </span>
                <div className="mt-3">
                  <span className="inline-flex items-end gap-1.5" dir="ltr">
                    <span className="text-[44px] font-bold leading-none tracking-tight">{num(totalDue)}</span>
                    <span className="mb-1.5 text-sm font-semibold opacity-80">MAD</span>
                  </span>
                </div>
                <p className="mt-1 text-[13px] opacity-80">
                  {i.home.chargeNonPayee(charges.length)}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-palier-700">
                  {i.home.payerMaintenant} <Icon name={isAr ? "ArrowLeft" : "ArrowRight"} className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3 rounded-3xl border border-success/20 bg-success-soft p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
              <Icon name="CircleCheck" className="h-6 w-6 text-success" strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-[17px] font-bold text-ink">{i.home.vousEtesAJour}</p>
              <p className="text-[13px] text-ink-soft">{i.home.aucuneCharge}</p>
            </div>
          </div>
        )}

        {/* ═══════ Transparence financière ═══════ */}
        <Link href="/immeuble" className="tap block">
          <div className="flex items-center gap-3 rounded-2xl border border-palier-100 bg-palier-50 p-3.5">
            <Icon name="ShieldCheck" className="h-6 w-6 shrink-0 text-palier-600" />
            <p className="flex-1 text-[13px] font-medium text-palier-800">
              {i.home.suivezArgent}
            </p>
            <Icon name={isAr ? "ChevronLeft" : "ChevronRight"} className="h-4 w-4 text-palier-600" />
          </div>
        </Link>

        {/* ═══════ Quick actions ═══════ */}
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

        {/* ═══════ Vie de l'immeuble ═══════ */}
        <div>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-[17px] font-bold tracking-tight text-ink">{i.home.vieImmeuble}</h2>
            <Link href="/immeuble" className="text-sm font-semibold text-palier-600">{i.home.voirDetails}</Link>
          </div>
          <div className="card divide-y divide-black/5 p-0">

            {openIncidents.length > 0 && (
              <Link href="/immeuble/signaler" className="tap flex items-center gap-3 p-3.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-danger-soft">
                  <Icon name="TriangleAlert" className="h-[18px] w-[18px] text-danger" strokeWidth={2.3} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{i.home.incidentsEnCours(openIncidents.length)}</p>
                  <p className="truncate text-[12px] text-ink-soft">
                    {openIncidents.slice(0, 2).map((inc) => inc.title.split(" ").slice(0, 3).join(" ")).join(" · ")}
                  </p>
                </div>
                <Icon name={isAr ? "ChevronLeft" : "ChevronRight"} className="h-4 w-4 text-ink-faint" />
              </Link>
            )}

            {latestAnnouncement && (
              <Link href="/voisinage" className="tap flex items-center gap-3 p-3.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-palier-100">
                  <Icon name="Megaphone" className="h-[18px] w-[18px] text-palier-600" strokeWidth={2.3} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{i.home.annonceSyndic(syndicAnnouncements.length)}</p>
                  <p className="truncate text-[12px] text-ink-soft">
                    {latestAnnouncement.title ?? latestAnnouncement.body.slice(0, 50)}
                  </p>
                </div>
                <Icon name={isAr ? "ChevronLeft" : "ChevronRight"} className="h-4 w-4 text-ink-faint" />
              </Link>
            )}

            {nextEvent && (
              <Link href="/voisinage" className="tap flex items-center gap-3 p-3.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-info-soft">
                  <Icon name="CalendarDays" className="h-[18px] w-[18px] text-info" strokeWidth={2.3} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{nextEvent.title}</p>
                  <p className="truncate text-[12px] text-ink-soft">{nextEvent.body.slice(0, 60)}</p>
                </div>
                <Icon name={isAr ? "ChevronLeft" : "ChevronRight"} className="h-4 w-4 text-ink-faint" />
              </Link>
            )}

            {openIncidents.length === 0 && !latestAnnouncement && !nextEvent && (
              <div className="flex items-center gap-3 p-3.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success-soft">
                  <Icon name="CheckCircle" className="h-[18px] w-[18px] text-success" strokeWidth={2.3} />
                </span>
                <p className="text-sm font-medium text-ink-soft">{i.home.toutEstCalme}</p>
              </div>
            )}
          </div>
        </div>

        {/* ═══════ Contact syndic ═══════ */}
        {building.syndic && (
          <div className="card flex items-center gap-3 p-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-palier-600 text-sm font-bold text-white">
              {building.syndic.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-ink-faint">{i.home.votreSyndic}</p>
              <p className="text-sm font-bold text-ink">{building.syndic}</p>
              <p className="text-[12px] text-ink-soft">{building.name} · {building.lots} {i.home.lots}</p>
            </div>
            <Link href="/immeuble" className="flex h-9 w-9 items-center justify-center rounded-full bg-palier-100">
              <Icon name="Phone" className="h-4 w-4 text-palier-600" strokeWidth={2.3} />
            </Link>
          </div>
        )}

        {/* ═══════ Services recommandés ═══════ */}
        {cityProviders.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-[17px] font-bold tracking-tight text-ink">{i.home.servicesRecommandes}</h2>
              <Link href="/services" className="text-sm font-semibold text-palier-600">{i.home.toutVoir}</Link>
            </div>
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
              {cityProviders.map((p) => {
                const cat = catIcon(p.categorySlug);
                return (
                  <Link
                    key={p.id}
                    href={`/services/prestataire/${p.id}`}
                    className="tap w-44 shrink-0 rounded-3xl border border-black/5 bg-white p-4 shadow-card"
                  >
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${p.avatar.from}, ${p.avatar.to})` }}
                    >
                      {p.avatar.initials}
                    </div>
                    <div className="mt-2.5">
                      <Rating value={p.rating} reviews={p.reviews} />
                    </div>
                    <p className="mt-1 text-[14px] font-bold leading-tight text-ink">{p.name}</p>
                    <p className="mt-0.5 text-[12px] text-ink-soft">
                      {i.catLabels[p.categorySlug] ?? p.categorySlug} · {p.district}
                    </p>
                    <p className="mt-1 text-[12px] font-semibold text-palier-600">
                      {i.home.des} {mad(p.basePrice, { decimals: false })}
                    </p>
                    {p.topNeighbor && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#fbf0d8] px-2 py-0.5 text-[10px] font-semibold text-[#a87d12]">
                        <Icon name="Star" className="h-2.5 w-2.5 fill-current" /> {i.home.topVoisins}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
