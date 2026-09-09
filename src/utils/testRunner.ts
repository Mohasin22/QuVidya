/**
 * Test Runner for Q-Learn Quantum Circuit Simulator
 * This file provides a simple way to run all gate tests and display results
 */

import { runAllGateTests, type GateTestResult } from './circuitTests'

export function runTestsAndDisplayResults(): void {
  console.log('🧪 Running Q-Learn Gate Tests...\n')

  const results = runAllGateTests()

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length

  console.log(`📊 Test Results: ${passed}/${total} passed, ${failed} failed\n`)

  // Group results by gate name
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.gateName]) {
      acc[result.gateName] = []
    }
    acc[result.gateName].push(result)
    return acc
  }, {} as Record<string, GateTestResult[]>)

  // Display results by gate
  for (const [gateName, gateResults] of Object.entries(groupedResults)) {
    console.log(`\n🔷 ${gateName}`)
    for (const result of gateResults) {
      const status = result.passed ? '✅' : '❌'
      console.log(`  ${status} ${result.testName}`)
      if (result.details) {
        console.log(`     ℹ️  ${result.details}`)
      }
      if (result.error) {
        console.log(`     ⚠️  ${result.error}`)
      }
    }
  }

  console.log(`\n${failed === 0 ? '🎉 All tests passed!' : '⚠️  Some tests failed. Please review the errors above.'}`)
}

// Auto-run tests if this file is executed directly
if (typeof window === 'undefined') {
  runTestsAndDisplayResults()
}
