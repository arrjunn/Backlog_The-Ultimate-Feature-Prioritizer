import { BaseRetriever, TextNode, type NodeWithScore } from 'llamaindex'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { MatchedRequest } from '@/types/ask.types'

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!

interface BacklogRetrieverOptions {
    supabase: SupabaseClient
    workspaceId: string
    matchThreshold?: number
    matchCount?: number
}

export class BacklogRetriever extends BaseRetriever {
    private supabase: SupabaseClient
    private workspaceId: string
    private matchThreshold: number
    private matchCount: number

    /** Populated after each _retrieve call so the API route can return structured sources */
    public lastSources: MatchedRequest[] = []

    constructor(options: BacklogRetrieverOptions) {
        super()
        this.supabase = options.supabase
        this.workspaceId = options.workspaceId
        this.matchThreshold = options.matchThreshold ?? 0.30
        this.matchCount = options.matchCount ?? 12
    }

    async _retrieve(params: { query: string }): Promise<NodeWithScore[]> {
        // 1. Embed the question using the same Google API as app/api/search/route.ts
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)

        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GOOGLE_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: { parts: [{ text: String(params.query) }] } }),
                signal: controller.signal,
            }
        )
        clearTimeout(timeout)

        const data = await res.json()
        const embedding = data?.embedding?.values as number[] | undefined
        if (!embedding) {
            console.error('Failed to embed question for Q&A')
            this.lastSources = []
            return []
        }

        // 2. Call existing match_requests RPC
        const { data: results, error } = await this.supabase.rpc('match_requests', {
            query_embedding: embedding,
            match_threshold: this.matchThreshold,
            match_count: this.matchCount,
            p_workspace_id: this.workspaceId,
        })

        if (error) {
            console.error('match_requests RPC error:', error)
            this.lastSources = []
            return []
        }

        const matched = (results || []) as MatchedRequest[]
        this.lastSources = matched

        // 3. Convert to LlamaIndex NodeWithScore format
        return matched.map((r) => {
            const text = [
                `Title: ${r.title}`,
                r.description ? `Description: ${r.description}` : null,
                `Status: ${r.status}`,
                r.rice_score != null ? `RICE Score: ${r.rice_score}` : null,
                `Created: ${r.created_at}`,
            ].filter(Boolean).join('\n')

            const node = new TextNode({
                text,
                metadata: {
                    id: r.id,
                    title: r.title,
                    status: r.status,
                    similarity: r.similarity,
                },
            })

            return { node, score: r.similarity }
        })
    }
}
