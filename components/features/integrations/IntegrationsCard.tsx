'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, ChevronDown, ChevronRight, ExternalLink, Loader2, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

interface IntegrationConfig {
    notion: { apiKey: string; databaseId: string }
    linear: { apiKey: string; teamId: string }
    jira: { jiraUrl: string; email: string; apiToken: string; projectKey: string }
}

const STORAGE_KEY = (workspaceId: string) => `fp_integrations_${workspaceId}`

function loadConfig(workspaceId: string): IntegrationConfig {
    try {
        const raw = localStorage.getItem(STORAGE_KEY(workspaceId))
        if (raw) return { ...defaultConfig(), ...JSON.parse(raw) }
    } catch { }
    return defaultConfig()
}

function defaultConfig(): IntegrationConfig {
    return {
        notion: { apiKey: '', databaseId: '' },
        linear: { apiKey: '', teamId: '' },
        jira: { jiraUrl: '', email: '', apiToken: '', projectKey: '' },
    }
}

function saveConfig(workspaceId: string, config: IntegrationConfig) {
    localStorage.setItem(STORAGE_KEY(workspaceId), JSON.stringify(config))
}

const PLATFORMS = [
    {
        id: 'notion' as const,
        name: 'Notion',
        logo: '📄',
        color: 'bg-gray-100 dark:bg-gray-800',
        docsUrl: 'https://www.notion.so/my-integrations',
        docsLabel: 'Get Notion API key →',
        fields: [
            { key: 'apiKey', label: 'Integration Token', placeholder: 'secret_xxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' },
            { key: 'databaseId', label: 'Database ID', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', type: 'text' },
        ],
    },
    {
        id: 'linear' as const,
        name: 'Linear',
        logo: '⚡',
        color: 'bg-violet-50 dark:bg-violet-950',
        docsUrl: 'https://linear.app/settings/api',
        docsLabel: 'Get Linear API key →',
        fields: [
            { key: 'apiKey', label: 'API Key', placeholder: 'lin_api_xxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' },
            { key: 'teamId', label: 'Team ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'text' },
        ],
    },
    {
        id: 'jira' as const,
        name: 'Jira',
        logo: '🔵',
        color: 'bg-blue-50 dark:bg-blue-950',
        docsUrl: 'https://id.atlassian.com/manage-profile/security/api-tokens',
        docsLabel: 'Get Jira API token →',
        fields: [
            { key: 'jiraUrl', label: 'Jira URL', placeholder: 'https://yourcompany.atlassian.net', type: 'text' },
            { key: 'email', label: 'Email', placeholder: 'you@company.com', type: 'email' },
            { key: 'apiToken', label: 'API Token', placeholder: 'ATATTxxxxxxxxxx', type: 'password' },
            { key: 'projectKey', label: 'Project Key', placeholder: 'PROJ', type: 'text' },
        ],
    },
]

export function IntegrationsCard({ workspaceId, isAdmin }: { workspaceId: string; isAdmin: boolean }) {
    const [expanded, setExpanded] = useState<string | null>(null)
    const [config, setConfig] = useState<IntegrationConfig>(() => loadConfig(workspaceId))
    const [saving, setSaving] = useState<string | null>(null)
    const [saved, setSaved] = useState<string[]>([])

    const handleSave = (platformId: keyof IntegrationConfig) => {
        setSaving(platformId)
        saveConfig(workspaceId, config)
        setTimeout(() => {
            setSaving(null)
            setSaved(prev => [...prev.filter(p => p !== platformId), platformId])
            toast.success(`${platformId.charAt(0).toUpperCase() + platformId.slice(1)} integration saved`)
            setTimeout(() => setSaved(prev => prev.filter(p => p !== platformId)), 3000)
        }, 600)
    }

    const updateField = (platform: keyof IntegrationConfig, field: string, value: string) => {
        setConfig(prev => ({
            ...prev,
            [platform]: { ...prev[platform], [field]: value },
        }))
    }

    const isConfigured = (platformId: keyof IntegrationConfig) => {
        const c = config[platformId]
        return Object.values(c).every(v => v.trim().length > 0)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Integrations
                </CardTitle>
                <CardDescription>Push feature requests to your project management tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {PLATFORMS.map(platform => {
                    const isOpen = expanded === platform.id
                    const configured = isConfigured(platform.id)

                    return (
                        <div key={platform.id} className={cn('rounded-xl border border-border overflow-hidden', platform.color)}>
                            <button
                                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                                onClick={() => setExpanded(isOpen ? null : platform.id)}
                                disabled={!isAdmin}
                            >
                                <span className="text-xl">{platform.logo}</span>
                                <span className="flex-1 font-medium text-sm">{platform.name}</span>
                                {configured && (
                                    <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                                        <CheckCircle2 className="h-3 w-3" /> Connected
                                    </span>
                                )}
                                {!isAdmin
                                    ? <span className="text-[10px] text-muted-foreground">admin only</span>
                                    : isOpen
                                        ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                }
                            </button>

                            {isOpen && isAdmin && (
                                <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3 bg-card/60">
                                    <a
                                        href={platform.docsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        {platform.docsLabel}
                                    </a>

                                    {platform.fields.map(field => (
                                        <div key={field.key} className="space-y-1">
                                            <Label className="text-xs">{field.label}</Label>
                                            <Input
                                                type={field.type}
                                                placeholder={field.placeholder}
                                                value={(config[platform.id] as any)[field.key]}
                                                onChange={e => updateField(platform.id, field.key, e.target.value)}
                                                className="h-8 text-xs font-mono"
                                            />
                                        </div>
                                    ))}

                                    <Button
                                        size="sm"
                                        onClick={() => handleSave(platform.id)}
                                        disabled={saving === platform.id}
                                        className="w-full"
                                    >
                                        {saving === platform.id
                                            ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                            : saved.includes(platform.id)
                                                ? <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-400" />
                                                : null
                                        }
                                        {saved.includes(platform.id) ? 'Saved!' : 'Save credentials'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )
                })}

                <p className="text-[10px] text-muted-foreground pt-1">
                    Credentials are stored locally in your browser. They are never sent to our servers.
                </p>
            </CardContent>
        </Card>
    )
}

// Exported helper for use in slide-over
export { loadConfig, STORAGE_KEY }
export type { IntegrationConfig }
