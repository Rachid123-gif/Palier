import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";

export const metadata = {
  title: "Palier — La super-app des copropriétés marocaines",
  description:
    "Gérez vos charges, signalez les incidents, communiquez avec vos voisins et trouvez des prestataires vérifiés. Disponible sur iOS et Android.",
};

const features = [
  {
    icon: "ReceiptText",
    title: "Charges transparentes",
    desc: "Suivez vos charges en temps réel, payez en ligne et accédez à l'historique complet.",
    tint: "bg-palier-50",
    color: "text-palier-600",
  },
  {
    icon: "TriangleAlert",
    title: "Signalement d'incidents",
    desc: "Signalez un problème en quelques taps. Suivi en temps réel jusqu'à la résolution.",
    tint: "bg-amber-50",
    color: "text-amber-600",
  },
  {
    icon: "Users",
    title: "Espace voisinage",
    desc: "Annonces, entraide, recommandations — la vie de l'immeuble au bout des doigts.",
    tint: "bg-blue-50",
    color: "text-blue-600",
  },
  {
    icon: "HandHelping",
    title: "Prestataires vérifiés",
    desc: "Plombier, électricien, femme de ménage — trouvez le bon prestataire par bouche à oreille.",
    tint: "bg-coral-400/20",
    color: "text-coral-600",
  },
  {
    icon: "ShieldCheck",
    title: "Transparence financière",
    desc: "Comptabilité conforme au Décret 2.23.700. Budget, dépenses, annexes réglementaires.",
    tint: "bg-emerald-50",
    color: "text-emerald-600",
  },
  {
    icon: "Building2",
    title: "Multi-immeubles",
    desc: "Gérez plusieurs résidences depuis un seul compte. Basculez en un clic.",
    tint: "bg-purple-100",
    color: "text-purple-600",
  },
];

const syndicFeatures = [
  "Tableau de bord complet avec KPIs",
  "Recouvrement et relances WhatsApp",
  "Gestion des incidents et résidents",
  "Assemblées générales et PV",
  "Comptabilité conforme (annexes I à V)",
  "Documents et stockage sécurisé",
];

export default function SitePage() {
  return (
    <div className="min-h-dvh bg-cream text-ink">
      {/* ═══ Nav ═══ */}
      <nav className="sticky top-0 z-50 border-b border-black/5 bg-cream/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <LogoMark size={36} />
            <Wordmark />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/bienvenue"
              className="hidden rounded-full border border-palier-200 px-5 py-2 text-[14px] font-semibold text-palier-700 transition-colors hover:bg-palier-50 sm:inline-flex"
            >
              Espace Résident
            </Link>
            <Link
              href="/bienvenue"
              className="rounded-full bg-palier-600 px-5 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-palier-700"
            >
              Espace Syndic
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ Hero ═══ */}
      <section className="relative overflow-hidden bg-palier-950">
        {/* Decorative orbs */}
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-palier-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-olive-500/15 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pb-28 sm:pt-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[13px] font-semibold text-white/90 backdrop-blur-sm">
              <Icon name="Sparkles" className="h-4 w-4" />
              Disponible sur iOS et Android
            </div>
            <h1 className="text-[38px] font-extrabold leading-[1.08] tracking-tight text-white sm:text-[56px]">
              La copropriété,
              <br />
              <span className="text-olive-400">simplifiée.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-[16px] leading-relaxed text-white/70 sm:text-[18px]">
              Charges, incidents, voisinage, prestataires — tout ce dont votre résidence a besoin, dans une seule app.
            </p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href="#telecharger"
                style={{ backgroundColor: "#fff", color: "#194a42" }}
                className="tap inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-[15px] font-bold shadow-lg transition-transform hover:scale-[1.02]"
              >
                <Icon name="Download" className="h-5 w-5" />
                Télécharger l&apos;app
              </a>
              <Link
                href="/bienvenue"
                className="tap inline-flex items-center gap-2 rounded-full border border-white/20 px-8 py-4 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                Accéder au web
                <Icon name="ArrowRight" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Features ═══ */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[28px] font-extrabold tracking-tight sm:text-[36px]">
            Tout pour votre résidence
          </h2>
          <p className="mt-3 text-[15px] text-ink-soft sm:text-[16px]">
            Palier réunit résidents, syndic et prestataires sur une plateforme unique, transparente et conforme à la loi marocaine.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card p-6">
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${f.tint}`}>
                <Icon name={f.icon} className={`h-6 w-6 ${f.color}`} strokeWidth={2} />
              </span>
              <h3 className="mt-4 text-[16px] font-bold">{f.title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Espace Syndic ═══ */}
      <section className="bg-palier-950 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-palier-600/30 px-4 py-1.5 text-[13px] font-semibold text-palier-300">
                <Icon name="Shield" className="h-4 w-4" />
                Espace Syndic
              </div>
              <h2 className="text-[28px] font-extrabold leading-tight tracking-tight text-white sm:text-[36px]">
                Gérez votre copropriété
                <br />
                depuis n&apos;importe où
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/70">
                Un tableau de bord complet, accessible depuis votre navigateur. Recouvrement, incidents, AG, comptabilité — tout est centralisé.
              </p>
              <ul className="mt-8 space-y-3">
                {syndicFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-[14px] text-white/90">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-palier-600/40">
                      <Icon name="Check" className="h-3.5 w-3.5 text-palier-300" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/bienvenue"
                style={{ backgroundColor: "#fff", color: "#194a42" }}
                className="tap mt-8 inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-[15px] font-bold shadow-lg transition-transform hover:scale-[1.02]"
              >
                Accéder à l&apos;espace syndic
                <Icon name="ArrowRight" className="h-4.5 w-4.5" />
              </Link>
            </div>
            <div className="hidden items-center justify-center lg:flex">
              <div className="relative h-[400px] w-[340px] overflow-hidden rounded-[32px] border-[8px] border-white/10 bg-palier-900 shadow-2xl">
                <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                  <LogoMark size={64} />
                  <Wordmark light className="text-2xl" />
                  <p className="text-[14px] text-white/60">Tableau de bord syndic</p>
                  <div className="mt-4 grid w-full grid-cols-2 gap-3">
                    {[
                      { label: "Résidents", value: "24", icon: "Users" },
                      { label: "Taux paie.", value: "87%", icon: "TrendingUp" },
                      { label: "Incidents", value: "3", icon: "TriangleAlert" },
                      { label: "Balance", value: "+12K", icon: "Wallet" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl bg-white/10 p-3 text-left">
                        <Icon name={s.icon} className="mb-1 h-4 w-4 text-palier-300" />
                        <p className="text-[18px] font-bold text-white">{s.value}</p>
                        <p className="text-[10px] text-white/50">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Télécharger ═══ */}
      <section id="telecharger" className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[28px] font-extrabold tracking-tight sm:text-[36px]">
            Téléchargez Palier
          </h2>
          <p className="mt-3 text-[15px] text-ink-soft sm:text-[16px]">
            Disponible gratuitement sur iOS et Android. Aucun compte à créer — votre syndic vous fournit un code d&apos;accès.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="#"
              style={{ backgroundColor: "#14201d", color: "#fff" }}
              className="tap flex items-center gap-3 rounded-2xl px-6 py-3.5 transition-transform hover:scale-[1.02]"
            >
              <Icon name="Apple" className="h-8 w-8" />
              <div className="text-left">
                <p className="text-[10px] font-medium uppercase tracking-wider opacity-70">Télécharger sur</p>
                <p className="text-[17px] font-bold leading-tight">App Store</p>
              </div>
            </a>
            <a
              href="#"
              style={{ backgroundColor: "#14201d", color: "#fff" }}
              className="tap flex items-center gap-3 rounded-2xl px-6 py-3.5 transition-transform hover:scale-[1.02]"
            >
              <Icon name="Play" className="h-8 w-8" />
              <div className="text-left">
                <p className="text-[10px] font-medium uppercase tracking-wider opacity-70">Disponible sur</p>
                <p className="text-[17px] font-bold leading-tight">Google Play</p>
              </div>
            </a>
          </div>
          <div className="mt-6 flex flex-col items-center gap-2 text-[13px] text-ink-faint">
            <p>
              <Icon name="Smartphone" className="mr-1.5 inline h-4 w-4" />
              iOS 15+ · Android 10+
            </p>
            <p>Version actuelle : 1.0.0</p>
          </div>
        </div>
      </section>

      {/* ═══ Conformité ═══ */}
      <section className="border-t border-black/5 bg-sand/50 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-palier-50">
              <Icon name="Scale" className="h-7 w-7 text-palier-600" />
            </span>
            <div>
              <h3 className="text-[16px] font-bold">Conforme à la loi marocaine</h3>
              <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-ink-soft">
                Palier respecte la loi 18-00 sur la copropriété et le Décret 2.23.700. Comptabilité réglementaire, tantièmes, budget prévisionnel, assemblées générales — tout est conforme.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-black/5 bg-cream py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2.5">
              <LogoMark size={28} />
              <Wordmark className="text-lg" />
            </div>
            <div className="flex items-center gap-6 text-[13px] text-ink-soft">
              <Link href="/bienvenue" className="hover:text-ink">Commencer</Link>
              <a href="#telecharger" className="hover:text-ink">Télécharger</a>
              <a href="mailto:contact@palier.ma" className="hover:text-ink">Contact</a>
            </div>
          </div>
          <div className="mt-8 border-t border-black/5 pt-6 text-center text-[12px] text-ink-faint">
            © {new Date().getFullYear()} Palier. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
