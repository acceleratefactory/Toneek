// src/lib/whatsapp/sendWhatsAppMessage.ts

const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v19.0'
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

interface SendWhatsAppParams {
    phone: string
    message: string
}

export async function sendWhatsAppMessage({ phone, message }: SendWhatsAppParams) {
    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
        console.warn('WhatsApp environment variables missing. Skipping WhatsApp send.')
        return { success: false, error: 'Missing environment variables' }
    }

    // Ensure phone number has no spaces, +, or special characters
    const cleanPhone = phone.replace(/\D/g, '')

    try {
        const response = await fetch(
            `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: cleanPhone,
                    type: 'text',
                    text: {
                        preview_url: true,
                        body: message,
                    },
                }),
            }
        )

        const data = await response.json()

        if (!response.ok) {
            console.error('Meta WhatsApp API Error:', data)
            return { success: false, error: data }
        }

        return { success: true, data }
    } catch (error) {
        console.error('Failed to send WhatsApp message:', error)
        return { success: false, error }
    }
}
