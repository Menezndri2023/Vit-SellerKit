/**
 * Real customer testimonials only (fake reviews are illegal in the EU/US and hurt trust).
 * The section stays hidden while this list is empty.
 */
export type Testimonial = { name: string; role: { en: string; fr: string }; quote: { en: string; fr: string } };

export const testimonials: Testimonial[] = [
  // { name: 'Salma B.', role: { en: 'Instagram seller, Casablanca', fr: 'Vendeuse Instagram, Casablanca' }, quote: { en: '…', fr: '…' } },
];
