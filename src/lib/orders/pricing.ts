import { adminClient } from '@/lib/supabase/admin'

export function getPlanPrice(
  plan_tier: string, 
  currency: string,
  routine_tier: string = 'just_one'
): number {
  const PRICES: Record<string, Record<string, Record<string, number>>> = {
    just_one: {
      essentials: { NGN: 20000, GBP: 35, USD: 45, EUR: 38, GHS: 250, CAD: 55 },
      full_protocol: { NGN: 25000, GBP: 42, USD: 55, EUR: 48, GHS: 320, CAD: 70 },
      restoration: { NGN: 45000, GBP: 68, USD: 88, EUR: 75, GHS: 500, CAD: 110 },
    },
    two_to_three: {
      essentials: { NGN: 32000, GBP: 52, USD: 68, EUR: 58, GHS: 400, CAD: 85 },
      full_protocol: { NGN: 38000, GBP: 62, USD: 80, EUR: 70, GHS: 480, CAD: 100 },
      restoration: { NGN: 62000, GBP: 95, USD: 125, EUR: 108, GHS: 780, CAD: 155 },
    },
    whatever_it_takes: {
      essentials: { NGN: 48000, GBP: 75, USD: 98, EUR: 85, GHS: 600, CAD: 125 },
      full_protocol: { NGN: 58000, GBP: 89, USD: 115, EUR: 100, GHS: 740, CAD: 145 },
      restoration: { NGN: 85000, GBP: 130, USD: 170, EUR: 148, GHS: 1050, CAD: 215 },
    },
  }

  const tier_prices = PRICES[routine_tier] ?? PRICES['just_one']
  const plan_prices = tier_prices[plan_tier] ?? tier_prices['essentials']
  return plan_prices[currency] ?? plan_prices['USD']
}

export function getBankDetails(currency: string) {
    const MAP: Record<string, Record<string, string | undefined>> = {
        NGN: {
            bank_name:      process.env.BANK_NGN_NAME,
            account_name:   process.env.BANK_NGN_ACCOUNT_NAME,
            account_number: process.env.BANK_NGN_ACCOUNT_NUMBER,
        },
        GBP: {
            bank_name:      process.env.BANK_GBP_NAME,
            account_name:   process.env.BANK_GBP_ACCOUNT_NAME,
            account_number: process.env.BANK_GBP_ACCOUNT_NUMBER,
            sort_code:      process.env.BANK_GBP_SORT_CODE,
        },
        USD: {
            bank_name:       process.env.BANK_USD_NAME,
            account_name:    process.env.BANK_USD_ACCOUNT_NAME,
            account_number:  process.env.BANK_USD_ACCOUNT_NUMBER,
            routing_number:  process.env.BANK_USD_ROUTING_NUMBER,
        },
        EUR: {
            bank_name:    process.env.BANK_EUR_NAME,
            account_name: process.env.BANK_EUR_ACCOUNT_NAME,
            iban:         process.env.BANK_EUR_IBAN,
        },
        GHS: {
            bank_name:      process.env.BANK_GHS_NAME,
            account_name:   process.env.BANK_GHS_ACCOUNT_NAME,
            account_number: process.env.BANK_GHS_ACCOUNT_NUMBER,
        },
    }
    // Fallback to USD if currency not configured
    return MAP[currency] ?? MAP['USD']
}
