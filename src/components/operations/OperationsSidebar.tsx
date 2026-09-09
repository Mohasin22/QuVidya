import { useState, useMemo } from 'react'
import { LockKeyhole, X, Info } from 'lucide-react'
import type { GateDefinition } from '../../types/circuit'
import { gateCategories } from '../gates/gateDefinitions'
import { OperationsHeader } from './OperationsHeader'
import { GateSearch } from './GateSearch'
import { GateCategory } from './GateCategory'

type OperationsSidebarProps = {
  selectedGate?: GateDefinition
  pendingMultiQubit?: { gate: GateDefinition; column: number; controlQubit: number }
  onGateSelect: (gate: GateDefinition) => void
  onGateDeselect?: () => void
}

export function OperationsSidebar({
  selectedGate,
  pendingMultiQubit,
  onGateSelect,
  onGateDeselect,
}: OperationsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Default expanded: Basic Gates and Multi-Qubit Gates
  const [userExpandedCategories, setUserExpandedCategories] = useState<Set<string>>(
    () => new Set(gateCategories.filter((c) => c.expandedByDefault).map((c) => c.id))
  )

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setUserExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  // Filter gates based on search query
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return gateCategories.map((category) => ({
        ...category,
        matchingGates: category.gates,
        hasMatches: true,
      }))
    }

    return gateCategories
      .map((category) => {
        const matchingGates = category.gates.filter((gate) => {
          const inSymbol = gate.symbol.toLowerCase().includes(query)
          const inLabel = gate.displayLabel.toLowerCase().includes(query)
          const inName = gate.name.toLowerCase().includes(query)
          const inDesc = gate.description.toLowerCase().includes(query)
          const inEdu = gate.educationalExplanation?.toLowerCase().includes(query)
          const inAliases = gate.aliases?.some((alias) =>
            alias.toLowerCase().includes(query)
          )

          return inSymbol || inLabel || inName || inDesc || inEdu || inAliases
        })

        return {
          ...category,
          matchingGates,
          hasMatches: matchingGates.length > 0,
        }
      })
      .filter((category) => category.hasMatches)
  }, [searchQuery])

  const totalMatches = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => acc + cat.matchingGates.length, 0)
  }, [filteredCategories])

  const isSearching = searchQuery.trim().length > 0

  // If searching: auto-expand all categories with matches.
  // Otherwise, use the user's manual expanded/collapsed state.
  const isCategoryExpanded = (categoryId: string) => {
    if (isSearching) return true
    return userExpandedCategories.has(categoryId)
  }

  const getStatusMessage = () => {
    if (!selectedGate) return null

    if (pendingMultiQubit) {
      if (selectedGate.name === 'swap') {
        return {
          title: `Selected: ${selectedGate.displayLabel}`,
          instruction: `First qubit on q[${pendingMultiQubit.controlQubit}]. Select second qubit in column ${pendingMultiQubit.column}`,
        }
      }
      return {
        title: `Selected: ${selectedGate.displayLabel}`,
        instruction: `Control on q[${pendingMultiQubit.controlQubit}]. Select target qubit in column ${pendingMultiQubit.column}`,
      }
    }

    if (selectedGate.name === 'swap') {
      return {
        title: `Selected: ${selectedGate.displayLabel}`,
        instruction: 'Select 2 different qubits',
      }
    }

    if (selectedGate.qubitsRequired > 1) {
      return {
        title: `Selected: ${selectedGate.displayLabel}`,
        instruction: '1. Select control qubit  2. Select target qubit',
      }
    }

    return {
      title: `Selected: ${selectedGate.displayLabel}`,
      instruction: 'Select a qubit',
    }
  }

  const statusInfo = getStatusMessage()

  return (
    <section className="flex h-full max-h-full flex-col min-w-0 select-none">
      {/* Pinned / Sticky Top: Header, Search & Selection Banner */}
      <div className="shrink-0 pb-3">
        <OperationsHeader />

        <GateSearch
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          totalMatches={totalMatches}
          isSearching={isSearching}
        />

        {/* Selected Gate Status Indicator */}
        {selectedGate && statusInfo && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-[#c4ded0] bg-[#eef7f2] p-2.5 shadow-[0_2px_8px_rgba(28,107,82,0.08)]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#1c6b52] font-mono text-[11px] font-bold text-white shadow-xs">
                {selectedGate.symbol}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold text-[#164e3c]">
                  {statusInfo.title}
                </p>
                <p className="truncate text-[9px] font-medium text-[#2d6a54]">
                  {statusInfo.instruction}
                </p>
              </div>
            </div>

            {onGateDeselect && (
              <button
                type="button"
                onClick={onGateDeselect}
                className="ml-1 rounded p-1 text-[#2d6a54] transition hover:bg-[#d8ebe0] hover:text-[#164e3c]"
                title="Cancel selection (Esc)"
                aria-label="Cancel gate selection"
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Independently Scrollable Category Accordion */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <GateCategory
              key={category.id}
              category={{
                ...category,
                gates: category.matchingGates,
              }}
              isExpanded={isCategoryExpanded(category.id)}
              onToggle={() => toggleCategory(category.id)}
              selectedGate={selectedGate}
              onGateSelect={onGateSelect}
            />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-[#dce3de] bg-white p-6 text-center">
            <Info size={18} className="mx-auto text-[#9aa49f]" />
            <p className="mt-2 text-[11px] font-semibold text-[#54645c]">
              No matching gates found
            </p>
            <p className="mt-1 text-[10px] text-[#829288]">
              Try searching by symbol, full name, or alias (e.g. CNOT, H, swap)
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-3 rounded-md bg-[#eef3ef] px-2.5 py-1 text-[10px] font-semibold text-[#1c6b52] transition hover:bg-[#e2ece5]"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Footer Helper */}
      <div className="mt-3 shrink-0 border-t border-[#e2e8e3] pt-2.5 text-[10px] text-[#86968d]">
        <div className="flex items-center gap-1.5">
          <LockKeyhole size={12} className="shrink-0 text-[#9aa49f]" />
          <span>Click to select or drag onto circuit</span>
        </div>
      </div>
    </section>
  )
}
