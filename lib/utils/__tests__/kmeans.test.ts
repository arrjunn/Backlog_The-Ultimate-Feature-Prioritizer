import { describe, it, expect } from 'vitest'
import { kMeansCosine, suggestK } from '../kmeans'

// ─── suggestK ────────────────────────────────────────────────

describe('suggestK', () => {
    it('returns minimum of 2 for small datasets', () => {
        expect(suggestK(1)).toBe(2)
        expect(suggestK(4)).toBe(2)
    })

    it('returns reasonable k for medium datasets', () => {
        const k = suggestK(100)
        expect(k).toBeGreaterThanOrEqual(2)
        expect(k).toBeLessThanOrEqual(8)
    })

    it('caps at 8 for large datasets', () => {
        expect(suggestK(10000)).toBe(8)
    })
})

// ─── kMeansCosine ────────────────────────────────────────────

describe('kMeansCosine', () => {
    it('returns empty result for empty input', () => {
        const result = kMeansCosine([], 2)
        expect(result.assignments).toHaveLength(0)
        expect(result.centroids).toHaveLength(0)
        expect(result.iterations).toBe(0)
    })

    it('assigns each point its own cluster when k >= n', () => {
        const vectors = [[1, 0], [0, 1], [1, 1]]
        const result = kMeansCosine(vectors, 5)
        expect(result.assignments).toHaveLength(3)
        // Each point in its own cluster (0, 1, 2)
        const unique = new Set(result.assignments)
        expect(unique.size).toBe(3)
    })

    it('produces exactly k clusters', () => {
        const vectors = [
            [1, 0, 0], [0.9, 0.1, 0],   // cluster A
            [0, 1, 0], [0.1, 0.9, 0],   // cluster B
            [0, 0, 1], [0, 0.1, 0.9],   // cluster C
        ]
        const result = kMeansCosine(vectors, 3)
        const unique = new Set(result.assignments)
        expect(unique.size).toBe(3)
    })

    it('all assignments are valid cluster indices', () => {
        const vectors = Array.from({ length: 10 }, (_, i) => [Math.cos(i), Math.sin(i), 0.1])
        const k = 3
        const result = kMeansCosine(vectors, k)
        for (const a of result.assignments) {
            expect(a).toBeGreaterThanOrEqual(0)
            expect(a).toBeLessThan(k)
        }
    })

    it('does not mutate original vectors', () => {
        const vectors = [[1, 0], [0, 1], [0.5, 0.5]]
        const copy = vectors.map(v => [...v])
        kMeansCosine(vectors, 2)
        expect(vectors).toEqual(copy)
    })

    it('groups clearly distinct vectors correctly', () => {
        // Two clearly distinct clusters in 2D
        const cluster1 = [[1, 0], [0.99, 0.01], [0.98, 0.02]]
        const cluster2 = [[0, 1], [0.01, 0.99], [0.02, 0.98]]
        const vectors = [...cluster1, ...cluster2]

        const result = kMeansCosine(vectors, 2)

        // All points from cluster1 should have the same assignment
        const a0 = result.assignments[0]
        expect(result.assignments[1]).toBe(a0)
        expect(result.assignments[2]).toBe(a0)

        // All points from cluster2 should have the other assignment
        const a3 = result.assignments[3]
        expect(a3).not.toBe(a0)
        expect(result.assignments[4]).toBe(a3)
        expect(result.assignments[5]).toBe(a3)
    })

    it('handles k=1', () => {
        const vectors = [[1, 0], [0, 1], [1, 1]]
        const result = kMeansCosine(vectors, 1)
        expect(new Set(result.assignments).size).toBe(1)
        expect(result.assignments.every(a => a === 0)).toBe(true)
    })
})
