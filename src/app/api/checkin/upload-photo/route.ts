// src/app/api/checkin/upload-photo/route.ts
// Uploads check-in progress photo to Supabase Storage.
// Stores in checkin-photos/{user_id}/{week}-{timestamp}.jpg

import { createServerClient } from '@supabase/ssr'
import { adminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cs) { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
                },
            }
        )

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'Photo must be under 5MB' }, { status: 400 })
        }

        const ext      = file.name.split('.').pop() ?? 'jpg'
        const path     = `${session.user.id}/${Date.now()}.${ext}`
        const buffer   = Buffer.from(await file.arrayBuffer())

        const { error: uploadError } = await adminClient.storage
            .from('checkin-photos')
            .upload(path, buffer, {
                contentType: file.type,
                upsert: false,
            })

        if (uploadError) {
            console.error('Photo upload error:', uploadError)
            return NextResponse.json({ error: uploadError.message }, { status: 500 })
        }

        const { data: { publicUrl } } = adminClient.storage
            .from('checkin-photos')
            .getPublicUrl(path)

        return NextResponse.json({ url: publicUrl })

    } catch (err: any) {
        console.error('Photo upload unexpected error:', err)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}
