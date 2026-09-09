import type { QuantumCircuit, QuantumOperation } from '../types/circuit'

const formatParameter = (value: number | undefined) => {
  if (value === undefined) return '0'
  return Number.isInteger(value) ? String(value) : value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
}

const operationToQasm = (operation: QuantumOperation) => {
  const target = operation.targetQubits
  const control = operation.controlQubit

  switch (operation.gateType) {
    case 'hadamard': return `h q[${target[0]}];`
    case 'pauli-x': return `x q[${target[0]}];`
    case 'pauli-y': return `y q[${target[0]}];`
    case 'pauli-z': return `z q[${target[0]}];`
    case 's': return `s q[${target[0]}];`
    case 's-dagger': return `sdg q[${target[0]}];`
    case 't': return `t q[${target[0]}];`
    case 't-dagger': return `tdg q[${target[0]}];`
    case 'phase': return `p(${formatParameter(operation.parameters?.theta)}) q[${target[0]}];`
    case 'rotation-x': return `rx(${formatParameter(operation.parameters?.theta)}) q[${target[0]}];`
    case 'rotation-y': return `ry(${formatParameter(operation.parameters?.theta)}) q[${target[0]}];`
    case 'rotation-z': return `rz(${formatParameter(operation.parameters?.theta)}) q[${target[0]}];`
    case 'controlled-not': return control === undefined ? `// Invalid CNOT operation ${operation.id}` : `cx q[${control}], q[${target[0]}];`
    case 'controlled-z': return control === undefined ? `// Invalid CZ operation ${operation.id}` : `cz q[${control}], q[${target[0]}];`
    case 'swap':
      if (target.length < 2) return `// Invalid SWAP operation ${operation.id}`
      if (target[0] === target[1]) return `// Invalid SWAP operation ${operation.id} - same qubit`
      return `swap q[${target[0]}], q[${target[1]}];`
    case 'measurement': return `c[${target[0]}] = measure q[${target[0]}];`
    case 'identity': return `id q[${target[0]}];`
    case 'barrier':
      // Barrier applies to specific qubits
      const qubitList = target.map(q => `q[${q}]`).join(', ')
      return `barrier ${qubitList};`
    default: return `// Unsupported operation: ${operation.gateType}`
  }
}

export function generateOpenQasm(circuit: QuantumCircuit) {
  const operations = [...circuit.operations].sort((left, right) => left.column - right.column)
  const body = operations.map(operationToQasm)

  return [
    'OPENQASM 3.0;',
    'include "stdgates.inc";',
    '',
    `qubit[${circuit.qubits}] q;`,
    `bit[${circuit.classicalBits}] c;`,
    ...(body.length > 0 ? ['', ...body] : []),
    '',
  ].join('\n')
}
