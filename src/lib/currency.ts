// src/lib/currency.ts
// Resolves the billing currency from country_of_residence.
// Bank transfer only — no Stripe. Currency is used for invoice display.

export function resolveCurrency(country: string): string {
    const COUNTRY_CURRENCY: Record<string, string> = {
        'Nigeria': 'NGN',
        'Ghana': 'GHS',
        'United Kingdom': 'GBP',
        'Ireland': 'GBP',
        'United States': 'USD',
        'Canada': 'CAD',
        'Jamaica': 'USD',
        'Trinidad and Tobago': 'USD',
        'Barbados': 'USD',
        'Germany': 'EUR',
        'Netherlands': 'EUR',
        'France': 'EUR',
        'Belgium': 'EUR',
        'Sweden': 'EUR',
        'Norway': 'EUR',
        'Denmark': 'EUR',
        'Austria': 'EUR',
        'Switzerland': 'EUR',
        'Spain': 'EUR',
        'Italy': 'EUR',
        'United Arab Emirates': 'USD',
        'Saudi Arabia': 'USD',
        'South Africa': 'USD',
        'Kenya': 'USD',
        'Australia': 'USD',
        'New Zealand': 'USD',
        'Cameroon': 'USD',
        'Senegal': 'USD',
        'Ivory Coast': 'USD',
        'Uganda': 'USD',
        'Tanzania': 'USD',
    }
    return COUNTRY_CURRENCY[country] ?? 'USD'
}
