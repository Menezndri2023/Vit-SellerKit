'use server';

import { getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { randomToken, sha256 } from '@/lib/crypto';
import { connectDb } from '@/lib/db';
import { reviewConfirmEmail, sendEmail } from '@/lib/email';
import { fieldErrors, type FormState } from '@/lib/forms';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { verificationFor } from '@/lib/reviews';
import { reviewFormSchema } from '@/lib/reviews-shared';
import { getSession } from '@/lib/session';
import { siteUrl } from '@/lib/site-url';
import { Review } from '@/models/Review';

const WEEK = 7 * 86_400_000;

/**
 * Public review form. Signed-in users with a verified email go straight to moderation;
 * everyone else confirms by email first (stops spam and proves the address for the "verified" badge).
 * Returns id = 'pending' or 'confirm' so the form shows the right message.
 */
export async function submitReview(_prev: FormState, form: FormData): Promise<FormState> {
  const raw = Object.fromEntries(form);
  const parsed = reviewFormSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  if (!(await rateLimit('review', await clientIp(), 5, 3600))) return { errors: { _form: 'rateLimited' } };

  const locale = routing.locales.includes(raw.locale as never) ? String(raw.locale) : routing.defaultLocale;
  const session = await getSession();
  const user = session?.user;
  const email = user?.emailVerified ? user.email.toLowerCase() : parsed.data.email;
  if (!email) return { errors: { email: 'required' } };

  const { kit, rating, name, location, comment } = parsed.data;
  const direct = Boolean(user?.emailVerified);
  const token = direct ? null : randomToken();
  await connectDb();
  await Review.findOneAndUpdate(
    { kit, email },
    {
      $set: {
        rating, name, location: location ?? null, comment, locale,
        userId: user?.id ?? null,
        status: direct ? 'pending' : 'unconfirmed',
        verified: direct ? await verificationFor(kit, email, user!.id) : null,
        confirmTokenHash: token ? sha256(token) : null,
        expireAt: token ? new Date(Date.now() + WEEK) : null,
        approvedAt: null,
      },
    },
    { upsert: true, setDefaultsOnInsert: true },
  );

  if (token) {
    const t = await getTranslations({ locale, namespace: 'reviews' });
    const url = `${await siteUrl()}/${locale}/reviews/confirm?token=${encodeURIComponent(token)}`;
    await sendEmail(reviewConfirmEmail(locale, email, t(`kits.${kit}.name`), url)).catch((e) => console.error('[reviews] confirmation email failed', e));
  }
  return { ok: true, id: direct ? 'pending' : 'confirm' };
}

/** Called from the confirmation page button (not on page load, so email link scanners don't confirm). */
export async function confirmReview(form: FormData) {
  const token = String(form.get('token') ?? '');
  const locale = routing.locales.includes(form.get('locale') as never) ? String(form.get('locale')) : routing.defaultLocale;
  let ok = false;
  if (token.length >= 20 && token.length <= 100) {
    await connectDb();
    const review = await Review.findOne({ confirmTokenHash: sha256(token), status: 'unconfirmed' });
    if (review) {
      review.status = 'pending';
      review.verified = await verificationFor(review.kit, review.email, review.userId ?? undefined);
      review.confirmTokenHash = undefined;
      review.expireAt = undefined;
      await review.save();
      ok = true;
    }
  }
  redirect({ href: `/reviews/confirm?${ok ? 'done=1' : 'error=1'}`, locale });
}
