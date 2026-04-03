export interface MatchedRequest {
    id: string
    title: string
    description: string | null
    status: string
    rice_score: number | null
    created_at: string
    similarity: number
}

export interface AskResponse {
    answer: string
    sources: MatchedRequest[]
}
