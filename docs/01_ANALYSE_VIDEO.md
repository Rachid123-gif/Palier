# PALIER — Analyse intégrale de la vidéo (reconstitution écran par écran)

> Source : `WhatsApp Video 2026-06-19 at 12.07.56.mp4` (162 s) + 3 captures Services.
> Méthode : extraction de 109 frames (1 / 1,5 s), transcription verbatim des textes, montants, badges, navigation.

## 0. Identité observée
- **Nom** : Palier — baseline *« Le voisinage en confiance. »*
- **Mention écran de lancement** : `TRUST LEDGER · v1.0`
- **Plateforme** : app iOS native, FR, marché marocain (MAD, Casablanca, Rabat…).
- **Palette** : vert sapin / teal `#1E5B50`→`#2D5A4D`, dégradé olive `#6B7A3F`, fond crème `#F5F1ED`, accent corail/orange `#D97D6F`, badges statut (orange/bleu/vert), rouge alerte `#D64545`.
- **Navigation principale (bottom tab, 5 items)** : Accueil · Factures · Immeuble · Voisinage · Profil.
  > ⚠️ Incohérence relevée : dans les captures Services le bottom nav devient *Accueil · Mes charges · Immeuble · Voisinage · Services · Profil* (6 items). À unifier.

## 1. Parcours observé (chronologie)
1. **Splash** (`Palier` / baseline / `Commencer →` / `Déjà un compte ? Se connecter`).
2. **Onboarding tel** : saisie `+212`, écran sécurité « Votre numéro reste privé… », stepper 3 étapes.
3. **OTP** : 4 cases, `(Dev) Code envoyé : 0000`, renvoi 22 s.
4. **Accueil** : carte « À PAYER MAINTENANT 1234,95 MAD / 3 factures », 3 quick actions (Payer / Services / Signaler), « Vie de l'immeuble » (2 incidents, 1 annonce syndic, AG dans 13 j), « Services recommandés ».
5. **Factures** : « Total à régler 1234,95 MAD », « Tout payer en 1 clic », liste Redal/inwi/Lydec, « Ajouter une facture » (catalogue opérateurs).
6. **Immeuble** : « Résidence Al Manar · Bd Anfa · Casablanca », alerte 2 incidents, 3 KPI (Solde −5950 MAD / Paiement 87 % / 2 incidents), 4 actions (Payer charges, Signaler, Documents, Voter AG), Activité, **Transparence** (dernière dépense, dernier paiement, caisse, « Vérifier la cohérence des comptes »).
7. **Signalements** : CTA « Signaler un problème », groupes Ouvert/En cours/Résolu.
8. **Formulaire incident** : 11 catégories (Ascenseur, Fuite, Électricité, Sécurité, Propreté, Nuisibles, Nuisance sonore, Parking, Parties communes, Jardinier, Autre), 4 niveaux d'urgence, titre, détails, info « syndic notifié immédiatement ».
9. **Services à domicile (hero)** : « Tout pour la maison. », 5 catégories (Ménage/Plombier/Élec/Clim/Jardin), badges (Vérifiés, 4.8/5, Assurés, < 1 min), preuve sociale « Khadija, Mehdi & 142 voisins », recherche, onglets Maintenant/Aujourd'hui/Demain, « Populaires cette semaine », « Offres spéciales » (abonnement hebdo −20 %, 1er ménage 1 MAD, clim −30 %, plombier urgent), « Toutes les catégories ».
10. **Sélecteur de ville (bottom sheet)** : « Détection automatique » + Casablanca (10), Marrakech (4), Rabat (4 ✓), Tanger (2).
11. **Liste prestataires** : cartes (avatar initiales, Top voisins, Vérifié, note + avis, quartier, description, prix dès X MAD, Dispo aujourd'hui, Appeler / WhatsApp / Réserver|Sélectionné).
12. **Réservation** : choix créneau (dates + heures), RÉCAP (prestataire/service/date/prix), « Paiement après la prestation », « Confirmer la réservation » → toast « ✓ Réservation envoyée · confirme sous 1h ».
13. **Voisinage** : alerte incidents, onglets Tout/Annonces/Événements/Entraide/Trouvé, fil type Facebook Groups (post épinglé syndic AG, réactions 👍❤️😂😮, commentaires), modal « Publier dans le voisinage » (0/300).
14. **Notifications** (overlay) : factures Lydec/Redal/inwi disponibles.

## 2. Inventaire complet des fonctionnalités VISIBLES
### Auth & onboarding
- Splash + value prop, login téléphone + OTP SMS (mock `0000`), sélecteur de langue (FR), stepper.

### Accueil (résident)
- Salutation contextuelle (Bonsoir), badge notifications, carte « à payer » agrégée, quick actions, digest « vie de l'immeuble », carrousel services recommandés.

### Factures / Charges
- Total agrégé, paiement unitaire et « tout payer en 1 clic », statut « À payer », échéances, ajout de facture via catalogue opérateurs (Redal, Lydec, inwi, Orange, Maroc Telecom, Amendis, RADEEMA, RADEEC, RADEES, ONEE).
  > ⚠️ Le brief impose : **MVP = charges de copropriété UNIQUEMENT**. Les opérateurs (Redal/Lydec/Inwi/IAM/Orange) doivent être RETIRÉS du MVP. C'est l'écart #1 entre la vidéo et la cible.

### Immeuble
- Fiche résidence, KPI (solde caisse, taux de paiement, incidents ouverts), actions, activité/timeline, **Transparence financière** (dépenses, paiements, caisse, vérification cohérence), AG à venir, documents, votes, réservation espaces communs (mentionné), travaux/budget.

### Incidents
- Liste par statut, fil de commentaires par incident, création (catégorie + urgence + média implicite), notification syndic.

### Services (marketplace)
- Hero premium, catégories, recherche, tri par disponibilité, offres/promos, preuve sociale, géolocalisation + sélecteur de ville, liste prestataires riches, fiche prestataire, **flow de réservation avec créneaux**, contact direct (Appeler/WhatsApp), paiement après prestation.

### Voisinage (social)
- Fil multi-catégories, post épinglé syndic, réactions, commentaires, composer (limite 300), badges de rôle (Syndic).

### Transverse
- Notifications (badge + overlay liste), multilingue (FR, drapeau), design system cohérent.

## 3. Logique métier déduite (par écran)
| Écran | Règles métier déduites |
|---|---|
| Accueil | Agrège *charges en attente* du lot du résident ; digest = N incidents ouverts + prochaine AG + dernière annonce ; recommandations = services populaires de la ville du résident. |
| Charges | Une charge = appel de fonds émis par le syndic sur un lot, avec échéance, statut (à payer / partiel / payé / en retard), reçu PDF. « Tout payer » = somme des charges dues du résident. |
| Immeuble | KPI calculés : solde = entrées − sorties de caisse ; taux paiement = charges encaissées / appelées sur la période ; incidents ouverts = count statut≠résolu. Transparence = journal signé (Trust Ledger) des opérations de caisse. |
| Incidents | Workflow : Ouvert → En cours → Résolu ; affectation syndic/prestataire ; fil de discussion ; urgence pilote la notification. |
| Services | Géoloc → ville → prestataires actifs filtrés par catégorie & zone ; ranking (note, avis, « Top voisins », dispo) ; réservation crée une demande (statut: envoyée → confirmée sous 1h) ; paiement hors-app (cash/après presta) au MVP. |
| Voisinage | Posts scoped à l'immeuble ; rôles (résident/syndic) ; modération implicite ; réactions + commentaires ; types = annonce/événement/entraide/trouvé. |

## 4. Écarts vidéo ↔ cible (à corriger absolument)
1. **Charges** : retirer les opérateurs (Redal/Lydec/Inwi/IAM/Orange) du MVP → ne garder que les charges de copropriété.
2. **Écran vide Services** (« Aucun prestataire pour le moment » / « Pas de prestataire dans votre zone — Californie ») → **interdit**. Remplacer par état « Faire une demande / Demander un devis / Nous trouvons quelqu'un pour vous ».
3. **Bottom nav incohérent** (5 vs 6 items) → unifier.
4. **Données de test visibles** (« Test », « Voiture mal gareée », `(Dev) Code 0000`) → seed crédible, jamais de placeholders en démo.
5. **Flow Réserver** : la vidéo ouvre une réservation in-app ; le brief impose en plus l'étape **Maintenant / Aujourd'hui / Planifier** puis **WhatsApp pré-rempli**. À ajouter.
6. **Trust Ledger** : ne jamais afficher le terme seul → libellé « Transparence financière » (déjà partiellement fait, à généraliser).
7. **Localisation par défaut** « Californie (Casablanca) » = bug de géoloc → détection réelle + fallback ville.
8. **Photos prestataires** : initiales seulement aujourd'hui → exiger photo unique par prestataire, jamais dupliquée.
