# Margokit — Profit Calculator

Calculateur de bénéfice gratuit (EN/FR) : coût réel par commande livrée (retours inclus), bénéfice et marge, prix minimum, prix pour 30 % et 50 % de marge, coût pub max, ROAS minimum, ventes pour rentabiliser un budget pub. Image 9:16 à partager en story, lien partageable avec les chiffres, récolte d'e-mails.

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · next-intl 4 · Zod · Vercel Analytics. Aucune base de données.

## En local

```bash
cd calculator
npm install
cp .env.example .env.local   # puis remplis les valeurs
npm run dev                  # http://localhost:3000
npm test                     # tests des calculs (mêmes résultats que le Pack Google Sheets)
```

## Déployer sur Vercel (gratuit)

1. Pousse le dépôt sur GitHub.
2. https://vercel.com/new → importe le dépôt → **Root Directory : `calculator`** (Next.js est détecté tout seul).
3. **Environment Variables** : copie celles de `.env.example` avec tes vraies valeurs.
4. **Deploy**. Puis Settings → Domains pour brancher ton domaine, et mets à jour `NEXT_PUBLIC_SITE_URL`.
5. Onglet **Analytics** → Enable (gratuit sur le plan Hobby) : visites + événements `share_result`, `copy_link`, `subscribe`.

> Le plan Hobby de Vercel est réservé à un usage non commercial. Un site qui vend des produits est un usage commercial : vérifie les conditions actuelles sur vercel.com/pricing et passe au plan Pro quand les ventes démarrent.

## Récolte des e-mails (gratuit, dans un Google Sheet)

Suis les instructions en tête de [email-capture/Code.gs](email-capture/Code.gs), puis renseigne `SUBSCRIBE_WEBHOOK_URL` et `SUBSCRIBE_WEBHOOK_SECRET` sur Vercel. Pour envoyer des e-mails à ta liste plus tard : importe le CSV dans un outil gratuit (Brevo, MailerLite…) et ajoute un lien de désinscription (obligatoire).

## Structure

| Fichier | Rôle |
|---|---|
| `src/lib/profit.ts` | Les calculs (fonction pure, testée dans `profit.test.ts`) |
| `src/lib/calculator-state.ts` | Préréglages de plateformes, devises, lecture/écriture des paramètres d'URL |
| `src/components/Calculator.tsx` | Formulaire + résultats en direct + partage |
| `src/app/api/share/route.tsx` | Image 1080×1920 du résultat (`next/og`) |
| `src/app/api/subscribe/route.ts` | Inscription e-mail : validation Zod, pot de miel anti-bot, limite 5/min/IP |
| `src/app/[locale]/opengraph-image.tsx` | Image d'aperçu des liens (1200×630) |
| `messages/en.json`, `messages/fr.json` | Tous les textes |
| `next.config.ts` | En-têtes de sécurité (CSP, HSTS, X-Frame-Options…) |

## Ajouter une langue (ex. arabe)

1. `messages/ar.json` (copie de `en.json`, traduit).
2. `src/i18n/routing.ts` : ajoute `'ar'` à `locales`.
3. Pour le RTL : dans `src/app/[locale]/layout.tsx`, ajoute `dir={locale === 'ar' ? 'rtl' : 'ltr'}` sur `<html>` et une police arabe (`IBM_Plex_Sans_Arabic` via `next/font/google`).
4. Ajoute `ar` dans `messages` de `src/app/api/share/route.tsx` et `opengraph-image.tsx`, et dans le schéma `locale` de `src/app/api/subscribe/route.ts`.

## Frais préréglés

Dans `src/lib/calculator-state.ts` (`PLATFORM_PRESETS`), vérifiés en septembre 2026, arrondis, pour un vendeur standard aux États-Unis. Ils changent souvent : revérifie-les chaque trimestre sur les pages de frais d'Etsy, Shopify et TikTok Shop.
