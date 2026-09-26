import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/form/fields';
import ProductForm from '@/components/products/ProductForm';
import { connectDb } from '@/lib/db';
import { guessCountry } from '@/lib/geo';
import { documentDefaults } from '@/lib/profile-defaults';
import { requireUser } from '@/lib/session';

export default async function NewProductPage({ params }: PageProps<'/[locale]/app/products/new'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const t = await getTranslations('products');
  await connectDb();
  const defaults = await documentDefaults(user.id, await guessCountry(locale));
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title={t('newTitle')} />
      <ProductForm initial={{}} defaults={defaults} />
    </div>
  );
}
