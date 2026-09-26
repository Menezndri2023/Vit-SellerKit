import 'server-only';
import { countryRules } from './countries';
import { BusinessProfile } from '@/models/BusinessProfile';

/** Defaults for new products/documents, from the business profile (or the country rules). */
export async function documentDefaults(userId: string, fallbackCountry: string) {
  const profile = await BusinessProfile.findOne({ userId }).select('address.country defaultCurrency vatRegime taxRates defaultDocLocale').lean();
  const country = profile?.address?.country ?? fallbackCountry;
  const rules = countryRules(country);
  const rates = profile?.taxRates?.length ? profile.taxRates.map((r) => r.rate ?? 0) : rules.taxRates;
  const charges = !profile || profile.vatRegime === 'standard';
  return {
    country,
    currency: profile?.defaultCurrency ?? rules.currency,
    rates: charges ? rates : [0],
    taxRate: charges ? rates[0] ?? 0 : 0,
    // Franchise / not registered: "outside scope" (O); exempt activity: E
    vatCategory: charges ? 'S' : profile?.vatRegime === 'exempt' ? 'E' : 'O',
    docLocale: profile?.defaultDocLocale ?? 'en',
  };
}
