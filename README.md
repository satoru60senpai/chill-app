# 🌴 Chill — On fait quoi aujourd'hui ?

**Chill** est l'application qui répond à la question « On fait quoi aujourd'hui ? » à **Lomé, Togo** : idées de sorties selon ton mood et ton budget, programmes multi-étapes avec budget détaillé (transport zémidjan, marge de sécurité), collections éditoriales et événements du week-end.

> Porteur du projet : **ND Software Studio** · MVP v1.0.0 · Prix indicatifs en FCFA

---

## ✨ Fonctionnalités (MVP)

| Domaine | Détail |
|---|---|
| 🏠 **Accueil** | Salutation personnalisée, météo Lomé en direct (open-meteo), moods rapides, populaires du moment, collections vedettes, événements du week-end |
| 🎲 **Générateur de sorties** | Mood + budget (1 000 – 15 000 FCFA) + nombre de personnes + moment + jour → programme multi-étapes horodaté (déjeuner, détente, pause, coucher de soleil…) |
| 🔒 **Budget non négociable** | Plafond strict : le moteur retire des étapes plutôt que de dépasser le budget ; marge de sécurité + transport zémidjan inclus |
| 📍 **Découvrir** | Recherche, filtres par catégorie et mood, 22 adresses de Lomé avec distances (géolocalisation, fallback centre-ville), collections éditoriales |
| 🗺️ **Fiches lieux** | Prix avec niveau de fiabilité (confirmé / partenaire / estimé), horaires, durée conseillée, services, itinéraire Google Maps, appel, signalement d'info incorrecte |
| ❤️ **Favoris & sorties** | Enregistrement local, statut à venir/terminée, statistiques, partage du programme en texte prêt pour WhatsApp |
| 🛠️ **Administration** | Espace équipe intégré (onglet Profil) : CRUD lieux / événements / collections + signalements, protégé par clé (`X-Admin-Key`) |
| 📴 **Mode faible connectivité** | Catalogue embarqué + cache service worker + données utilisateur locales (§19.5 du cahier des charges) |
| 📱 **PWA + APK** | Installable depuis le navigateur ; APK Android généré automatiquement par GitHub Actions (Capacitor) |

## 🧱 Stack technique

- **Next.js 16** (App Router) + **TypeScript** — SPA sur une seule route `/`
- **Tailwind CSS 4** + **shadcn/ui** + Quicksand — identité pastel (rose `#F9A9C5`, lavande `#B9A6E8`, crème `#FDF7EF`, corail `#EF7A64`)
- **Prisma + SQLite** — lieux, collections, événements, moods, sorties, favoris, signalements
- **Zustand** (persist localStorage) — profil, favoris, sorties, préférences
- **Capacitor 7** — habillage Android ; **GitHub Actions** — build APK à chaque push

## 🚀 Démarrage local

```bash
bun install
bun run db:push      # crée la base SQLite (db/custom.db)
bun run db:seed      # catalogue de démonstration Lomé (22 lieux, 5 collections…)
bun run dev          # http://localhost:3000
```

Variables d'environnement (`.env`) :
```
DATABASE_URL=file:/chemin/absolu/db/custom.db
ADMIN_KEY=chill-admin-2025   # optionnel, clé de l'espace équipe (défaut : chill-admin-2025)
```

> 🔐 Pense à **changer la clé admin** en production (`ADMIN_KEY`).

## 📱 Obtenir l'APK Android

Le workflow de build (contenu fourni dans **`docs/build-apk.yml`**) construit l'APK à chaque push sur `main` :

1. Ouvre l'onglet **Actions** du dépôt GitHub
2. Clique sur le run **« Build APK Android (Chill) »**
3. Télécharge l'artefact **`Chill-APK`** → `Chill-v1.0.0.apk`
4. Partage le fichier (WhatsApp, drive…) — sur Android, autorise « Installer des apps inconnues » puis installe

L'APK est un **build hors-ligne complet** : le catalogue est embarqué, la météo et le partage fonctionnent dès qu'une connexion est disponible, et aucune donnée personnelle ne quitte l'appareil.

> Pour une version « store », publie l'app en PWA sur un hébergement HTTPS puis génère un TWA signé avec [PWABuilder](https://www.pwabuilder.com).

## 🌍 Déployer la version web

Le projet est un Next.js standard :

- **Vercel / Netlify** : fonctionne pour la démo, mais SQLite est éphémère sur du serverless → préférer un VPS pour la production.
- **VPS (recommandé production)** : `bun run build && bun run start` derrière Nginx/Caddy, avec `DATABASE_URL` persistant.

## 🗂️ Structure

```
prisma/schema.prisma        # Modèle de données (§11 du cahier des charges)
prisma/seed.ts              # Catalogue Lomé de démonstration
src/lib/                    # types, catalogue embarqué, générateur de sorties, store, API
src/app/api/                # Routes REST : catalog, weather, plans, favorites, reports, admin/*
src/components/chill/       # Écrans + composants (Accueil, Découvrir, Générateur, Profil, Admin…)
public/images/              # Photos (générées) + icônes
.github/workflows/          # Build APK automatique
scripts/build-offline.mjs   # Export statique hors-ligne pour l'APK
```

## ⚠️ Avertissements

- **Nom « Chill » provisoire** : vérification juridique et commerciale à faire avant lancement public (cahier des charges §6.2).
- **Données de démonstration** : les établissements, prix et horaires sont indicatifs et doivent être vérifiés avant tout usage réel (§8.2).
- Les contenus sponsorisés sont explicitement identifiés dans l'interface (§5.6).

---

ND Software Studio · Lomé, Togo 🇹🇬
