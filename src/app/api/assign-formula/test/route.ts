// src/app/api/assign-formula/test/route.ts
// Visit GET /api/assign-formula/test to run all test cases
// All 9 must produce PASS before proceeding to Sprint 2

import { NextResponse } from 'next/server'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

interface TestCase {
    name: string
    input: Record<string, any>
    expected?: string
    expected_not?: string[]
}

const TEST_CASES: TestCase[] = [
    {
        name: 'Lagos oily acne',
        input: { climate_zone: 'humid_tropical', skin_type: 'oily', primary_concern: 'acne', bleaching_history: 'none' },
        expected: 'LG-OA-01',
    },
    {
        name: 'Lagos oily PIH',
        input: { climate_zone: 'humid_tropical', skin_type: 'oily', primary_concern: 'PIH', bleaching_history: 'none' },
        expected: 'LG-OB-01',
    },
    {
        name: 'Abuja dry PIH',
        input: { climate_zone: 'semi_arid', skin_type: 'dry', primary_concern: 'PIH', bleaching_history: 'none' },
        expected: 'AB-DB-01',
    },
    {
        name: 'London combination PIH (diaspora)',
        input: { climate_zone: 'temperate_maritime', skin_type: 'combination', primary_concern: 'PIH', bleaching_history: 'none' },
        expected: 'GN-CB-01',
    },
    {
        name: 'Active bleaching — humid tropical',
        input: { climate_zone: 'humid_tropical', skin_type: 'oily', primary_concern: 'PIH', bleaching_history: 'active' },
        expected: 'RP-HT-01',
    },
    {
        name: 'Pregnancy safe — oily',
        input: { climate_zone: 'humid_tropical', skin_type: 'oily', primary_concern: 'PIH', pregnant_or_breastfeeding: true },
        expected: 'PG-GN-01',
    },
    {
        name: 'Pregnancy safe — dry',
        input: { climate_zone: 'humid_tropical', skin_type: 'dry', primary_concern: 'dryness', pregnant_or_breastfeeding: true },
        expected: 'PG-DH-01',
    },
    {
        name: 'Male razor bumps',
        input: { climate_zone: 'humid_tropical', skin_type: 'oily', primary_concern: 'razor_bumps', gender: 'male' },
        expected: 'M-OA-01',
    },
    {
        name: 'Climate transition — recently moved to London',
        input: {
            climate_zone: 'temperate_maritime',
            years_in_current_location: 'less_than_1',
            climate_transition_effects: ['more_dry'],
            skin_type: 'oily',
            primary_concern: 'PIH',
            bleaching_history: 'none',
        },
        expected: 'RP-HT-01',
    },
    {
        name: 'Isotretinoin SA exclusion — must not receive SA formula',
        input: {
            climate_zone: 'humid_tropical',
            skin_type: 'oily',
            primary_concern: 'acne',
            bleaching_history: 'none',
            isotretinoin_flag: true,
        },
        expected_not: ['LG-OA-01', 'AB-OA-01', 'LG-OH-01', 'GN-OT-01', 'M-OA-01'],
    },
]

export async function GET() {
    const results = []

    for (const test of TEST_CASES) {
        try {
            const res = await fetch(`${BASE_URL}/api/assign-formula`, {
                method: 'POST',
                body: JSON.stringify(test.input),
                headers: { 'Content-Type': 'application/json' },
            })
            const data = await res.json()
            const got = data.formula_code

            let pass: boolean
            let reason: string

            if (test.expected) {
                pass = got === test.expected
                reason = pass ? 'correct' : `expected ${test.expected}, got ${got}`
            } else if (test.expected_not) {
                pass = !test.expected_not.includes(got)
                reason = pass
                    ? `correctly avoided SA formula — assigned ${got}`
                    : `assigned SA-containing formula ${got} — this is wrong`
            } else {
                pass = false
                reason = 'no expected value defined'
            }

            results.push({ name: test.name, pass, got, reason })
        } catch (err: any) {
            results.push({ name: test.name, pass: false, got: null, reason: err.message })
        }
    }

    const pass_count = results.filter(r => r.pass).length
    const total = results.length
    const all_pass = pass_count === total

    return NextResponse.json({
        summary: `${pass_count}/${total} tests passed`,
        all_pass,
        results,
    })
}
