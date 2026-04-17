// src/app/(dashboard)/dashboard/page.tsx
// Default dashboard page — redirects to /dashboard/formula (My Formula view).
// Task 4.2 builds the formula page directly.

import { redirect } from 'next/navigation'

export default function DashboardPage() {
    redirect('/dashboard/formula')
}
