import 'server-only';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { nextCookies } from 'better-auth/next-js';
import { admin, twoFactor } from 'better-auth/plugins';
import { ObjectId } from 'mongodb';
import { blocksSocialSignIn } from './two-factor-policy';
import { mongoClient } from './db';
import { authEmail, sendEmail } from './email';
import { env, googleEnabled } from './env';

function createAuth() {
  const e = env();
  const client = mongoClient();

  return betterAuth({
    appName: 'Margokit',
    baseURL: e.BETTER_AUTH_URL ?? e.NEXT_PUBLIC_SITE_URL,
    secret: e.BETTER_AUTH_SECRET,
    database: mongodbAdapter(client.db(), { client }),

    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      // A verified email is required: Gumroad purchases are linked to accounts by email.
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail(authEmail('reset', (user as { uiLocale?: string }).uiLocale, user.email, url));
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail(authEmail('verify', (user as { uiLocale?: string }).uiLocale, user.email, url));
      },
    },
    socialProviders: googleEnabled()
      ? { google: { clientId: e.GOOGLE_CLIENT_ID!, clientSecret: e.GOOGLE_CLIENT_SECRET! } }
      : undefined,

    user: {
      additionalFields: {
        uiLocale: { type: 'string', required: false, defaultValue: 'en', input: true },
        timeZone: { type: 'string', required: false, defaultValue: 'UTC', input: true },
      },
    },

    // Stored in MongoDB so limits hold across all serverless instances
    rateLimit: {
      // Automated tests create many accounts; the switch is ignored on Vercel production
      enabled: !(process.env.E2E_DISABLE_RATE_LIMIT === '1' && process.env.VERCEL_ENV !== 'production'),
      storage: 'database',
      window: 60,
      max: 100,
      customRules: {
        '/sign-in/email': { window: 60, max: 5 },
        '/sign-up/email': { window: 60, max: 3 },
        '/request-password-reset': { window: 300, max: 3 },
        '/send-verification-email': { window: 300, max: 3 },
      },
    },

    // Two-factor authentication (authenticator app + backup codes). Required for admins (see session.ts).
    // Better Auth only asks the second factor on email/password sign-in, so admins can't sign in with Google.
    plugins: [admin({ defaultRole: 'user', adminRoles: ['admin'] }), twoFactor({ issuer: 'Margokit' }), nextCookies()],
    databaseHooks: {
      session: {
        create: {
          before: async (session, ctx) => {
            if (!ctx?.path?.startsWith('/callback') || !ObjectId.isValid(String(session.userId))) return;
            const u = await client.db().collection('user').findOne({ _id: new ObjectId(String(session.userId)) }, { projection: { role: 1 } });
            if (blocksSocialSignIn(u?.role as string | undefined, ctx.path)) return false;
          },
        },
      },
    },
  });
}

type Auth = ReturnType<typeof createAuth>;
const globalForAuth = globalThis as unknown as { auth?: Auth };

/** Lazily created so `next build` doesn't need database credentials. */
export function getAuth(): Auth {
  globalForAuth.auth ??= createAuth();
  return globalForAuth.auth;
}
