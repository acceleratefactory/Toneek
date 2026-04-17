// src/lib/currency.ts
// Resolves billing currency from country_of_residence.
// Case-insensitive lookup with whitespace trimming.
// Bank transfer only — no Stripe. Currency used for invoice display.

const COUNTRY_CURRENCY: Record<string, string> = {
    // West Africa
    'nigeria':              'NGN',
    'ghana':                'GHS',
    'cameroon':             'USD',
    'senegal':              'USD',
    'ivory coast':          'USD',
    "côte d'ivoire":        'USD',
    'uganda':               'USD',
    'tanzania':             'USD',
    'kenya':                'USD',
    'south africa':         'USD',
    'ethiopia':             'USD',
    'zimbabwe':             'USD',
    'rwanda':               'USD',
    'zambia':               'USD',
    // UK & Ireland
    'united kingdom':       'GBP',
    'uk':                   'GBP',
    'great britain':        'GBP',
    'england':              'GBP',
    'scotland':             'GBP',
    'wales':                'GBP',
    'northern ireland':     'GBP',
    'ireland':              'EUR',
    // Europe (EUR)
    'germany':              'EUR',
    'netherlands':          'EUR',
    'france':               'EUR',
    'belgium':              'EUR',
    'spain':                'EUR',
    'italy':                'EUR',
    'portugal':             'EUR',
    'austria':              'EUR',
    'switzerland':          'EUR',
    'sweden':               'EUR',
    'norway':               'EUR',
    'denmark':              'EUR',
    'finland':              'EUR',
    'poland':               'EUR',
    'czech republic':       'EUR',
    'czechia':              'EUR',
    'greece':               'EUR',
    // North America
    'united states':        'USD',
    'usa':                  'USD',
    'us':                   'USD',
    'canada':               'CAD',
    // Caribbean
    'jamaica':              'USD',
    'trinidad and tobago':  'USD',
    'barbados':             'USD',
    'bahamas':              'USD',
    // Middle East
    'united arab emirates': 'USD',
    'uae':                  'USD',
    'saudi arabia':         'USD',
    'qatar':                'USD',
    'kuwait':               'USD',
    // Rest of world
    'australia':            'USD',
    'new zealand':          'USD',
    'india':                'USD',
    'singapore':            'USD',
}

export function resolveCurrency(country: string | null | undefined): string {
    if (!country) return 'USD'
    const key = country.trim().toLowerCase()
    return COUNTRY_CURRENCY[key] ?? 'USD'
}
