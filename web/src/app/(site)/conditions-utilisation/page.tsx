import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/brand/Logo";

export const metadata = {
  title: "Conditions générales d'utilisation | Palier",
  description: "Conditions générales d'utilisation de la plateforme Palier — gestion de copropriété au Maroc.",
};

export default function ConditionsUtilisationPage() {
  return (
    <div className="min-h-dvh bg-cream antialiased">
      {/* ═══ Header ═══ */}
      <nav className="sticky top-0 z-50 border-b border-black/[0.06] bg-cream-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3 sm:px-8">
          <Link href="/site" className="flex items-center gap-2">
            <LogoMark size={28} />
            <Wordmark />
          </Link>
        </div>
      </nav>

      {/* ═══ Content ═══ */}
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <h1 className="text-[28px] font-extrabold tracking-tight text-ink sm:text-[36px]">
          Conditions générales d&apos;utilisation
        </h1>
        <p className="mt-2 text-[14px] text-ink-faint">Dernière mise à jour : septembre 2026</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-ink-soft">

          {/* ── 1. Objet ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">1. Objet</h2>
            <p>
              Les présentes conditions générales d&apos;utilisation (ci-après « CGU ») régissent l&apos;accès et l&apos;utilisation
              de la plateforme <strong>Palier</strong>, accessible via navigateur web (application web progressive),
              ci-après « le Service ».
            </p>
            <p className="mt-2">
              Palier est une plateforme numérique de gestion de copropriété destinée aux résidents et aux syndics au Maroc.
              Elle facilite la communication, le suivi financier et l&apos;organisation de la vie en copropriété.
              Palier est un outil d&apos;aide à la gestion et ne se substitue pas aux obligations légales des copropriétaires
              et des syndics prévues par la <strong>Loi 18-00</strong> relative au statut de la copropriété des immeubles bâtis.
            </p>
          </section>

          {/* ── 2. Éditeur du service ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">2. Éditeur du service</h2>
            <p>Le Service est édité par :</p>
            <ul className="mt-2 list-none space-y-1 pl-0">
              <li><strong>Nom :</strong> Rachid IDRISSI</li>
              <li><strong>Téléphone :</strong> +212 661-087205</li>
              <li><strong>Email :</strong> <a href="mailto:contact@palier.ma" className="text-palier-600 underline">contact@palier.ma</a></li>
            </ul>
            <p className="mt-2 text-[13px] text-ink-faint">
              Hébergement et exécution : Vercel Inc., San Francisco, CA, États-Unis (réseau CDN mondial).
              Base de données et stockage : Supabase Inc. — données hébergées en Europe (région AWS eu-west-3, Paris, France).
              Envoi de messages WhatsApp : Infobip Ltd., Londres, Royaume-Uni.
              Recherche de prestataires : Google Places API, Google LLC, Mountain View, CA, États-Unis.
            </p>
          </section>

          {/* ── 3. Acceptation des CGU ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">3. Acceptation des CGU</h2>
            <p>
              En cochant la case d&apos;acceptation des conditions d&apos;utilisation et de la politique de confidentialité
              lors de l&apos;inscription ou de la première connexion, l&apos;utilisateur accepte les présentes CGU dans leur intégralité.
              Cette acceptation constitue un contrat électronique valide conformément à la <strong>Loi 53-05</strong>.
            </p>
            <p className="mt-2">
              Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser le Service.
            </p>
          </section>

          {/* ── 4. Description du service ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">4. Description du service</h2>
            <p>Palier propose notamment les fonctionnalités suivantes :</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Gestion et suivi des charges de copropriété et des paiements</li>
              <li>Signalement et suivi des incidents</li>
              <li>Espace de voisinage (publications, commentaires, recommandations)</li>
              <li>Organisation et suivi des assemblées générales (convocations, votes, procès-verbaux)</li>
              <li>Recherche de prestataires de services</li>
              <li>Consultation et partage de documents de copropriété</li>
              <li>Comptabilité et transparence financière</li>
              <li>Gestion des résidents et de la résidence par le syndic</li>
              <li>Notifications et communications (in-app, push, WhatsApp)</li>
            </ul>
          </section>

          {/* ── 5. Gratuité du service ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">5. Gratuité du service</h2>
            <p>
              Le Service est actuellement proposé à titre <strong>gratuit</strong>. Aucun frais n&apos;est facturé
              aux résidents ni aux syndics pour l&apos;utilisation de la plateforme.
            </p>
            <p className="mt-2">
              Si des fonctionnalités payantes venaient à être introduites, les utilisateurs en seraient
              informés au préalable. Aucune facturation ne sera appliquée sans le consentement explicite
              de l&apos;utilisateur.
            </p>
          </section>

          {/* ── 6. Inscription et accès ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">6. Inscription et accès</h2>
            <p className="font-semibold text-ink">Pour les résidents :</p>
            <p className="mt-1">
              L&apos;accès se fait via un code d&apos;accès généré par le syndic via la plateforme
              et envoyé directement par WhatsApp au résident. Le syndic n&apos;a pas accès au code.
              Ce code est personnel et confidentiel.
            </p>

            <p className="mt-3 font-semibold text-ink">Pour les syndics :</p>
            <p className="mt-1">
              L&apos;inscription se fait en remplissant un formulaire (nom, téléphone, nom de l&apos;immeuble, ville,
              nombre de lots). Le numéro de téléphone est vérifié par un code OTP envoyé par WhatsApp.
              La demande est ensuite soumise à l&apos;administrateur de la plateforme pour validation.
              Après approbation, le syndic reçoit ses codes d&apos;accès par WhatsApp.
            </p>

            <p className="mt-3 font-semibold text-ink">Responsabilité de l&apos;utilisateur :</p>
            <p className="mt-1">
              Chaque utilisateur est responsable de la confidentialité de son code d&apos;accès et de toute activité
              effectuée avec celui-ci. En cas de perte, le syndic peut récupérer son code via un OTP envoyé
              sur son numéro de téléphone enregistré. Pour les résidents, le syndic peut générer
              un nouveau code qui sera envoyé directement par WhatsApp au résident.
            </p>
          </section>

          {/* ── 7. Rôles et responsabilités ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">7. Rôles et responsabilités</h2>
            <p>
              La plateforme distingue deux rôles principaux, chacun avec des droits et responsabilités distincts :
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                <strong>Résident</strong> : peut consulter ses charges, signaler des incidents, publier dans l&apos;espace
                de voisinage, voter en assemblée générale et gérer son profil.
              </li>
              <li>
                <strong>Syndic</strong> : dispose des droits de gestion de la copropriété. Il peut ajouter et gérer
                les résidents, émettre des charges, enregistrer des paiements, organiser des assemblées générales,
                gérer la comptabilité et modérer le contenu publié. Le syndic peut désactiver le compte d&apos;un résident
                dans le cadre de la gestion de la copropriété (départ d&apos;un résident, changement de propriétaire, etc.).
              </li>
            </ul>
            <p className="mt-2">
              Le syndic est seul responsable de l&apos;exactitude des données financières (charges, paiements, comptabilité)
              et des informations relatives aux résidents qu&apos;il saisit sur la plateforme.
            </p>
          </section>

          {/* ── 8. Obligations de l'utilisateur ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">8. Obligations de l&apos;utilisateur</h2>
            <p>L&apos;utilisateur s&apos;engage à :</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Fournir des informations exactes et à jour</li>
              <li>Ne pas détourner la plateforme de son usage prévu</li>
              <li>Respecter les autres résidents et utilisateurs</li>
              <li>Ne pas publier de contenu illicite, diffamatoire, injurieux ou contraire à l&apos;ordre public</li>
              <li>Ne pas uploader de fichiers malveillants, illicites ou portant atteinte aux droits de tiers</li>
              <li>Ne pas usurper l&apos;identité d&apos;un autre utilisateur ou d&apos;un prestataire</li>
              <li>Ne pas tenter d&apos;accéder aux données d&apos;autres résidences ou d&apos;autres utilisateurs</li>
            </ul>
          </section>

          {/* ── 9. Obligations de l'éditeur ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">9. Obligations de l&apos;éditeur</h2>
            <p>L&apos;éditeur s&apos;engage à :</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Mettre en œuvre les moyens raisonnables pour assurer la disponibilité et le bon fonctionnement du Service</li>
              <li>Protéger les données personnelles des utilisateurs conformément à la <strong>Loi 09-08</strong></li>
              <li>Ne pas transmettre les données personnelles à des tiers à des fins commerciales</li>
              <li>Informer les utilisateurs de toute modification substantielle du Service ou des présentes CGU</li>
              <li>Mettre à disposition un mécanisme de contact pour les réclamations</li>
              <li>Isoler les données de chaque résidence : un utilisateur ne peut accéder qu&apos;aux données de sa propre copropriété</li>
            </ul>
          </section>

          {/* ── 10. Contenu et fichiers ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">10. Contenu et fichiers uploadés</h2>
            <p>
              Les publications, commentaires, photos et documents partagés sur Palier sont sous la responsabilité
              de leur auteur. Le syndic de la copropriété assure la modération du contenu au sein de sa résidence.
            </p>
            <p className="mt-2">
              Les fichiers uploadés (photos, documents) sont limités à <strong>5 Mo</strong> par fichier.
              Seuls les formats images (JPG, PNG, WebP, HEIC) et documents (PDF, DOC, DOCX, XLS, XLSX) sont acceptés.
              Tout fichier non conforme sera rejeté automatiquement.
            </p>
            <p className="mt-2">
              En publiant du contenu, l&apos;utilisateur conserve l&apos;intégralité de ses droits de propriété intellectuelle
              sur celui-ci. Il accorde à Palier une licence non exclusive, limitée à l&apos;affichage de ce contenu
              auprès des membres de sa résidence, dans le seul cadre du fonctionnement du Service.
            </p>
          </section>

          {/* ── 11. Assemblées générales et votes ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">11. Assemblées générales et votes</h2>
            <p>
              Palier permet l&apos;organisation d&apos;assemblées générales ordinaires et extraordinaires, et le vote
              sur les résolutions proposées. Chaque utilisateur ne peut voter qu&apos;une seule fois par résolution.
              Le vote est enregistré de manière nominative et peut être modifié jusqu&apos;à la clôture de l&apos;assemblée.
            </p>
            <p className="mt-2">
              Les résultats des votes sont calculés selon les règles de majorité prévues par la Loi 18-00
              (majorité simple, trois quarts, unanimité) et pondérés par les tantièmes de chaque lot.
            </p>
            <p className="mt-2">
              Palier facilite le processus de vote et de convocation mais ne se substitue pas aux obligations
              légales de la copropriété. Le syndic reste responsable du respect des formalités légales de convocation,
              de quorum et de tenue des assemblées.
            </p>
          </section>

          {/* ── 12. Services et recommandations ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">12. Services et recommandations</h2>
            <p>
              Palier permet aux résidents de recommander des prestataires de services (plombier, électricien, etc.)
              et de rechercher des prestataires via l&apos;annuaire intégré. La recherche de prestataires
              utilise l&apos;API Google Places : les termes recherchés sont transmis à Google pour afficher les
              résultats. Aucune donnée personnelle de l&apos;utilisateur n&apos;est partagée avec Google lors de cette recherche.
            </p>
            <p className="mt-2">
              Les recommandations sont publiées sous la seule responsabilité de leur auteur.
              Palier n&apos;est ni intermédiaire, ni partie prenante dans la relation entre l&apos;utilisateur et le
              prestataire. Palier ne garantit pas la qualité, la disponibilité ou la fiabilité des prestataires
              affichés et décline toute responsabilité en cas de litige.
            </p>
          </section>

          {/* ── 13. Communications et notifications ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">13. Communications et notifications</h2>
            <p>Palier utilise les canaux de communication suivants :</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Notifications in-app</strong> : informations sur les charges, incidents, publications,
                assemblées et documents.
              </li>
              <li>
                <strong>Notifications push</strong> : envoyées via le navigateur, avec le consentement explicite
                de l&apos;utilisateur. Ce consentement peut être retiré à tout moment depuis les paramètres du navigateur.
              </li>
              <li>
                <strong>WhatsApp</strong> : utilisé pour l&apos;envoi de codes de vérification (OTP), de codes d&apos;accès
                après approbation, et de rappels de paiement par le syndic. Les messages sont envoyés
                via l&apos;API Infobip uniquement au numéro de téléphone fourni lors de l&apos;inscription.
              </li>
            </ul>
            <p className="mt-2">
              Vous pouvez gérer vos préférences de notification depuis votre profil.
            </p>
          </section>

          {/* ── 14. Données personnelles ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">14. Données personnelles</h2>
            <p>
              La collecte et le traitement des données personnelles sont régis par la{" "}
              <strong>Loi 09-08</strong> relative à la protection des personnes physiques à l&apos;égard du traitement
              des données à caractère personnel.
            </p>
            <p className="mt-2">
              Les données collectées par Palier (nom, téléphone, informations de copropriété) sont utilisées
              exclusivement pour le fonctionnement du Service. Elles ne sont ni vendues, ni transmises à des tiers
              à des fins commerciales.
            </p>
            <p className="mt-2">
              Conformément à la Loi 09-08, chaque utilisateur dispose d&apos;un droit
              d&apos;accès (art. 7), de rectification (art. 8) et d&apos;opposition (art. 9) sur ses données personnelles. Ces droits peuvent être
              exercés depuis la page « Mon profil » (export de données, suppression de compte) ou par email
              à <a href="mailto:contact@palier.ma" className="text-palier-600 underline">contact@palier.ma</a>.
            </p>
            <p className="mt-2">
              Pour plus de détails sur les données collectées, les durées de conservation, les mesures
              de sécurité et les transferts internationaux, consultez notre{" "}
              <Link href="/politique-confidentialite" className="text-palier-600 underline">politique de confidentialité</Link>.
            </p>
          </section>

          {/* ── 15. Responsabilité ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">15. Responsabilité et limites</h2>
            <p>
              Palier met en œuvre les moyens raisonnables pour assurer le bon fonctionnement du Service.
              Toutefois, Palier ne garantit pas une disponibilité ininterrompue de la plateforme et ne saurait
              être tenu responsable des dommages résultant d&apos;une indisponibilité temporaire, notamment en cas
              de maintenance, de mise à jour ou de problème technique indépendant de sa volonté.
            </p>
            <p className="mt-2">
              L&apos;éditeur s&apos;efforce de limiter la durée et la fréquence des interruptions de service.
            </p>
            <p className="mt-2">
              Palier n&apos;est pas responsable :
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Des décisions prises par les utilisateurs ou les syndics sur la base des informations affichées</li>
              <li>De l&apos;exactitude des montants de charges, paiements ou écritures comptables saisis par le syndic</li>
              <li>De la qualité ou de la fiabilité des prestataires de services affichés</li>
              <li>De l&apos;indisponibilité des services tiers (WhatsApp, notifications push, recherche de prestataires)</li>
            </ul>
            <p className="mt-2">
              Conformément à l&apos;article 19 de la Loi 31-08, les limitations de responsabilité prévues dans les présentes
              CGU ne s&apos;appliquent pas en cas de faute intentionnelle ou de négligence grave de l&apos;éditeur.
            </p>
          </section>

          {/* ── 16. Support et signalement ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">16. Support et signalement</h2>
            <p>
              En cas de problème technique, de suggestion d&apos;amélioration ou de toute autre remarque,
              l&apos;utilisateur peut soumettre un signalement directement depuis l&apos;application via la
              fonctionnalité <strong>« Votre avis »</strong> accessible depuis le profil (résidents)
              ou les paramètres (syndics). L&apos;utilisateur choisit son moyen de contact préféré
              (téléphone ou email) et peut consulter l&apos;historique de ses signalements ainsi que
              les réponses apportées par l&apos;équipe Palier.
            </p>
            <p className="mt-2">
              Les résidents peuvent également signaler une erreur dans leurs informations personnelles
              directement à leur syndic depuis leur profil dans l&apos;application.
            </p>
          </section>

          {/* ── 17. Propriété intellectuelle ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">17. Propriété intellectuelle</h2>
            <p>
              Le contenu, le design, le code source et les éléments graphiques de Palier sont protégés par le droit
              de la propriété intellectuelle. Toute reproduction, copie ou utilisation non autorisée est interdite.
            </p>
          </section>

          {/* ── 18. Durée et résiliation ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">18. Durée et résiliation</h2>
            <p>
              Les présentes CGU sont conclues pour une <strong>durée indéterminée</strong> à compter de l&apos;acceptation
              par l&apos;utilisateur.
            </p>

            <p className="mt-3 font-semibold text-ink">Résiliation par l&apos;utilisateur :</p>
            <p className="mt-1">
              L&apos;utilisateur peut supprimer son compte à tout moment depuis son profil, sans justification
              et sans frais. Lors de la suppression, les données personnelles sont anonymisées conformément
              à notre{" "}
              <Link href="/politique-confidentialite" className="text-palier-600 underline">politique de confidentialité</Link>.
              Les données comptables (charges, paiements) sont conservées conformément aux obligations légales
              (Loi 9-88, Décret 2.23.700 — durée minimale de 10 ans).
            </p>

            <p className="mt-3 font-semibold text-ink">Désactivation par le syndic :</p>
            <p className="mt-1">
              Le syndic peut désactiver le compte d&apos;un résident dans le cadre de la gestion de la copropriété
              (départ, changement de propriétaire, etc.). L&apos;utilisateur concerné en est informé lors de sa
              prochaine tentative de connexion.
            </p>
          </section>

          {/* ── 19. Droit de rétractation ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">19. Droit de rétractation</h2>
            <p>
              Conformément à l&apos;article 36 de la <strong>Loi 31-08</strong> relative à la protection du consommateur,
              l&apos;utilisateur dispose d&apos;un délai de <strong>sept (7) jours</strong> à compter de l&apos;acceptation
              des présentes CGU pour se rétracter, sans justification ni pénalité.
            </p>
            <p className="mt-2">
              Pour exercer ce droit, l&apos;utilisateur peut supprimer son compte depuis son profil ou
              contacter l&apos;éditeur par email
              à <a href="mailto:contact@palier.ma" className="text-palier-600 underline">contact@palier.ma</a>.
            </p>
          </section>

          {/* ── 20. Modification des CGU ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">20. Modification des CGU</h2>
            <p>
              L&apos;éditeur se réserve le droit de modifier les présentes CGU. En cas de modification substantielle,
              les utilisateurs en seront informés au moins <strong>trente (30) jours</strong> avant
              l&apos;entrée en vigueur des nouvelles conditions.
            </p>
            <p className="mt-2">
              Si l&apos;utilisateur n&apos;accepte pas les nouvelles conditions, il peut supprimer son compte avant leur
              entrée en vigueur. La poursuite de l&apos;utilisation du Service après l&apos;entrée en vigueur des
              nouvelles CGU vaut acceptation de celles-ci.
            </p>
          </section>

          {/* ── 21. Médiation et règlement des litiges ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">21. Médiation et règlement des litiges</h2>
            <p>
              En cas de différend relatif à l&apos;utilisation du Service, l&apos;utilisateur est invité à contacter
              l&apos;éditeur par email
              à <a href="mailto:contact@palier.ma" className="text-palier-600 underline">contact@palier.ma</a>{" "}
              afin de rechercher une solution amiable.
            </p>
            <p className="mt-2">
              À défaut de résolution amiable dans un délai de trente (30) jours, le litige pourra être soumis
              aux tribunaux compétents de Casablanca, conformément au droit marocain.
            </p>
            <p className="mt-2">
              Conformément à l&apos;article 31 de la Loi 31-08, la charge de la preuve du respect des obligations
              d&apos;information incombe à l&apos;éditeur.
            </p>
          </section>

          {/* ── 22. Droit applicable ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">22. Droit applicable</h2>
            <p>
              Les présentes CGU sont régies par le droit marocain, notamment :
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Le Dahir des Obligations et Contrats (DOC)</li>
              <li>La Loi 31-08 relative aux mesures de protection du consommateur</li>
              <li>La Loi 09-08 relative à la protection des personnes physiques à l&apos;égard du traitement des données à caractère personnel</li>
              <li>La Loi 53-05 relative à l&apos;échange électronique de données juridiques</li>
              <li>La Loi 18-00 relative au statut de la copropriété des immeubles bâtis</li>
            </ul>
          </section>

          {/* ── 23. Références juridiques ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">23. Références juridiques</h2>
            <p>
              Les lois marocaines citées dans l&apos;application et dans les présentes CGU sont fournies
              <strong> à titre purement informatif</strong> et ne constituent en aucun cas un conseil juridique.
            </p>
            <p className="mt-2">
              Palier ne garantit pas l&apos;exactitude, l&apos;exhaustivité ou l&apos;actualité de ces références.
              L&apos;utilisateur est invité à consulter un professionnel du droit pour toute question juridique.
            </p>
            <p className="mt-2">
              En aucun cas l&apos;éditeur ne pourra être tenu responsable d&apos;une erreur, omission ou
              interprétation inexacte d&apos;un texte de loi affiché dans l&apos;application.
            </p>
          </section>

          {/* ── 24. Dispositions générales ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">24. Dispositions générales</h2>
            <p>
              Si l&apos;une des clauses des présentes CGU est déclarée nulle ou inapplicable, les autres clauses
              restent en vigueur (clause de divisibilité).
            </p>
            <p className="mt-2">
              Les présentes CGU, ainsi que la{" "}
              <Link href="/politique-confidentialite" className="text-palier-600 underline">politique de confidentialité</Link>,
              constituent l&apos;intégralité de l&apos;accord entre l&apos;utilisateur et l&apos;éditeur concernant l&apos;utilisation
              du Service.
            </p>
          </section>

          {/* ── 25. Contact ── */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-ink">25. Contact</h2>
            <p>
              Pour toute question relative aux présentes CGU, aux données personnelles ou au fonctionnement
              du Service, vous pouvez contacter l&apos;éditeur par email
              à <a href="mailto:contact@palier.ma" className="text-palier-600 underline">contact@palier.ma</a> ou
              via la fonctionnalité « Votre avis » intégrée à l&apos;application (voir section 16).
            </p>
          </section>
        </div>
      </main>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-black/[0.06] bg-sand py-8">
        <div className="mx-auto max-w-3xl px-5 text-center text-[12px] text-ink-faint sm:px-8">
          © {new Date().getFullYear()} Palier. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
