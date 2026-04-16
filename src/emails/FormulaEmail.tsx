// src/emails/FormulaEmail.tsx
// React Email component for the formula assignment email.
// Sent immediately after a completed assessment via Resend.

import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
} from '@react-email/components'

interface Active {
    name: string
    concentration: number
    unit: string
    rationale: string
}

interface FormulaEmailProps {
    email: string
    formula_code: string
    formula: {
        profile_description?: string
        active_modules?: Active[]
        outcome_timeline_weeks?: number
        week_2_expectation?: string
        week_4_expectation?: string
        week_8_expectation?: string
    } | null
    skin_os_score: number
    primary_concern: string
    climate_zone: string
    routine_expectation: string
    isotretinoin_flag?: boolean
    assessment_id?: string
}

const CLIMATE_LABELS: Record<string, string> = {
    humid_tropical: 'hot and humid (tropical)',
    semi_arid: 'hot and dry (semi-arid)',
    temperate_maritime: 'mild and damp (temperate maritime)',
    cold_continental: 'cold winters, humid summers (continental)',
    mediterranean: 'hot dry summers, mild wet winters',
    equatorial: 'extremely hot and humid (equatorial)',
}

const ROUTINE_MESSAGES: Record<string, string> = {
    just_one: 'Your Toneek formula is your treatment. Pair it with a gentle cleanser and a plain moisturiser. Nothing else needed.',
    two_to_three: 'Use your Toneek formula as your treatment step. Add a simple cleanser and moisturiser only.',
    whatever_it_takes: 'Your Toneek formula is your active treatment step. If you use other products, apply them before your formula and wait 10 minutes.',
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://toneek.vercel.app'

export default function FormulaEmail({
    formula_code,
    formula,
    skin_os_score,
    primary_concern,
    climate_zone,
    routine_expectation,
    isotretinoin_flag,
    assessment_id,
}: FormulaEmailProps) {
    const actives: Active[] = formula?.active_modules ?? []
    const climateLabel = CLIMATE_LABELS[climate_zone] ?? climate_zone
    const routineMessage = ROUTINE_MESSAGES[routine_expectation] ?? ROUTINE_MESSAGES.two_to_three
    const resultsUrl = assessment_id
        ? `${BASE_URL}/results?assessment_id=${assessment_id}`
        : `${BASE_URL}/results`

    return (
        <Html>
            <Head />
            <Preview>Your Toneek formula: {formula_code} — built for your skin</Preview>
            <Body style={body}>
                <Container style={container}>

                    {/* Header */}
                    <Section style={header}>
                        <Heading style={brandHeading}>Toneek</Heading>
                        <Text style={tagline}>Skin intelligence for melanin-rich skin</Text>
                    </Section>

                    <Hr style={divider} />

                    {/* Intro */}
                    <Section style={section}>
                        <Heading as="h2" style={h2}>Your formula is ready</Heading>
                        <Text style={body_text}>
                            Based on your assessment, we have assigned you a personalised formula designed for {' '}
                            {primary_concern === 'PIH' ? 'dark spots (PIH)' : primary_concern} in a {climateLabel} climate.
                        </Text>
                    </Section>

                    {/* Skin OS Score */}
                    <Section style={scoreSection}>
                        <Text style={scoreLabel}>Your Skin OS Score</Text>
                        <Text style={scoreValue}>{skin_os_score}</Text>
                        <Text style={scoreSubLabel}>out of 100</Text>
                    </Section>

                    {/* Formula code */}
                    <Section style={section}>
                        <Text style={formulaLabel}>Formula assigned</Text>
                        <Text style={formulaCode}>{formula_code}</Text>
                        {formula?.profile_description && (
                            <Text style={body_text}>{formula.profile_description}</Text>
                        )}
                    </Section>

                    <Hr style={divider} />

                    {/* Active ingredients */}
                    {actives.length > 0 && (
                        <Section style={section}>
                            <Heading as="h3" style={h3}>Why this formula for you</Heading>
                            {actives.map((active, i) => (
                                <Section key={i} style={activeCard}>
                                    <Text style={activeName}>
                                        {active.name} — {active.concentration}{active.unit}
                                    </Text>
                                    <Text style={activeRationale}>{active.rationale}</Text>
                                </Section>
                            ))}
                        </Section>
                    )}

                    <Hr style={divider} />

                    {/* Timeline */}
                    {formula?.outcome_timeline_weeks && (
                        <Section style={section}>
                            <Heading as="h3" style={h3}>What to expect</Heading>
                            {formula.week_2_expectation && (
                                <Text style={timelineItem}><strong>Week 2:</strong> {formula.week_2_expectation}</Text>
                            )}
                            {formula.week_4_expectation && (
                                <Text style={timelineItem}><strong>Week 4:</strong> {formula.week_4_expectation}</Text>
                            )}
                            {formula.week_8_expectation && (
                                <Text style={timelineItem}>
                                    <strong>Week {formula.outcome_timeline_weeks}:</strong> {formula.week_8_expectation}
                                </Text>
                            )}
                        </Section>
                    )}

                    {/* Routine instruction */}
                    <Section style={section}>
                        <Heading as="h3" style={h3}>How to use your formula</Heading>
                        <Text style={body_text}>{routineMessage}</Text>
                    </Section>

                    {/* Isotretinoin warning */}
                    {isotretinoin_flag && (
                        <Section style={warningSection}>
                            <Text style={warningText}>
                                ⚠ Because you are on isotretinoin, your formula has been adjusted to exclude any exfoliating acids.
                                Your formula is safe to use alongside your prescription. Always confirm with your prescribing doctor.
                            </Text>
                        </Section>
                    )}

                    <Hr style={divider} />

                    {/* CTA */}
                    <Section style={ctaSection}>
                        <Heading as="h3" style={h3}>Ready to get your formula made?</Heading>
                        <Text style={body_text}>
                            Payment is by bank transfer only. Your formula is made to order once payment is confirmed.
                        </Text>
                        <Button href={resultsUrl} style={ctaButton}>
                            View your formula and subscribe
                        </Button>
                    </Section>

                    <Hr style={divider} />

                    <Section style={footer}>
                        <Text style={footerText}>
                            Toneek · Skin intelligence for melanin-rich skin
                        </Text>
                        <Text style={footerText}>
                            You received this because you completed a Toneek skin assessment.
                        </Text>
                    </Section>

                </Container>
            </Body>
        </Html>
    )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const body = {
    backgroundColor: '#0f0f0f',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: '0',
    padding: '0',
}

const container = {
    backgroundColor: '#1a1a1a',
    margin: '0 auto',
    maxWidth: '580px',
    padding: '0 0 40px',
}

const header = {
    backgroundColor: '#111111',
    padding: '32px 40px 24px',
    textAlign: 'center' as const,
}

const brandHeading = {
    color: '#d4a574',
    fontSize: '28px',
    fontWeight: '700',
    letterSpacing: '0.08em',
    margin: '0 0 4px',
}

const tagline = {
    color: '#888888',
    fontSize: '13px',
    margin: '0',
}

const divider = {
    borderColor: '#2a2a2a',
    margin: '0',
}

const section = {
    padding: '28px 40px 0',
}

const h2 = {
    color: '#f5f5f5',
    fontSize: '22px',
    fontWeight: '600',
    margin: '0 0 12px',
}

const h3 = {
    color: '#d4a574',
    fontSize: '15px',
    fontWeight: '600',
    letterSpacing: '0.04em',
    margin: '0 0 12px',
    textTransform: 'uppercase' as const,
}

const body_text = {
    color: '#cccccc',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 8px',
}

const scoreSection = {
    backgroundColor: '#222222',
    margin: '24px 40px 0',
    padding: '24px',
    borderRadius: '8px',
    textAlign: 'center' as const,
}

const scoreLabel = {
    color: '#888888',
    fontSize: '12px',
    letterSpacing: '0.08em',
    margin: '0 0 4px',
    textTransform: 'uppercase' as const,
}

const scoreValue = {
    color: '#d4a574',
    fontSize: '52px',
    fontWeight: '700',
    lineHeight: '1',
    margin: '0',
}

const scoreSubLabel = {
    color: '#666666',
    fontSize: '12px',
    margin: '4px 0 0',
}

const formulaLabel = {
    color: '#888888',
    fontSize: '11px',
    letterSpacing: '0.08em',
    margin: '0 0 4px',
    textTransform: 'uppercase' as const,
}

const formulaCode = {
    color: '#f5f5f5',
    fontSize: '26px',
    fontWeight: '700',
    letterSpacing: '0.06em',
    margin: '0 0 8px',
}

const activeCard = {
    backgroundColor: '#222222',
    borderLeft: '3px solid #d4a574',
    marginBottom: '12px',
    padding: '12px 16px',
    borderRadius: '0 6px 6px 0',
}

const activeName = {
    color: '#f5f5f5',
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 4px',
}

const activeRationale = {
    color: '#aaaaaa',
    fontSize: '13px',
    lineHeight: '1.5',
    margin: '0',
}

const timelineItem = {
    color: '#cccccc',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0 0 6px',
}

const warningSection = {
    backgroundColor: '#2a1f0a',
    border: '1px solid #6b4c00',
    borderRadius: '6px',
    margin: '24px 40px 0',
    padding: '16px 20px',
}

const warningText = {
    color: '#d4a574',
    fontSize: '13px',
    lineHeight: '1.6',
    margin: '0',
}

const ctaSection = {
    padding: '28px 40px 0',
    textAlign: 'center' as const,
}

const ctaButton = {
    backgroundColor: '#d4a574',
    borderRadius: '6px',
    color: '#0f0f0f',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '600',
    padding: '14px 28px',
    textDecoration: 'none',
}

const footer = {
    padding: '24px 40px 0',
    textAlign: 'center' as const,
}

const footerText = {
    color: '#555555',
    fontSize: '12px',
    lineHeight: '1.5',
    margin: '0 0 4px',
}
