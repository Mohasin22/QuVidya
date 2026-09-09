import type { QuantumCircuit } from './circuit'
import type { SimulationResult } from './simulation'

export type ExplanationRequest = {
  circuit: QuantumCircuit
  gatesUsed: string[]
  simulationResults?: SimulationResult
  learnerLevel?: string
}

export type ExplanationContent = {
  overview: string
  gates: string[]
  stateChanges: string
  observedResult: string
  concepts: string[]
}

export type ExplanationResponse = {
  success: boolean
  explanation: ExplanationContent
}
