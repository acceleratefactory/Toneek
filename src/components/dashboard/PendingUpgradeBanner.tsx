'use client'

import { useState } from 'react'
import BankTransferModal from '@/components/payment/BankTransferModal'
import { getBankDetails } from '@/lib/orders/pricing'

interface PendingUpgradeBannerProps {
    orderId: string
    paymentReference: string
    amount: number
    currency: string
}

export default function PendingUpgradeBanner({ orderId, paymentReference, amount, currency }: PendingUpgradeBannerProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const bankDetails = getBankDetails(currency)

    return (
        <>
            <div style={{ background: '#FEF3E2', borderLeft: '4px solid #C87D3E' }} className="mx-0 mb-4 rounded-r-xl shadow-sm overflow-hidden p-5">
                <p className="text-[#2A0F06] font-bold text-[15px] mb-2">
                    Your upgrade to Full Protocol is awaiting payment.
                </p>
                <p className="text-[#8C7B72] text-[13px] mb-3">
                    Reference: {paymentReference}<br/>
                    Complete your bank transfer to activate the upgrade.
                </p>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="text-[#C87D3E] font-bold text-[13px] hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                    View payment details →
                </button>
            </div>

            {isModalOpen && (
                <BankTransferModal
                    orderId={orderId}
                    amount={amount}
                    currency={currency}
                    paymentReference={paymentReference}
                    bankDetails={bankDetails}
                    onClose={() => setIsModalOpen(false)}
                    isRenewal={false}
                />
            )}
        </>
    )
}
