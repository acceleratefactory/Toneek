// src/lib/formula/triggerModifiers.ts
// Applies pre-submit modifications to the assessment based on trigger patterns.
// Called by /api/assessments/submit BEFORE calling /api/assign-formula.

export function applyTriggerModifiers(assessment: any) {
    const modified = { ...assessment }

    // ISOTRETINOIN — forces SA exclusion in the rule engine
    if (assessment.medications?.includes('isotretinoin')) {
        modified.isotretinoin_flag = true
        modified.medications_risk_high = true
    }

    // PRODUCT OVERLOAD — barrier-first override
    // 6+ products + products_trigger → route to GN-SN-01 (sensitive/minimal formula)
    if (
        assessment.current_product_count === '6_or_more' &&
        assessment.triggers?.includes('products_trigger')
    ) {
        modified.barrier_overload_flag = true
        modified.formula_override = 'GN-SN-01'
    }

    // HORMONAL TRIGGER + PIH — flag for tranexamic priority at Week 4 reformulation
    if (
        assessment.triggers?.includes('hormonal_trigger') &&
        assessment.primary_concern === 'PIH'
    ) {
        modified.tranexamic_priority = true
    }

    // STRESS TRIGGER — elevated check-in regardless of routing tier
    if (assessment.triggers?.includes('stress_trigger')) {
        modified.elevated_checkin = true
    }

    return modified
}
