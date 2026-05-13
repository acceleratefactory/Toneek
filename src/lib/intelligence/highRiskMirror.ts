import { adminClient } from '@/lib/supabase/admin'

export type ProfileSegment = {
  skin_type: string
  fitzpatrick_estimate: string
  primary_concern: string
}

export type RiskAssessmentResult = {
  risk_level: 'insufficient_data' | 'low_risk' | 'moderate_risk' | 'high_risk'
  confidence: 'low' | 'medium' | 'high'
  adverse_rate: number
  total_prescriptions: number
  safe_alternative?: string
}

/**
 * Assesses the risk of a specific formula for a specific customer profile.
 */
export async function assessFormulaRisk(
  formulaCode: string,
  segment: ProfileSegment
): Promise<RiskAssessmentResult> {
  // Try to find an exact match for the segment
  const { data: exactMatch } = await adminClient
    .from('clinical_lookalike_risk')
    .select('*')
    .eq('formula_code', formulaCode)
    .contains('profile_segment', segment)
    .maybeSingle()

  if (exactMatch) {
    return {
      risk_level: exactMatch.risk_level,
      confidence: exactMatch.confidence,
      adverse_rate: exactMatch.adverse_rate,
      total_prescriptions: exactMatch.total_prescriptions,
      // If high risk, we can query for a safer alternative (lowest adverse_rate for this segment)
      safe_alternative: exactMatch.risk_level === 'high_risk' ? await findSafeAlternative(formulaCode, segment) : undefined
    }
  }

  // If no exact match, or insufficient data, we return insufficient_data
  return {
    risk_level: 'insufficient_data',
    confidence: 'low',
    adverse_rate: 0,
    total_prescriptions: 0
  }
}

async function findSafeAlternative(originalFormula: string, segment: ProfileSegment): Promise<string | undefined> {
  // Find formulas prescribed to the same segment with low risk
  const { data: safeAlternatives } = await adminClient
    .from('clinical_lookalike_risk')
    .select('formula_code, adverse_rate')
    .contains('profile_segment', segment)
    .neq('formula_code', originalFormula)
    .in('risk_level', ['low_risk'])
    .order('adverse_rate', { ascending: true })
    .limit(1)

  if (safeAlternatives && safeAlternatives.length > 0) {
    return safeAlternatives[0].formula_code
  }

  return undefined
}
