import { isValidObjectId } from 'mongoose';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/form/fields';
import ProductForm, { type ProductValues } from '@/components/products/ProductForm';
import { connectDb } from '@/lib/db';
import { guessCountry } from '@/lib/geo';
import { documentDefaults } from '@/lib/profile-defaults';
import { plain } from '@/lib/serialize';
import { requireUser } from '@/lib/session';
import { Product } from '@/models/Product';

export default async function EditProductPage({ params }: PageProps<'/[locale]/app/products/[id]'>) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  if (!isValidObjectId(id)) notFound();
  await connectDb();
  const product = await Product.findOne({ _id: id, userId: user.id }).lean();
  if (!product) notFound();
  const t = await getTranslations('products');
  const values = plain<ProductValues>(product);
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title={t('editTitle')} subtitle={values.name} />
      <ProductForm initial={values} defaults={await documentDefaults(user.id, await guessCountry(locale))} />
    </div>
  );
}
