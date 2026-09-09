import type { QuantumOperation } from '../../types/circuit'
import { CircuitColumn } from './CircuitColumn'

type QubitWireProps = {
  qubitIndex: number
  columnCount: number
  operations: QuantumOperation[]
  qubitCount: number
  selectedOperationId?: string
  onCellClick: (column: number, qubitIndex: number) => void
  onOperationSelect: (operation: QuantumOperation) => void
}

export function QubitWire({ qubitIndex, columnCount, operations, qubitCount, selectedOperationId, onCellClick, onOperationSelect }: QubitWireProps) {
  return (
    <div className="flex h-16 border-b border-[#edf1ee] last:border-b-0">
      <div className="flex w-14 shrink-0 items-center bg-[#fbfcfa] pl-4 font-mono text-[11px] text-[#718078]">q[{qubitIndex}]</div>
      <div className="relative flex min-w-0 flex-1 items-center">
        <div className="absolute inset-x-0 top-1/2 h-px bg-[#cfd9d2]" />
        <div className="relative z-10 flex w-full">
          {Array.from({ length: columnCount }, (_, column) => (
            <CircuitColumn 
              key={column} 
              column={column} 
              qubitIndex={qubitIndex} 
              qubitCount={qubitCount} 
              operations={operations.filter((item) => item.column === column)} 
              selectedOperationId={selectedOperationId} 
              onCellClick={onCellClick} 
              onOperationSelect={onOperationSelect} 
            />
          ))}
        </div>
      </div>
      <div className="flex w-14 shrink-0 items-center justify-end bg-[#fbfcfa] pr-4 font-mono text-[11px] text-[#a1aaa5]">|0⟩</div>
    </div>
  )
}
