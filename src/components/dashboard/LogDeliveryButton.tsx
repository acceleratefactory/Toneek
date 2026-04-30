'use client'

import { useState } from 'react'

export default function LogDeliveryButton({ orderId }: { orderId: string }) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleLogDelivery = async () => {
        setIsSubmitting(true)
        try {
            const today = new Date().toISOString().split('T')[0]
            const res = await fetch('/api/orders/log-delivery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: orderId,
                    received_date: today,
                }),
            })
            if (res.ok) {
                window.location.reload()
            } else {
                console.error('Failed to log delivery')
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <button
            onClick={handleLogDelivery}
            disabled={isSubmitting}
            className="mt-4 w-full py-2 border-2 border-amber-600 text-amber-700 
                       rounded-lg text-sm font-medium hover:bg-amber-50 transition-colors disabled:opacity-50"
        >
            {isSubmitting ? 'Logging...' : 'I received my formula — log delivery'}
        </button>
    )
}
