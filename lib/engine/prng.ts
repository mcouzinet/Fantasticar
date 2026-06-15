/**
 * PRNG seedable et rapide (mulberry32) — spec §6.
 * Reproductible et utilisable en Web Worker, contrairement à Math.random().
 */
export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let s = seed >>> 0
  return function () {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Entier dans [0, n). */
export function nextInt(rng: Rng, n: number): number {
  return Math.floor(rng() * n)
}

/**
 * Mélange de Fisher-Yates en place sur un Int8Array réutilisé (évite les allocations).
 */
export function shuffle(arr: Int8Array, rng: Rng): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = arr[i]!
    arr[i] = arr[j]!
    arr[j] = tmp
  }
}
