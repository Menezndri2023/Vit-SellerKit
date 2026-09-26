import 'server-only';
import { z } from 'zod';

const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
  BETTER_AUTH_URL: z.url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  MONGODB_URI: z.string().startsWith('mongodb'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Margokit <hello@margokit.com>'),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Validated server environment. Read lazily so `next build` works without secrets. */
export function env(): Env {
  cached ??= schema.parse(process.env);
  return cached;
}

export const googleEnabled = () => Boolean(env().GOOGLE_CLIENT_ID && env().GOOGLE_CLIENT_SECRET);
