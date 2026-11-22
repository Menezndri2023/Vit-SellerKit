# Gumroad — Margokit Pro (Monthly, Annual et Lifetime)

> À copier-coller dans Gumroad. Les blocs `texte` sont destinés aux clients.
> Trois produits distincts (l'app a besoin d'un Product ID par formule), même description de base.
> `{{URL_APP}}` = l'adresse de l'app en production (`https://margokit-pro.vercel.app` au départ, `https://margokit.com` une fois le domaine branché).
> Réglages techniques côté app (Product ID, Ping, test) : [app/README.md](../../app/README.md), section 4.

## Réglages des produits

| Champ Gumroad | Pro Monthly | Pro Annual | Pro Lifetime |
|---|---|---|---|
| Type | **Membership** (abonnement) | **Membership**, récurrence **Yearly** uniquement | Produit numérique |
| Nom | `Margokit Pro — Monthly` | `Margokit Pro — Annual` | `Margokit Pro — Lifetime` |
| URL | `margokit.gumroad.com/l/pro-monthly` | `margokit.gumroad.com/l/pro-annual` | `margokit.gumroad.com/l/pro-lifetime` |
| Prix | **5 $ / mois** | **49 $ / an** (2 mois offerts) | **99 $** une fois |
| Clés de licence | ✅ **Generate a unique license key per sale** | ✅ idem | ✅ idem |
| Bouton | `Subscribe` | `Subscribe` | `I want this!` |
| Résumé (sous le bouton) | `Unlimited invoices, automatic reminders. Cancel anytime.` | `Everything in Pro for 12 months — 2 months free.` | `Everything in Pro, forever. Pay once.` |
| Tags | `invoice`, `invoicing`, `quote`, `freelance`, `small business`, `factur-x`, `facture`, `devis` | idem | idem |
| Remboursement | 14 jours | 14 jours | 14 jours |
| PPP | ✅ (comme les templates — attention, le champ PPP liste les produits **exclus**) | ✅ | ✅ |
| Codes promo | Aucun au lancement | Aucun | `EARLY` peut s'appliquer (vérifie qu'il n'est pas en « tous les produits **sauf** ») |

Une fois créés : Monthly et Lifetime sont déjà branchés ; pour Annual, lance `bash scripts/gumroad-annual-setup.sh` depuis `app/` (il enregistre l'ID, l'URL et le prix sur Vercel).

---

## Description (à coller telle quelle — remplace la 1re ligne de prix selon le produit)

```text
🇫🇷 Version française plus bas ↓

Professional quotes and invoices in one minute — in English or French.

Margokit Pro is a simple web app for freelancers, online sellers and small businesses. Create a quote, turn it into an invoice in one click when your client says yes, send it by link, email or WhatsApp, and see what's paid and what's overdue.

You can start free (3 documents per month). This product unlocks Pro.

━━━━━━━━━━━━━━━━
WHAT PRO UNLOCKS
━━━━━━━━━━━━━━━━

✔ Unlimited quotes, invoices and credit notes
✔ No "Made with Margokit" watermark
✔ Automatic reminders: Margokit emails clients who pay late (1, 7 and 15 days after the due date), in your name
✔ Recurring invoices: a ready-to-issue draft every month, quarter or year
✔ Plus everything in the free plan: your logo, payment links, bank details and SEPA QR code, sharing by link, email and WhatsApp, paid / overdue tracking

━━━━━━━━━━━━━━━━
BUILT FOR REAL INVOICING
━━━━━━━━━━━━━━━━

• Automatic, gap-free numbering; quote → invoice → credit note
• Your tax IDs and the legal mentions of your country, multiple tax rates and currencies
• PDF in English or French
• Ready for e-invoicing: European EN 16931 standard, Factur-X and UBL/Peppol exports
• Works in your browser, on computer and phone. Nothing to install.

━━━━━━━━━━━━━━━━
HOW TO ACTIVATE
━━━━━━━━━━━━━━━━

1. Create your free account: {{URL_APP}}/en/signup
2. After your purchase, copy the license key from your receipt.
3. Paste it on {{URL_APP}}/en/activate — Pro is active immediately.

━━━━━━━━━━━━━━━━
FAQ
━━━━━━━━━━━━━━━━

Can I try before paying?
Yes. The free plan lets you issue 3 documents per month, with a small watermark.

Monthly or lifetime?
Monthly is $5/month, cancel anytime. Annual is $49/year (2 months free). Lifetime is $99 once, with all future updates.

Does it replace my accountant?
No. Margokit helps you produce clean, compliant-ready documents; your accountant remains your reference for tax questions.

Is my data safe?
Your data is stored in the EU. You can export or delete your account at any time from your settings.

What if it's not for me?
Email us within 14 days for a full refund.

My card was declined (Morocco, Africa…)
Message us on WhatsApp: {{LIEN_WHATSAPP}} — you can pay locally and receive an activation code.

━━━━━━━━━━━━━━━━
🇫🇷 FRANÇAIS
━━━━━━━━━━━━━━━━

Des devis et factures professionnels en une minute, en français ou en anglais.

Margokit Pro est une application web simple pour les freelances, les vendeurs en ligne et les petites entreprises. Crée un devis, transforme-le en facture en un clic quand ton client dit oui, envoie-le par lien, e-mail ou WhatsApp, et vois ce qui est payé et ce qui est en retard.

Tu peux commencer gratuitement (3 documents par mois). Ce produit débloque Pro.

CE QUE PRO DÉBLOQUE

✔ Devis, factures et avoirs illimités
✔ Plus de filigrane « Fait avec Margokit »
✔ Relances automatiques : Margokit écrit à tes clients en retard (1, 7 et 15 jours après l'échéance), à ton nom
✔ Factures récurrentes : un brouillon prêt à émettre chaque mois, trimestre ou année
✔ Et tout ce qu'offre le plan gratuit : ton logo, liens de paiement, RIB et QR code SEPA, partage par lien, e-mail et WhatsApp, suivi des paiements et des retards

FAIT POUR FACTURER POUR DE VRAI

• Numérotation automatique et continue ; devis → facture → avoir
• Tes identifiants fiscaux et les mentions légales de ton pays, plusieurs taux de TVA et devises
• PDF en français ou en anglais
• Prêt pour la facture électronique : norme européenne EN 16931, exports Factur-X et UBL/Peppol
• Dans ton navigateur, sur ordinateur et téléphone. Rien à installer.

ACTIVER PRO

1. Crée ton compte gratuit : {{URL_APP}}/fr/signup
2. Après l'achat, copie la clé de licence de ton reçu.
3. Colle-la sur {{URL_APP}}/fr/activate — Pro est actif tout de suite.

QUESTIONS FRÉQUENTES

Je peux essayer avant de payer ? Oui : l'offre gratuite permet 3 documents par mois, avec un petit filigrane.
Mensuel, annuel ou à vie ? Mensuel : 5 $/mois, résiliable à tout moment. Annuel : 49 $/an (2 mois offerts). À vie : 99 $ une fois, mises à jour incluses.
Ça remplace mon comptable ? Non. Margokit t'aide à produire des documents propres et prêts pour la réforme ; ton comptable reste ta référence pour les questions fiscales.
Mes données sont en sécurité ? Elles sont hébergées dans l'UE. Tu peux exporter ou supprimer ton compte à tout moment depuis tes paramètres.
Et si ça ne me convient pas ? Écris-nous sous 14 jours : remboursement complet.
Ma carte a été refusée (Maroc, Afrique…) : écris-nous sur WhatsApp : {{LIEN_WHATSAPP}} — tu paies localement et tu reçois un code d'activation.
```

---

## Contenu livré après l'achat (onglet « Content »)

```text
🎉 Thank you! / Merci !

Your license key / Ta clé de licence :
{license_key}

1. Create your free account / Crée ton compte gratuit :
   {{URL_APP}}/en/signup  ·  {{URL_APP}}/fr/signup
2. Paste your key here / Colle ta clé ici :
   {{URL_APP}}/en/activate  ·  {{URL_APP}}/fr/activate

Pro is active immediately. / Pro est actif immédiatement.

Need help? / Besoin d'aide ? WhatsApp : {{LIEN_WHATSAPP}}
```

> Vérifie dans Gumroad que `{license_key}` est bien remplacé dans le reçu de test (sinon, la clé figure de toute façon dans l'e-mail de reçu Gumroad).
