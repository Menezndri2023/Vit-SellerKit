import { connectDb } from '@/lib/db';
import { BusinessProfile } from '@/models/BusinessProfile';

/** Public logo by random key (used on documents shared with clients). */
export async function GET(_req: Request, ctx: RouteContext<'/api/logo/[key]'>) {
  const { key } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(key)) return new Response('Not found', { status: 404 });
  await connectDb();
  const profile = await BusinessProfile.findOne({ 'logo.key': key }).select('+logo.data logo.mime').lean();
  const logo = profile?.logo;
  if (!logo?.data || !logo.mime) return new Response('Not found', { status: 404 });
  // lean() may return a BSON Binary: copy into a plain byte array for the response
  const raw = logo.data as unknown as { buffer?: Uint8Array } | Uint8Array;
  const bytes = new Uint8Array(raw instanceof Uint8Array ? raw : (raw.buffer ?? []));
  return new Response(bytes, {
    headers: {
      'Content-Type': logo.mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  });
}
