import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// Rule-based AI suggestion engine
// No external API — works offline, no rate limits, instant
// ---------------------------------------------------------------------------

interface Keyword {
    patterns: RegExp[]
    reach?: number
    impact?: number
    confidence?: number
    effort?: number
    tags?: string[]
}

const KEYWORD_RULES: Keyword[] = [
    // High reach + high impact
    { patterns: [/auth|login|sign.?in|sso|oauth|password/i], reach: 8, impact: 9, confidence: 80, effort: 7, tags: ['security', 'auth'] },
    { patterns: [/dashboard|overview|home.?page|landing/i], reach: 9, impact: 8, confidence: 80, effort: 6 },
    { patterns: [/search|filter|sort|find/i], reach: 9, impact: 7, confidence: 90, effort: 5 },
    { patterns: [/notification|alert|email|remind/i], reach: 8, impact: 7, confidence: 70, effort: 6 },
    { patterns: [/export|download|csv|pdf|report/i], reach: 7, impact: 8, confidence: 90, effort: 4 },
    { patterns: [/import|upload|sync/i], reach: 7, impact: 7, confidence: 80, effort: 6 },
    { patterns: [/mobile|responsive|tablet|ios|android/i], reach: 8, impact: 8, confidence: 70, effort: 8 },
    { patterns: [/performance|speed|fast|optim|slow|latency/i], reach: 8, impact: 9, confidence: 70, effort: 7 },
    { patterns: [/dark.?mode|theme|appearance/i], reach: 7, impact: 5, confidence: 90, effort: 4 },
    { patterns: [/onboard|tutorial|guide|help|doc/i], reach: 7, impact: 7, confidence: 80, effort: 5 },
    { patterns: [/billing|payment|subscription|stripe|plan/i], reach: 6, impact: 10, confidence: 70, effort: 9 },
    { patterns: [/api|webhook|integration|zapier|plugin/i], reach: 6, impact: 8, confidence: 70, effort: 7 },
    { patterns: [/bug|fix|broken|crash|error/i], reach: 8, impact: 8, confidence: 90, effort: 3 },
    { patterns: [/design|ui|ux|style|color|font|icon/i], reach: 7, impact: 5, confidence: 80, effort: 3 },
    { patterns: [/admin|settings|config|prefer/i], reach: 6, impact: 7, confidence: 80, effort: 5 },
    { patterns: [/analytics|insight|chart|graph|metric|report/i], reach: 7, impact: 8, confidence: 80, effort: 7 },
    { patterns: [/collaboration|share|team|invite|permission/i], reach: 8, impact: 8, confidence: 75, effort: 8 },
    { patterns: [/automat|workflow|batch|schedul|cron/i], reach: 6, impact: 8, confidence: 70, effort: 7 },
    { patterns: [/ai|ml|machine.?learn|predict|suggest/i], reach: 7, impact: 9, confidence: 60, effort: 9 },
    { patterns: [/comment|feedback|review|rating/i], reach: 7, impact: 6, confidence: 85, effort: 5 },
    { patterns: [/keyboard|shortcut|hotkey/i], reach: 5, impact: 6, confidence: 85, effort: 3 },
    { patterns: [/offline|cache|sync/i], reach: 6, impact: 7, confidence: 60, effort: 8 },
]

function analyzeText(text: string) {
    let reach = 5, impact = 5, confidence = 70, effort = 5
    const matchedTags: string[] = []
    let matchCount = 0

    for (const rule of KEYWORD_RULES) {
        if (rule.patterns.some(p => p.test(text))) {
            reach += (rule.reach ?? 5) - 5
            impact += (rule.impact ?? 5) - 5
            confidence += (rule.confidence ?? 70) - 70
            effort += (rule.effort ?? 5) - 5
            if (rule.tags) matchedTags.push(...rule.tags)
            matchCount++
        }
    }

    // Text length signals complexity → higher effort
    if (text.length > 300) effort += 1
    if (text.length > 600) effort += 1

    // Clamp values
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(v)))
    const avgDivisor = matchCount > 0 ? matchCount : 1

    return {
        reach: clamp(matchCount > 1 ? Math.round(reach / Math.max(matchCount - 1, 1)) : reach, 1, 10),
        impact: clamp(matchCount > 1 ? Math.round(impact / Math.max(matchCount - 1, 1)) : impact, 1, 10),
        confidence: clamp(confidence, 10, 100),
        effort: clamp(matchCount > 1 ? Math.round(effort / Math.max(matchCount - 1, 1)) : effort, 1, 10),
        tags: Array.from(new Set(matchedTags)),
    }
}

function buildReasoning(title: string, scores: ReturnType<typeof analyzeText>, framework: string): string {
    const { reach, impact, effort } = scores
    const complexity = effort >= 7 ? 'complex' : effort >= 4 ? 'moderate' : 'straightforward'
    const priority = impact >= 8 ? 'high-impact' : impact >= 5 ? 'medium-impact' : 'lower-impact'
    return `"${title.slice(0, 50)}" appears to be a ${priority}, ${complexity} feature based on its description keywords. Adjust scores based on your team's specific context.`
}

function getSuggestion(title: string, description: string, framework: string): Record<string, unknown> {
    const text = `${title} ${description}`.toLowerCase()
    const scores = analyzeText(text)
    const reasoning = buildReasoning(title, scores, framework)

    switch (framework) {
        case 'rice':
            return {
                reach: scores.reach,
                impact: scores.impact,
                confidence: Math.round(scores.confidence / 10) * 10, // round to nearest 10
                effort: scores.effort,
                reasoning,
            }
        case 'ice':
            return {
                ice_impact: scores.impact,
                ice_confidence: Math.min(10, Math.round(scores.confidence / 10)),
                ice_ease: Math.max(1, 11 - scores.effort), // invert effort → ease
                reasoning,
            }
        case 'moscow': {
            const score = (scores.impact * 2 + scores.reach) / 3
            const category = score >= 8 ? 'must_have' : score >= 6 ? 'should_have' : score >= 4 ? 'could_have' : 'wont_have'
            return {
                moscow_category: category,
                moscow_rationale: reasoning,
            }
        }
        case 'jtbd':
            return {
                jtbd_importance: scores.impact,
                jtbd_satisfaction: Math.max(1, 10 - scores.impact + 2), // low impact = high satisfaction gap
                jtbd_job_statement: `When I use the product, I want to ${title.toLowerCase().replace(/^add |^create |^build |^implement /i, '')}, so I can achieve my goals more efficiently.`,
                reasoning,
            }
        case 'kano': {
            const categories = ['must_be', 'one_dimensional', 'attractive', 'indifferent']
            const idx = scores.impact >= 8 ? 0 : scores.impact >= 6 ? 1 : scores.reach >= 7 ? 2 : 3
            return {
                kano_category: categories[idx],
                kano_functional_response: scores.impact >= 7 ? 'like' : 'neutral',
                kano_dysfunctional_response: scores.impact >= 8 ? 'dislike' : 'neutral',
                reasoning,
            }
        }
        case 'impact_effort': {
            const quadrant =
                scores.impact >= 6 && scores.effort <= 5 ? 'quick_win' :
                    scores.impact >= 6 && scores.effort > 5 ? 'major_project' :
                        scores.impact < 6 && scores.effort <= 5 ? 'fill_in' : 'thankless_task'
            return {
                ie_impact: scores.impact,
                ie_effort: scores.effort,
                ie_quadrant: quadrant,
                reasoning,
            }
        }
        case 'wsjf':
            return {
                wsjf_user_business_value: scores.impact,
                wsjf_time_criticality: Math.min(10, Math.round(scores.reach * 0.8)),
                wsjf_risk_reduction: Math.min(10, Math.round(scores.confidence / 10)),
                wsjf_job_size: scores.effort,
                reasoning,
            }
        default:
            return { reasoning }
    }
}

export async function POST(req: NextRequest) {
    try {
        const { title, description, framework } = await req.json()

        if (!title || !framework) {
            return NextResponse.json({ error: 'title and framework are required' }, { status: 400 })
        }

        const suggestion = getSuggestion(title, description ?? '', framework)
        return NextResponse.json({ suggestion, framework })
    } catch (err: any) {
        return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
    }
}
