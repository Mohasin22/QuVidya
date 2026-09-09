export type QuantumCircuit = {
  qubits: number
  classicalBits: number
  operations: QuantumOperation[]
}

export type QuantumOperation = {
  id: string
  gateType: string
  targetQubits: number[]
  controlQubit?: number
  column: number
  parameters?: Record<string, number>
}

export type GateDefinition = {
  id: string
  name: string
  displayLabel: string
  category: string
  gateType: GateType
  qubitsRequired: number
  qubitCount?: number
  requiresParameters: boolean
  requiresParameter?: boolean
  parameterName?: string
  parameters: string[]
  symbol: string
  description: string
  educationalExplanation: string
  aliases?: string[]
}

export type GateType = 'basic' | 'phase' | 'rotation' | 'multi-qubit' | 'operation'
