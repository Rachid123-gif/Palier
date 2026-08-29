import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/brand/Logo";

export const metadata = {
  title: "Conditions générales d'utilisation | Palier",
  description: "Conditions générales d'utilisation de la plateforme Palier — gestion de copropriété au Maroc.",
};

export default function ConditionsUtilisationPage() {
  return (
    <div className="min-h-dvh antialiased" style={{ color: "#111815", colorScheme: "light" } as React.CSSProperties}>
      {/* ═══ Header ═══ */}
      <nav className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3 sm:px-8">
          <Link href="/site" className="flex items-center gap-2">
            <LogoMark size={28} />
            <Wordmark />
          </Link>
        </div>
      </nav>

      {/* ═══ Content ═══ */}
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <h1 className="text-[28px] font-extrabold tracking-tight text-[#111815] sm:text-[36px]">
          Conditions générales d&apos;utilisation
        </h1>
        <p className="mt-2 text-[14px] text-[#6b7280]">Dernière mise à jour : août 2026</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-[#374151]">
          {/* 1. Objet */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">1. Objet</h2>
            <p>
              Les présentes conditions générales d&apos;utilisation (ci-après « CGU ») encadrent l&apos;utilisation de la
              plateforme <strong>Palier</strong>, accessible via le navigateur web (mobile et ordinateur). Palier est une
              plateforme de gestion de copropriété destinée aux résidents et aux syndics au Maroc.
            </p>
          </section>

          {/* 2. Acceptation */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">2. Acceptation des CGU</h2>
            <p>
              L&apos;utilisation de la plateforme Palier implique l&apos;acceptation pleine et entière des présentes CGU.
              Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser le service.
            </p>
          </section>

          {/* 3. Description du service */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">3. Description du service</h2>
            <p>Palier propose les fonctionnalités suivantes :</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Gestion et suivi des charges de copropriété et des paiements</li>
              <li>Signalement et suivi des incidents (avec possibilité de joindre des photos)</li>
              <li>Communication et entraide entre voisins (publications, commentaires, réactions)</li>
              <li>Organisation et gestion des assemblées générales (convocations, votes, procès-verbaux)</li>
              <li>Annuaire de services recommandés par les résidents</li>
              <li>Consultation de documents de copropriété (règlement, PV, contrats)</li>
              <li>Suivi de la transparence financière de la résidence</li>
              <li>Notifications push et in-app relatives à l&apos;activité de la résidence</li>
            </ul>
          </section>

          {/* 4. Inscription et accès */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">4. Inscription et accès</h2>
            <p>
              L&apos;accès à Palier se fait via un code d&apos;accès. Pour les résidents, ce code est fourni par le syndic
              de la copropriété. Pour les syndics, le code est créé lors de l&apos;inscription sur la plateforme et
              validé par un code de vérification (OTP) envoyé par SMS.
            </p>
            <p className="mt-2">
              Chaque utilisateur est responsable de la confidentialité de son code d&apos;accès et de toute activité
              effectuée avec celui-ci. En cas de perte, l&apos;utilisateur peut demander un nouveau code via la
              procédure de récupération.
            </p>
          </section>

          {/* 5. Obligations de l'utilisateur */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">5. Obligations de l&apos;utilisateur</h2>
            <p>L&apos;utilisateur s&apos;engage à :</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Fournir des informations exactes et à jour</li>
              <li>Ne pas détourner la plateforme de son usage prévu</li>
              <li>Respecter les autres résidents et utilisateurs</li>
              <li>Ne pas publier de contenu illicite, diffamatoire, injurieux ou contraire à l&apos;ordre public</li>
              <li>Ne pas uploader de fichiers malveillants, illicites ou portant atteinte aux droits de tiers</li>
              <li>Ne pas usurper l&apos;identité d&apos;un autre utilisateur ou d&apos;un prestataire</li>
            </ul>
          </section>

          {/* 6. Contenu et fichiers */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">6. Contenu et fichiers uploadés</h2>
            <p>
              Les publications, commentaires, photos et documents partagés sur Palier sont sous la responsabilité
              de leur auteur. Palier se réserve le droit de modérer, modifier ou supprimer tout contenu contraire
              aux présentes CGU ou à la législation en vigueur.
            </p>
            <p className="mt-2">
              Les fichiers uploadés (photos, documents) sont limités à 5 Mo par fichier. Seuls les formats
              images (JPG, PNG, WebP, HEIC) et documents (PDF, DOC, DOCX, XLS, XLSX) sont acceptés.
              Tout fichier non conforme sera rejeté automatiquement.
            </p>
          </section>

          {/* 7. Assemblées générales et votes */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">7. Assemblées générales et votes</h2>
            <p>
              Palier permet l&apos;organisation d&apos;assemblées générales et le vote sur les résolutions proposées.
              Chaque utilisateur ne peut voter qu&apos;une seule fois par résolution. Le vote est enregistré de
              manière nominative et ne peut pas être modifié après soumission.
            </p>
            <p className="mt-2">
              Les résultats des votes sont calculés selon les règles de majorité définies par le syndic
              (majorité simple, trois quarts, unanimité) et pondérés par les tantièmes le cas échéant.
              Palier facilite le processus de vote mais ne se substitue pas aux obligations légales
              de la copropriété prévues par la <strong>Loi 18-00</strong>.
            </p>
          </section>

          {/* 8. Services et recommandations */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">8. Services et recommandations</h2>
            <p>
              Palier permet aux résidents de recommander des prestataires de services (plombier, électricien, etc.)
              et de rechercher des prestataires via un annuaire. Les recommandations sont publiées sous la seule
              responsabilité de leur auteur.
            </p>
            <p className="mt-2">
              Palier n&apos;est ni intermédiaire, ni partie prenante dans la relation entre l&apos;utilisateur et le
              prestataire recommandé. Palier ne garantit pas la qualité, la disponibilité ou la fiabilité des
              prestataires affichés et décline toute responsabilité en cas de litige entre un utilisateur et
              un prestataire.
            </p>
          </section>

          {/* 9. Notifications */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">9. Notifications</h2>
            <p>
              Palier envoie des notifications in-app et push pour informer les utilisateurs de l&apos;activité de leur
              résidence (nouvelles charges, incidents, publications, assemblées). Les notifications push nécessitent
              votre consentement explicite via votre navigateur ou appareil.
            </p>
            <p className="mt-2">
              Vous pouvez gérer vos préférences de notification depuis votre profil et retirer le
              consentement push à tout moment depuis les paramètres de votre navigateur.
            </p>
          </section>

          {/* 10. Responsabilité */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">10. Responsabilité</h2>
            <p>
              Palier fournit le service « en l&apos;état ». Palier ne garantit pas une disponibilité ininterrompue de la
              plateforme et ne saurait être tenu responsable des dommages résultant d&apos;une indisponibilité temporaire
              du service.
            </p>
            <p className="mt-2">
              Palier n&apos;est pas responsable des décisions prises par les utilisateurs ou les syndics sur la base des
              informations affichées sur la plateforme, ni des montants de charges ou paiements saisis par le syndic.
            </p>
          </section>

          {/* 11. Propriété intellectuelle */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">11. Propriété intellectuelle</h2>
            <p>
              Le contenu, le design, le code et les éléments graphiques de Palier sont protégés par le droit de la
              propriété intellectuelle. Toute reproduction ou utilisation non autorisée est interdite.
            </p>
            <p className="mt-2">
              L&apos;utilisateur conserve l&apos;intégralité de ses droits sur le contenu qu&apos;il publie sur la plateforme.
              En publiant du contenu, l&apos;utilisateur accorde à Palier une licence non exclusive d&apos;affichage
              de ce contenu dans le cadre du fonctionnement du service, limitée aux membres de sa résidence.
            </p>
          </section>

          {/* 12. Résiliation */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">12. Résiliation</h2>
            <p>
              L&apos;utilisateur peut supprimer son compte à tout moment depuis son profil. Pour plus de détails sur le
              traitement des données après suppression, consultez notre{" "}
              <Link href="/politique-confidentialite" className="text-[#0B7A57] underline">politique de confidentialité</Link>.
            </p>
            <p className="mt-2">
              Le syndic peut désactiver le compte d&apos;un résident à tout moment dans le cadre de la gestion de la
              copropriété.
            </p>
          </section>

          {/* 13. Modification des CGU */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">13. Modification des CGU</h2>
            <p>
              Palier se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés
              de toute modification. La poursuite de l&apos;utilisation de la plateforme après modification vaut acceptation
              des nouvelles conditions.
            </p>
          </section>

          {/* 14. Droit applicable */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">14. Droit applicable</h2>
            <p>
              Les présentes CGU sont régies par le droit marocain. En cas de litige, les tribunaux de Casablanca seront
              seuls compétents.
            </p>
          </section>

          {/* 15. Contact */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">15. Contact</h2>
            <p>
              Pour toute question relative aux présentes CGU, vous pouvez nous contacter à l&apos;adresse{" "}
              <a href="mailto:contact@palier.ma" className="text-[#0B7A57] underline">contact@palier.ma</a>.
            </p>
          </section>
        </div>
      </main>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-black/[0.06] bg-[#f4f5f2] py-8">
        <div className="mx-auto max-w-3xl px-5 text-center text-[12px] text-[#6b7280] sm:px-8">
          © {new Date().getFullYear()} Palier. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
