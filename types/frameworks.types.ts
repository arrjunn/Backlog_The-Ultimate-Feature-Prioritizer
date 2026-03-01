export type FrameworkId = 'rice' | 'ice' | 'moscow' | 'jtbd' | 'kano' | 'impact_effort' | 'wsjf'

export type MoSCoWCategory = 'must_have' | 'should_have' | 'could_have' | 'wont_have'

export type KanoResponse = 'like' | 'expect' | 'neutral' | 'tolerate' | 'dislike'

export type KanoCategory = 'must_be' | 'one_dimensional' | 'attractive' | 'indifferent' | 'reverse' | 'questionable'

export type IEQuadrant = 'quick_win' | 'major_project' | 'fill_in' | 'thankless_task'

export interface FrameworkConfig {
    id: FrameworkId
    name: string
    fullName: string
    description: string
    bestFor: string
    fields: string[]
    scoreField: string
    icon: string
    color: string
    colorHex: string
}

export interface FrameworkScores {
    // ICE
    ice_impact?: number | null
    ice_confidence?: number | null
    ice_ease?: number | null
    ice_score?: number | null
    // MoSCoW
    moscow_category?: MoSCoWCategory | null
    moscow_rationale?: string | null
    // JTBD
    jtbd_job_statement?: string | null
    jtbd_importance?: number | null
    jtbd_satisfaction?: number | null
    jtbd_opportunity_score?: number | null
    // Kano
    kano_category?: KanoCategory | null
    kano_functional_response?: KanoResponse | null
    kano_dysfunctional_response?: KanoResponse | null
    kano_satisfaction_score?: number | null
    // Impact/Effort
    ie_impact?: number | null
    ie_effort?: number | null
    ie_quadrant?: IEQuadrant | null
    // WSJF
    wsjf_user_business_value?: number | null
    wsjf_time_criticality?: number | null
    wsjf_risk_reduction?: number | null
    wsjf_job_size?: number | null
    wsjf_score?: number | null
}

export interface FrameworkCoverage {
    rice: boolean
    ice: boolean
    moscow: boolean
    jtbd: boolean
    kano: boolean
    impact_effort: boolean
    wsjf: boolean
}
