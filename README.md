# Palier — La super-app des copropriétés marocaines

> Les concurrents digitalisent le syndic. **Palier digitalise la vie du copropriétaire.**

Plateforme complète de vie résidentielle : charges de copropriété, vie de l'immeuble, voisinage, et marketplace de services à domicile — côté **résident** (app mobile) et côté **syndic** (backoffice).

## Contenu du dépôt
- **`web/`** — application Next.js 16 (résident `/` + backoffice syndic `/syndic`), branchée sur Supabase. Voir [web/README.md](web/README.md).
- **`docs/`** — analyse vidéo écran par écran, architecture, modèle de données, roadmap.
- `WhatsApp Video … .mp4` — démo source ayant servi à la reconstruction.

## Démarrage rapide
```bash
cd web
cp .env.example .env.local
npm install
npm run dev          # http://localhost:3000
```
- App résident → http://localhost:3000
- Backoffice syndic → http://localhost:3000/syndic

## Stack
Next.js 16 · React 19 · Tailwind v4 · lucide-react · Supabase (Postgres + RLS).

## État
- ✅ App résident (5 onglets) branchée sur Supabase (lectures + écritures).
- ✅ Backoffice syndic (9 modules) dont **recouvrement** (relance WhatsApp/SMS/push).
- ⏳ À venir : auth OTP réelle + RLS strict, paiement in-app CMI + reçus PDF, app native Expo.
