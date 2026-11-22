import { describe, expect, it } from 'vitest';
import { clientKey, countryCode, planClientImport } from './clients-import';
import { detectDelimiter, parseCsv } from './csv';

describe('parseCsv', () => {
  it('handles quotes, doubled quotes, line breaks in quotes, CRLF, BOM and blank lines', () => {
    const text = '﻿nom;ville\r\n"Dupont; fils";"Paris"\r\n"Le ""Bon"" Coin";"Lyon\n2e"\r\n\r\n';
    expect(detectDelimiter(text)).toBe(';');
    expect(parseCsv(text)).toEqual([
      ['nom', 'ville'],
      ['Dupont; fils', 'Paris'],
      ['Le "Bon" Coin', 'Lyon\n2e'],
    ]);
  });
  it('detects commas and tabs', () => {
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',');
    expect(detectDelimiter('a\tb\n1\t2')).toBe('\t');
  });
});

describe('countryCode', () => {
  it('accepts ISO codes and country names in English or French', () => {
    expect(countryCode('ma')).toBe('MA');
    expect(countryCode('Maroc')).toBe('MA');
    expect(countryCode('Morocco')).toBe('MA');
    expect(countryCode('Côte d’Ivoire')).toBe('CI');
    expect(countryCode('Atlantis')).toBeNull();
  });
});

describe('planClientImport', () => {
  it('maps French headers, identifiers per country and the default country', () => {
    const csv = [
      'Raison sociale;E-mail;Téléphone;Adresse;Code postal;Ville;Pays;ICE;TVA;Type;Langue',
      'Atlas Négoce SARL;compta@atlas.ma;0600000000;12 bd Zerktouni;20000;Casablanca;Maroc;001234567000089;;entreprise;français',
      'Jean Martin;jean@example.fr;;3 rue de la Paix;75002;Paris;;;;particulier;',
      'Bad;not-an-email;;;;;Maroc;;;;',
    ].join('\n');
    const plan = planClientImport(csv, 'FR');
    expect(plan.error).toBeUndefined();
    const [a, b, c] = plan.rows;
    expect(a).toMatchObject({ line: 2, ok: true, data: { kind: 'business', name: 'Atlas Négoce SARL', email: 'compta@atlas.ma', preferredDocLocale: 'fr', address: { country: 'MA', city: 'Casablanca' }, ids: [{ scheme: 'ICE', value: '001234567000089' }] } });
    expect(b).toMatchObject({ ok: true, data: { kind: 'individual', address: { country: 'FR' }, ids: [] } });
    expect(c.ok).toBe(false);
    if (!c.ok) expect(c.errors).toEqual(expect.arrayContaining(['email', 'address.line1', 'address.city']));
  });

  it('keeps identifiers the country form does not have in the notes', () => {
    const plan = planClientImport('name,address,city,country,vat\nAcme,1 Main St,Austin,US,US123', 'FR');
    expect(plan.rows[0]).toMatchObject({ ok: true, data: { ids: [], notes: 'vat: US123' } });
  });

  it('rejects an invalid ICE like the client form does', () => {
    const plan = planClientImport('nom;adresse;ville;pays;ice\nX;1 rue;Rabat;MA;123', 'MA');
    expect(plan.rows[0]).toMatchObject({ ok: false, errors: ['ids.ICE'] });
  });

  it('reports a file without a name column, an empty file and ignored columns', () => {
    expect(planClientImport('email\na@b.c', 'FR').error).toBe('noName');
    expect(planClientImport('nom', 'FR').error).toBe('empty');
    expect(planClientImport('nom;adresse;ville;Chiffre d’affaires\nA;1 rue;Paris;100', 'FR').ignoredColumns).toEqual(['Chiffre d’affaires']);
  });

  it('identifies duplicates by name and email, ignoring case and accents', () => {
    expect(clientKey({ name: 'Société  Générale', email: 'A@B.fr' })).toBe(clientKey({ name: 'societe generale', email: 'a@b.fr ' }));
    expect(clientKey({ name: 'شركة الأطلس' })).not.toBe(clientKey({ name: 'شركة النور' }));
  });
});

describe('downloadable templates', () => {
  it.each(['fr', 'en'])('the %s template imports without errors', async (lang) => {
    const { readFileSync } = await import('node:fs');
    const plan = planClientImport(readFileSync(`public/templates/clients-${lang}.csv`, 'utf8'), 'FR');
    expect(plan.error).toBeUndefined();
    expect(plan.ignoredColumns).toEqual([]);
    expect(plan.rows.map((r) => r.ok)).toEqual([true, true]);
  });
});
