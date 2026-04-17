'use client'
// src/components/dashboard/ProfileForm.tsx
// Editable profile fields: full name, phone, city, country, notification prefs.
// Calls PATCH /api/profile/update on save.

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label htmlFor={id} style={{ color: '#888', fontSize: '0.8rem' }}>{label}</label>
            <input
                id={id}
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                style={{
                    background: '#222',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    padding: '0.7rem 0.9rem',
                    color: '#f5f5f5',
                    fontSize: '0.9rem',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#d4a574')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
            />
        </div>
    )

    return (
        <section style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: '12px', padding: '1.25rem 1.5rem' }}>
            <p style={{ color: '#666', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                Your details
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {field('Full name',    'profile-name',    fullName, setFullName, 'Your full name')}
                {field('Phone (WhatsApp)', 'profile-phone', phone, setPhone, '+234 800 000 0000')}
                {field('City',         'profile-city',    city,     setCity,     'Your city')}
                {field('Country',      'profile-country', country,  setCountry,  'Your country')}
            </div>

            {error && (
                <p style={{ color: '#e05555', fontSize: '0.82rem', marginTop: '0.75rem', background: 'rgba(224,85,85,0.08)', borderRadius: '6px', padding: '0.6rem 0.8rem' }}>
                    {error}
                </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.25rem' }}>
                <button
                    id="save-profile"
                    onClick={handleSave}
                    disabled={saving || !isDirty}
                    style={{
                        padding: '0.7rem 1.5rem',
                        background: saved ? '#4caf82' : '#d4a574',
                        color: '#0f0f0f',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        cursor: saving || !isDirty ? 'not-allowed' : 'pointer',
                        opacity: !isDirty && !saving ? 0.5 : 1,
                        transition: 'background 0.2s',
                    }}
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
                        style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                        Cancel
                    </button>
                )}
            </div>
        </section>
    )
}
