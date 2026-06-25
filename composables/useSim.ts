import type { Deck, SimConfig, SimResult } from '~/lib/engine/types'
import type { T2RecipesResult } from '~/lib/engine/trace'
import type { CardImpact } from '~/lib/engine/impacts'
import type { WorkerOut } from '~/lib/sim.worker'

// Singleton worker (hors état réactif : non sérialisable).
let worker: Worker | null = null
let seq = 0 // compteur partagé d'identifiants de requête
let curCompareId = 0
let curImpactsId = 0
let pending: (() => void) | null = null
let impactsPending: (() => void) | null = null

export function useSim() {
  const isRunning = useState('sim:running', () => false)
  const progress = useState('sim:progress', () => 0) // 0..1
  const baselineResult = useState<SimResult | null>('sim:baseline', () => null)
  const draftResult = useState<SimResult | null>('sim:draft', () => null)
  const t2 = useState<T2RecipesResult | null>('sim:t2', () => null)
  const error = useState<string | null>('sim:error', () => null)
  // Influence des cartes (calculée à la demande, mise en cache)
  const impacts = useState<CardImpact[] | null>('sim:impacts', () => null)
  const impactsRunning = useState('sim:impacts:running', () => false)
  const impactsProgress = useState('sim:impacts:progress', () => 0)
  // Config fixe : 50 000 itérations (calcul quasi instantané) et mulligan London.
  const lastConfig = useState<SimConfig>('sim:config', () => ({
    iterations: 50000,
    mulligan: 'london',
    maxTurn: 5,
    seed: 0xc0ffee,
  }))

  function finish() {
    isRunning.value = false
    pending?.()
    pending = null
  }
  function finishImpacts() {
    impactsRunning.value = false
    impactsPending?.()
    impactsPending = null
  }

  function ensureWorker(): Worker {
    if (worker) return worker
    worker = new Worker(new URL('../lib/sim.worker.ts', import.meta.url), { type: 'module' })
    worker.onerror = (e) => {
      error.value = e.message || 'Erreur du worker de simulation.'
      finish()
      finishImpacts()
    }
    worker.onmessage = (e: MessageEvent<WorkerOut>) => {
      const m = e.data
      // Requête « influence des cartes »
      if (m.reqId === curImpactsId) {
        if (m.kind === 'progress') impactsProgress.value = m.total ? m.done / m.total : 0
        else if (m.kind === 'impacts-done') {
          impacts.value = m.impacts
          impactsProgress.value = 1
          finishImpacts()
        } else if (m.kind === 'error') {
          error.value = m.message
          finishImpacts()
        }
        return
      }
      // Requête de simulation/comparaison
      if (m.reqId !== curCompareId) return // réponse obsolète
      if (m.kind === 'progress') {
        progress.value = m.total ? m.done / m.total : 0
      } else if (m.kind === 'done') {
        baselineResult.value = m.baseline
        draftResult.value = m.draft
        t2.value = m.t2
        progress.value = 1
        finish()
      } else if (m.kind === 'error') {
        error.value = m.message
        finish()
      }
    }
    return worker
  }

  /** Copie « plate » (sans proxy réactif Vue) clonable par structuredClone/postMessage. */
  function plain<T>(v: T): T {
    return JSON.parse(JSON.stringify(v)) as T
  }

  /**
   * Lance la simulation. Si `draft` est fourni et diffère, baseline + draft tournent à
   * seed identique pour un delta peu bruité (spec §4.3).
   */
  function run(baseline: Deck, draft: Deck | null, config: SimConfig): Promise<void> {
    if (isRunning.value) return Promise.resolve()
    error.value = null
    isRunning.value = true
    progress.value = 0
    lastConfig.value = { ...config }
    const w = ensureWorker()
    curCompareId = ++seq
    return new Promise<void>((resolve) => {
      pending = resolve
      // Décks/config dé-proxifiés : un proxy réactif Vue n'est pas clonable (DataCloneError).
      w.postMessage({
        kind: 'compare',
        reqId: curCompareId,
        baseline: plain(baseline),
        draft: draft ? plain(draft) : null,
        config: plain(config),
      })
    })
  }

  /** Calcule l'influence par catégorie (à la demande, mise en cache). */
  function runImpacts(config: SimConfig): Promise<void> {
    if (impactsRunning.value || impacts.value) return Promise.resolve()
    impactsRunning.value = true
    impactsProgress.value = 0
    const w = ensureWorker()
    curImpactsId = ++seq
    return new Promise<void>((resolve) => {
      impactsPending = resolve
      w.postMessage({ kind: 'impacts', reqId: curImpactsId, config: plain(config) })
    })
  }

  return {
    isRunning, progress, baselineResult, draftResult, t2, error, lastConfig, run,
    impacts, impactsRunning, impactsProgress, runImpacts,
  }
}
