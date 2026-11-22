import 'server-only';
import { publisherLine } from './brand';
import { env } from './env';

type Email = { to: string; subject: string; html: string; text: string; replyTo?: string; attachments?: { filename: string; content: Buffer }[]; headers?: Record<string, string> };

/** Sends through Resend's HTTP API. Without RESEND_API_KEY (local dev), prints the email instead. */
export async function sendEmail({ to, subject, html, text, replyTo, attachments, headers }: Email) {
  const { RESEND_API_KEY, EMAIL_FROM } = env();
  if (!RESEND_API_KEY) {
    console.info(`\n[email] to=${to}\nsubject=${subject}\n${text}\n${attachments?.length ? `attachments=${attachments.map((a) => a.filename).join(', ')}\n` : ''}`);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text,
      reply_to: replyTo,
      attachments: attachments?.map((a) => ({ filename: a.filename, content: a.content.toString('base64') })),
      headers,
    }),
  });
  if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`);
}


const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Minimal branded layout: one message, one button. */
export function layout(title: string, body: string, button: { label: string; url: string }, footer: string, lang = 'en', unsubscribe?: { label: string; url: string }) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  return `<!doctype html><html lang="${lang}" dir="${dir}"><body dir="${dir}" style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px" cellpadding="0" cellspacing="0">
<tr><td style="padding:32px">
<div style="font-weight:800;font-size:18px"><span style="display:inline-block;background:#a3e635;border-radius:8px;padding:2px 9px;margin-right:8px">M</span>Margokit</div>
<h1 style="font-size:22px;margin:28px 0 12px">${escapeHtml(title)}</h1>
<p style="font-size:15px;line-height:1.6;color:#475569;margin:0 0 24px">${escapeHtml(body)}</p>
<a href="${escapeHtml(button.url)}" style="display:inline-block;background:#a3e635;color:#0f172a;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:12px">${escapeHtml(button.label)}</a>
<p style="font-size:12px;color:#94a3b8;margin:28px 0 0">${escapeHtml(footer)}${unsubscribe ? ` <a href="${escapeHtml(unsubscribe.url)}" style="color:#64748b">${escapeHtml(unsubscribe.label)}</a>` : ''}</p>
</td></tr></table>
<p style="font-size:11px;color:#94a3b8;margin:16px 0 0">${escapeHtml(publisherLine(lang))}</p>
</td></tr></table></body></html>`;
}

const copy = {
  en: {
    verify: { subject: 'Confirm your email — Margokit', title: 'Confirm your email', body: 'Click the button below to confirm your email address and open your Margokit account.', button: 'Confirm my email' },
    reset: { subject: 'Reset your password — Margokit', title: 'Reset your password', body: 'Someone (hopefully you) asked to reset your Margokit password. This link expires in 1 hour.', button: 'Choose a new password' },
    footer: "If you didn't ask for this, you can ignore this email.",
  },
  ar: {
    verify: { subject: 'أكّد بريدك الإلكتروني — Margokit', title: 'أكّد بريدك الإلكتروني', body: 'انقر على الزر أدناه لتأكيد بريدك الإلكتروني وفتح حسابك في Margokit.', button: 'تأكيد بريدي' },
    reset: { subject: 'إعادة تعيين كلمة المرور — Margokit', title: 'إعادة تعيين كلمة المرور', body: 'طلب أحدهم (نتمنى أن تكون أنت) إعادة تعيين كلمة مرور حسابك في Margokit. تنتهي صلاحية هذا الرابط بعد ساعة.', button: 'اختيار كلمة مرور جديدة' },
    footer: 'إن لم تطلب ذلك، يمكنك تجاهل هذه الرسالة.',
  },
  fr: {
    verify: { subject: 'Confirme ton e-mail — Margokit', title: 'Confirme ton e-mail', body: 'Clique sur le bouton ci-dessous pour confirmer ton adresse e-mail et ouvrir ton compte Margokit.', button: 'Confirmer mon e-mail' },
    reset: { subject: 'Réinitialise ton mot de passe — Margokit', title: 'Réinitialise ton mot de passe', body: 'Quelqu’un (toi, on l’espère) a demandé à réinitialiser ton mot de passe Margokit. Ce lien expire dans 1 heure.', button: 'Choisir un nouveau mot de passe' },
    footer: 'Si tu n’es pas à l’origine de cette demande, ignore cet e-mail.',
  },
} as const;

const langOf = (locale: string | null | undefined) => (locale === 'fr' || locale === 'ar' ? locale : 'en');

export function authEmail(kind: 'verify' | 'reset', locale: string | null | undefined, to: string, url: string): Email {
  const lang = langOf(locale);
  const c = copy[lang];
  const k = c[kind];
  return {
    to,
    subject: k.subject,
    html: layout(k.title, k.body, { label: k.button, url }, c.footer, lang),
    text: `${k.title}\n\n${k.body}\n\n${url}\n\n${c.footer}`,
  };
}

const planCopy = {
  en: {
    j7: { subject: 'Your Margokit Pro access ends in 7 days', body: 'Your Pro access ends on {date}. Renew now to keep unlimited invoices without watermark.' },
    j1: { subject: 'Your Margokit Pro access ends tomorrow', body: 'Your Pro access ends on {date}. Renew now so your next invoices stay unlimited and without watermark.' },
    expired: { subject: 'Your Margokit Pro access has ended', body: 'Your Pro access ended on {date}. Your documents are safe; you are back on the free plan (3 documents per month).' },
    button: 'Renew Pro',
    trial: {
      j1: { subject: 'Your Margokit Pro trial ends tomorrow', body: 'Your 7-day Pro trial ends on {date}. Choose a plan (from $5/month) to keep unlimited invoices without watermark, automatic reminders and recurring invoices.' },
      expired: { subject: 'Your Margokit Pro trial has ended', body: 'Your Pro trial ended on {date}. Your documents are safe; you are on the free plan (3 documents per month). Pro starts at $5/month.' },
      button: 'Choose a plan',
    },
    footer: 'You receive this email because you have a Margokit account.',
  },
  ar: {
    j7: { subject: 'ينتهي وصولك إلى Margokit Pro بعد 7 أيام', body: 'ينتهي وصولك إلى Pro في {date}. جدّده الآن لتحتفظ بفواتير غير محدودة وبدون علامة.' },
    j1: { subject: 'ينتهي وصولك إلى Margokit Pro غدًا', body: 'ينتهي وصولك إلى Pro في {date}. جدّده الآن لتبقى فواتيرك القادمة غير محدودة وبدون علامة.' },
    expired: { subject: 'انتهى وصولك إلى Margokit Pro', body: 'انتهى وصولك إلى Pro في {date}. مستنداتك محفوظة، وقد عدت إلى الخطة المجانية (3 مستندات شهريًا).' },
    button: 'تجديد Pro',
    trial: {
      j1: { subject: 'تنتهي تجربتك لـ Margokit Pro غدًا', body: 'تنتهي تجربتك المجانية لـ Pro (7 أيام) في {date}. اختر خطة (ابتداءً من 5 $ شهريًا) لتحتفظ بفواتير غير محدودة وبدون علامة، والتذكيرات التلقائية والفواتير المتكررة.' },
      expired: { subject: 'انتهت تجربتك لـ Margokit Pro', body: 'انتهت تجربتك لـ Pro في {date}. مستنداتك محفوظة، وأنت الآن على الخطة المجانية (3 مستندات شهريًا). يبدأ Pro من 5 $ شهريًا.' },
      button: 'اختر خطة',
    },
    footer: 'تصلك هذه الرسالة لأن لديك حسابًا في Margokit.',
  },
  fr: {
    j7: { subject: 'Ton accès Margokit Pro se termine dans 7 jours', body: 'Ton accès Pro se termine le {date}. Renouvelle-le pour garder des factures illimitées et sans filigrane.' },
    j1: { subject: 'Ton accès Margokit Pro se termine demain', body: 'Ton accès Pro se termine le {date}. Renouvelle-le pour que tes prochaines factures restent illimitées et sans filigrane.' },
    expired: { subject: 'Ton accès Margokit Pro est terminé', body: 'Ton accès Pro s’est terminé le {date}. Tes documents sont conservés ; tu repasses au plan gratuit (3 documents par mois).' },
    button: 'Renouveler Pro',
    trial: {
      j1: { subject: 'Ton essai Margokit Pro se termine demain', body: 'Ton essai Pro de 7 jours se termine le {date}. Choisis une offre (dès 5 $/mois) pour garder les factures illimitées sans filigrane, les relances automatiques et les factures récurrentes.' },
      expired: { subject: 'Ton essai Margokit Pro est terminé', body: 'Ton essai Pro s’est terminé le {date}. Tes documents sont conservés ; tu es sur le plan gratuit (3 documents par mois). Pro est à partir de 5 $/mois.' },
      button: 'Choisir une offre',
    },
    footer: 'Tu reçois cet e-mail car tu as un compte Margokit.',
  },
} as const;

export function planEmail(kind: 'j7' | 'j1' | 'expired', locale: string | null | undefined, to: string, date: Date, url: string, trial = false): Email {
  const lang = langOf(locale);
  const c = planCopy[lang];
  // The trial has its own wording ("choose a plan", not "renew"); it never gets the 7-day email
  const k = trial && kind !== 'j7' ? c.trial[kind] : c[kind];
  const button = trial ? c.trial.button : c.button;
  const body = k.body.replace('{date}', new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-nu-latn' : lang, { dateStyle: 'long' }).format(date));
  return { to, subject: k.subject, html: layout(k.subject, body, { label: button, url }, c.footer, lang), text: `${body}\n\n${url}` };
}

const reviewCopy = {
  en: { subject: 'Confirm your review — Margokit', title: 'Confirm your review', body: 'Thanks for your review of {kit}! Click the button to confirm it. We read every review before publishing it. This link is valid for 7 days.', button: 'Confirm my review', footer: "If you didn't write a review, ignore this email: nothing will be published." },
  ar: { subject: 'أكّد تقييمك — Margokit', title: 'أكّد تقييمك', body: 'شكرًا على تقييمك لـ {kit}! انقر على الزر لتأكيده. نقرأ كل تقييم قبل نشره. الرابط صالح لمدة 7 أيام.', button: 'تأكيد تقييمي', footer: 'إن لم تكتب تقييمًا، تجاهل هذه الرسالة: لن يُنشر شيء.' },
  fr: { subject: 'Confirme ton avis — Margokit', title: 'Confirme ton avis', body: 'Merci pour ton avis sur {kit} ! Clique sur le bouton pour le confirmer. On lit chaque avis avant de le publier. Ce lien est valable 7 jours.', button: 'Confirmer mon avis', footer: 'Si tu n’as pas écrit d’avis, ignore cet e-mail : rien ne sera publié.' },
} as const;

export function reviewConfirmEmail(locale: string | null | undefined, to: string, kitName: string, url: string): Email {
  const c = reviewCopy[langOf(locale)];
  const body = c.body.replace('{kit}', kitName);
  return { to, subject: c.subject, html: layout(c.title, body, { label: c.button, url }, c.footer, langOf(locale)), text: `${c.title}\n\n${body}\n\n${url}\n\n${c.footer}` };
}

// ── Onboarding series (sent by the daily cron; one-click unsubscribe) ──────────────────────

export type OnboardingKind = 'first' | 'share' | 'pro';

const onboardingCopy = {
  fr: {
    first: { subject: 'Ta première facture en 2 minutes', title: 'Ta première facture en 2 minutes', body: 'Ton compte Margokit est prêt. Renseigne une fois ton entreprise, ajoute un client, puis crée ta facture : les totaux, la TVA et les mentions légales sont calculés pour toi. Le plan gratuit comprend 3 documents par mois.', button: 'Créer ma première facture', path: '/app' },
    share: { subject: 'Fais-toi payer plus vite', title: 'Fais-toi payer plus vite', body: 'Ajoute ton RIB et tes liens de paiement (Stripe, PayPal, Wise…) dans Paramètres : ils apparaissent sur chaque facture, avec un QR code de virement pour les factures en euros. Ensuite, envoie la facture par lien, e-mail ou WhatsApp, et suis ce qui est payé ou en retard.', button: 'Ajouter mes moyens de paiement', path: '/app/settings' },
    pro: { subject: 'Ce que Margokit Pro débloque', title: 'Ce que Margokit Pro débloque', body: 'Avec Pro, tu émets autant de devis, factures et avoirs que tu veux, sans la mention « Réalisé avec Margokit », et Margokit relance automatiquement tes clients en retard de paiement. 5 $ par mois sans engagement, 49 $ par an, ou 99 $ une fois pour toujours. Paiement par carte, ou localement via WhatsApp.', button: 'Voir les offres Pro', path: '/activate' },
    footer: 'Tu reçois ces conseils de prise en main car tu as créé un compte Margokit.',
    unsubscribe: 'Ne plus recevoir ces conseils',
  },
  en: {
    first: { subject: 'Your first invoice in 2 minutes', title: 'Your first invoice in 2 minutes', body: 'Your Margokit account is ready. Fill in your business once, add a client, then create your invoice: totals, VAT and legal mentions are calculated for you. The free plan includes 3 documents per month.', button: 'Create my first invoice', path: '/app' },
    share: { subject: 'Get paid faster', title: 'Get paid faster', body: 'Add your bank details and payment links (Stripe, PayPal, Wise…) in Settings: they appear on every invoice, with a transfer QR code on euro invoices. Then send the invoice by link, email or WhatsApp, and track what is paid or overdue.', button: 'Add my payment methods', path: '/app/settings' },
    pro: { subject: 'What Margokit Pro unlocks', title: 'What Margokit Pro unlocks', body: 'With Pro, you issue as many quotes, invoices and credit notes as you want, without the “Made with Margokit” mention, and Margokit automatically reminds clients who pay late. $5 a month, cancel anytime, $49 a year, or $99 once, forever. Pay by card, or locally through WhatsApp.', button: 'See Pro plans', path: '/activate' },
    footer: 'You receive these getting-started tips because you created a Margokit account.',
    unsubscribe: 'Stop these tips',
  },
  ar: {
    first: { subject: 'فاتورتك الأولى في دقيقتين', title: 'فاتورتك الأولى في دقيقتين', body: 'حسابك في Margokit جاهز. املأ معلومات نشاطك مرة واحدة، أضف عميلًا، ثم أنشئ فاتورتك: المجاميع والضريبة والبيانات القانونية تُحسب لك. الخطة المجانية تشمل 3 مستندات شهريًا.', button: 'أنشئ فاتورتي الأولى', path: '/app' },
    share: { subject: 'احصل على أموالك أسرع', title: 'احصل على أموالك أسرع', body: 'أضف معلوماتك البنكية وروابط الدفع (Stripe وPayPal وWise…) في الإعدادات: تظهر في كل فاتورة، مع رمز QR للتحويل في الفواتير باليورو. ثم أرسل الفاتورة عبر رابط أو بريد إلكتروني أو واتساب، وتابع المدفوع والمتأخر.', button: 'أضف وسائل الدفع', path: '/app/settings' },
    pro: { subject: 'ما يتيحه لك Margokit Pro', title: 'ما يتيحه لك Margokit Pro', body: 'مع Pro، تصدر عددًا غير محدود من عروض الأسعار والفواتير والإشعارات الدائنة، بدون عبارة «Made with Margokit»، ويذكّر Margokit تلقائيًا عملاءك المتأخرين في الدفع. 5 دولارات شهريًا بدون التزام، أو 49 دولارًا سنويًا، أو 99 دولارًا مرة واحدة للأبد. الدفع بالبطاقة أو محليًا عبر واتساب.', button: 'اطّلع على عروض Pro', path: '/activate' },
    footer: 'تصلك نصائح البدء هذه لأنك أنشأت حسابًا في Margokit.',
    unsubscribe: 'إيقاف هذه النصائح',
  },
} as const;

export function onboardingEmail(kind: OnboardingKind, locale: string | null | undefined, to: string, site: string, unsubscribeUrl: string): Email {
  const lang = langOf(locale);
  const c = onboardingCopy[lang];
  const k = c[kind];
  const url = `${site}/${lang}${k.path}?utm_source=email&utm_medium=onboarding&utm_campaign=${kind}`;
  return {
    to,
    subject: k.subject,
    html: layout(k.title, k.body, { label: k.button, url }, c.footer, lang, { label: c.unsubscribe, url: unsubscribeUrl }),
    text: `${k.title}\n\n${k.body}\n\n${url}\n\n${c.footer}\n${c.unsubscribe}: ${unsubscribeUrl}`,
    // One-click unsubscribe (RFC 8058), required by Gmail/Yahoo for bulk senders
    headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
  };
}

// ── Overdue invoice reminders (sent to the user's client, on behalf of the user) ─────────────

const reminderCopy = {
  fr: {
    subject: { 1: 'Rappel : facture {number} — {seller}', 7: 'Deuxième rappel : facture {number} — {seller}', 15: 'Dernier rappel : facture {number} — {seller}' },
    lead: { 1: 'Bonjour,', 7: 'Bonjour,', 15: 'Bonjour,' },
    body: {
      1: 'Sauf erreur de notre part, la facture {number} de {seller}, arrivée à échéance le {due}, n’est pas encore réglée. Reste à payer : {amount}. Vous pouvez la consulter et la régler en suivant le lien ci-dessous. Si le paiement a déjà été effectué, merci de ne pas tenir compte de ce message.',
      7: 'Nous revenons vers vous au sujet de la facture {number} de {seller}, échue depuis le {due}. Reste à payer : {amount}. Vous trouverez la facture et les moyens de paiement en suivant le lien ci-dessous. Si le paiement a déjà été effectué, merci de ne pas tenir compte de ce message.',
      15: 'Malgré nos précédents rappels, la facture {number} de {seller}, échue depuis le {due}, reste impayée. Reste à payer : {amount}. Merci de procéder au règlement ou de répondre à cet e-mail si vous rencontrez une difficulté.',
    },
    button: 'Voir la facture',
    footer: 'Message envoyé par Margokit pour le compte de {seller}. Pour toute question, répondez simplement à cet e-mail.',
  },
  en: {
    subject: { 1: 'Reminder: invoice {number} — {seller}', 7: 'Second reminder: invoice {number} — {seller}', 15: 'Final reminder: invoice {number} — {seller}' },
    lead: { 1: 'Hello,', 7: 'Hello,', 15: 'Hello,' },
    body: {
      1: 'Unless we are mistaken, invoice {number} from {seller}, due on {due}, has not been paid yet. Amount due: {amount}. You can view and pay it from the link below. If you have already paid, please disregard this message.',
      7: 'We are following up on invoice {number} from {seller}, due since {due}. Amount due: {amount}. The invoice and the payment options are available from the link below. If you have already paid, please disregard this message.',
      15: 'Despite our previous reminders, invoice {number} from {seller}, due since {due}, remains unpaid. Amount due: {amount}. Please settle it, or reply to this email if anything prevents you from doing so.',
    },
    button: 'View the invoice',
    footer: 'Message sent by Margokit on behalf of {seller}. For any question, simply reply to this email.',
  },
} as const;

export function reminderEmail(
  step: 1 | 7 | 15,
  lang: string,
  v: { to: string; seller: string; sellerEmail?: string; number: string; amount: string; due: string; url: string },
): Email {
  const c = reminderCopy[lang === 'fr' ? 'fr' : 'en'];
  const fill = (s: string) => s.replaceAll('{number}', v.number).replaceAll('{seller}', v.seller).replaceAll('{amount}', v.amount).replaceAll('{due}', v.due);
  const subject = fill(c.subject[step]);
  const body = `${c.lead[step]} ${fill(c.body[step])}`;
  return {
    to: v.to,
    subject,
    html: layout(subject, body, { label: c.button, url: v.url }, fill(c.footer), lang === 'fr' ? 'fr' : 'en'),
    text: `${body}\n\n${v.url}\n\n${fill(c.footer)}`,
    replyTo: v.sellerEmail,
  };
}

// ── Recurring invoices: a new draft is ready (to the user) ───────────────────────────────────

const recurringCopy = {
  fr: { subject: 'Ta facture récurrente est prête à émettre', body: 'Margokit a préparé le brouillon de ta facture récurrente{client}. Vérifie-le (lignes, dates, montants), puis émets-le et envoie-le à ton client.', button: 'Voir le brouillon', footer: 'Tu reçois cet e-mail car tu as programmé une facture récurrente dans Margokit.' },
  en: { subject: 'Your recurring invoice is ready to issue', body: 'Margokit prepared the draft of your recurring invoice{client}. Check it (lines, dates, amounts), then issue it and send it to your client.', button: 'Open the draft', footer: 'You receive this email because you scheduled a recurring invoice in Margokit.' },
  ar: { subject: 'فاتورتك المتكررة جاهزة للإصدار', body: 'أعدّ Margokit مسودة فاتورتك المتكررة{client}. تحقق منها (الأسطر والتواريخ والمبالغ)، ثم أصدرها وأرسلها إلى عميلك.', button: 'عرض المسودة', footer: 'تصلك هذه الرسالة لأنك برمجت فاتورة متكررة في Margokit.' },
} as const;

export function recurringReadyEmail(locale: string | null | undefined, to: string, clientName: string, url: string): Email {
  const lang = langOf(locale);
  const c = recurringCopy[lang];
  const client = clientName ? (lang === 'fr' ? ` pour ${clientName}` : lang === 'ar' ? ` لـ ${clientName}` : ` for ${clientName}`) : '';
  const body = c.body.replace('{client}', client);
  return { to, subject: c.subject, html: layout(c.subject, body, { label: c.button, url }, c.footer, lang), text: `${body}\n\n${url}` };
}
