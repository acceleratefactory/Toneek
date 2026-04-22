import { adminClient } from '@/lib/supabase/admin'

export default async function Home() {
  const { count } = await adminClient
    .from('formula_codes')
    .select('*', { count: 'exact', head: true })

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-950 text-white">
      <div className="text-center space-y-4 p-8">
        <img src="/logo-dark.svg" alt="Toneek" className="h-10 w-auto mx-auto" />
        <p className="text-stone-400 text-lg">Skin intelligence for melanin-rich skin</p>
        <div className="text-sm text-stone-500 space-y-1 mt-6">
          <p>Database: {count !== null ? '✅ Connected' : '❌ Error'}</p>
          <p>Formula codes: {count ?? 0} / 30</p>
        </div>
        <a
          href="/assessment"
          className="inline-block mt-8 px-10 py-4 bg-amber-500 text-stone-950
                     font-bold rounded-full hover:bg-amber-400 transition-colors text-lg"
        >
          Start your skin assessment →
        </a>
      </div>
    </main>
  )
}
