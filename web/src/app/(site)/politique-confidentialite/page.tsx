import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/brand/Logo";

export const metadata = {
  title: "Politique de confidentialité | Palier",
  description: "Politique de confidentialité de Palier — protection des données personnelles conformément à la Loi 09-08.",
};

export default function PolitiqueConfidentialitePage() {
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
          Politique de confidentialité
        </h1>
        <p className="mt-2 text-[14px] text-[#6b7280]">Dernière mise à jour : août 2026</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-[#374151]">
          {/* 1. Responsable */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">1. Responsable du traitement</h2>
            <p>
              Le responsable du traitement des données est <strong>Palier</strong>, joignable à l&apos;adresse{" "}
              <a href="mailto:contact@palier.ma" className="text-[#0B7A57] underline">contact@palier.ma</a>.
            </p>
          </section>

          {/* 2. Données collectées */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">2. Données collectées</h2>
            <p>Dans le cadre de l&apos;utilisation de la plateforme, nous collectons les données suivantes :</p>

            <p className="mt-3 font-semibold text-[#111815]">Données d&apos;identification</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Nom complet</li>
              <li>Numéro de téléphone</li>
              <li>Adresse email (le cas échéant, via le formulaire de feedback ou les paramètres de l&apos;immeuble)</li>
              <li>Numéro de lot / appartement</li>
              <li>Rôle dans la copropriété (propriétaire, locataire, syndic)</li>
              <li>Ville</li>
              <li>Couleur d&apos;avatar choisie</li>
              <li>Quote-part en tantièmes (le cas échéant)</li>
            </ul>

            <p className="mt-3 font-semibold text-[#111815]">Données d&apos;usage et contenu</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Publications, commentaires et réactions (likes) sur le fil de voisinage</li>
              <li>Signalements d&apos;incidents (texte, catégorie, niveau d&apos;urgence)</li>
              <li>Photos et documents uploadés (incidents, publications, documents de copropriété)</li>
              <li>Votes lors des assemblées générales (choix individuel : pour, contre, abstention)</li>
              <li>Recommandations de prestataires (nom, téléphone, catégorie du prestataire)</li>
              <li>Messages de feedback envoyés via l&apos;application</li>
            </ul>

            <p className="mt-3 font-semibold text-[#111815]">Données financières</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Montants des charges et appels de fonds</li>
              <li>Paiements enregistrés (montant, méthode de paiement, date)</li>
            </ul>

            <p className="mt-3 font-semibold text-[#111815]">Données techniques</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Adresse IP (uniquement pour la limitation de débit / sécurité)</li>
              <li>Identifiant de souscription aux notifications push (endpoint et clés de chiffrement)</li>
            </ul>
          </section>

          {/* 3. Finalité */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">3. Finalité du traitement</h2>
            <p>Vos données sont traitées dans le but de fournir les services de gestion de copropriété proposés par Palier :</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Gestion des charges, appels de fonds et suivi des paiements</li>
              <li>Signalement et suivi des incidents</li>
              <li>Communication et entraide entre résidents (voisinage)</li>
              <li>Organisation des assemblées générales et enregistrement des votes</li>
              <li>Recherche de prestataires de services locaux</li>
              <li>Envoi de notifications (push, in-app) relatives à l&apos;activité de votre résidence</li>
              <li>Envoi de SMS pour les codes de vérification (OTP) lors de la connexion</li>
            </ul>
          </section>

          {/* 4. Base légale */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">4. Base légale</h2>
            <p>
              Le traitement de vos données repose sur l&apos;exécution du contrat de service liant l&apos;utilisateur à Palier,
              conformément à l&apos;article 3 de la <strong>Loi n° 09-08</strong> relative à la protection des personnes
              physiques à l&apos;égard du traitement des données à caractère personnel.
            </p>
            <p className="mt-2">
              L&apos;envoi de notifications push repose sur votre consentement explicite, recueilli via la permission
              de votre navigateur ou appareil. Vous pouvez retirer ce consentement à tout moment depuis les
              paramètres de votre navigateur.
            </p>
          </section>

          {/* 5. Sous-traitants */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">5. Sous-traitants et services tiers</h2>
            <p>Nous faisons appel aux sous-traitants et services suivants pour le fonctionnement de la plateforme :</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Supabase</strong> (AWS, Europe / États-Unis) — hébergement de la base de données, authentification et stockage de fichiers</li>
              <li><strong>Twilio / Infobip</strong> (États-Unis / Europe) — envoi de SMS pour les codes de vérification (OTP)</li>
              <li><strong>Google Places API</strong> (États-Unis) — recherche de prestataires de services locaux. Les requêtes de recherche sont envoyées à Google ; aucune donnée personnelle n&apos;est transmise</li>
              <li><strong>Service Web Push</strong> (navigateur) — acheminement des notifications push via les serveurs de votre navigateur (Google pour Chrome, Mozilla pour Firefox, Apple pour Safari)</li>
            </ul>
          </section>

          {/* 6. Transferts internationaux */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">6. Transferts internationaux de données</h2>
            <p>
              Certains de nos sous-traitants (Supabase, Twilio, Google) sont situés en dehors du Maroc,
              notamment aux États-Unis et en Europe. Ces transferts sont encadrés par des clauses contractuelles
              garantissant un niveau de protection adéquat, conformément aux articles 43 et 44 de la <strong>Loi 09-08</strong>.
            </p>
          </section>

          {/* 7. Durée de conservation */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">7. Durée de conservation</h2>
            <p>
              Vos données personnelles sont conservées pendant toute la durée d&apos;utilisation de votre compte.
              En cas de suppression de votre compte :
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Données effacées :</strong> nom, téléphone, avatar, notifications, likes, codes d&apos;accès, abonnements push</li>
              <li><strong>Données anonymisées :</strong> publications, incidents signalés et votes en assemblée générale — le contenu
                est conservé pour l&apos;historique de la copropriété mais l&apos;auteur est remplacé par « [Supprimé] »</li>
              <li><strong>Données conservées :</strong> charges et paiements — obligation comptable du syndic
                (Décret n° 2.23.700, Loi comptable n° 9-88)</li>
            </ul>
            <p className="mt-2">
              Les codes de vérification OTP sont automatiquement supprimés après 5 minutes.
            </p>
          </section>

          {/* 8. Vos droits */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">8. Vos droits</h2>
            <p>Conformément aux articles 7, 8, 9 et 12 de la Loi 09-08, vous disposez des droits suivants :</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Droit d&apos;accès</strong> (art. 7) — obtenir une copie de vos données personnelles (export disponible depuis votre profil)</li>
              <li><strong>Droit de rectification</strong> (art. 9) — corriger des données inexactes ou incomplètes</li>
              <li><strong>Droit de suppression</strong> — demander l&apos;effacement de vos données (suppression disponible depuis votre profil)</li>
              <li><strong>Droit d&apos;opposition</strong> (art. 12) — vous opposer au traitement de vos données pour des motifs légitimes</li>
            </ul>
            <p className="mt-2">
              L&apos;export et la suppression de compte sont accessibles directement depuis votre profil dans l&apos;application.
              Pour les autres droits, contactez-nous à{" "}
              <a href="mailto:contact@palier.ma" className="text-[#0B7A57] underline">contact@palier.ma</a>.
              Nous nous engageons à répondre à toute demande dans un délai maximum de <strong>trente (30) jours</strong>.
            </p>
          </section>

          {/* 9. Réclamation auprès de la CNDP */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">9. Réclamation auprès de la CNDP</h2>
            <p>
              Si vous estimez que le traitement de vos données ne respecte pas la réglementation en vigueur,
              vous avez le droit d&apos;introduire une réclamation auprès de la{" "}
              <strong>Commission Nationale de contrôle de la protection des Données à caractère Personnel (CNDP)</strong>,
              autorité de contrôle compétente au Maroc
              (<a href="https://www.cndp.ma" target="_blank" rel="noopener noreferrer" className="text-[#0B7A57] underline">www.cndp.ma</a>).
            </p>
          </section>

          {/* 10. Mesures de sécurité */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">10. Mesures de sécurité</h2>
            <p>
              Palier met en œuvre des mesures techniques et organisationnelles appropriées pour protéger
              vos données personnelles contre tout accès, altération, divulgation ou destruction non autorisés :
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Chiffrement</strong> — toutes les communications sont chiffrées (HTTPS).
                Les sessions utilisateur sont signées et stockées de manière sécurisée.
              </li>
              <li>
                <strong>Contrôle d&apos;accès</strong> — chaque action est restreinte selon le rôle
                de l&apos;utilisateur (résident, syndic, administrateur). Les données de chaque résidence
                sont isolées et inaccessibles aux autres résidences.
              </li>
              <li>
                <strong>Protection contre les abus</strong> — les tentatives de connexion sont limitées
                en fréquence. Les codes de vérification expirent après quelques minutes et sont bloqués
                après plusieurs tentatives incorrectes.
              </li>
              <li>
                <strong>Validation et sécurité des données</strong> — toutes les données soumises sont
                validées côté serveur. Les fichiers uploadés sont vérifiés par type et limités en taille.
              </li>
            </ul>
          </section>

          {/* 11. Cookies et stockage local */}
          <section>
            <h2 className="mb-2 text-[18px] font-bold text-[#111815]">11. Cookies et stockage local</h2>
            <p>Palier utilise les cookies et mécanismes de stockage suivants, tous strictement nécessaires au fonctionnement de l&apos;application :</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Cookie de session</strong> (<code className="rounded bg-[#f4f5f2] px-1.5 py-0.5 text-[13px]">palier_session</code>)
                {" "}— marqué <code className="rounded bg-[#f4f5f2] px-1.5 py-0.5 text-[13px]">httpOnly</code>, contient l&apos;identifiant
                de session chiffré. Strictement nécessaire à l&apos;authentification.
              </li>
              <li>
                <strong>Cookie d&apos;accès bêta</strong> (<code className="rounded bg-[#f4f5f2] px-1.5 py-0.5 text-[13px]">palier_beta</code>)
                {" "}— marqué <code className="rounded bg-[#f4f5f2] px-1.5 py-0.5 text-[13px]">httpOnly</code>, durée 365 jours.
                Indique l&apos;accès au programme bêta.
              </li>
              <li>
                <strong>Stockage local du navigateur</strong> (localStorage) — préférences de langue, thème (clair/sombre),
                préférences de notifications. Ces données restent sur votre appareil et ne sont jamais transmises à nos serveurs.
              </li>
            </ul>
            <p className="mt-2">
              Aucun cookie publicitaire ou de traçage n&apos;est utilisé. Ces cookies et données de stockage local
              sont strictement nécessaires au fonctionnement de l&apos;application et ne nécessitent pas de consentement
              préalable.
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
