import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";
import { CopyEmail } from "@/components/ui/CopyEmail";
import { InstallButton } from "@/components/ui/InstallButton";

export const metadata = {
  title: "Palier | La plateforme des copropriétés marocaines",
  description:
    "Gérez vos charges, signalez les incidents, communiquez avec vos voisins. La plateforme tout-en-un pour résidents et syndics.",
};

/* ═══════════════════════════════════════════════
   Device mockup shells
   ═══════════════════════════════════════════════ */

function PhoneFrame({ src, alt, className = "", bare = false }: { src: string; alt: string; className?: string; bare?: boolean }) {
  return (
    <div className={className}>
      <div className="overflow-hidden rounded-[2.2rem] border-[5px] border-[#1a1a1a] bg-[#1a1a1a] shadow-2xl">
        {bare ? (
          <img src={src} alt={alt} className="block w-full" draggable={false} />
        ) : (
          <div className="relative pt-[3px]">
            <div className="absolute left-1/2 top-[1px] z-10 h-[8px] w-[40px] -translate-x-1/2 rounded-full bg-[#1a1a1a]" />
            <img src={src} alt={alt} className="block w-full" draggable={false} />
          </div>
        )}
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
        <div className="mx-auto max-w-6xl px-5 pt-14 pb-10 sm:px-8 sm:pt-20 sm:pb-14 lg:pt-24 lg:pb-16">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-10">
            <div className="text-center lg:text-left">
              <h1 className="text-[36px] font-extrabold leading-[1.08] tracking-tight text-[#111815] sm:text-[48px] lg:text-[56px]">
                Votre résidence,<br />
                <span className="text-[#0B7A57]">enfin bien gérée.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-[420px] text-[16px] leading-relaxed text-[#6b7280] sm:text-[18px] lg:mx-0">
                Charges, incidents, voisinage. Tout ce qu'il faut pour que votre résidence fonctionne, enfin sur une seule plateforme.
              </p>
              <div className="mt-9 flex flex-col items-center gap-4 lg:items-start">
                <InstallButton />
                <Link href="/bienvenue?role=syndic" className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#0B7A57] transition-colors hover:text-[#096b4b] sm:text-[16px]">
                  Vous êtes syndic ? Accédez à votre espace <Icon name="ArrowRight" className="h-5 w-5" />
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
                Signalez un problème en quelques secondes
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
                Un espace social pour votre immeuble. Annonces du syndic, événements, entraide entre voisins. Tout au même endroit.
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
                Les prestataires recommandés par vos voisins
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#6b7280] sm:text-[16px]">
                Besoin d'un plombier ? D'un service de ménage ? Vos voisins ont déjà testé et recommandé les meilleurs prestataires du quartier.
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
            Charges, comptabilité, assemblées générales. Gérez tout depuis un seul tableau de bord.
          </p>
          <MacFrame src="/screens/syndic-dashboard.png" alt="Tableau de bord syndic" />
          <div className="mt-8">
            <MacFrame src="/screens/syndic-recouvrement.png" alt="Recouvrement syndic" />
          </div>
        </div>
      </section>

      {/* ═══ Comptabilité — Décret 2.23.700 ═══ */}
      <section className="bg-[#f4f5f2]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#0B7A57]">Comptabilité</p>
              <h2 className="text-[26px] font-extrabold leading-tight tracking-tight text-[#111815] sm:text-[34px]">
                Annexes comptables conformes au Décret 2.23.700
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#6b7280] sm:text-[16px]">
                Depuis janvier 2026, chaque syndic doit produire les annexes comptables imposées par le Décret 2.23.700. Palier les génère automatiquement — zéro Excel, zéro erreur.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "12 annexes générées automatiquement en PDF",
                  "Adapté à la taille de votre copropriété (petit, moyen, grand)",
                  "Prêt pour l'assemblée générale en un clic",
                  "Plan comptable normalisé des syndicats (PCSI)",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[14px] leading-relaxed text-[#374151]">
                    <Icon name="Check" className="mt-0.5 h-4 w-4 shrink-0 text-[#0B7A57]" strokeWidth={3} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
              <div className="space-y-3">
                {[
                  { tier: "Grand", seuil: "≥ 500 000 MAD / an", annexes: "Annexes 3 à 10", count: "8 documents", color: "bg-[#0B7A57]" },
                  { tier: "Moyen", seuil: "200 000 – 500 000 MAD / an", annexes: "Annexes 10, 11, 12", count: "3 documents", color: "bg-[#0B7A57]/80" },
                  { tier: "Petit", seuil: "≤ 200 000 MAD / an", annexes: "Annexes 10, 13-1, 13-2", count: "3 documents", color: "bg-[#0B7A57]/60" },
                ].map((t) => (
                  <div key={t.tier} className="flex items-center gap-4 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.color} text-[13px] font-bold text-white`}>
                      {t.tier[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-[#111815]">{t.tier}</p>
                      <p className="text-[12px] text-[#6b7280]">{t.seuil}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-semibold text-[#0B7A57]">{t.count}</p>
                      <p className="text-[11px] text-[#6b7280]">{t.annexes}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-[12px] text-[#6b7280]">
                + Annexe 10 (suivi des contributions) obligatoire pour tous les régimes
              </p>
            </div>
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
              { icon: "Eye", title: "Transparence financière", desc: "Suivez le budget de votre immeuble en toute transparence. Encaissements, dépenses, solde de caisse." },
              { icon: "Banknote", title: "Charges & paiements", desc: "Consultez vos charges, leur détail, les échéances. Recevez vos reçus de paiement numériques." },
              { icon: "FileText", title: "Documents", desc: "PV d'assemblées, règlement de copropriété, contrats d'assurance. Tout accessible à tout moment." },
              { icon: "CalendarDays", title: "Assemblées générales", desc: "Convocations, ordre du jour, votes pondérés par tantièmes depuis votre téléphone, comptes-rendus." },
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


      {/* ═══ Footer ═══ */}
      <footer className="border-t border-white/[0.06] bg-[#0c1210] py-12">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col items-center gap-3 sm:items-start">
              <div className="flex items-center gap-2"><LogoMark size={22} /><Wordmark className="text-base text-white" /></div>
              <p className="max-w-[260px] text-center text-[13px] leading-relaxed text-white/40 sm:text-left">La plateforme des copropriétés marocaines.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-[13px] text-white/50">
              <a href="#fonctionnalites" className="transition-colors hover:text-white/80">Fonctionnalités</a>
              <CopyEmail email="contact@palier.ma" className="text-white/50 hover:text-white/80" />
              <Link href="/conditions-utilisation" className="transition-colors hover:text-white/80">Conditions d&apos;utilisation</Link>
              <Link href="/politique-confidentialite" className="transition-colors hover:text-white/80">Politique de confidentialité</Link>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center gap-3 border-t border-white/[0.06] pt-6 sm:flex-row sm:justify-between">
            <p className="text-[11px] text-white/30">© {new Date().getFullYear()} Palier. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
