import { connectDb } from '@/lib/db';
import { getSession } from '@/lib/session';
import { BusinessProfile } from '@/models/BusinessProfile';
import { Client } from '@/models/Client';
import { Document } from '@/models/Document';
import { Product } from '@/models/Product';
import { Subscription } from '@/models/Subscription';

/** Full export of the user's data (GDPR right of access / portability), as JSON. */
export async function GET() {
  const session = await getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const userId = session.user.id;
  await connectDb();
  const [profile, clients, products, documents, subscriptions] = await Promise.all([
    BusinessProfile.findOne({ userId }).select('-logo.data -userId -__v').lean(),
    Client.find({ userId }).select('-userId -__v').lean(),
    Product.find({ userId }).select('-userId -__v').lean(),
    Document.find({ userId }).select('-userId -__v -publicTokenHash -publicTokenEnc').lean(),
    Subscription.find({ userId }).select('plan provider status startsAt expiresAt createdAt').lean(),
  ]);
  const data = {
    exportedAt: new Date().toISOString(),
    account: { name: session.user.name, email: session.user.email, createdAt: session.user.createdAt },
    businessProfile: profile,
    clients,
    products,
    documents,
    subscriptions,
  };
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="margokit-export-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
