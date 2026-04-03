import { RetrieverQueryEngine, Settings, PromptTemplate, getResponseSynthesizer } from 'llamaindex'
import { Gemini, GEMINI_MODEL } from '@llamaindex/google'
import type { SupabaseClient } from '@supabase/supabase-js'
import { BacklogRetriever } from './retriever'

const TEXT_QA_PROMPT = new PromptTemplate({
    template: `You are a helpful assistant for a product team's feature request backlog.
Answer the user's question based ONLY on the provided feature request data below.
Be concise and specific. Reference feature requests by their exact title in quotes.
If the data doesn't contain enough information to answer, say so clearly.
Do not make up information that isn't in the provided context.
Format your response in plain text with clear structure.

Context information:
---------------------
{context}
---------------------

Question: {query}
Answer:`,
})

interface CreateAskEngineOptions {
    supabase: SupabaseClient
    workspaceId: string
}

export function createAskEngine(options: CreateAskEngineOptions) {
    const retriever = new BacklogRetriever({
        supabase: options.supabase,
        workspaceId: options.workspaceId,
        matchThreshold: 0.30,
        matchCount: 12,
    })

    Settings.llm = new Gemini({
        model: GEMINI_MODEL.GEMINI_2_0_FLASH,
        apiKey: process.env.GOOGLE_API_KEY!,
        temperature: 0.3,
    })

    const responseSynthesizer = getResponseSynthesizer('compact', {
        textQATemplate: TEXT_QA_PROMPT,
    })

    const engine = new RetrieverQueryEngine(retriever, responseSynthesizer)

    return { engine, retriever }
}
