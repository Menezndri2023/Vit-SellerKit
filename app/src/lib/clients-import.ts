import { DOC_LOCALES } from './catalog';
import { countryOptions, countryRules } from './countries';
import { normalizeHeader, parseCsv } from './csv';
import { clientSchema, type ClientInput } from './validation';

export const IMPORT_MAX_ROWS = 2000;
export const IMPORT_MAX_BYTES = 1_000_000;

type Field = 'name' | 'kind' | 'contactName' | 'email' | 'phone' | 'line1' | 'line2' | 'postalCode' | 'city' | 'region' | 'country' | 'currency' | 'language' | 'notes';

/** Accepted column names (EN/FR, compared without accents, spaces or punctuation). */
const FIELD_ALIASES: Record<Field, string[]> = {
  name: ['name', 'nom', 'client', 'company', 'companyname', 'entreprise', 'societe', 'raisonsociale', 'nomclient', 'clientname', 'customer', 'customername'],
  kind: ['kind', 'type', 'typeclient', 'clienttype', 'categorie', 'category'],
  contactName: ['contact', 'contactname', 'nomcontact', 'nomducontact', 'interlocuteur'],
  email: ['email', 'mail', 'courriel', 'adressemail', 'emailaddress', 'adresseemail'],
  phone: ['phone', 'telephone', 'tel', 'mobile', 'portable', 'phonenumber', 'gsm', 'whatsapp'],
  line1: ['address', 'adresse', 'address1', 'adresse1', 'addressline1', 'street', 'rue'],
  line2: ['address2', 'adresse2', 'addressline2', 'complement', 'complementadresse'],
  postalCode: ['postalcode', 'postcode', 'zip', 'zipcode', 'codepostal', 'cp'],
  city: ['city', 'ville', 'town', 'localite'],
  region: ['region', 'state', 'province', 'departement'],
  country: ['country', 'pays', 'countrycode', 'codepays'],
  currency: ['currency', 'devise', 'monnaie'],
  language: ['language', 'langue', 'lang', 'documentlanguage', 'languedocument'],
  notes: ['notes', 'note', 'comment', 'comments', 'commentaire', 'commentaires', 'remarques'],
};

/** Identifier columns → scheme. "GENERIC" = the country's main tax identifier. */
const ID_ALIASES: Record<string, string> = {
  vat: 'VAT', tva: 'VAT', vatnumber: 'VAT', vatid: 'VAT', numerotva: 'VAT', ntva: 'VAT', notva: 'VAT', tvaintracom: 'VAT', tvaintracommunautaire: 'VAT',
  siren: 'SIREN', siret: 'SIRET', ice: 'ICE', bce: 'BCE', kbo: 'BCE', nif: 'NIF', cif: 'NIF', cf: 'CF', codicefiscale: 'CF', uid: 'UID', ide: 'UID',
  bn: 'BN', ninea: 'NINEA', ncc: 'NCC', mf: 'MF', matriculefiscal: 'MF', tin: 'TIN', ein: 'EIN',
  taxid: 'GENERIC', identifiantfiscal: 'GENERIC', numerofiscal: 'GENERIC',
};

const INDIVIDUAL = new Set(['individual', 'particulier', 'person', 'personne', 'individu', 'b2c', 'prive', 'private']);
const LANGS: Record<string, string> = { fr: 'fr', francais: 'fr', french: 'fr', en: 'en', anglais: 'en', english: 'en', ar: 'ar', arabe: 'ar', arabic: 'ar' };

let countryNames: Map<string, string> | null = null;
/** "Maroc", "Morocco", "MA" → "MA". */
export function countryCode(value: string): string | null {
  const v = value.trim();
  if (/^[A-Za-z]{2}$/.test(v)) return v.toUpperCase();
  if (!countryNames) {
    countryNames = new Map();
    for (const locale of ['en', 'fr']) for (const c of countryOptions(locale)) countryNames.set(normalizeHeader(c.name), c.code);
    for (const [alias, code] of [['usa', 'US'], ['uk', 'GB'], ['angleterre', 'GB'], ['england', 'GB'], ['cotedivoire', 'CI'], ['ivorycoast', 'CI']] as const) countryNames.set(alias, code);
  }
  return countryNames.get(normalizeHeader(v)) ?? null;
}

export type ImportRow = { line: number; name: string } & ({ ok: true; data: ClientInput } | { ok: false; errors: string[] });
export type ImportPlan = { rows: ImportRow[]; ignoredColumns: string[]; error?: 'empty' | 'noName' | 'tooMany' };

/** CSV text → one validated client per data row, with the same rules as the client form. */
export function planClientImport(text: string, defaultCountry: string): ImportPlan {
  const table = parseCsv(text);
  if (table.length < 2) return { rows: [], ignoredColumns: [], error: 'empty' };
  if (table.length - 1 > IMPORT_MAX_ROWS) return { rows: [], ignoredColumns: [], error: 'tooMany' };

  const header = table[0].map(normalizeHeader);
  const fieldCol = new Map<Field, number>();
  const idCols: { col: number; scheme: string; label: string }[] = [];
  const ignoredColumns: string[] = [];
  header.forEach((h, col) => {
    const field = (Object.keys(FIELD_ALIASES) as Field[]).find((f) => FIELD_ALIASES[f].includes(h));
    if (field && !fieldCol.has(field)) fieldCol.set(field, col);
    else if (ID_ALIASES[h]) idCols.push({ col, scheme: ID_ALIASES[h], label: table[0][col].trim() });
    else if (table[0][col].trim()) ignoredColumns.push(table[0][col].trim());
  });
  if (!fieldCol.has('name')) return { rows: [], ignoredColumns, error: 'noName' };

  const rows = table.slice(1).map((cells, i): ImportRow => {
    const get = (f: Field) => (fieldCol.has(f) ? (cells[fieldCol.get(f)!] ?? '').trim() : '');
    const line = i + 2;
    const name = get('name');
    const countryRaw = get('country');
    const country = countryRaw ? countryCode(countryRaw) : defaultCountry;
    if (!country) return { line, name, ok: false, errors: ['address.country'] };

    const buyerSchemes = countryRules(country).idSchemes.filter((s) => s.buyer).map((s) => s.scheme);
    const ids: Record<string, string> = {};
    const extraNotes: string[] = [];
    for (const { col, scheme, label } of idCols) {
      const value = (cells[col] ?? '').trim();
      if (!value) continue;
      const target = scheme === 'GENERIC' ? buyerSchemes.find((s) => s !== 'VAT') ?? buyerSchemes[0] : scheme;
      // Identifiers the country's client form doesn't have are kept in the notes, never lost
      if (target && buyerSchemes.includes(target) && !ids[target]) ids[target] = value;
      else extraNotes.push(`${label}: ${value}`);
    }
    const kindRaw = normalizeHeader(get('kind'));
    const lang = LANGS[normalizeHeader(get('language'))];
    const notes = [get('notes'), ...extraNotes].filter(Boolean).join('\n');

    const parsed = clientSchema.safeParse({
      kind: INDIVIDUAL.has(kindRaw) ? 'individual' : 'business',
      name,
      contactName: get('contactName'),
      email: get('email'),
      phone: get('phone'),
      address: { line1: get('line1'), line2: get('line2'), postalCode: get('postalCode'), city: get('city'), region: get('region'), country },
      ids,
      preferredDocLocale: lang && (DOC_LOCALES as readonly string[]).includes(lang) ? lang : '',
      preferredCurrency: get('currency').toUpperCase(),
      notes,
    });
    if (!parsed.success) return { line, name, ok: false, errors: [...new Set(parsed.error.issues.map((x) => x.path.join('.')))] };
    return { line, name, ok: true, data: parsed.data };
  });
  return { rows, ignoredColumns };
}

/** Same client = same name (case and accents ignored) and same email (or both without email). */
export const clientKey = (c: { name: string; email?: string | null }) =>
  `${c.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()}|${(c.email ?? '').trim().toLowerCase()}`;
