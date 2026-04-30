// src/lib/orders/orderState.ts

export type OrderState = 'pending_payment' | 'in_production' | 'dispatched' | 'active_protocol' | 'no_order'

export function determineOrderState(order: any): OrderState {
  if (!order) return 'no_order'
  
  if (['pending', 'pending_verification'].includes(order.payment_status)) {
    return 'pending_payment'
  }
  
  if (['payment_confirmed', 'pending_formulation', 'formulating'].includes(order.status)) {
    return 'in_production'
  }
  
  if (order.status === 'dispatched' && !order.received_at) {
    return 'dispatched'
  }
  
  if (order.received_at) {
    return 'active_protocol'
  }
  
  return 'pending_payment' // fallback
}
