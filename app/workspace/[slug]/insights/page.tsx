'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend,
} from 'recharts'
import { TrendingUp, Star, Package, Users, BarChart3, Layers } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { STATUS_CONFIG } from '@/lib/utils/rice'
import { FRAMEWORKS } from '@/lib/utils/frameworks'
import { FeatureRequest } from '@/types/database.types'
import { useWorkspace } from '../WorkspaceLayoutClient'
import { cn } from '@/lib/utils/cn'

const COLORS = ['#8b5cf6', '#f97316', '#3b82f6', '#6b7280', '#22c55e']

function StatCard({
    title,
    value,
    icon: Icon,
    color,
}: {
    title: string
    value: number | string
    icon: React.ElementType
    color: string
}) {
    return (
        <Card className="relative overflow-hidden">
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">{title}</p>
                        <p className="text-3xl font-bold">{value}</p>
                    </div>
                    <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', color)}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-600 opacity-20" />
            </CardContent>
        </Card>
    )
}

export default function InsightsPage() {
    const { slug } = useParams<{ slug: string }>()
    const { workspace } = useWorkspace()
    const supabase = createClient()

    const { data: requests, isLoading } = useQuery({
        queryKey: ['feature-requests', slug],
        enabled: !!workspace,
        queryFn: async () => {
            const { data } = await supabase
                .from('feature_requests')
                .select('*, votes(id)')
                .eq('workspace_id', workspace!.id)
            return (data || []) as (FeatureRequest & { votes: { id: string }[] })[]
        },
    })

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
                </div>
            </div>
        )
    }

    const totalRequests = requests?.length || 0
    const totalVotes = requests?.reduce((sum, r) => sum + (r.votes?.length || 0), 0) || 0

    const now = new Date()
    const shippedThisMonth = requests?.filter((r) => {
        if (r.status !== 'shipped' || !r.shipped_at) return false
        const shipped = new Date(r.shipped_at)
        return shipped.getMonth() === now.getMonth() && shipped.getFullYear() === now.getFullYear()
    }).length || 0

    // Top 10 by RICE score
    const top10 = [...(requests || [])]
        .sort((a, b) => (b.rice_score || 0) - (a.rice_score || 0))
        .slice(0, 10)
        .map((r) => ({
            name: r.title.length > 30 ? r.title.slice(0, 30) + '…' : r.title,
            score: Math.round((r.rice_score || 0) * 100) / 100,
        }))

    // By status (pie)
    const byStatus = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
        name: cfg.label,
        value: requests?.filter((r) => r.status === key).length || 0,
        color: key === 'backlog' ? '#6b7280'
            : key === 'now' ? '#ef4444'
                : key === 'next' ? '#f97316'
                    : key === 'later' ? '#3b82f6'
                        : '#22c55e',
    })).filter((d) => d.value > 0)

    // Last 30 days trend
    const last30 = Array.from({ length: 30 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (29 - i))
        const dateStr = d.toISOString().split('T')[0]
        const count = requests?.filter((r) => r.created_at.startsWith(dateStr)).length || 0
        return {
            date: `${d.getMonth() + 1}/${d.getDate()}`,
            requests: count,
        }
    })

    // Framework coverage
    const coverageData = FRAMEWORKS.map((f) => {
        let count = 0
        if (!requests) { count = 0 }
        else if (f.id === 'rice') count = requests.filter((r) => r.rice_score != null).length
        else if (f.id === 'ice') count = requests.filter((r) => r.ice_score != null).length
        else if (f.id === 'moscow') count = requests.filter((r) => r.moscow_category != null).length
        else if (f.id === 'jtbd') count = requests.filter((r) => r.jtbd_opportunity_score != null).length
        else if (f.id === 'kano') count = requests.filter((r) => r.kano_category != null).length
        else if (f.id === 'impact_effort') count = requests.filter((r) => r.ie_quadrant != null).length
        else if (f.id === 'wsjf') count = requests.filter((r) => r.wsjf_score != null).length
        return { name: f.name, count, color: f.colorHex, pct: totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0 }
    })
    const avgCoverage = coverageData.length > 0
        ? Math.round(coverageData.reduce((s, d) => s + d.pct, 0) / coverageData.length)
        : 0

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div>
                <h1 className="ws-page-heading">Insights</h1>
                <p className="ws-page-sub">analytics and trends for your workspace</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard
                    title="Total Requests"
                    value={totalRequests}
                    icon={BarChart3}
                    color="bg-violet-500/10 text-violet-500"
                />
                <StatCard
                    title="Total Votes"
                    value={totalVotes}
                    icon={Star}
                    color="bg-orange-500/10 text-orange-500"
                />
                <StatCard
                    title="Shipped This Month"
                    value={shippedThisMonth}
                    icon={Package}
                    color="bg-green-500/10 text-green-500"
                />
                <StatCard
                    title="Avg Framework Coverage"
                    value={`${avgCoverage}%`}
                    icon={Layers}
                    color="bg-blue-500/10 text-blue-500"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar chart - Top 10 RICE */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Top 10 by RICE Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {top10.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                                No data yet
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={top10} layout="vertical" margin={{ left: 16 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={180}
                                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            borderColor: 'hsl(var(--border))',
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                    />
                                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Pie chart - by status */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Requests by Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {byStatus.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                                No data yet
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={240}>
                                <PieChart>
                                    <Pie
                                        data={byStatus}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {byStatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            borderColor: 'hsl(var(--border))',
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                    />
                                    <Legend
                                        iconType="circle"
                                        iconSize={8}
                                        formatter={(value) => <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Line chart - trend */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Requests Over Last 30 Days</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={last30} margin={{ left: -8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                                    interval={4}
                                />
                                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: 8,
                                        fontSize: 12,
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="requests"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Framework Coverage */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Framework Coverage</CardTitle>
                    <p className="text-xs text-muted-foreground">How many requests have been scored with each framework</p>
                </CardHeader>
                <CardContent className="space-y-3">
                    {totalRequests === 0 ? (
                        <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
                    ) : (
                        coverageData.map((f) => (
                            <div key={f.name} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: f.color }} />
                                        <span>{f.name}</span>
                                    </div>
                                    <span className="text-muted-foreground tabular-nums">{f.count} / {totalRequests}</span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${f.pct}%`, background: f.color }}
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
