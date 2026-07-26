import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";

export const metadata = {
  title: "Palier | La super-app des copropriétés marocaines",
  description:
    "Gérez vos charges, signalez les incidents, communiquez avec vos voisins. La plateforme tout-en-un pour résidents et syndics.",
};

/* ═══════════════════════════════════════════════
   Device mockup shells
   ═══════════════════════════════════════════════ */

function PhoneFrame({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={className}>
      <div className="overflow-hidden rounded-[2.2rem] border-[5px] border-[#1a1a1a] bg-[#1a1a1a] shadow-2xl">
        <div className="relative pt-[3px]">
          <div className="absolute left-1/2 top-[1px] z-10 h-[8px] w-[40px] -translate-x-1/2 rounded-full bg-[#1a1a1a]" />
          <img src={src} alt={alt} className="block w-full" draggable={false} />
        </div>
      </div>
    </div>
  );
}

function MacFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="overflow-hidden rounded-xl shadow-2xl">
        <div className="flex items-center bg-[#1a1a1a] px-3 py-[6px]">
          <div className="flex items-center gap-[6px]">
            <span className="h-[11px] w-[11px] rounded-full bg-[#ff5f56]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#ffbd2e]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#27c93f]" />
          </div>
          <div className="mx-auto flex items-center gap-1 rounded-md bg-white/10 px-3 py-[3px]">
            <svg className="h-[9px] w-[9px] text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <span className="text-[10px] font-medium text-white/50">palier.ma</span>
          </div>
          <div className="w-[52px]" />
        </div>
        <img src={src} alt={alt} className="block w-full" draggable={false} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Store badges (reusable)
   ═══════════════════════════════════════════════ */

function StoreBadges({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <span className="inline-flex cursor-not-allowed items-center gap-2.5 rounded-xl bg-[#111815] py-2.5 pl-3.5 pr-5 opacity-60">
        <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 21.99 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 21.99C7.79 22.03 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" /></svg>
        <div className="flex flex-col leading-none">
          <span className="text-[10px] text-white/60">Bientôt sur</span>
          <span className="text-[15px] font-semibold text-white">App Store</span>
        </div>
      </span>
      <span className="inline-flex cursor-not-allowed items-center gap-2.5 rounded-xl bg-[#111815] py-2.5 pl-3.5 pr-5 opacity-60">
        <svg className="h-6 w-6" viewBox="0 0 512 512" fill="none"><path d="M239.2 270.9L44.5 471.7a47.9 47.9 0 0 0 31.4 11.8c10.4 0 20-3.3 28.2-9L325 347.2 239.2 270.9Z" fill="#EA4335"/><path d="M382.3 233.7l-57.3-32.5L244 270.9l81 76.3 57.2-32.4c17.3-9.8 27.8-27.5 27.8-40.6s-10.5-30.7-27.7-40.5Z" fill="#FBBC04"/><path d="M44.5 40.3C42.9 45.5 42 51.2 42 57.4v397.2c0 6.2.9 11.9 2.5 17.1L239.2 270.9 44.5 40.3Z" fill="#4285F4"/><path d="M241.4 256L325 164.8l-221-125.3A47.3 47.3 0 0 0 75.9 28.7c-12.1 0-23.2 4.3-31.4 11.6L241.4 256Z" fill="#34A853"/></svg>
        <div className="flex flex-col leading-none">
          <span className="text-[10px] text-white/60">Bientôt sur</span>
          <span className="text-[15px] font-semibold text-white">Google Play</span>
        </div>
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════ */

export default function SitePage() {
  return (
    <div
      className="min-h-dvh scroll-smooth antialiased"
      style={{ color: "#111815", colorScheme: "light" } as React.CSSProperties}
    >
      {/* ═══ Nav ═══ */}
      <nav className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
          <Link href="/site" className="flex items-center gap-2">
            <LogoMark size={32} />
            <Wordmark />
          </Link>
          <div className="flex items-center gap-5">
            <a href="#fonctionnalites" className="hidden text-[14px] font-medium text-[#6b7280] transition-colors hover:text-[#111815] sm:block">Fonctionnalités</a>
            <Link href="/bienvenue?role=syndic" className="rounded-full bg-[#111815] px-5 py-[7px] text-[13px] font-semibold text-white transition-opacity hover:opacity-85">Espace Syndic</Link>
          </div>
        </div>
      </nav>

      {/* ═══ Hero ═══ */}
      <section className="overflow-hidden bg-white">
        <div className="mx-auto max-w-6xl px-5 pt-20 pb-20 sm:px-8 sm:pt-28 sm:pb-28 lg:pt-32 lg:pb-32">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-12">
            <div className="text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#0B7A57]/15 bg-[#0B7A57]/[0.06] px-4 py-1.5">
                <span className="h-2 w-2 rounded-full bg-[#0B7A57]" />
                <span className="text-[13px] font-semibold text-[#0B7A57]">La super-app des copropriétés</span>
              </div>
              <h1 className="text-[38px] font-extrabold leading-[1.08] tracking-tight text-[#111815] sm:text-[52px] lg:text-[60px]">
                Votre résidence<br />
                <span className="text-[#0B7A57]">mérite mieux.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-[420px] text-[16px] leading-relaxed text-[#6b7280] sm:text-[18px] lg:mx-0">
                Palier connecte résidents et syndics sur une seule plateforme. Charges, transparence financière, incidents, voisinage.
              </p>
              <StoreBadges className="mt-9 justify-center lg:justify-start" />
              <div className="mt-6 flex items-center justify-center lg:justify-start">
                <Link href="/bienvenue?role=syndic" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#6b7280] transition-colors hover:text-[#111815]">
                  Vous êtes syndic ? Accédez à votre espace <Icon name="ArrowRight" className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="relative mx-auto flex max-w-[560px] items-end justify-center pb-8 lg:mx-0 lg:max-w-none lg:pb-0">
              <div className="absolute inset-[-10%] rounded-full bg-[#0B7A57]/[0.07] blur-[90px]" />
              <PhoneFrame src="/screens/charges.png" alt="Suivi des charges" className="relative z-0 -mr-3 mb-10 w-[135px] -rotate-6 opacity-90 sm:-mr-4 sm:w-[160px] lg:w-[170px]" />
              <PhoneFrame src="/screens/home.png" alt="Accueil résident" className="relative z-10 w-[170px] sm:w-[210px] lg:w-[220px]" />
              <PhoneFrame src="/screens/immeuble.png" alt="Transparence financière" className="relative z-0 -ml-3 mb-10 w-[135px] rotate-6 opacity-90 sm:-ml-4 sm:w-[160px] lg:w-[170px]" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Feature: Incidents ═══ */}
      <section id="fonctionnalites" className="scroll-mt-14 bg-[#f4f5f2]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="mx-auto max-w-[260px] lg:mx-0">
              <PhoneFrame src="/screens/incident.png" alt="Signalement d'incident" />
            </div>
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#0B7A57]">Incidents</p>
              <h2 className="text-[26px] font-extrabold leading-tight tracking-tight text-[#111815] sm:text-[34px]">
                Signalez un problème en 10 secondes
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#6b7280] sm:text-[16px]">
                Ascenseur en panne, fuite d'eau, problème de sécurité. Plus besoin d'appeler ou d'envoyer un message WhatsApp au syndic.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Choisissez la catégorie et le niveau d'urgence",
                  "Ajoutez une photo pour illustrer le problème",
                  "Le syndic est notifié instantanément dans son tableau de bord",
                  "Suivez la résolution en temps réel avec un fil de discussion",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[14px] leading-relaxed text-[#374151]">
                    <Icon name="Check" className="mt-0.5 h-4 w-4 shrink-0 text-[#0B7A57]" strokeWidth={3} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Feature: Voisinage ═══ */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 lg:order-1">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#0B7A57]">Voisinage</p>
              <h2 className="text-[26px] font-extrabold leading-tight tracking-tight text-[#111815] sm:text-[34px]">
                Votre communauté, connectée
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#6b7280] sm:text-[16px]">
                Un espace social pour votre immeuble. Annonces du syndic, événements, entraide entre voisins — tout au même endroit.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Annonces officielles du syndic avec badge vérifié",
                  "Entraide, objets trouvés, événements entre voisins",
                  "Réactions et commentaires pour échanger facilement",
                  "Le syndic peut épingler les annonces importantes",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[14px] leading-relaxed text-[#374151]">
                    <Icon name="Check" className="mt-0.5 h-4 w-4 shrink-0 text-[#0B7A57]" strokeWidth={3} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 mx-auto max-w-[260px] lg:order-2 lg:mx-0 lg:ml-auto">
              <PhoneFrame src="/screens/voisinage.png" alt="Voisinage" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Feature: Services ═══ */}
      <section className="bg-[#f4f5f2]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="mx-auto max-w-[260px] lg:mx-0">
              <PhoneFrame src="/screens/services.png" alt="Services" />
            </div>
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#0B7A57]">Services</p>
              <h2 className="text-[26px] font-extrabold leading-tight tracking-tight text-[#111815] sm:text-[34px]">
                Les bons plans de vos voisins
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#6b7280] sm:text-[16px]">
                Besoin d'un plombier ? D'une femme de ménage ? Vos voisins ont déjà testé et recommandé les meilleurs prestataires du quartier.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Recommandations vérifiées par vos voisins",
                  "Contact direct par téléphone ou WhatsApp",
                  "Postez une demande et recevez des suggestions",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[14px] leading-relaxed text-[#374151]">
                    <Icon name="Check" className="mt-0.5 h-4 w-4 shrink-0 text-[#0B7A57]" strokeWidth={3} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Syndic ═══ */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.15em] text-[#0B7A57]">Pour le syndic</p>
          <h2 className="mb-4 text-center text-[26px] font-extrabold tracking-tight text-[#111815] sm:text-[34px]">
            Tout centraliser, ne rien oublier
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-[15px] leading-relaxed text-[#6b7280] sm:text-[16px]">
            Recouvrement en un clic, relances WhatsApp, comptabilité conforme à la loi 18-00, assemblées générales digitalisées. Palier remplace vos fichiers Excel.
          </p>
          <MacFrame src="/screens/syndic-dashboard.png" alt="Tableau de bord syndic" />
          <div className="mt-8">
            <MacFrame src="/screens/syndic-recouvrement.png" alt="Recouvrement syndic" />
          </div>
        </div>
      </section>

      {/* ═══ Plus de fonctionnalités ═══ */}
      <section className="bg-[#111815]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <h2 className="mb-4 text-center text-[24px] font-extrabold tracking-tight text-white sm:text-[32px]">Et bien plus encore</h2>
          <p className="mx-auto mb-14 max-w-md text-center text-[15px] leading-relaxed text-[#9ca3af]">Tout ce dont votre résidence a besoin, sur une seule plateforme.</p>

          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "Eye", title: "Transparence financière", desc: "Chaque centime du budget de votre immeuble, visible en temps réel. Encaissements, dépenses, solde de caisse." },
              { icon: "Banknote", title: "Charges & paiements", desc: "Consultez vos charges, leur détail, les échéances. Recevez vos reçus de paiement numériques." },
              { icon: "FileText", title: "Documents", desc: "PV d'assemblées, règlement de copropriété, contrats d'assurance. Tout accessible à tout moment." },
              { icon: "CalendarDays", title: "Assemblées générales", desc: "Convocations, ordre du jour, votes pondérés par tantièmes depuis votre téléphone, comptes-rendus." },
              { icon: "Receipt", title: "Comptabilité légale", desc: "Annexes comptables générées automatiquement, conformes au Décret 2.23.700. Plus besoin d'Excel." },
              { icon: "Shield", title: "Conformité & assurance", desc: "Mandat syndic, règlement, assurances avec alertes d'expiration. Tout est suivi automatiquement." },
            ].map((f) => (
              <div key={f.title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0B7A57]/20">
                  <Icon name={f.icon} className="h-5 w-5 text-[#34d399]" strokeWidth={2} />
                </span>
                <div>
                  <h3 className="text-[15px] font-bold text-white">{f.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#9ca3af]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="bg-[#111815]">
        <div className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 sm:pb-28">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B7A57] to-[#096b4c] px-6 py-14 text-center sm:px-12 sm:py-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
            <div className="relative">
              <h2 className="text-[24px] font-extrabold tracking-tight text-white sm:text-[34px]">
                Prêt à transformer votre résidence ?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/70">
                Téléchargez Palier et rejoignez les copropriétés marocaines qui ont choisi la transparence.
              </p>
              <StoreBadges className="mt-8 justify-center" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-white/[0.06] bg-[#0c1210] py-12">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col items-center gap-3 sm:items-start">
              <div className="flex items-center gap-2"><LogoMark size={22} /><Wordmark className="text-base text-white" /></div>
              <p className="max-w-[260px] text-center text-[13px] leading-relaxed text-white/40 sm:text-left">La super-app des copropriétés marocaines.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-[13px] text-white/50">
              <Link href="/bienvenue" className="transition-colors hover:text-white/80">Télécharger</Link>
              <a href="#fonctionnalites" className="transition-colors hover:text-white/80">Fonctionnalités</a>
              <a href="mailto:contact@palier.ma" className="transition-colors hover:text-white/80">Contact</a>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center gap-3 border-t border-white/[0.06] pt-6 sm:flex-row sm:justify-between">
            <p className="text-[11px] text-white/30">© {new Date().getFullYear()} Palier. Tous droits réservés.</p>
            <div className="flex gap-5 text-[11px] text-white/30">
              <a href="mailto:contact@palier.ma" className="transition-colors hover:text-white/50">Conditions d&apos;utilisation</a>
              <a href="mailto:contact@palier.ma" className="transition-colors hover:text-white/50">Politique de confidentialité</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
