import 'server-only';
import { env } from './env';

type Email = { to: string; subject: string; html: string; text: string; replyTo?: string; attachments?: { filename: string; content: Buffer }[] };

/** Sends through Resend's HTTP API. Without RESEND_API_KEY (local dev), prints the email instead. */
export async function sendEmail({ to, subject, html, text, replyTo, attachments }: Email) {
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
    }),
  });
  if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`);
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Minimal branded layout: one message, one button. */
export function layout(title: string, body: string, button: { label: string; url: string }, footer: string) {
  return `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px" cellpadding="0" cellspacing="0">
<tr><td style="padding:32px">
<div style="font-weight:800;font-size:18px"><span style="display:inline-block;background:#a3e635;border-radius:8px;padding:2px 9px;margin-right:8px">M</span>Margokit</div>
<h1 style="font-size:22px;margin:28px 0 12px">${escapeHtml(title)}</h1>
<p style="font-size:15px;line-height:1.6;color:#475569;margin:0 0 24px">${escapeHtml(body)}</p>
<a href="${escapeHtml(button.url)}" style="display:inline-block;background:#a3e635;color:#0f172a;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:12px">${escapeHtml(button.label)}</a>
<p style="font-size:12px;color:#94a3b8;margin:28px 0 0">${escapeHtml(footer)}</p>
</td></tr></table></td></tr></table></body></html>`;
}

const copy = {
  en: {
    verify: { subject: 'Confirm your email — Margokit', title: 'Confirm your email', body: 'Click the button below to confirm your email address and open your Margokit account.', button: 'Confirm my email' },
    reset: { subject: 'Reset your password — Margokit', title: 'Reset your password', body: 'Someone (hopefully you) asked to reset your Margokit password. This link expires in 1 hour.', button: 'Choose a new password' },
    footer: "If you didn't ask for this, you can ignore this email.",
  },
  fr: {
    verify: { subject: 'Confirme ton e-mail — Margokit', title: 'Confirme ton e-mail', body: 'Clique sur le bouton ci-dessous pour confirmer ton adresse e-mail et ouvrir ton compte Margokit.', button: 'Confirmer mon e-mail' },
    reset: { subject: 'Réinitialise ton mot de passe — Margokit', title: 'Réinitialise ton mot de passe', body: 'Quelqu’un (toi, on l’espère) a demandé à réinitialiser ton mot de passe Margokit. Ce lien expire dans 1 heure.', button: 'Choisir un nouveau mot de passe' },
    footer: 'Si tu n’es pas à l’origine de cette demande, ignore cet e-mail.',
  },
} as const;

export function authEmail(kind: 'verify' | 'reset', locale: string | null | undefined, to: string, url: string): Email {
  const c = copy[locale === 'fr' ? 'fr' : 'en'];
  const k = c[kind];
  return {
    to,
    subject: k.subject,
    html: layout(k.title, k.body, { label: k.button, url }, c.footer),
    text: `${k.title}\n\n${k.body}\n\n${url}\n\n${c.footer}`,
  };
}

const planCopy = {
  en: {
    j7: { subject: 'Your Margokit Pro access ends in 7 days', body: 'Your Pro access ends on {date}. Renew now to keep unlimited invoices without watermark.' },
    j1: { subject: 'Your Margokit Pro access ends tomorrow', body: 'Your Pro access ends on {date}. Renew now so your next invoices stay unlimited and without watermark.' },
    expired: { subject: 'Your Margokit Pro access has ended', body: 'Your Pro access ended on {date}. Your documents are safe; you are back on the free plan (3 documents per month).' },
    button: 'Renew Pro',
    footer: 'You receive this email because you have a Margokit account.',
  },
  fr: {
    j7: { subject: 'Ton accès Margokit Pro se termine dans 7 jours', body: 'Ton accès Pro se termine le {date}. Renouvelle-le pour garder des factures illimitées et sans filigrane.' },
    j1: { subject: 'Ton accès Margokit Pro se termine demain', body: 'Ton accès Pro se termine le {date}. Renouvelle-le pour que tes prochaines factures restent illimitées et sans filigrane.' },
    expired: { subject: 'Ton accès Margokit Pro est terminé', body: 'Ton accès Pro s’est terminé le {date}. Tes documents sont conservés ; tu repasses au plan gratuit (3 documents par mois).' },
    button: 'Renouveler Pro',
    footer: 'Tu reçois cet e-mail car tu as un compte Margokit.',
  },
} as const;

export function planEmail(kind: 'j7' | 'j1' | 'expired', locale: string | null | undefined, to: string, date: Date, url: string): Email {
  const lang = locale === 'fr' ? 'fr' : 'en';
  const c = planCopy[lang];
  const body = c[kind].body.replace('{date}', new Intl.DateTimeFormat(lang, { dateStyle: 'long' }).format(date));
  return { to, subject: c[kind].subject, html: layout(c[kind].subject, body, { label: c.button, url }, c.footer), text: `${body}\n\n${url}` };
}
