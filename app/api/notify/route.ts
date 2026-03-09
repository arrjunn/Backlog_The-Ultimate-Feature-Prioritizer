import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRoute } from '@/lib/supabase/api-auth'
import { escapeHtml, getErrorMessage } from '@/lib/utils/shared'

const RESEND_URL = 'https://api.resend.com/emails'

type EmailEvent =
    | { type: 'status_change'; requesterEmail: string; requesterName: string; requestTitle: string; oldStatus: string; newStatus: string; workspaceName: string; requestUrl: string }
    | { type: 'new_comment'; requesterEmail: string; requesterName: string; requestTitle: string; commenterName: string; commentText: string; workspaceName: string; requestUrl: string }
    | { type: 'new_request'; adminEmail: string; adminName: string; requestTitle: string; requesterName: string; description: string; workspaceName: string; requestUrl: string }
    | { type: 'vote_milestone'; requesterEmail: string; requesterName: string; requestTitle: string; voteCount: number; workspaceName: string; requestUrl: string }

export async function POST(req: NextRequest) {
    const auth = await authenticateApiRoute()
    if (auth.error) return auth.error

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })

    try {
        const event = await req.json() as EmailEvent

        let to: string
        let subject: string
        let html: string

        switch (event.type) {
            case 'status_change':
                to = event.requesterEmail
                subject = `Your request "${event.requestTitle}" status changed - ${formatStatus(event.newStatus)}`
                html = statusChangeEmail(event)
                break
            case 'new_comment':
                to = event.requesterEmail
                subject = `New comment on "${event.requestTitle}"`
                html = newCommentEmail(event)
                break
            case 'new_request':
                to = event.adminEmail
                subject = `New feature request in ${event.workspaceName}: "${event.requestTitle}"`
                html = newRequestEmail(event)
                break
            case 'vote_milestone':
                to = event.requesterEmail
                subject = `Your request "${event.requestTitle}" reached ${event.voteCount} votes!`
                html = voteMilestoneEmail(event)
                break
            default:
                return NextResponse.json({ error: 'Unknown event type' }, { status: 400 })
        }

        const res = await fetch(RESEND_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Backlog <onboarding@resend.dev>',
                to,
                subject,
                html,
            }),
        })

        if (!res.ok) {
            const err = await res.json()
            return NextResponse.json({ error: err.message ?? JSON.stringify(err) }, { status: res.status })
        }

        const data = await res.json()
        return NextResponse.json({ id: data.id })
    } catch (err: unknown) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
    }
}

function formatStatus(s: string) {
    const map: Record<string, string> = { backlog: 'Backlog', now: 'In Progress', next: 'Up Next', later: 'Later', shipped: 'Shipped' }
    return map[s] ?? s
}

const BASE_STYLES = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:0;`

function emailWrapper(content: string) {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="${BASE_STYLES}">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <tr><td style="padding-bottom:32px">
          <div style="display:inline-flex;align-items:center;gap:8px">
            <div style="width:32px;height:32px;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:8px;display:flex;align-items:center;justify-content:center">
              <span style="color:white;font-size:16px;font-weight:700">P</span>
            </div>
            <span style="color:#a78bfa;font-weight:600;font-size:16px;letter-spacing:-0.3px">Backlog</span>
          </div>
        </td></tr>
        <tr><td style="background:#141414;border:1px solid #262626;border-radius:16px;padding:40px;overflow:hidden">
          ${content}
        </td></tr>
        <tr><td style="padding-top:24px;text-align:center;color:#525252;font-size:12px">
          You received this because you're a member of this workspace.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function pillBadge(text: string, color: string) {
    const colors: Record<string, string> = {
        purple: 'background:#3b0764;color:#c4b5fd;border:1px solid #6d28d9',
        green: 'background:#052e16;color:#86efac;border:1px solid #166534',
        blue: 'background:#1e3a5f;color:#93c5fd;border:1px solid #1d4ed8',
        amber: 'background:#451a03;color:#fcd34d;border:1px solid #92400e',
    }
    return `<span style="display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;${colors[color] ?? colors.purple}">${escapeHtml(text)}</span>`
}

function ctaButton(text: string, url: string) {
    return `<a href="${escapeHtml(url)}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px;margin-top:24px">${escapeHtml(text)}</a>`
}

function statusChangeEmail(e: Extract<EmailEvent, { type: 'status_change' }>) {
    const statusColors: Record<string, string> = { shipped: 'green', now: 'blue', next: 'amber', later: 'purple', backlog: 'purple' }
    return emailWrapper(`
        <h2 style="margin:0 0 8px;color:#f5f5f5;font-size:22px;font-weight:700">Status Update</h2>
        <p style="margin:0 0 28px;color:#737373;font-size:14px">Hi ${escapeHtml(e.requesterName)}, your feature request status changed.</p>
        <div style="background:#1a1a1a;border:1px solid #262626;border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="margin:0 0 12px;color:#a3a3a3;font-size:12px;text-transform:uppercase;letter-spacing:0.8px">Feature Request</p>
          <p style="margin:0 0 16px;color:#f5f5f5;font-size:17px;font-weight:600">${escapeHtml(e.requestTitle)}</p>
          <div style="display:flex;align-items:center;gap:12px">
            <span style="color:#525252;font-size:13px;text-decoration:line-through">${escapeHtml(formatStatus(e.oldStatus))}</span>
            <span style="color:#525252">&rarr;</span>
            ${pillBadge(formatStatus(e.newStatus), statusColors[e.newStatus] ?? 'purple')}
          </div>
        </div>
        <p style="margin:0;color:#737373;font-size:13px">Workspace: <strong style="color:#a3a3a3">${escapeHtml(e.workspaceName)}</strong></p>
        ${ctaButton('View Request', e.requestUrl)}
    `)
}

function newCommentEmail(e: Extract<EmailEvent, { type: 'new_comment' }>) {
    const truncated = e.commentText.slice(0, 300) + (e.commentText.length > 300 ? '...' : '')
    return emailWrapper(`
        <h2 style="margin:0 0 8px;color:#f5f5f5;font-size:22px;font-weight:700">New Comment</h2>
        <p style="margin:0 0 28px;color:#737373;font-size:14px">Hi ${escapeHtml(e.requesterName)}, ${escapeHtml(e.commenterName)} left a comment on your request.</p>
        <div style="background:#1a1a1a;border:1px solid #262626;border-radius:12px;padding:20px;margin-bottom:16px">
          <p style="margin:0 0 6px;color:#a3a3a3;font-size:12px">On: <strong style="color:#d4d4d4">${escapeHtml(e.requestTitle)}</strong></p>
        </div>
        <div style="border-left:3px solid #7c3aed;padding:16px;background:#1a1a1a;border-radius:0 12px 12px 0;margin-bottom:24px">
          <p style="margin:0 0 8px;color:#a78bfa;font-size:12px;font-weight:600">${escapeHtml(e.commenterName)}</p>
          <p style="margin:0;color:#d4d4d4;font-size:14px;line-height:1.6">${escapeHtml(truncated)}</p>
        </div>
        ${ctaButton('Reply to Comment', e.requestUrl)}
    `)
}

function newRequestEmail(e: Extract<EmailEvent, { type: 'new_request' }>) {
    const truncated = e.description ? e.description.slice(0, 200) + (e.description.length > 200 ? '...' : '') : ''
    return emailWrapper(`
        <h2 style="margin:0 0 8px;color:#f5f5f5;font-size:22px;font-weight:700">New Feature Request</h2>
        <p style="margin:0 0 28px;color:#737373;font-size:14px">Hi ${escapeHtml(e.adminName)}, a new request was submitted in <strong style="color:#a3a3a3">${escapeHtml(e.workspaceName)}</strong>.</p>
        <div style="background:#1a1a1a;border:1px solid #262626;border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="margin:0 0 4px;color:#a3a3a3;font-size:12px">From: <strong style="color:#d4d4d4">${escapeHtml(e.requesterName)}</strong></p>
          <p style="margin:0 0 12px;color:#f5f5f5;font-size:17px;font-weight:600">${escapeHtml(e.requestTitle)}</p>
          ${truncated ? `<p style="margin:0;color:#737373;font-size:13px;line-height:1.6">${escapeHtml(truncated)}</p>` : ''}
        </div>
        ${ctaButton('Review Request', e.requestUrl)}
    `)
}

function voteMilestoneEmail(e: Extract<EmailEvent, { type: 'vote_milestone' }>) {
    return emailWrapper(`
        <div style="text-align:center;margin-bottom:28px">
          <h2 style="margin:0 0 8px;color:#f5f5f5;font-size:24px;font-weight:700">Your request is trending!</h2>
          <p style="margin:0;color:#737373;font-size:14px">Hi ${escapeHtml(e.requesterName)},</p>
        </div>
        <div style="background:linear-gradient(135deg,#1e1b4b,#13111c);border:1px solid #4c1d95;border-radius:12px;padding:28px;text-align:center;margin-bottom:24px">
          <p style="margin:0 0 8px;color:#a78bfa;font-size:13px;text-transform:uppercase;letter-spacing:1px">Total Votes</p>
          <p style="margin:0 0 12px;color:#f5f5f5;font-size:48px;font-weight:800">${e.voteCount}</p>
          <p style="margin:0;color:#c4b5fd;font-size:15px;font-weight:500">"${escapeHtml(e.requestTitle)}"</p>
        </div>
        <p style="margin:0 0 24px;color:#737373;font-size:13px;text-align:center">in <strong style="color:#a3a3a3">${escapeHtml(e.workspaceName)}</strong></p>
        ${ctaButton('View Your Request', e.requestUrl)}
    `)
}
