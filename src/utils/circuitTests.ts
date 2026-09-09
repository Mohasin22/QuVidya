import type { QuantumCircuit, QuantumOperation } from '../types/circuit'
import { generateOpenQasm } from '../services/qasmService'
import { parseOpenQasmToCircuit } from '../services/qasmParser'
import { validateOperation } from './circuitValidation'

/**
 * Test utilities for quantum circuit gates
 * This file provides comprehensive testing functions for all supported gates
 */

export interface GateTestResult {
  gateName: string
  testName: string
  passed: boolean
  error?: string
  details?: string
}

export function runAllGateTests(): GateTestResult[] {
  const results: GateTestResult[] = []

  // Test single-qubit gates
  results.push(...testSingleQubitGates())

  // Test multi-qubit gates
  results.push(...testMultiQubitGates())

  // Test parameterized gates
  results.push(...testParameterizedGates())

  // Test operations
  results.push(...testOperations())

  // Test SWAP gate specifically
  results.push(...testSwapGate())

  // Test OpenQASM round-trip
  results.push(...testOpenQasmRoundTrip())

  // Test validation
  results.push(...testValidation())

  return results
}

function testSingleQubitGates(): GateTestResult[] {
  const results: GateTestResult[] = []
  const gates = ['hadamard', 'pauli-x', 'pauli-y', 'pauli-z', 'identity', 's', 's-dagger', 't', 't-dagger']

  for (const gate of gates) {
    const operation: Omit<QuantumOperation, 'id'> = {
      gateType: gate,
      targetQubits: [0],
      column: 0,
      parameters: undefined
    }

    const circuit: QuantumCircuit = {
      qubits: 2,
      classicalBits: 2,
      operations: [{ ...operation, id: 'test-1' }]
    }

    try {
      const qasm = generateOpenQasm(circuit)
      const parsed = parseOpenQasmToCircuit(qasm)

      if (parsed.operations.length !== 1) {
        results.push({
          gateName: gate,
          testName: 'Single-qubit gate circuit generation',
          passed: false,
          error: `Expected 1 operation, got ${parsed.operations.length}`
        })
        continue
      }

      if (parsed.operations[0].gateType !== gate) {
        results.push({
          gateName: gate,
          testName: 'Single-qubit gate circuit generation',
          passed: false,
          error: `Gate type mismatch: expected ${gate}, got ${parsed.operations[0].gateType}`
        })
        continue
      }

      results.push({
        gateName: gate,
        testName: 'Single-qubit gate circuit generation',
        passed: true,
        details: `Generated valid OpenQASM for ${gate}`
      })
    } catch (error) {
      results.push({
        gateName: gate,
        testName: 'Single-qubit gate circuit generation',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return results
}

function testMultiQubitGates(): GateTestResult[] {
  const results: GateTestResult[] = []

  // Test CNOT
  const cnotOperation: Omit<QuantumOperation, 'id'> = {
    gateType: 'controlled-not',
    targetQubits: [1],
    controlQubit: 0,
    column: 0,
    parameters: undefined
  }

  const cnotCircuit: QuantumCircuit = {
    qubits: 2,
    classicalBits: 2,
    operations: [{ ...cnotOperation, id: 'test-cnot' }]
  }

  try {
    const cnotQasm = generateOpenQasm(cnotCircuit)
    const cnotParsed = parseOpenQasmToCircuit(cnotQasm)

    if (cnotParsed.operations[0].gateType !== 'controlled-not' ||
        cnotParsed.operations[0].controlQubit !== 0 ||
        cnotParsed.operations[0].targetQubits[0] !== 1) {
      results.push({
        gateName: 'CNOT',
        testName: 'CNOT gate circuit generation',
        passed: false,
        error: 'CNOT gate structure mismatch after round-trip'
      })
    } else {
      results.push({
        gateName: 'CNOT',
        testName: 'CNOT gate circuit generation',
        passed: true,
        details: 'CNOT gate correctly preserves control and target qubits'
      })
    }
  } catch (error) {
    results.push({
      gateName: 'CNOT',
      testName: 'CNOT gate circuit generation',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test CZ
  const czOperation: Omit<QuantumOperation, 'id'> = {
    gateType: 'controlled-z',
    targetQubits: [1],
    controlQubit: 0,
    column: 0,
    parameters: undefined
  }

  const czCircuit: QuantumCircuit = {
    qubits: 2,
    classicalBits: 2,
    operations: [{ ...czOperation, id: 'test-cz' }]
  }

  try {
    const czQasm = generateOpenQasm(czCircuit)
    const czParsed = parseOpenQasmToCircuit(czQasm)

    if (czParsed.operations[0].gateType !== 'controlled-z' ||
        czParsed.operations[0].controlQubit !== 0 ||
        czParsed.operations[0].targetQubits[0] !== 1) {
      results.push({
        gateName: 'CZ',
        testName: 'CZ gate circuit generation',
        passed: false,
        error: 'CZ gate structure mismatch after round-trip'
      })
    } else {
      results.push({
        gateName: 'CZ',
        testName: 'CZ gate circuit generation',
        passed: true,
        details: 'CZ gate correctly preserves control and target qubits'
      })
    }
  } catch (error) {
    results.push({
      gateName: 'CZ',
      testName: 'CZ gate circuit generation',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  return results
}

function testParameterizedGates(): GateTestResult[] {
  const results: GateTestResult[] = []
  const gates = ['phase', 'rotation-x', 'rotation-y', 'rotation-z']
  const testParams = [0, 1.570796, 3.141593] // 0, π/2, π

  for (const gate of gates) {
    for (const param of testParams) {
      const operation: Omit<QuantumOperation, 'id'> = {
        gateType: gate,
        targetQubits: [0],
        column: 0,
        parameters: { theta: param }
      }

      const circuit: QuantumCircuit = {
        qubits: 2,
        classicalBits: 2,
        operations: [{ ...operation, id: `test-${gate}-${param}` }]
      }

      try {
        const qasm = generateOpenQasm(circuit)
        const parsed = parseOpenQasmToCircuit(qasm)

        if (parsed.operations[0].gateType !== gate) {
          results.push({
            gateName: gate,
            testName: `Parameterized gate with theta=${param}`,
            passed: false,
            error: `Gate type mismatch: expected ${gate}, got ${parsed.operations[0].gateType}`
          })
          continue
        }

        const parsedParam = parsed.operations[0].parameters?.theta
        if (parsedParam === undefined || Math.abs(parsedParam - param) > 0.0001) {
          results.push({
            gateName: gate,
            testName: `Parameterized gate with theta=${param}`,
            passed: false,
            error: `Parameter mismatch: expected ${param}, got ${parsedParam}`
          })
          continue
        }

        results.push({
          gateName: gate,
          testName: `Parameterized gate with theta=${param}`,
          passed: true,
          details: `Parameter ${param} correctly preserved`
        })
      } catch (error) {
        results.push({
          gateName: gate,
          testName: `Parameterized gate with theta=${param}`,
          passed: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }

  return results
}

function testOperations(): GateTestResult[] {
  const results: GateTestResult[] = []

  // Test measurement
  const measureOperation: Omit<QuantumOperation, 'id'> = {
    gateType: 'measurement',
    targetQubits: [0],
    column: 0,
    parameters: undefined
  }

  const measureCircuit: QuantumCircuit = {
    qubits: 2,
    classicalBits: 2,
    operations: [{ ...measureOperation, id: 'test-measure' }]
  }

  try {
    const measureQasm = generateOpenQasm(measureCircuit)
    const measureParsed = parseOpenQasmToCircuit(measureQasm)

    if (measureParsed.operations[0].gateType !== 'measurement') {
      results.push({
        gateName: 'Measurement',
        testName: 'Measurement operation',
        passed: false,
        error: 'Measurement gate type mismatch'
      })
    } else {
      results.push({
        gateName: 'Measurement',
        testName: 'Measurement operation',
        passed: true,
        details: 'Measurement operation correctly parsed'
      })
    }
  } catch (error) {
    results.push({
      gateName: 'Measurement',
      testName: 'Measurement operation',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test barrier
  const barrierOperation: Omit<QuantumOperation, 'id'> = {
    gateType: 'barrier',
    targetQubits: [0, 1],
    column: 0,
    parameters: undefined
  }

  const barrierCircuit: QuantumCircuit = {
    qubits: 2,
    classicalBits: 2,
    operations: [{ ...barrierOperation, id: 'test-barrier' }]
  }

  try {
    const barrierQasm = generateOpenQasm(barrierCircuit)
    const barrierParsed = parseOpenQasmToCircuit(barrierQasm)

    if (barrierParsed.operations[0].gateType !== 'barrier' ||
        barrierParsed.operations[0].targetQubits.length !== 2) {
      results.push({
        gateName: 'Barrier',
        testName: 'Barrier operation',
        passed: false,
        error: 'Barrier gate structure mismatch'
      })
    } else {
      results.push({
        gateName: 'Barrier',
        testName: 'Barrier operation',
        passed: true,
        details: 'Barrier operation correctly parsed with multiple qubits'
      })
    }
  } catch (error) {
    results.push({
      gateName: 'Barrier',
      testName: 'Barrier operation',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  return results
}

function testSwapGate(): GateTestResult[] {
  const results: GateTestResult[] = []

  // Test 1: Valid SWAP q[0], q[1]
  const swapOperation1: Omit<QuantumOperation, 'id'> = {
    gateType: 'swap',
    targetQubits: [0, 1],
    column: 0,
    parameters: undefined
  }

  const swapCircuit1: QuantumCircuit = {
    qubits: 2,
    classicalBits: 2,
    operations: [{ ...swapOperation1, id: 'test-swap-1' }]
  }

  try {
    const swapQasm1 = generateOpenQasm(swapCircuit1)
    const swapParsed1 = parseOpenQasmToCircuit(swapQasm1)

    if (swapParsed1.operations[0].gateType !== 'swap' ||
        swapParsed1.operations[0].targetQubits.length !== 2 ||
        swapParsed1.operations[0].targetQubits[0] !== 0 ||
        swapParsed1.operations[0].targetQubits[1] !== 1 ||
        swapParsed1.operations[0].controlQubit !== undefined) {
      results.push({
        gateName: 'SWAP',
        testName: 'Valid SWAP q[0], q[1]',
        passed: false,
        error: 'SWAP gate structure mismatch'
      })
    } else {
      results.push({
        gateName: 'SWAP',
        testName: 'Valid SWAP q[0], q[1]',
        passed: true,
        details: 'SWAP gate correctly preserves both qubits without control'
      })
    }
  } catch (error) {
    results.push({
      gateName: 'SWAP',
      testName: 'Valid SWAP q[0], q[1]',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 2: Invalid SWAP with same qubit
  const swapOperation2: Omit<QuantumOperation, 'id'> = {
    gateType: 'swap',
    targetQubits: [0, 0],
    column: 0,
    parameters: undefined
  }

  const validation2 = validateOperation(swapOperation2, 2, 2)
  if (!validation2.valid) {
    results.push({
      gateName: 'SWAP',
      testName: 'Invalid SWAP with same qubit',
      passed: true,
      details: `Correctly rejected: ${validation2.error}`
    })
  } else {
    results.push({
      gateName: 'SWAP',
      testName: 'Invalid SWAP with same qubit',
      passed: false,
      error: 'Should have rejected SWAP with same qubit'
    })
  }

  // Test 3: SWAP with control qubit (invalid)
  const swapOperation3: Omit<QuantumOperation, 'id'> = {
    gateType: 'swap',
    targetQubits: [0, 1],
    column: 0,
    controlQubit: 0,
    parameters: undefined
  }

  const validation3 = validateOperation(swapOperation3, 2, 2)
  if (!validation3.valid) {
    results.push({
      gateName: 'SWAP',
      testName: 'Invalid SWAP with control qubit',
      passed: true,
      details: `Correctly rejected: ${validation3.error}`
    })
  } else {
    results.push({
      gateName: 'SWAP',
      testName: 'Invalid SWAP with control qubit',
      passed: false,
      error: 'Should have rejected SWAP with control qubit'
    })
  }

  return results
}

function testOpenQasmRoundTrip(): GateTestResult[] {
  const results: GateTestResult[] = []

  // Create a complex circuit with multiple gate types
  const complexCircuit: QuantumCircuit = {
    qubits: 3,
    classicalBits: 3,
    operations: [
      { id: 'op1', gateType: 'hadamard', targetQubits: [0], column: 0, parameters: undefined },
      { id: 'op2', gateType: 'pauli-x', targetQubits: [1], column: 1, parameters: undefined },
      { id: 'op3', gateType: 'controlled-not', targetQubits: [1], controlQubit: 0, column: 2, parameters: undefined },
      { id: 'op4', gateType: 'swap', targetQubits: [1, 2], column: 3, parameters: undefined },
      { id: 'op5', gateType: 'phase', targetQubits: [0], column: 4, parameters: { theta: 1.570796 } },
      { id: 'op6', gateType: 'measurement', targetQubits: [0], column: 5, parameters: undefined },
    ]
  }

  try {
    const qasm = generateOpenQasm(complexCircuit)
    const parsed = parseOpenQasmToCircuit(qasm)

    if (parsed.operations.length !== complexCircuit.operations.length) {
      results.push({
        gateName: 'OpenQASM',
        testName: 'Complex circuit round-trip',
        passed: false,
        error: `Operation count mismatch: expected ${complexCircuit.operations.length}, got ${parsed.operations.length}`
      })
      return results
    }

    // Check that gate types match
    for (let i = 0; i < complexCircuit.operations.length; i++) {
      if (parsed.operations[i].gateType !== complexCircuit.operations[i].gateType) {
        results.push({
          gateName: 'OpenQASM',
          testName: 'Complex circuit round-trip',
          passed: false,
          error: `Gate type mismatch at operation ${i}: expected ${complexCircuit.operations[i].gateType}, got ${parsed.operations[i].gateType}`
        })
        return results
      }
    }

    results.push({
      gateName: 'OpenQASM',
      testName: 'Complex circuit round-trip',
      passed: true,
      details: `Successfully round-tripped ${complexCircuit.operations.length} operations`
    })
  } catch (error) {
    results.push({
      gateName: 'OpenQASM',
      testName: 'Complex circuit round-trip',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  return results
}

function testValidation(): GateTestResult[] {
  const results: GateTestResult[] = []

  // Test out-of-range qubit
  const invalidQubitOp: Omit<QuantumOperation, 'id'> = {
    gateType: 'hadamard',
    targetQubits: [10],
    column: 0,
    parameters: undefined
  }

  const validation1 = validateOperation(invalidQubitOp, 2, 2)
  if (!validation1.valid) {
    results.push({
      gateName: 'Validation',
      testName: 'Out-of-range qubit',
      passed: true,
      details: `Correctly rejected: ${validation1.error}`
    })
  } else {
    results.push({
      gateName: 'Validation',
      testName: 'Out-of-range qubit',
      passed: false,
      error: 'Should have rejected out-of-range qubit'
    })
  }

  // Test missing parameter for parameterized gate
  const missingParamOp: Omit<QuantumOperation, 'id'> = {
    gateType: 'phase',
    targetQubits: [0],
    column: 0,
    parameters: undefined
  }

  const validation2 = validateOperation(missingParamOp, 2, 2)
  if (!validation2.valid) {
    results.push({
      gateName: 'Validation',
      testName: 'Missing parameter for parameterized gate',
      passed: true,
      details: `Correctly rejected: ${validation2.error}`
    })
  } else {
    results.push({
      gateName: 'Validation',
      testName: 'Missing parameter for parameterized gate',
      passed: false,
      error: 'Should have rejected missing parameter'
    })
  }

  // Test NaN parameter
  const nanParamOp: Omit<QuantumOperation, 'id'> = {
    gateType: 'phase',
    targetQubits: [0],
    column: 0,
    parameters: { theta: NaN }
  }

  const validation3 = validateOperation(nanParamOp, 2, 2)
  if (!validation3.valid) {
    results.push({
      gateName: 'Validation',
      testName: 'NaN parameter',
      passed: true,
      details: `Correctly rejected: ${validation3.error}`
    })
  } else {
    results.push({
      gateName: 'Validation',
      testName: 'NaN parameter',
      passed: false,
      error: 'Should have rejected NaN parameter'
    })
  }

  // Test control equals target
  const controlEqualsTargetOp: Omit<QuantumOperation, 'id'> = {
    gateType: 'controlled-not',
    targetQubits: [0],
    controlQubit: 0,
    column: 0,
    parameters: undefined
  }

  const validation4 = validateOperation(controlEqualsTargetOp, 2, 2)
  if (!validation4.valid) {
    results.push({
      gateName: 'Validation',
      testName: 'Control equals target',
      passed: true,
      details: `Correctly rejected: ${validation4.error}`
    })
  } else {
    results.push({
      gateName: 'Validation',
      testName: 'Control equals target',
      passed: false,
      error: 'Should have rejected control equals target'
    })
  }

  return results
}
