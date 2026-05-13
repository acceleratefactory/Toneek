import { adminClient } from '@/lib/supabase/admin'

export async function incrementPrescriptionCount(formulaCode: string, segment: any) {
  // Try to find existing pattern
  const { data: existing } = await adminClient
    .from('formula_adverse_patterns')
    .select('id, total_prescriptions')
    .eq('formula_code', formulaCode)
    .contains('profile_segment', segment)
    .maybeSingle()

  if (existing) {
    await adminClient
      .from('formula_adverse_patterns')
      .update({ 
        total_prescriptions: existing.total_prescriptions + 1,
        last_updated: new Date().toISOString()
      })
      .eq('id', existing.id)
  } else {
    await adminClient
      .from('formula_adverse_patterns')
      .insert({
        formula_code: formulaCode,
        profile_segment: segment,
        total_prescriptions: 1,
        adverse_reaction_count: 0
      })
  }
}

export async function incrementAdverseCount(formulaCode: string, segment: any) {
  const { data: existing } = await adminClient
    .from('formula_adverse_patterns')
    .select('id, adverse_reaction_count')
    .eq('formula_code', formulaCode)
    .contains('profile_segment', segment)
    .maybeSingle()

  if (existing) {
    await adminClient
      .from('formula_adverse_patterns')
      .update({ 
        adverse_reaction_count: existing.adverse_reaction_count + 1,
        last_updated: new Date().toISOString()
      })
      .eq('id', existing.id)
  } else {
    // Should theoretically exist because prescription came first, but fallback just in case
    await adminClient
      .from('formula_adverse_patterns')
      .insert({
        formula_code: formulaCode,
        profile_segment: segment,
        total_prescriptions: 1, // Assume 1 to avoid division by zero
        adverse_reaction_count: 1
      })
  }
}
