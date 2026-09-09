import type { QuantumCircuit } from './circuit'

export type AnalysisRequest = {
  circuit: QuantumCircuit
  learnerLevel?: string
}

export type AnalysisIssue = {
  issue: string
  explanation: string
  suggestedImprovement: string
  category: string
  severity: 'error' | 'warning' | 'suggestion' | 'info' | string
}

export type AnalysisResponse = {
  success: boolean
  issues: AnalysisIssue[]
}
