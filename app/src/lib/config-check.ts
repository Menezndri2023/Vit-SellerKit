/**
 * Production configuration check, run by next.config.ts when Vercel builds the production
 * deployment: a missing variable fails the build instead of shipping localhost links,
 * "[Legal name]" placeholders on the legal pages or a Pro plan that can't be activated.
 * Pure function (no secrets are printed: only variable names).
 */
type Env = Record<string, string | undefined>;

export function productionConfigProblems(env: Env): string[] {
  const problems: string[] = [];
  const need = (name: string, why: string) => {
    if (!env[name]?.trim()) problems.push(`${name} is missing (${why})`);
  };

  const site = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!site) problems.push('NEXT_PUBLIC_SITE_URL is missing (canonical domain: sitemap, metadata, links in emails)');
  else if (!/^https:\/\//.test(site) || /localhost|127\.0\.0\.1/.test(site)) problems.push('NEXT_PUBLIC_SITE_URL must be the public https:// domain, not localhost');

  need('MONGODB_URI', 'database');
  need('APP_ENCRYPTION_KEY', 'share links, license keys, activation codes');
  if ((env.BETTER_AUTH_SECRET?.length ?? 0) < 32) problems.push('BETTER_AUTH_SECRET is missing or shorter than 32 characters');
  // Email verification is mandatory at sign-up: without Resend nobody can open an account
  need('RESEND_API_KEY', 'sign-up confirmation and password reset emails');
  need('CRON_SECRET', 'protects /api/cron/daily declared in vercel.json');
  need('LEGAL_ENTITY', 'publisher shown in the terms and privacy policy');
  need('LEGAL_ADDRESS', 'publisher address shown in the terms and privacy policy');
  need('CONTACT_EMAIL', 'contact shown in the terms and privacy policy');

  if ((env.BILLING_PROVIDER ?? 'gumroad') === 'gumroad') {
    need('GUMROAD_PRODUCT_ID_MONTHLY', 'license verification of Margokit Pro Monthly');
    need('GUMROAD_PRODUCT_ID_LIFETIME', 'license verification of Margokit Pro Lifetime');
    need('GUMROAD_PING_SECRET', 'secret part of the Gumroad Ping URL');
  }
  if (env.EINVOICE_PROVIDER === 'sandbox') problems.push('EINVOICE_PROVIDER=sandbox is a local simulation: use "none" in production');
  for (const name of Object.keys(env)) {
    if (name.startsWith('NEXT_PUBLIC_') && /SECRET|KEY|TOKEN|PASSWORD|MONGODB/i.test(name)) problems.push(`${name}: secrets must never use the NEXT_PUBLIC_ prefix (sent to the browser)`);
  }
  return problems;
}
