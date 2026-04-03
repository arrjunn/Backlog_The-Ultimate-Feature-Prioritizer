'use client'

import { useState, useCallback, useRef } from 'react'
import { Loader2, Send, Sparkles, ExternalLink } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useWorkspace } from '@/app/workspace/[slug]/WorkspaceLayoutClient'
import { cn } from '@/lib/utils/cn'
import type { MatchedRequest } from '@/types/ask.types'

const STATUS_DOTS: Record<string, string> = {
    backlog: 'bg-gray-400',
    now: 'bg-red-500',
    next: 'bg-orange-400',
    later: 'bg-blue-400',
    shipped: 'bg-green-500',
}

const SUGGESTED_QUESTIONS = [
    'What are the highest priority unshipped features?',
    'Are there any duplicate or similar requests?',
    'Summarize the backlog by status',
    'Which requests need the most effort?',
]

interface AskAIProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AskAI({ open, onOpenChange }: AskAIProps) {
    const { workspace } = useWorkspace()
    const [question, setQuestion] = useState('')
    const [answer, setAnswer] = useState<string | null>(null)
    const [sources, setSources] = useState<MatchedRequest[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleAsk = useCallback(async (q?: string) => {
        const text = (q || question).trim()
        if (!text || !workspace?.id || loading) return
        setLoading(true)
        setError(null)
        setAnswer(null)
        setSources([])

        try {
            const res = await fetch('/api/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: text, workspaceId: workspace.id }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
            setAnswer(data.answer)
            setSources(data.sources || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get answer')
        } finally {
            setLoading(false)
        }
    }, [question, workspace?.id, loading])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleAsk()
        }
    }, [handleAsk])

    const handleSuggestion = (q: string) => {
        setQuestion(q)
        handleAsk(q)
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) setLoading(false); onOpenChange(v) }}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
                        <Sparkles className="h-4 w-4" />
                        Ask AI
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Ask a natural language question about your feature requests
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col flex-1 overflow-hidden">
                    {/* Input */}
                    <div className="px-5 pt-4 pb-3">
                        <div className="flex gap-2">
                            <Textarea
                                ref={textareaRef}
                                placeholder="e.g., What are the top pain points around onboarding?"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="min-h-[60px] max-h-[100px] text-sm flex-1 resize-none font-mono"
                                disabled={loading}
                            />
                            <Button
                                size="icon"
                                onClick={() => handleAsk()}
                                disabled={!question.trim() || loading}
                                className="shrink-0 self-end"
                                aria-label="Ask question"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                        {error && <p className="text-xs text-destructive mt-2">{error}</p>}
                    </div>

                    {/* Suggested questions (shown when no answer) */}
                    {!answer && !loading && (
                        <div className="px-5 pb-4">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Try asking</p>
                            <div className="flex flex-wrap gap-1.5">
                                {SUGGESTED_QUESTIONS.map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => handleSuggestion(q)}
                                        className="text-[11px] px-2.5 py-1 border border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="px-5 py-8 flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-xs">Thinking...</span>
                        </div>
                    )}

                    {/* Answer */}
                    {answer && (
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <ScrollArea className="flex-1 px-5">
                                <div className="py-3">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Answer</p>
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {answer}
                                    </div>
                                </div>

                                {/* Sources */}
                                {sources.length > 0 && (
                                    <div className="pt-3 pb-5 border-t border-border mt-3">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                                            Sources ({sources.length} feature requests)
                                        </p>
                                        <div className="space-y-1.5">
                                            {sources.map((s) => (
                                                <div
                                                    key={s.id}
                                                    className="flex items-center gap-2 px-2.5 py-1.5 border border-border bg-muted/30 hover:bg-muted/60 transition-colors group"
                                                >
                                                    <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', STATUS_DOTS[s.status] || 'bg-gray-400')} />
                                                    <span className="text-xs font-medium flex-1 truncate">{s.title}</span>
                                                    <span className="text-[10px] text-muted-foreground capitalize shrink-0">{s.status}</span>
                                                    {s.rice_score != null && (
                                                        <span className="text-[10px] text-muted-foreground shrink-0">RICE: {s.rice_score}</span>
                                                    )}
                                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                                        {Math.round(s.similarity * 100)}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
