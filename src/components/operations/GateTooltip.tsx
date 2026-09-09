import type { GateDefinition } from '../../types/circuit'

export function GateTooltip({ gate }: { gate: GateDefinition }) {
  const requiresParameter = gate.requiresParameters || gate.requiresParameter
  const paramName = gate.parameterName || (gate.parameters.length > 0 ? gate.parameters[0] : 'θ')
  const qubitCount = gate.qubitCount || gate.qubitsRequired

  let requirementText = `Requires: ${qubitCount} qubit${qubitCount > 1 ? 's' : ''}`
  if (requiresParameter) {
    requirementText += ` + angle parameter (${paramName})`
  }

  return (
    <div className="w-[220px] max-w-[260px] select-none text-left">
      <div className="flex items-center justify-between gap-2 border-b border-[#e9eeea] pb-2">
        <strong className="text-[12px] font-bold text-[#17211f]">
          {gate.displayLabel}
        </strong>
        <span className="rounded-md bg-[#e5f2e9] px-2 py-0.5 font-mono text-[11px] font-bold text-[#1c6b52]">
          {gate.symbol}
        </span>
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-[#56655e]">
        {gate.educationalExplanation || gate.description}
      </p>

      <div className="mt-2.5 flex items-center justify-between rounded-md bg-[#f4f7f4] px-2 py-1 text-[9px] font-medium text-[#65766e]">
        <span>{requirementText}</span>
      </div>
    </div>
  )
}
