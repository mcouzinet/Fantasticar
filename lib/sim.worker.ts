/// <reference lib="webworker" />
import { runSimulation, collectT2Recipes } from './engine'
import type { Deck, SimConfig, SimResult } from './engine/types'
import type { T2RecipesResult } from './engine/trace'

export interface CompareRequest {
  kind: 'compare'
  reqId: number
  baseline: Deck
  draft: Deck | null // null si pas de variante (baseline seul)
  config: SimConfig
}

export type WorkerOut =
  | { kind: 'progress'; reqId: number; done: number; total: number }
  | { kind: 'done'; reqId: number; baseline: SimResult; draft: SimResult | null; t2: T2RecipesResult }
  | { kind: 'error'; reqId: number; message: string }

const ctx = self as unknown as DedicatedWorkerGlobalScope

ctx.onmessage = (e: MessageEvent<CompareRequest>) => {
  const msg = e.data
  if (!msg || msg.kind !== 'compare') return
  const { reqId, baseline, draft, config } = msg
  try {
    const decks = draft ? 2 : 1
    const grand = decks * config.iterations * 2 // 2 axes (play/draw) par deck
    let offset = 0
    const onProgress = (done: number) => {
      ctx.postMessage({ kind: 'progress', reqId, done: offset + done, total: grand } satisfies WorkerOut)
    }

    // baseline et draft tournent à seed identique → deltas peu bruités (spec §3.7/§6).
    const baselineResult = runSimulation(baseline, config, { onProgress })
    offset = config.iterations * 2
    const draftResult = draft ? runSimulation(draft, config, { onProgress }) : null

    // Recettes T2 (par nom) du deck affiché : la variante si présente, sinon la référence.
    // Itérations plafonnées (la fréquence T2 est stable bien avant 50 000) pour rester fluide.
    const t2 = collectT2Recipes(draft ?? baseline, { ...config, iterations: Math.min(config.iterations, 30000) })

    ctx.postMessage({ kind: 'done', reqId, baseline: baselineResult, draft: draftResult, t2 } satisfies WorkerOut)
  } catch (err) {
    ctx.postMessage({ kind: 'error', reqId, message: err instanceof Error ? err.message : String(err) } satisfies WorkerOut)
  }
}
