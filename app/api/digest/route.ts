import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { escapeHtml } from '@/lib/utils/shared'

const RESEND_URL = 'https://api.resend.com/emails'

export async function GET(req: NextRequest) {
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

    const langflowUrl = process.env.LANGFLOW_FLOW_URL || 'https://aws-us-east-2.langflow.datastax.com/lf/8564c1bc-1419-4ac1-bd57-5ac513af3939/api/v1/run/c75be9c4-62d3-4e6a-b14e-b94224dbf11f'
    const langflowOrgId = process.env.LANGFLOW_ORG_ID || '3eb722f0-a013-4727-b3ba-854ed6988059'
    const emailFrom = process.env.EMAIL_FROM || 'Backlog <onboarding@resend.dev>'

    const supabase = createClient(supabaseUrl, supabaseKey)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    try {
        const { data: workspaces } = await supabase.from('workspaces').select('id, name, slug')
        if (!workspaces || workspaces.length === 0) {
            return NextResponse.json({ sent: 0 })
        }

        let totalSent = 0

        for (const ws of workspaces) {
            const { data: admins } = await supabase
                .from('workspace_members')
                .select('user_id, profiles(email, full_name)')
                .eq('workspace_id', ws.id)
                .eq('role', 'admin')

            if (!admins || admins.length === 0) continue

            const { count: newRequests } = await supabase
                .from('feature_requests')
                .select('*', { count: 'exact', head: true })
                .eq('workspace_id', ws.id)
                .gte('created_at', sevenDaysAgo)

            const { count: shipped } = await supabase
                .from('feature_requests')
                .select('*', { count: 'exact', head: true })
                .eq('workspace_id', ws.id)
                .eq('status', 'shipped')
                .gte('shipped_at', sevenDaysAgo)

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

            const { data: topRequests } = await supabase
                .from('feature_requests')
                .select('title, status, votes(id)')
                .eq('workspace_id', ws.id)
                .neq('status', 'shipped')
                .order('rice_score', { ascending: false, nullsFirst: false })
                .limit(3)

            let aiSummary = ''
            try {
                const langflowController = new AbortController()
                const langflowTimeout = setTimeout(() => langflowController.abort(), 30000)

                const langflowRes = await fetch(langflowUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${process.env.LANGFLOW_TOKEN}`,
                        'X-DataStax-Current-Org': langflowOrgId,
                    },
                    body: JSON.stringify({
                        input_type: 'chat',
                        output_type: 'chat',
                        input_value: `
Workspace: ${ws.name}
New requests this week: ${newRequests || 0}
Shipped this week: ${shipped || 0}
New votes this week: ${newVotes}
New comments this week: ${newComments}
Top requests: ${(topRequests || []).map((r: any) => r.title).join(', ')}
                        `.trim(),
                    }),
                    signal: langflowController.signal,
                })
                clearTimeout(langflowTimeout)

                if (!langflowRes.ok) {
                    console.error('Langflow error:', langflowRes.status)
                } else {
                    const langflowData = await langflowRes.json()
                    aiSummary = langflowData?.outputs?.[0]?.outputs?.[0]?.messages?.[0]?.message ||
                        langflowData?.outputs?.[0]?.outputs?.[0]?.results?.message?.text || ''
                }
            } catch (e) {
                console.error('Langflow error:', e)
            }

            const topRequestsHtml = (topRequests || [])
                .map((r: any) => {
                    const votes = r.votes?.length || 0
                    return `<li style="margin-bottom:8px;"><strong>${escapeHtml(r.title)}</strong> — ${votes} vote${votes !== 1 ? 's' : ''} · ${escapeHtml(r.status)}</li>`
                })
                .join('')

            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://backlog-the-ultimate-feature-priori.vercel.app'
            const wsUrl = `${siteUrl}/workspace/${ws.slug}/backlog`

            const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#050505;color:#f5f5f5;font-family:system-ui,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
    <h1 style="font-size:18px;font-weight:700;margin:0 0 4px;">Weekly Digest</h1>
    <p style="color:#666;font-size:13px;margin:0 0 24px;">${escapeHtml(ws.name)} — last 7 days</p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td width="25%" style="padding:16px 8px 16px 0;border:1px solid rgba(255,255,255,0.1);text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#f5f5f5;">${newRequests || 0}</div>
          <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;">New Requests</div>
        </td>
        <td width="25%" style="padding:16px 8px;border:1px solid rgba(255,255,255,0.1);border-left:none;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#f5f5f5;">${shipped || 0}</div>
          <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;">Shipped</div>
        </td>
        <td width="25%" style="padding:16px 8px;border:1px solid rgba(255,255,255,0.1);border-left:none;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#f5f5f5;">${newVotes}</div>
          <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;">Votes</div>
        </td>
        <td width="25%" style="padding:16px 8px;border:1px solid rgba(255,255,255,0.1);border-left:none;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#f5f5f5;">${newComments}</div>
          <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;">Comments</div>
        </td>
      </tr>
    </table>

    ${topRequestsHtml ? `
    <h2 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#666;margin:0 0 12px;">Top Requests</h2>
    <ul style="padding-left:16px;margin:0 0 24px;font-size:14px;line-height:1.6;">${topRequestsHtml}</ul>
    ` : ''}

    ${aiSummary ? `
    <p style="font-size:11px;color:#555;line-height:1.6;margin:0 0 24px;font-style:italic;">${aiSummary}</p>
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

            for (const admin of admins) {
                const profile = (admin as any).profiles
                if (!profile?.email) continue

                try {
                    const emailController = new AbortController()
                    const emailTimeout = setTimeout(() => emailController.abort(), 10000)

                    const emailRes = await fetch(RESEND_URL, {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            from: emailFrom,
                            to: profile.email,
                            subject: `Weekly Digest — ${ws.name}`,
                            html,
                        }),
                        signal: emailController.signal,
                    })
                    clearTimeout(emailTimeout)

                    if (emailRes.ok) {
                        totalSent++
                    } else {
                        console.error(`Failed to send email to ${profile.email}: ${emailRes.status}`)
                    }
                } catch (emailErr) {
                    console.error(`Email send error for ${profile.email}:`, emailErr)
                }
            }
        }

        return NextResponse.json({ sent: totalSent })
    } catch (err) {
        console.error('Digest error:', err)
        return NextResponse.json({ error: 'Failed to send digests' }, { status: 500 })
    }
}
