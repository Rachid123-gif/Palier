# Palier — App résident (Next.js)

Super-app de copropriété marocaine. App résident mobile-first (PWA), reconstruite fidèlement depuis la démo vidéo puis améliorée.

## Lancer
```bash
cd web
npm install
npm run dev        # http://localhost:3000
```
Ouvrir sur mobile ou réduire la fenêtre du navigateur en format téléphone (DevTools responsive).

## Écrans livrés (5 onglets + sous-écrans)
| Route | Écran |
|---|---|
| `/` | Accueil — carte à payer, accès rapides, vie de l'immeuble, services recommandés |
| `/charges` | Charges **copropriété uniquement** — total, paiement (CMI/virement/espèces), historique, reçu PDF |
| `/immeuble` | Cœur copro — KPI santé, **Transparence financière** (ledger signé), AG, activité |
| `/immeuble/signaler` | Signalement incident (11 catégories, urgence) + liste par statut |
| `/immeuble/ag` | AG, ordre du jour, votes pondérés tantièmes |
| `/immeuble/documents` | PV, contrats, assurance |
| `/voisinage` | Fil social (annonces/événements/entraide/trouvé), réactions, composer |
| `/services` | **Héros conservé** — catégories, géoloc, offres, populaires |
| `/services/[category]` | Liste prestataires riches · **anti-écran-vide** (jamais « Aucun prestataire ») |
| `/services/prestataire/[id]` | Fiche + **flow Maintenant/Aujourd'hui/Planifier → WhatsApp pré-rempli** |

## Conformité au cahier des charges
- ✅ Charges = copropriété seulement (pas de Redal/Lydec/Inwi/IAM/Orange).
- ✅ Jamais « Aucun prestataire » → « Faire une demande / Demander un devis ».
- ✅ Jamais « Trust Ledger » seul → « Transparence financière ».
- ✅ Géolocalisation + changement de ville (Glovo-like).
- ✅ Prestataires : nom, tél, WhatsApp, note, avis, quartier, ville, badges, **avatar unique** (jamais dupliqué).
- ✅ Bottom nav unifié 5 onglets, design premium, micro-interactions, aucun écran vide.

## Backoffice syndic (`/syndic/*`)
| Route | Module |
|---|---|
| `/syndic` | Tableau de bord (KPIs, santé recouvrement, marketplace, incidents) |
| `/syndic/recouvrement` | **Recouvrement** — table par lot/statut, relance WhatsApp/SMS/push + relance groupée (loguée en base) |
| `/syndic/charges` | Appels de fonds & suivi |
| `/syndic/incidents` | Kanban incidents (live, signalés par les résidents) |
| `/syndic/residents` | Résidents & lots |
| `/syndic/transparence` | Journal de caisse signé + enregistrer une opération |
| `/syndic/marketplace` | Prestataires, réservations, demandes de devis |
| `/syndic/ag` · `/syndic/documents` | AG/votes · coffre-fort documents |

## Backend Supabase
Projet `palier` (eu-west-3). Lectures résident via `src/lib/queries.ts` → `DataProvider` (server-side dans le layout). Lectures syndic via `src/lib/syndic.ts`. Écritures via `src/lib/actions.ts` (incident, post, booking, devis, paiement, dunning, opération de caisse). Variables dans `.env.local`. Schéma + RLS gérés par migrations Supabase ; types DB générables via MCP/CLI.

## Stack
Next.js 16 · React 19 · Tailwind v4 · lucide-react · @supabase/supabase-js.

## Reste à construire (phases suivantes)
1. **Auth OTP réelle** (Supabase phone auth + provider SMS) → durcir les policies RLS multi-tenant (actuellement permissives pour la démo).
2. Paiement in-app (CMI/wallet) + génération reçus PDF + notifications push réelles (Expo/WhatsApp Cloud API).
3. App native Expo (réutilise les tokens du design system).
