import type { QuantumCircuit, QuantumOperation } from '../types/circuit'

export function parseOpenQasmToCircuit(qasmCode: string): QuantumCircuit {
  const lines = qasmCode.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'))
  
  let qubits = 4
  let classicalBits = 4
  const operations: Omit<QuantumOperation, 'id'>[] = []
  
  let column = 0
  
  for (const line of lines) {
    // Parse qubit declaration
    const qubitMatch = line.match(/qubit\[(\d+)\]\s+q;?/)
    if (qubitMatch) {
      qubits = parseInt(qubitMatch[1], 10)
      continue
    }
    
    // Parse classical bit declaration
    const bitMatch = line.match(/bit\[(\d+)\]\s+c;?/)
    if (bitMatch) {
      classicalBits = parseInt(bitMatch[1], 10)
      continue
    }
    
    // Parse parameterized gates (p, rx, ry, rz)
    const paramGateMatch = line.match(/(\w+)\s*\(([^)]+)\)\s+q\[(\d+)\];?/)
    if (paramGateMatch) {
      const gateName = paramGateMatch[1]
      const paramValue = parseFloat(paramGateMatch[2])
      const targetQubit = parseInt(paramGateMatch[3], 10)

      const operation = parseGateOperation(gateName, targetQubit, undefined, column, paramValue)
      if (operation) {
        operations.push(operation)
        column++
      }
      continue
    }

    // Parse gate operations
    const gateMatch = line.match(/(\w+)\s+q\[(\d+)\](?:,\s*q\[(\d+)\])?;?/)
    if (gateMatch) {
      const gateName = gateMatch[1]
      const targetQubit = parseInt(gateMatch[2], 10)
      const controlQubit = gateMatch[3] ? parseInt(gateMatch[3], 10) : undefined

      const operation = parseGateOperation(gateName, targetQubit, controlQubit, column)
      if (operation) {
        operations.push(operation)
        column++
      }
      continue
    }

    // Parse SWAP gate specifically (since it has a different pattern)
    const swapMatch = line.match(/swap\s+q\[(\d+)\],\s*q\[(\d+)\];?/)
    if (swapMatch) {
      const firstQubit = parseInt(swapMatch[1], 10)
      const secondQubit = parseInt(swapMatch[2], 10)

      operations.push({
        gateType: 'swap',
        targetQubits: [firstQubit, secondQubit],
        column,
        parameters: undefined
      })
      column++
      continue
    }
    
    // Parse measurement operations
    const measureMatch = line.match(/c\[(\d+)\]\s*=\s*measure\s+q\[(\d+)\];?/)
    if (measureMatch) {
      operations.push({
        gateType: 'measurement',
        targetQubits: [parseInt(measureMatch[2], 10)],
        column,
        parameters: undefined
      })
      column++
      continue
    }
    
    // Parse CX (controlled-not) alternative syntax
    const cxMatch = line.match(/cx\s+q\[(\d+)\],\s*q\[(\d+)\];?/)
    if (cxMatch) {
      operations.push({
        gateType: 'controlled-not',
        targetQubits: [parseInt(cxMatch[2], 10)],
        controlQubit: parseInt(cxMatch[1], 10),
        column,
        parameters: undefined
      })
      column++
      continue
    }

    // Parse CZ (controlled-z) alternative syntax
    const czMatch = line.match(/cz\s+q\[(\d+)\],\s*q\[(\d+)\];?/)
    if (czMatch) {
      operations.push({
        gateType: 'controlled-z',
        targetQubits: [parseInt(czMatch[2], 10)],
        controlQubit: parseInt(czMatch[1], 10),
        column,
        parameters: undefined
      })
      column++
      continue
    }

    // Parse barrier with specific qubits
    const barrierMatch = line.match(/barrier\s+(.+);?/)
    if (barrierMatch) {
      const qubitStr = barrierMatch[1]
      const qubitRegex = /q\[(\d+)\]/g
      const targetQubits: number[] = []
      let match
      while ((match = qubitRegex.exec(qubitStr)) !== null) {
        targetQubits.push(parseInt(match[1], 10))
      }
      if (targetQubits.length > 0) {
        operations.push({
          gateType: 'barrier',
          targetQubits,
          column,
          parameters: undefined
        })
        column++
      }
      continue
    }
  }
  
  return {
    qubits,
    classicalBits,
    operations: operations.map((op, index) => ({
      ...op,
      id: `operation-${index}-${Date.now()}`
    }))
  }
}

function parseGateOperation(
  gateName: string,
  targetQubit: number,
  controlQubit: number | undefined,
  column: number,
  parameterValue?: number
): Omit<QuantumOperation, 'id'> | null {
  const gateMap: Record<string, string> = {
    'h': 'hadamard',
    'x': 'pauli-x',
    'y': 'pauli-y',
    'z': 'pauli-z',
    's': 's',
    'sdg': 's-dagger',
    't': 't',
    'tdg': 't-dagger',
    'id': 'identity',
    'p': 'phase',
    'rx': 'rotation-x',
    'ry': 'rotation-y',
    'rz': 'rotation-z',
    'cx': 'controlled-not',
    'cz': 'controlled-z',
  }

  const gateType = gateMap[gateName.toLowerCase()]
  if (!gateType) return null

  const operation: Omit<QuantumOperation, 'id'> = {
    gateType,
    targetQubits: [targetQubit],
    column,
    parameters: undefined
  }

  if (controlQubit !== undefined) {
    operation.controlQubit = controlQubit
  }

  if (parameterValue !== undefined && !isNaN(parameterValue)) {
    operation.parameters = { theta: parameterValue }
  }

  return operation
}