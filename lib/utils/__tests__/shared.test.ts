import { describe, it, expect } from 'vitest'
import { escapeHtml, getInitials, getErrorMessage } from '../shared'

// ─── escapeHtml ───────────────────────────────────────────────

describe('escapeHtml', () => {
    it('escapes ampersands', () => {
        expect(escapeHtml('a & b')).toBe('a &amp; b')
    })

    it('escapes angle brackets', () => {
        expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
    })

    it('escapes double quotes', () => {
        expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;')
    })

    it('escapes single quotes', () => {
        expect(escapeHtml("it's fine")).toBe('it&#39;s fine')
    })

    it('handles XSS payload', () => {
        const payload = '<img src=x onerror=alert(1)>'
        const result = escapeHtml(payload)
        expect(result).not.toContain('<img')
        expect(result).toContain('&lt;img')
    })

    it('returns plain text unchanged', () => {
        expect(escapeHtml('Hello World')).toBe('Hello World')
    })

    it('handles empty string', () => {
        expect(escapeHtml('')).toBe('')
    })

    it('escapes multiple occurrences', () => {
        expect(escapeHtml('1 < 2 & 3 > 0')).toBe('1 &lt; 2 &amp; 3 &gt; 0')
    })
})

// ─── getInitials ──────────────────────────────────────────────

describe('getInitials', () => {
    it('returns initials for full name', () => {
        expect(getInitials('John Doe')).toBe('JD')
    })

    it('returns single letter for single name', () => {
        expect(getInitials('Alice')).toBe('A')
    })

    it('returns ? for null', () => {
        expect(getInitials(null)).toBe('?')
    })

    it('returns ? for empty string', () => {
        expect(getInitials('')).toBe('?')
    })

    it('truncates to 2 characters for multi-part names', () => {
        expect(getInitials('John Paul Doe Smith')).toBe('JP')
    })

    it('uppercases initials', () => {
        expect(getInitials('john doe')).toBe('JD')
    })
})

// ─── getErrorMessage ─────────────────────────────────────────

describe('getErrorMessage', () => {
    it('extracts message from Error instance', () => {
        expect(getErrorMessage(new Error('something failed'))).toBe('something failed')
    })

    it('returns string errors as-is', () => {
        expect(getErrorMessage('bad input')).toBe('bad input')
    })

    it('extracts message from object with message property', () => {
        expect(getErrorMessage({ message: 'oops' })).toBe('oops')
    })

    it('returns fallback for unknown types', () => {
        expect(getErrorMessage(42)).toBe('Unknown error')
        expect(getErrorMessage(null)).toBe('Unknown error')
        expect(getErrorMessage(undefined)).toBe('Unknown error')
    })
})
