'use client'
// src/components/dashboard/ProfileForm.tsx
import { useState } from 'react'

interface ProfileFormProps {
    profileId: string
    initialFullName: string
    initialPhone: string
    initialCity: string
    initialCountry: string
}

export default function ProfileForm({
    profileId, initialFullName, initialPhone, initialCity, initialCountry,
}: ProfileFormProps) {
    const [fullName,    setFullName]    = useState(initialFullName)
    const [phone,       setPhone]       = useState(initialPhone)
    const [city,        setCity]        = useState(initialCity)
    const [country,     setCountry]     = useState(initialCountry)
    const [saving,      setSaving]      = useState(false)
    const [saved,       setSaved]       = useState(false)
    const [error,       setError]       = useState('')

    const isDirty =
        fullName !== initialFullName ||
        phone    !== initialPhone    ||
        city     !== initialCity     ||
        country  !== initialCountry

    const handleSave = async () => {
        setSaving(true)
        setError('')
        setSaved(false)

        try {
            const res = await fetch('/api/profile/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile_id: profileId, full_name: fullName, phone, city, country }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error ?? 'Could not save profile')

            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (err: any) {
            setError(err.message ?? 'Something went wrong. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const field = (label: string, id: string, value: string, onChange: (v: string) => void, placeholder?: string) => (
        <div className="flex flex-col gap-1.5 focus-within:text-toneek-amber">
            <label htmlFor={id} className="text-gray-500 dark:text-gray-400 text-xs font-medium">{label}</label>
            <input
                id={id}
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-3.5 py-2.5 text-gray-900 dark:text-gray-100 text-sm outline-none w-full box-border focus:border-toneek-amber dark:focus:border-toneek-amber transition-colors"
                onFocus={e => (e.currentTarget.style.borderColor = '#d4a574')}
                onBlur={e => (e.currentTarget.style.borderColor = '')}
            />
        </div>
    )

    return (
        <section className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#222] rounded-xl p-6 shadow-sm">
            <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-4 font-bold">
                Your details
            </p>

            <div className="flex flex-col gap-4">
                {field('Full name',    'profile-name',    fullName, setFullName, 'Your full name')}
                {field('Phone (WhatsApp)', 'profile-phone', phone, setPhone, '+234 800 000 0000')}
                {field('City',         'profile-city',    city,     setCity,     'Your city')}
                {field('Country',      'profile-country', country,  setCountry,  'Your country')}
            </div>

            {error && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-4 bg-red-50 dark:bg-red-900/10 rounded-lg p-3">
                    {error}
                </p>
            )}

            <div className="flex items-center gap-4 mt-6">
                <button
                    id="save-profile"
                    onClick={handleSave}
                    disabled={saving || !isDirty}
                    className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-colors ${
                        saved ? 'bg-green-500 text-white' : 'bg-toneek-amber text-[#000000]'
                    } ${saving || !isDirty ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
                >
                    {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
                </button>

                {isDirty && !saving && (
                    <button
                        onClick={() => {
                            setFullName(initialFullName)
                            setPhone(initialPhone)
                            setCity(initialCity)
                            setCountry(initialCountry)
                            setError('')
                        }}
                        className="bg-transparent border-none text-gray-500 dark:text-gray-400 text-sm cursor-pointer hover:underline"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </section>
    )
}
