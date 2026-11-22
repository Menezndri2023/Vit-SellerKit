import { connectDb } from '@/lib/db';
import { isValidUnsubscribe, optOut } from '@/lib/onboarding';

const TEXT = {
  fr: { ask: 'Ne plus recevoir les conseils de prise en main de Margokit ?', button: 'Me désinscrire', done: 'C’est fait : tu ne recevras plus ces conseils. Les e-mails indispensables (sécurité, abonnement) continuent.', invalid: 'Ce lien n’est pas valide.' },
  en: { ask: 'Stop receiving Margokit getting-started tips?', button: 'Unsubscribe', done: 'Done: you won’t receive these tips anymore. Essential emails (security, subscription) continue.', invalid: 'This link is not valid.' },
  ar: { ask: 'إيقاف تلقي نصائح البدء من Margokit؟', button: 'إلغاء الاشتراك', done: 'تم: لن تتلقى هذه النصائح بعد الآن. تستمر الرسائل الضرورية (الأمان، الاشتراك).', invalid: 'هذا الرابط غير صالح.' },
} as const;

function page(lang: keyof typeof TEXT, body: string, status = 200) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  return new Response(
    `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Margokit</title></head><body style="font-family:system-ui,sans-serif;background:#f8fafc;color:#0f172a;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px"><main style="max-width:440px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:28px"><p style="font-weight:800;margin:0 0 16px">Margokit</p>${body}</main></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  );
}

const params = (req: Request) => {
  const q = new URL(req.url).searchParams;
  const l = q.get('l');
  return { u: q.get('u') ?? '', t: q.get('t') ?? '', lang: (l === 'fr' || l === 'ar' ? l : 'en') as keyof typeof TEXT };
};

/** Link in the email: confirmation page (mail scanners that open links don't unsubscribe anyone). */
export async function GET(req: Request) {
  const { u, t, lang } = params(req);
  const x = TEXT[lang];
  if (!isValidUnsubscribe(u, t)) return page(lang, `<p>${x.invalid}</p>`, 400);
  const action = `/api/email/unsubscribe?u=${encodeURIComponent(u)}&t=${encodeURIComponent(t)}&l=${lang}`;
  return page(lang, `<p>${x.ask}</p><form method="post" action="${action}"><button style="margin-top:12px;height:44px;padding:0 20px;border:0;border-radius:12px;background:#a3e635;color:#0f172a;font-weight:700;cursor:pointer">${x.button}</button></form>`);
}

/** Confirmation button, and one-click unsubscribe from the mail client (List-Unsubscribe-Post). */
export async function POST(req: Request) {
  const { u, t, lang } = params(req);
  if (!isValidUnsubscribe(u, t)) return page(lang, `<p>${TEXT[lang].invalid}</p>`, 400);
  await connectDb();
  await optOut(u);
  return page(lang, `<p>${TEXT[lang].done}</p>`);
}
