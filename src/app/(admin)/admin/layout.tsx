import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ensure we use the cookie-aware client to read the user's session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/assessment')

  const { data: profile } = await adminClient
    .from('profiles')
    .select('is_admin, full_name, email')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  return (
    <AdminShell userProfile={profile}>
      {children}
    </AdminShell>
  )
}
