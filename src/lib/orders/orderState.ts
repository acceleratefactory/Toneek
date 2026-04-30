// src/lib/orders/orderState.ts

export type OrderState = 
  | 'pending_payment'
  | 'in_production' 
  | 'dispatched'
  | 'active_protocol'
  | 'no_order'

export function determineOrderState(order: any): OrderState {
  if (!order) return 'no_order'

  // Check if formula received first (terminal state)
  if (order.received_at) return 'active_protocol'

  // Normalise status strings — handle all variants
  const status = (order.status ?? '').toLowerCase().replace(/[_\s-]/g, '_')
  const payment_status = (order.payment_status ?? '').toLowerCase().replace(/[_\s-]/g, '_')

  // PENDING PAYMENT states
  const pending_payment_statuses = [
    'pending',
    'pending_payment', 
    'pending_verification',
    'awaiting_payment',
  ]
  if (pending_payment_statuses.includes(payment_status)) {
    return 'pending_payment'
  }

  // IN PRODUCTION states — payment confirmed but not yet shipped
  const in_production_statuses = [
    'payment_confirmed',
    'pending_formulation',
    'formulating',
    'in_production',
    'production',
  ]
  if (in_production_statuses.includes(status)) {
    return 'in_production'
  }

  // DISPATCHED states — ready to ship or shipped, not yet received
  const dispatched_statuses = [
    'dispatched',
    'ready_to_dispatch',
    'ready_for_dispatch',
    'pending_dispatch',     // held for check-in
    'shipped',
    'in_transit',
    'out_for_delivery',
    'delivered',            // courier says delivered but customer hasn't logged it
  ]
  if (dispatched_statuses.includes(status)) {
    return 'dispatched'
  }

  // If payment was confirmed but status is unrecognised, 
  // treat as in_production (safer than showing pending_payment)
  if (payment_status === 'confirmed' || order.payment_confirmed_at) {
    return 'in_production'
  }

  // Fallback
  return 'pending_payment'
}
