import type { QuantumOperation } from '../../types/circuit'

export function OperationPreview({ operation }: { operation: QuantumOperation }) {
  const labels: Record<string, string> = { hadamard: 'H', 'pauli-x': 'X', 'pauli-y': 'Y', 'pauli-z': 'Z', identity: 'I', s: 'S', 's-dagger': 'S†', t: 'T', 't-dagger': 'T†', phase: 'P', 'rotation-x': 'Rx', 'rotation-y': 'Ry', 'rotation-z': 'Rz', 'controlled-not': '⊕', 'controlled-z': '●', swap: '×', measurement: 'M', barrier: '||' }
  const label = labels[operation.gateType] ?? '?'
  return <div className="grid size-10 scale-[1.04] place-items-center rounded-lg border border-[#84ad98] bg-[#e4f3e8] font-mono text-[11px] font-medium text-[#1c6b52] shadow-[0_12px_24px_rgba(39,66,53,0.18)] transition-all duration-200">{label}</div>
}
