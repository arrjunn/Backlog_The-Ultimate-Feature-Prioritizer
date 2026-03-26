/**
 * K-means++ clustering with cosine similarity.
 * Designed for high-dimensional text embeddings (e.g. 3072-dim).
 * Zero dependencies.
 */

export interface KMeansResult {
    assignments: number[]
    centroids: number[][]
    iterations: number
}

/** Auto-suggest k based on number of data points */
export function suggestK(n: number): number {
    return Math.max(2, Math.min(8, Math.floor(Math.sqrt(n) / 1.5)))
}

/** Normalize a vector to unit length (in-place) */
function normalize(v: number[]): number[] {
    let mag = 0
    for (let i = 0; i < v.length; i++) mag += v[i] * v[i]
    mag = Math.sqrt(mag)
    if (mag === 0) return v
    for (let i = 0; i < v.length; i++) v[i] /= mag
    return v
}

/** Dot product of two vectors (equals cosine similarity when both are unit-length) */
function dot(a: number[], b: number[]): number {
    let s = 0
    for (let i = 0; i < a.length; i++) s += a[i] * b[i]
    return s
}

/** K-means++ initialization: pick k centroids biased toward dissimilar points */
function initCentroids(vectors: number[][], k: number): number[][] {
    const n = vectors.length
    const centroids: number[][] = []

    // First centroid: random
    centroids.push([...vectors[Math.floor(Math.random() * n)]])

    for (let c = 1; c < k; c++) {
        // For each point, find max similarity to any existing centroid
        const weights: number[] = new Array(n)
        let totalWeight = 0
        for (let i = 0; i < n; i++) {
            let maxSim = -Infinity
            for (const centroid of centroids) {
                const sim = dot(vectors[i], centroid)
                if (sim > maxSim) maxSim = sim
            }
            // Weight = 1 - maxSimilarity (more dissimilar = higher probability)
            weights[i] = Math.max(0, 1 - maxSim)
            totalWeight += weights[i]
        }

        // Weighted random selection
        if (totalWeight === 0) {
            centroids.push([...vectors[Math.floor(Math.random() * n)]])
            continue
        }
        let r = Math.random() * totalWeight
        for (let i = 0; i < n; i++) {
            r -= weights[i]
            if (r <= 0) {
                centroids.push([...vectors[i]])
                break
            }
        }
        if (centroids.length < c + 1) {
            centroids.push([...vectors[n - 1]])
        }
    }

    return centroids
}

/**
 * Run k-means clustering with cosine similarity.
 * Vectors are normalized internally — originals are not mutated.
 */
export function kMeansCosine(
    rawVectors: number[][],
    k: number,
    maxIterations = 50
): KMeansResult {
    const n = rawVectors.length
    if (n === 0) return { assignments: [], centroids: [], iterations: 0 }
    if (k >= n) {
        // Each point is its own cluster
        return {
            assignments: rawVectors.map((_, i) => i),
            centroids: rawVectors.map((v) => [...v]),
            iterations: 0,
        }
    }

    // Normalize copies
    const vectors = rawVectors.map((v) => normalize([...v]))
    let centroids = initCentroids(vectors, k)
    centroids.forEach((c) => normalize(c))

    let assignments = new Array<number>(n).fill(0)
    let iterations = 0

    for (let iter = 0; iter < maxIterations; iter++) {
        iterations++
        let changed = false

        // Assignment step: each vector → nearest centroid (highest dot product)
        for (let i = 0; i < n; i++) {
            let bestCluster = 0
            let bestSim = -Infinity
            for (let c = 0; c < k; c++) {
                const sim = dot(vectors[i], centroids[c])
                if (sim > bestSim) {
                    bestSim = sim
                    bestCluster = c
                }
            }
            if (assignments[i] !== bestCluster) {
                assignments[i] = bestCluster
                changed = true
            }
        }

        if (!changed) break

        // Update step: recompute centroids as mean of assigned vectors
        const dim = vectors[0].length
        const newCentroids: number[][] = Array.from({ length: k }, () => new Array(dim).fill(0))
        const counts = new Array(k).fill(0)

        for (let i = 0; i < n; i++) {
            const c = assignments[i]
            counts[c]++
            for (let d = 0; d < dim; d++) {
                newCentroids[c][d] += vectors[i][d]
            }
        }

        for (let c = 0; c < k; c++) {
            if (counts[c] > 0) {
                for (let d = 0; d < dim; d++) {
                    newCentroids[c][d] /= counts[c]
                }
                normalize(newCentroids[c])
            } else {
                // Empty cluster — reinitialize to a random point
                newCentroids[c] = [...vectors[Math.floor(Math.random() * n)]]
            }
        }

        centroids = newCentroids
    }

    return { assignments, centroids, iterations }
}
