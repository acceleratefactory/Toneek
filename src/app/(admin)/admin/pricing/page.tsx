import { adminClient } from '@/lib/supabase/admin'
import PricingEditor from '@/components/admin/PricingEditor'

export const dynamic = 'force-dynamic'

export default async function AdminPricingPage() {
  const { data: tiers, error } = await adminClient
    .from('subscription_tiers')
    .select('id, name, description, prices, routine_tier')
    .order('sort_order', { ascending: true })

  return (
    <div className="space-y-6 text-gray-800">
      
      {/* ── Top Header Banner (Zoho Style) ── */}
      <div className="bg-white pt-6 px-10 rounded-b-xl shadow-sm border-b border-gray-200 -mt-8 mx-[-2rem] mb-6 relative pb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-toneek-cream border border-toneek-lightgray text-toneek-brown rounded flex items-center justify-center font-bold shadow-sm">
            PL
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Global Pricing Matrix</h1>
            <p className="text-sm text-gray-500 mt-1">Configure subscription pricing models injected transparently into global checkout</p>
          </div>
        </div>
      </div>

      {error || !tiers ? (
        <div className="bg-toneek-errorbg text-toneek-error border border-toneek-error px-6 py-6 rounded-lg text-center font-medium shadow-sm">
          Error retrieving global pricing parameters. Ensure database migration 009 has correctly established the subscription_tiers registry.
        </div>
      ) : (
        <PricingEditor initialTiers={tiers} />
      )}
    </div>
  )
}
