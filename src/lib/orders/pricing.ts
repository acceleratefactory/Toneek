import { adminClient } from '@/lib/supabase/admin'

export async function getPlanPrice(plan_tier: string, currency: string): Promise<number> {
    const { data: tier } = await adminClient
        .from('subscription_tiers')
        .select('prices')
        .eq('id', plan_tier)
        .single()

    if (!tier || !tier.prices) {
        throw new Error(`Pricing not found for plan_tier: ${plan_tier}`)
    }

    const exactPriceData = tier.prices[currency] || tier.prices['USD']
    return exactPriceData?.amount || 45
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
