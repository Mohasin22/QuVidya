import type { QuantumOperation } from '../types/circuit'

export interface ValidationResult {
  valid: boolean
  error?: string
}

// Gate metadata for validation
const gateMetadata: Record<string, {
  qubitsRequired: number
  requiresParameters: boolean
  gateType: string
  displayLabel: string
}> = {
  'hadamard': { qubitsRequired: 1, requiresParameters: false, gateType: 'basic', displayLabel: 'H' },
  'pauli-x': { qubitsRequired: 1, requiresParameters: false, gateType: 'basic', displayLabel: 'X' },
  'pauli-y': { qubitsRequired: 1, requiresParameters: false, gateType: 'basic', displayLabel: 'Y' },
  'pauli-z': { qubitsRequired: 1, requiresParameters: false, gateType: 'basic', displayLabel: 'Z' },
  'identity': { qubitsRequired: 1, requiresParameters: false, gateType: 'basic', displayLabel: 'I' },
  's': { qubitsRequired: 1, requiresParameters: false, gateType: 'phase', displayLabel: 'S' },
  's-dagger': { qubitsRequired: 1, requiresParameters: false, gateType: 'phase', displayLabel: 'S†' },
  't': { qubitsRequired: 1, requiresParameters: false, gateType: 'phase', displayLabel: 'T' },
  't-dagger': { qubitsRequired: 1, requiresParameters: false, gateType: 'phase', displayLabel: 'T†' },
  'phase': { qubitsRequired: 1, requiresParameters: true, gateType: 'phase', displayLabel: 'P' },
  'rotation-x': { qubitsRequired: 1, requiresParameters: true, gateType: 'rotation', displayLabel: 'Rx' },
  'rotation-y': { qubitsRequired: 1, requiresParameters: true, gateType: 'rotation', displayLabel: 'Ry' },
  'rotation-z': { qubitsRequired: 1, requiresParameters: true, gateType: 'rotation', displayLabel: 'Rz' },
  'controlled-not': { qubitsRequired: 2, requiresParameters: false, gateType: 'multi-qubit', displayLabel: 'CNOT' },
  'controlled-z': { qubitsRequired: 2, requiresParameters: false, gateType: 'multi-qubit', displayLabel: 'CZ' },
  'swap': { qubitsRequired: 2, requiresParameters: false, gateType: 'multi-qubit', displayLabel: 'SWAP' },
  'measurement': { qubitsRequired: 1, requiresParameters: false, gateType: 'operation', displayLabel: 'Measure' },
  'barrier': { qubitsRequired: 1, requiresParameters: false, gateType: 'operation', displayLabel: 'Barrier' },
}

export function validateOperation(
  operation: Omit<QuantumOperation, 'id'>,
  circuitQubits: number,
  circuitClassicalBits: number
): ValidationResult {
  const metadata = gateMetadata[operation.gateType]
  if (!metadata) {
    return { valid: false, error: `Unknown gate type: ${operation.gateType}` }
  }

  // Check required number of qubits
  if (operation.targetQubits.length !== metadata.qubitsRequired) {
    return { valid: false, error: `${metadata.displayLabel} requires exactly ${metadata.qubitsRequired} qubit(s), got ${operation.targetQubits.length}` }
  }

  // Check target qubit ranges
  for (const qubit of operation.targetQubits) {
    if (qubit < 0 || qubit >= circuitQubits) {
      return { valid: false, error: `Target qubit q[${qubit}] is out of range (0-${circuitQubits - 1})` }
    }
  }

  // Check for duplicate target qubits
  const uniqueTargets = new Set(operation.targetQubits)
  if (uniqueTargets.size !== operation.targetQubits.length) {
    return { valid: false, error: `${metadata.displayLabel} cannot use the same qubit multiple times` }
  }

  // Validate control qubit for controlled gates
  if (metadata.gateType === 'multi-qubit' && operation.gateType !== 'swap') {
    if (operation.controlQubit === undefined) {
      return { valid: false, error: `${metadata.displayLabel} requires a control qubit` }
    }
    if (operation.controlQubit < 0 || operation.controlQubit >= circuitQubits) {
      return { valid: false, error: `Control qubit q[${operation.controlQubit}] is out of range (0-${circuitQubits - 1})` }
    }
    if (operation.targetQubits.includes(operation.controlQubit)) {
      return { valid: false, error: `${metadata.displayLabel} control and target qubits must be different` }
    }
  }

  // SWAP gate specific validation
  if (operation.gateType === 'swap') {
    if (operation.targetQubits.length !== 2) {
      return { valid: false, error: 'SWAP gate requires exactly 2 qubits' }
    }
    if (operation.targetQubits[0] === operation.targetQubits[1]) {
      return { valid: false, error: 'SWAP gate requires two different qubits' }
    }
    if (operation.controlQubit !== undefined) {
      return { valid: false, error: 'SWAP gate should not have a control qubit' }
    }
  }

  // Validate parameters for parameterized gates
  if (metadata.requiresParameters) {
    if (!operation.parameters) {
      return { valid: false, error: `${metadata.displayLabel} requires parameters` }
    }
    const theta = operation.parameters.theta
    if (theta === undefined || theta === null) {
      return { valid: false, error: `${metadata.displayLabel} requires a theta parameter` }
    }
    if (typeof theta !== 'number' || isNaN(theta)) {
      return { valid: false, error: `${metadata.displayLabel} requires a valid numeric theta parameter` }
    }
  }

  // Validate measurement
  if (operation.gateType === 'measurement') {
    const targetQubit = operation.targetQubits[0]
    if (targetQubit >= circuitClassicalBits) {
      return { valid: false, error: `Measurement q[${targetQubit}] has no matching classical bit` }
    }
  }

  // Validate column
  if (operation.column < 0) {
    return { valid: false, error: 'Column must be non-negative' }
  }

  return { valid: true }
}

export function validateOperationPlacement(
  operation: Omit<QuantumOperation, 'id'>,
  existingOperations: QuantumOperation[]
): ValidationResult {
  // Get all qubits used by this operation
  const occupiedQubits = new Set([
    ...operation.targetQubits,
    ...(operation.controlQubit === undefined ? [] : [operation.controlQubit])
  ])

  // Check for collisions in the same column
  for (const existing of existingOperations) {
    if (existing.column === operation.column) {
      const existingQubits = new Set([
        ...existing.targetQubits,
        ...(existing.controlQubit === undefined ? [] : [existing.controlQubit])
      ])

      // Check for qubit overlap
      for (const qubit of occupiedQubits) {
        if (existingQubits.has(qubit)) {
          return { valid: false, error: `Qubit q[${qubit}] is already occupied in column ${operation.column}` }
        }
      }
    }
  }

  return { valid: true }
}
