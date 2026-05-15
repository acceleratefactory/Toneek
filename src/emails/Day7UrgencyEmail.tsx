// src/emails/Day7UrgencyEmail.tsx
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

interface Day7UrgencyEmailProps {
    email: string
    formula_code: string
    assessment_id?: string
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://toneek.vercel.app'

export default function Day7UrgencyEmail({
    email,
    formula_code,
    assessment_id,
}: Day7UrgencyEmailProps) {
    const resultsUrl = `${BASE_URL}/login?email=${encodeURIComponent(email)}`

    return (
        <Html>
            <Head />
            <Preview>Your formula assignment expires in 7 days</Preview>
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
                        <Heading as="h2" style={h2}>Action Required</Heading>
                        <Text style={body_text}>
                            Your clinical profile and formula <strong>{formula_code}</strong> have been saved securely. However, this formula assignment expires in 7 days.
                        </Text>
                        <Text style={body_text}>
                            Because Toneek formulas contain highly active, pharmaceutical-grade ingredients tailored to your current skin state, the assessment data becomes stale after 14 days. If you do not begin your protocol, you will need to retake the clinical assessment to receive a new formula.
                        </Text>
                    </Section>

                    <Hr style={divider} />

                    {/* CTA */}
                    <Section style={ctaSection}>
                        <Heading as="h3" style={h3}>Finalise your protocol</Heading>
                        <Text style={body_text}>
                            We are ready to compound your formula the moment your payment is confirmed.
                        </Text>
                        <Button href={resultsUrl} style={ctaButton}>
                            Subscribe to compound formula
                        </Button>
                    </Section>

                    <Hr style={divider} />

                    <Section style={footer}>
                        <Text style={footerText}>
                            Toneek · Skin intelligence for melanin-rich skin
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
