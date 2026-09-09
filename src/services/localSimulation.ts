import type { QuantumCircuit, QuantumOperation } from '../types/circuit'
import type { SimulationResult } from '../types/simulation'

// Simple local simulation for basic gates when backend is unavailable
// This is a fallback for demonstration purposes, not a full quantum simulator

interface Complex {
  real: number
  imag: number
}

class LocalQuantumSimulator {
  private state: Complex[]
  private qubits: number
  private shots: number

  constructor(qubits: number, shots: number = 1024) {
    this.qubits = qubits
    this.shots = shots
    // Initialize to |0...0⟩ state
    this.state = new Array(2 ** qubits).fill(null).map(() => ({ real: 0, imag: 0 }))
    this.state[0] = { real: 1, imag: 0 }
  }

  private applyGate(gate: Complex[][], targetQubit: number) {
    const newState = [...this.state]
    const mask = 1 << targetQubit
    
    for (let i = 0; i < this.state.length; i++) {
      const bit = (i & mask) ? 1 : 0
      const otherIndex = i ^ mask
      
      const a = this.state[otherIndex]
      const b = this.state[i]
      
      newState[i] = {
        real: gate[bit][0].real * a.real - gate[bit][0].imag * a.imag + gate[bit][1].real * b.real - gate[bit][1].imag * b.imag,
        imag: gate[bit][0].real * a.imag + gate[bit][0].imag * a.real + gate[bit][1].real * b.imag + gate[bit][1].imag * b.real
      }
    }
    
    this.state = newState
  }

  private applyHadamard(target: number) {
    const h = 1 / Math.sqrt(2)
    const gate: Complex[][] = [
      [{ real: h, imag: 0 }, { real: h, imag: 0 }],
      [{ real: h, imag: 0 }, { real: -h, imag: 0 }]
    ]
    this.applyGate(gate, target)
  }

  private applyPauliX(target: number) {
    const gate: Complex[][] = [
      [{ real: 0, imag: 0 }, { real: 1, imag: 0 }],
      [{ real: 1, imag: 0 }, { real: 0, imag: 0 }]
    ]
    this.applyGate(gate, target)
  }

  private applyPauliY(target: number) {
    const gate: Complex[][] = [
      [{ real: 0, imag: 0 }, { real: 0, imag: -1 }],
      [{ real: 0, imag: 1 }, { real: 0, imag: 0 }]
    ]
    this.applyGate(gate, target)
  }

  private applyPauliZ(target: number) {
    const gate: Complex[][] = [
      [{ real: 1, imag: 0 }, { real: 0, imag: 0 }],
      [{ real: 0, imag: 0 }, { real: -1, imag: 0 }]
    ]
    this.applyGate(gate, target)
  }

  private applyCNOT(control: number, target: number) {
    const newState = [...this.state]
    const controlMask = 1 << control
    const targetMask = 1 << target
    
    for (let i = 0; i < this.state.length; i++) {
      if (i & controlMask) {
        const flippedIndex = i ^ targetMask
        newState[flippedIndex] = { ...this.state[i] }
        newState[i] = { real: 0, imag: 0 }
      }
    }
    
    this.state = newState
  }

  applyOperation(operation: QuantumOperation) {
    switch (operation.gateType) {
      case 'hadamard':
        this.applyHadamard(operation.targetQubits[0])
        break
      case 'pauli-x':
        this.applyPauliX(operation.targetQubits[0])
        break
      case 'pauli-y':
        this.applyPauliY(operation.targetQubits[0])
        break
      case 'pauli-z':
        this.applyPauliZ(operation.targetQubits[0])
        break
      case 'controlled-not':
        if (operation.controlQubit !== undefined) {
          this.applyCNOT(operation.controlQubit, operation.targetQubits[0])
        }
        break
      default:
        // For unsupported gates, do nothing (identity)
        break
    }
  }

  private getStateVector() {
    const amplitudes = []
    for (let i = 0; i < this.state.length; i++) {
      const prob = this.state[i].real ** 2 + this.state[i].imag ** 2
      if (prob > 0.000001) {
        const basisState = i.toString(2).padStart(this.qubits, '0')
        const sign = this.state[i].imag >= 0 ? '+' : '-'
        amplitudes.push({
          basisState: `|${basisState}⟩`,
          real: Math.round(this.state[i].real * 1000000) / 1000000,
          imaginary: Math.round(this.state[i].imag * 1000000) / 1000000,
          amplitude: `${this.state[i].real.toFixed(6)} ${sign} ${Math.abs(this.state[i].imag).toFixed(6)}i`
        })
      }
    }
    return amplitudes
  }

  measure(): SimulationResult {
    // Calculate probabilities
    const probabilities: Record<string, number> = {}
    let totalProb = 0
    
    for (let i = 0; i < this.state.length; i++) {
      const prob = this.state[i].real ** 2 + this.state[i].imag ** 2
      if (prob > 0.000001) {
        const bitString = i.toString(2).padStart(this.qubits, '0')
        probabilities[bitString] = prob
        totalProb += prob
      }
    }
    
    // Normalize probabilities
    Object.keys(probabilities).forEach(key => {
      probabilities[key] = probabilities[key] / totalProb
    })
    
    // Generate measurement counts based on probabilities
    const counts: Record<string, number> = {}
    const sortedKeys = Object.keys(probabilities).sort((a, b) => probabilities[b] - probabilities[a])
    
    let remainingShots = this.shots
    for (const key of sortedKeys) {
      if (remainingShots <= 0) break
      const expectedCount = Math.round(probabilities[key] * this.shots)
      counts[key] = Math.min(expectedCount, remainingShots)
      remainingShots -= counts[key]
    }
    
    // Distribute remaining shots
    if (remainingShots > 0 && sortedKeys.length > 0) {
      counts[sortedKeys[0]] = (counts[sortedKeys[0]] || 0) + remainingShots
    }
    
    return {
      success: true,
      counts,
      probabilities,
      shots: this.shots,
      status: 'completed',
      stateVector: this.getStateVector()
    }
  }
}

export function simulateCircuitLocally(circuit: QuantumCircuit, shots: number = 1024): SimulationResult {
  try {
    // Check if circuit uses only supported gates
    const supportedGates = ['hadamard', 'pauli-x', 'pauli-y', 'pauli-z', 'controlled-not', 'identity']
    const hasUnsupportedGates = circuit.operations.some(op => !supportedGates.includes(op.gateType))
    
    if (hasUnsupportedGates) {
      throw new Error('Local simulation only supports H, X, Y, Z, CNOT, and I gates. Please start the backend server for full simulation capabilities.')
    }
    
    if (circuit.qubits > 4) {
      throw new Error('Local simulation supports up to 4 qubits. Please start the backend server for larger circuits.')
    }
    
    const simulator = new LocalQuantumSimulator(circuit.qubits, shots)
    
    // Sort operations by column
    const sortedOperations = [...circuit.operations].sort((a, b) => a.column - b.column)
    
    // Apply each operation
    for (const operation of sortedOperations) {
      simulator.applyOperation(operation)
    }
    
    return simulator.measure()
  } catch (error) {
    throw new Error(`Local simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}