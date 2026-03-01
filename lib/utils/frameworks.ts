import type { FrameworkConfig, FrameworkId } from '@/types/frameworks.types'

export const FRAMEWORKS: FrameworkConfig[] = [
    {
        id: 'rice',
        name: 'RICE',
        fullName: 'RICE Score',
        description: 'Prioritize by Reach, Impact, Confidence, and Effort',
        bestFor: 'Teams that want a data-driven, balanced scoring method',
        fields: ['reach', 'impact', 'confidence', 'effort'],
        scoreField: 'rice_score',
        icon: 'BarChart2',
        color: 'indigo',
        colorHex: '#6366f1',
    },
    {
        id: 'ice',
        name: 'ICE',
        fullName: 'ICE Score',
        description: 'Prioritize by Impact, Confidence, and Ease',
        bestFor: 'Teams that want a simpler, faster scoring method than RICE',
        fields: ['ice_impact', 'ice_confidence', 'ice_ease'],
        scoreField: 'ice_score',
        icon: 'Zap',
        color: 'cyan',
        colorHex: '#06b6d4',
    },
    {
        id: 'moscow',
        name: 'MoSCoW',
        fullName: 'MoSCoW Method',
        description: "Categorize features as Must Have, Should Have, Could Have, or Won't Have",
        bestFor: 'Sprint planning and stakeholder alignment',
        fields: ['moscow_category', 'moscow_rationale'],
        scoreField: 'moscow_category',
        icon: 'Layers',
        color: 'violet',
        colorHex: '#8b5cf6',
    },
    {
        id: 'jtbd',
        name: 'JTBD',
        fullName: 'Jobs To Be Done',
        description: 'Identify user jobs and score by importance vs satisfaction gap',
        bestFor: 'Customer-centric teams focused on user outcomes',
        fields: ['jtbd_job_statement', 'jtbd_importance', 'jtbd_satisfaction'],
        scoreField: 'jtbd_opportunity_score',
        icon: 'Target',
        color: 'orange',
        colorHex: '#f97316',
    },
    {
        id: 'kano',
        name: 'Kano',
        fullName: 'Kano Model',
        description: 'Classify features by their effect on customer satisfaction',
        bestFor: 'Product discovery and delight-driven roadmapping',
        fields: ['kano_functional_response', 'kano_dysfunctional_response'],
        scoreField: 'kano_satisfaction_score',
        icon: 'Smile',
        color: 'pink',
        colorHex: '#ec4899',
    },
    {
        id: 'impact_effort',
        name: 'Impact/Effort',
        fullName: 'Impact/Effort Matrix',
        description: 'Plot features on a 2×2 matrix of impact vs effort',
        bestFor: 'Quick visual prioritization and team alignment',
        fields: ['ie_impact', 'ie_effort'],
        scoreField: 'ie_quadrant',
        icon: 'Grid2x2',
        color: 'teal',
        colorHex: '#14b8a6',
    },
    {
        id: 'wsjf',
        name: 'WSJF',
        fullName: 'Weighted Shortest Job First',
        description: 'Prioritize by Cost of Delay ÷ Job Size (SAFe framework)',
        bestFor: 'Enterprise and agile-at-scale teams using SAFe',
        fields: ['wsjf_user_business_value', 'wsjf_time_criticality', 'wsjf_risk_reduction', 'wsjf_job_size'],
        scoreField: 'wsjf_score',
        icon: 'TrendingUp',
        color: 'amber',
        colorHex: '#f59e0b',
    },
]

export function getFrameworkConfig(id: FrameworkId): FrameworkConfig {
    return FRAMEWORKS.find((f) => f.id === id) ?? FRAMEWORKS[0]
}

export function getFrameworkById(id: string): FrameworkConfig | undefined {
    return FRAMEWORKS.find((f) => f.id === id)
}
