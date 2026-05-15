// src/emails/Day1ScienceEmail.tsx
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

interface Day1ScienceEmailProps {
    email: string
    formula_code: string
    primary_concern: string
    analysis_scores?: any
    assessment_id?: string
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://toneek.vercel.app'

export default function Day1ScienceEmail({
    email,
    formula_code,
    primary_concern,
    analysis_scores,
    assessment_id,
}: Day1ScienceEmailProps) {
    const resultsUrl = `${BASE_URL}/login?email=${encodeURIComponent(email)}`

    const concernText = primary_concern === 'PIH' ? 'dark spots (PIH)' : primary_concern

    // Dynamic Clinical Copy Logic
    let personalizedSnippet = ''
    if (analysis_scores) {
        if (analysis_scores.barrier_integrity && analysis_scores.barrier_integrity < 70) {
            personalizedSnippet = `Your barrier integrity score of ${analysis_scores.barrier_integrity} is exactly why we assigned barrier-restoring actives into your formula.`
        } else if (analysis_scores.melanin_sensitivity && analysis_scores.melanin_sensitivity > 60) {
            personalizedSnippet = `Your melanin sensitivity score of ${analysis_scores.melanin_sensitivity} is why we prioritized non-inflammatory brighteners over harsh acids.`
        } else {
            personalizedSnippet = `Your clinical scores dictated the precise concentration of each active.`
        }
    }

    return (
        <Html>
            <Head />
            <Preview>The clinical science behind your Toneek formula</Preview>
            <Body style={body}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={brandHeading}>Toneek</Heading>
                        <Text style={tagline}>Skin intelligence for melanin-rich skin</Text>
                    </Section>

                    <Hr style={divider} />

                    {/* Content */}
                    <Section style={section}>
                        <Heading as="h2" style={h2}>Why your skin needs {formula_code}</Heading>
                        <Text style={body_text}>
                            Yesterday, you completed your Toneek skin assessment. Our clinical algorithm designed <strong>{formula_code}</strong> specifically to address {concernText} while protecting your skin barrier.
                        </Text>
                        <Text style={body_text}>
                            Melanin-rich skin requires a different approach. Standard products often use harsh exfoliants that trigger inflammation and actually worsen pigmentation. Your custom formula uses precise, targeted concentrations of bio-active ingredients that work <em>with</em> your skin's natural chemistry, not against it.
                        </Text>
                        {personalizedSnippet && (
                            <Text style={body_text}>
                                <em>{personalizedSnippet}</em>
                            </Text>
                        )}
                    </Section>

                    {/* Education */}
                    <Section style={scoreSection}>
                        <Heading as="h3" style={h3}>The Toneek Difference</Heading>
                        <Text style={body_text}>
                            ✓ <strong>Compounded fresh</strong> for maximum potency<br/>
                            ✓ <strong>Zero harsh acids</strong> that trigger inflammation<br/>
                            ✓ <strong>Climate-adjusted</strong> for your local environment
                        </Text>
                    </Section>

                    <Hr style={divider} />

                    {/* CTA */}
                    <Section style={ctaSection}>
                        <Heading as="h3" style={h3}>Start your protocol</Heading>
                        <Text style={body_text}>
                            Your formula is saved and ready to be compounded by our clinical team.
                        </Text>
                        <Button href={resultsUrl} style={ctaButton}>
                            Subscribe to commence protocol
                        </Button>
                    </Section>

                    <Hr style={divider} />

                    <Section style={footer}>
                        <Text style={footerText}>
                            Toneek · Skin intelligence for melanin-rich skin
                        </Text>
                        <Text style={footerText}>
                            You received this because you requested a Toneek skin assessment.
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
