import { ApiClientError, postJson } from './apiClient'
import type { QuantumCircuit } from '../types/circuit'
import type { SimulationResult } from '../types/simulation'
import { simulateCircuitLocally } from './localSimulation'

export class SimulationRequestError extends Error {
  readonly kind: 'unavailable' | 'invalid' | 'server'

  constructor(message: string, kind: SimulationRequestError['kind']) {
    super(message)
    this.name = 'SimulationRequestError'
    this.kind = kind
  }
}

export async function simulateCircuit(circuit: QuantumCircuit, signal?: AbortSignal, shots?: number): Promise<SimulationResult> {
  try {
    const result = await postJson<unknown>(`/simulate${shots ? `?shots=${shots}` : ''}`, circuit, signal)
    if (!isSimulationResult(result)) throw new SimulationRequestError('The simulation backend returned an invalid simulation result.', 'server')
    return result
  } catch (error) {
    if (error instanceof SimulationRequestError) throw error
    if (error instanceof ApiClientError) {
      if (error.kind === 'unavailable') {
        // Fall back to local simulation for basic gates
        try {
          console.warn('Backend unavailable, falling back to local simulation')
          return simulateCircuitLocally(circuit, shots)
        } catch (localError) {
          throw new SimulationRequestError(
            `Cannot connect to the simulation server and local simulation failed: ${localError instanceof Error ? localError.message : 'Unknown error'}. Please ensure the FastAPI backend is running on http://localhost:8000 for full simulation capabilities.`,
            'unavailable'
          )
        }
      }
      throw new SimulationRequestError(error.message, error.kind)
    }
    if (signal?.aborted) throw error
    throw new SimulationRequestError('The simulation failed unexpectedly. Please check the server logs for details.', 'server')
  }
}

function isSimulationResult(value: unknown): value is SimulationResult {
  if (typeof value !== 'object' || value === null) return false
  const result = value as Partial<SimulationResult>
  return result.success === true && typeof result.counts === 'object' && result.counts !== null && typeof result.probabilities === 'object' && result.probabilities !== null && typeof result.shots === 'number' && typeof result.status === 'string'
}
