export type SimulationResult = {
  success: boolean
  counts: Record<string, number>
  probabilities: Record<string, number>
  shots: number
  status: string
  stateVector: StateVectorAmplitude[] | null
}

export type StateVectorAmplitude = {
  basisState: string
  real: number
  imaginary: number
  amplitude: string
}

export type SimulationState = {
  status: 'idle' | 'loading' | 'success' | 'error'
  result?: SimulationResult
  error?: string
}
