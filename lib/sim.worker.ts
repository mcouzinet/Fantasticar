/// <reference lib="webworker" />
import { runSimulation } from './engine'
import type { Deck, SimConfig, SimResult } from './engine/types'

export interface CompareRequest {
  kind: 'compare'
  reqId: number
  baseline: Deck
  draft: Deck | null // null si pas de variante (baseline seul)
  config: SimConfig
}

export type WorkerOut =
  | { kind: 'progress'; reqId: number; done: number; total: number }
  | { kind: 'done'; reqId: number; baseline: SimResult; draft: SimResult | null }
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

    ctx.postMessage({ kind: 'done', reqId, baseline: baselineResult, draft: draftResult } satisfies WorkerOut)
  } catch (err) {
    ctx.postMessage({ kind: 'error', reqId, message: err instanceof Error ? err.message : String(err) } satisfies WorkerOut)
  }
}
