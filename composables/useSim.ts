import type { Deck, SimConfig, SimResult } from '~/lib/engine/types'
import type { WorkerOut } from '~/lib/sim.worker'

// Singleton worker (hors état réactif : non sérialisable).
let worker: Worker | null = null
let reqId = 0
let pending: (() => void) | null = null

export function useSim() {
  const isRunning = useState('sim:running', () => false)
  const progress = useState('sim:progress', () => 0) // 0..1
  const baselineResult = useState<SimResult | null>('sim:baseline', () => null)
  const draftResult = useState<SimResult | null>('sim:draft', () => null)
  const error = useState<string | null>('sim:error', () => null)
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

  function ensureWorker(): Worker {
    if (worker) return worker
    worker = new Worker(new URL('../lib/sim.worker.ts', import.meta.url), { type: 'module' })
    worker.onerror = (e) => {
      error.value = e.message || 'Erreur du worker de simulation.'
      finish()
    }
    worker.onmessage = (e: MessageEvent<WorkerOut>) => {
      const m = e.data
      if (m.reqId !== reqId) return // réponse d'une requête obsolète
      if (m.kind === 'progress') {
        progress.value = m.total ? m.done / m.total : 0
      } else if (m.kind === 'done') {
        baselineResult.value = m.baseline
        draftResult.value = m.draft
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
    reqId++
    return new Promise<void>((resolve) => {
      pending = resolve
      // Décks/config dé-proxifiés : un proxy réactif Vue n'est pas clonable (DataCloneError).
      w.postMessage({
        kind: 'compare',
        reqId,
        baseline: plain(baseline),
        draft: draft ? plain(draft) : null,
        config: plain(config),
      })
    })
  }

  return { isRunning, progress, baselineResult, draftResult, error, lastConfig, run }
}
