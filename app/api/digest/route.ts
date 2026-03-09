import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { escapeHtml } from '@/lib/utils/shared'

const RESEND_URL = 'https://api.resend.com/emails'

/**
 * Weekly digest email — called via cron (e.g., Vercel Cron).
 * Sends each workspace admin a summary of the past 7 days.
 *
 * Auth: Uses a shared CRON_SECRET header (not user auth).
 */
export async function GET(req: NextRequest) {
    // Verify cron secret
    const cronSecret = process.env.CRON_SECRET
    const authHeader = req.headers.get('authorization')
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Supabase env vars not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    try {
        // Get all workspaces
        const { data: workspaces } = await supabase.from('workspaces').select('id, name, slug')
        if (!workspaces || workspaces.length === 0) {
            return NextResponse.json({ sent: 0 })
        }

        let totalSent = 0

        for (const ws of workspaces) {
            // Get admins
            const { data: admins } = await supabase
                .from('workspace_members')
                .select('user_id, profiles(email, full_name)')
                .eq('workspace_id', ws.id)
                .eq('role', 'admin')

            if (!admins || admins.length === 0) continue

            // New requests this week
            const { count: newRequests } = await supabase
                .from('feature_requests')
                .select('*', { count: 'exact', head: true })
                .eq('workspace_id', ws.id)
                .gte('created_at', sevenDaysAgo)

            // Shipped this week
            const { count: shipped } = await supabase
                .from('feature_requests')
                .select('*', { count: 'exact', head: true })
                .eq('workspace_id', ws.id)
                .eq('status', 'shipped')
                .gte('shipped_at', sevenDaysAgo)

            // Total votes this week
            const { data: weekRequests } = await supabase
                .from('feature_requests')
                .select('id')
                .eq('workspace_id', ws.id)

            let newVotes = 0
            let newComments = 0
            if (weekRequests && weekRequests.length > 0) {
                const reqIds = weekRequests.map((r) => r.id)
                const { count: voteCount } = await supabase
                    .from('votes')
                    .select('*', { count: 'exact', head: true })
                    .in('feature_request_id', reqIds)
                    .gte('created_at', sevenDaysAgo)
                newVotes = voteCount || 0

                const { count: commentCount } = await supabase
                    .from('comments')
                    .select('*', { count: 'exact', head: true })
                    .in('feature_request_id', reqIds)
                    .gte('created_at', sevenDaysAgo)
                newComments = commentCount || 0
            }

            // Top 3 most voted requests
            const { data: topRequests } = await supabase
                .from('feature_requests')
                .select('title, status, votes(id)')
                .eq('workspace_id', ws.id)
                .neq('status', 'shipped')
                .order('rice_score', { ascending: false, nullsFirst: false })
                .limit(3)

            // Skip if nothing happened
            if ((newRequests || 0) === 0 && (shipped || 0) === 0 && newVotes === 0 && newComments === 0) {
                continue
            }

            const topRequestsHtml = (topRequests || [])
                .map((r: any) => {
                    const votes = r.votes?.length || 0
                    return `<li style="margin-bottom:8px;"><strong>${escapeHtml(r.title)}</strong> — ${votes} vote${votes !== 1 ? 's' : ''} · ${escapeHtml(r.status)}</li>`
                })
                .join('')

            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
            const wsUrl = `${siteUrl}/workspace/${ws.slug}/backlog`

            const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#050505;color:#f5f5f5;font-family:system-ui,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
    <h1 style="font-size:18px;font-weight:700;margin:0 0 4px;">Weekly Digest</h1>
    <p style="color:#666;font-size:13px;margin:0 0 24px;">${escapeHtml(ws.name)} — last 7 days</p>

    <div style="display:flex;gap:12px;margin-bottom:24px;">
      <div style="flex:1;padding:16px;border:1px solid rgba(255,255,255,0.1);text-align:center;">
        <div style="font-size:24px;font-weight:700;">${newRequests || 0}</div>
        <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;">New Requests</div>
      </div>
      <div style="flex:1;padding:16px;border:1px solid rgba(255,255,255,0.1);text-align:center;">
        <div style="font-size:24px;font-weight:700;">${shipped || 0}</div>
        <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;">Shipped</div>
      </div>
      <div style="flex:1;padding:16px;border:1px solid rgba(255,255,255,0.1);text-align:center;">
        <div style="font-size:24px;font-weight:700;">${newVotes}</div>
        <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;">Votes</div>
      </div>
      <div style="flex:1;padding:16px;border:1px solid rgba(255,255,255,0.1);text-align:center;">
        <div style="font-size:24px;font-weight:700;">${newComments}</div>
        <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;">Comments</div>
      </div>
    </div>

    ${topRequestsHtml ? `
    <h2 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#666;margin:0 0 12px;">Top Requests</h2>
    <ul style="padding-left:16px;margin:0 0 24px;font-size:14px;line-height:1.6;">${topRequestsHtml}</ul>
    ` : ''}

    <a href="${wsUrl}" style="display:inline-block;padding:10px 20px;background:#f5f5f5;color:#050505;text-decoration:none;font-size:13px;font-weight:600;">
      View Backlog →
    </a>

    <p style="margin-top:32px;font-size:11px;color:#444;">
      Sent by Backlog · Weekly digest for workspace admins
    </p>
  </div>
</body>
</html>`

            // Send to each admin
            for (const admin of admins) {
                const profile = (admin as any).profiles
                if (!profile?.email) continue

                await fetch(RESEND_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: 'Backlog <digest@updates.backlog.dev>',
                        to: profile.email,
                        subject: `Weekly Digest — ${ws.name}`,
                        html,
                    }),
                })
                totalSent++
            }
        }

        return NextResponse.json({ sent: totalSent })
    } catch (err) {
        return NextResponse.json({ error: 'Failed to send digests' }, { status: 500 })
    }
}
