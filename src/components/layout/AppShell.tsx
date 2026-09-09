import { useEffect, useState } from 'react'
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { CircuitCanvas } from '../circuit/CircuitCanvas'
import { CircuitToolbar } from '../editor/CircuitToolbar'
import { QasmCodeEditor } from '../editor/QasmCodeEditor'
import { OperationsSidebar } from '../operations/OperationsSidebar'
import { SimulationResults } from '../results/SimulationResults'
import { TopNavbar } from './TopNavbar'
import { useCircuit } from '../../hooks/useCircuit'
import { useCircuitStore } from '../../store/circuitStore'
import { simulateCircuit, SimulationRequestError } from '../../services/simulationService'
import { generateOpenQasm } from '../../services/qasmService'
import type { GateDefinition, QuantumOperation } from '../../types/circuit'
import { GatePreview } from '../gates/GatePreview'
import { OperationPreview } from '../circuit/OperationPreview'
import { gateCategories } from '../gates/gateDefinitions'
import { HelpPanel } from './HelpPanel'
import { SettingsPanel } from './SettingsPanel'

export function AppShell() {
  const [selectedGate, setSelectedGate] = useState<GateDefinition>()
  const [selectedOperationId, setSelectedOperationId] = useState<string>()
  const [placementMessage, setPlacementMessage] = useState<string>()
  const [pendingMultiQubit, setPendingMultiQubit] = useState<{ gate: GateDefinition; column: number; controlQubit: number }>()
  const [activeDrag, setActiveDrag] = useState<{ gate?: GateDefinition; operation?: QuantumOperation }>()
  const [activeMenu, setActiveMenu] = useState<'File' | 'Edit' | 'View' | 'Help'>()
  const [helpTopic, setHelpTopic] = useState<'build' | 'gates' | 'shortcuts'>()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [paletteOpen, setPaletteOpen] = useState(true)
  const [qasmOpen, setQasmOpen] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [shots, setShots] = useState(1024)
  const [motionEnabled, setMotionEnabled] = useState(true)
  const { addQubit } = useCircuit()
  const circuit = useCircuitStore((state) => state.circuit)
  const addOperation = useCircuitStore((state) => state.addOperation)
  const moveOperation = useCircuitStore((state) => state.moveOperation)
  const removeOperation = useCircuitStore((state) => state.removeOperation)
  const removeQubit = useCircuitStore((state) => state.removeQubit)
  const clearCircuit = useCircuitStore((state) => state.clearCircuit)
  const resetCircuit = useCircuitStore((state) => state.resetCircuit)
  const loadCircuit = useCircuitStore((state) => state.loadCircuit)
  const undo = useCircuitStore((state) => state.undo)
  const redo = useCircuitStore((state) => state.redo)
  const canUndo = useCircuitStore((state) => state.past.length > 0)
  const canRedo = useCircuitStore((state) => state.future.length > 0)
  const simulation = useCircuitStore((state) => state.simulation)
  const setSimulationLoading = useCircuitStore((state) => state.setSimulationLoading)
  const setSimulationResult = useCircuitStore((state) => state.setSimulationResult)
  const setSimulationError = useCircuitStore((state) => state.setSimulationError)
  const clearSimulation = useCircuitStore((state) => state.clearSimulation)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey
      if (modifier && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if (event.key === 'Escape') {
        setActiveMenu(undefined)
        setSettingsOpen(false)
        setHelpTopic(undefined)
        setSearchQuery('')
        return
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedOperationId) {
        removeOperation(selectedOperationId)
        setSelectedOperationId(undefined)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [redo, removeOperation, selectedOperationId, undo])

  const placeGateAt = (gate: GateDefinition, qubitIndex: number, column: number, multiQubitTarget?: number) => {
    // Handle different gate types properly
    let targetQubits: number[]
    let controlQubit: number | undefined

    if (gate.qubitsRequired === 1) {
      // Single-qubit gates
      targetQubits = [qubitIndex]
      controlQubit = undefined
    } else if (gate.name === 'swap') {
      // SWAP gate: needs two different qubits
      if (multiQubitTarget === undefined) {
        setPlacementMessage('SWAP requires two different qubits. Select the second qubit.')
        return false
      }
      if (qubitIndex === multiQubitTarget) {
        setPlacementMessage('SWAP requires two different qubits. Cannot use the same qubit twice.')
        return false
      }
      targetQubits = [qubitIndex, multiQubitTarget]
      controlQubit = undefined
    } else {
      // Other multi-qubit gates (CNOT, CZ): control + target
      if (multiQubitTarget === undefined) {
        setPlacementMessage(`${gate.displayLabel} requires a target qubit.`)
        return false
      }
      if (qubitIndex === multiQubitTarget) {
        setPlacementMessage(`${gate.displayLabel} requires different control and target qubits.`)
        return false
      }
      controlQubit = qubitIndex
      targetQubits = [multiQubitTarget]
    }

    const operation: Omit<QuantumOperation, 'id'> = {
      gateType: gate.name,
      targetQubits,
      column,
      ...(controlQubit !== undefined ? { controlQubit } : {}),
      ...(gate.requiresParameters ? { parameters: { theta: 0 } } : {}),
    }

    // Validate qubit ranges
    if (targetQubits.some((target) => target < 0 || target >= circuit.qubits)) {
      setPlacementMessage(`${gate.displayLabel} target qubits are out of range.`)
      return false
    }
    if (controlQubit !== undefined && (controlQubit < 0 || controlQubit >= circuit.qubits)) {
      setPlacementMessage(`${gate.displayLabel} control qubit is out of range.`)
      return false
    }

    const operationId = addOperation(operation)
    if (!operationId) {
      setPlacementMessage('That circuit position is already occupied.')
      return false
    }
    setSelectedGate(undefined)
    setPendingMultiQubit(undefined)
    setPlacementMessage(`${gate.displayLabel} placed in column ${column}.`)
    return true
  }

  const handleCellClick = (column: number, qubitIndex: number) => {
    if (!selectedGate) return

    // Handle multi-qubit gates (CNOT, CZ, SWAP)
    if (selectedGate.qubitsRequired > 1 && !pendingMultiQubit) {
      if (selectedGate.name === 'swap') {
        // SWAP: first qubit selection
        setPendingMultiQubit({ gate: selectedGate, column, controlQubit: qubitIndex })
        setPlacementMessage(`First qubit selected on q[${qubitIndex}]. Select the second qubit on the same column.`)
      } else {
        // CNOT/CZ: control qubit selection
        setPendingMultiQubit({ gate: selectedGate, column, controlQubit: qubitIndex })
        setPlacementMessage(`Control selected on q[${qubitIndex}]. Select the target on the same column.`)
      }
      return
    }

    // Validate that target is in the same column for multi-qubit gates
    if (pendingMultiQubit && column !== pendingMultiQubit.column) {
      setPlacementMessage(`Select the target in column ${pendingMultiQubit.column} to keep the gate connected.`)
      return
    }

    const gate = pendingMultiQubit?.gate ?? selectedGate
    if (pendingMultiQubit) {
      placeGateAt(gate, pendingMultiQubit.controlQubit, column, qubitIndex)
    } else {
      placeGateAt(gate, qubitIndex, column)
    }
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveDrag(undefined)
    if (!over) return
    const target = over.data.current as { column?: number; qubitIndex?: number } | undefined
    if (target?.column === undefined || target.qubitIndex === undefined) return
    const data = active.data.current as { kind?: string; gate?: GateDefinition; operation?: QuantumOperation } | undefined
    if (data?.kind === 'gate' && data.gate) {
      if (data.gate.qubitsRequired === 1) placeGateAt(data.gate, target.qubitIndex, target.column)
      else placeGateAt(data.gate, target.qubitIndex, target.column, target.qubitIndex + 1)
      return
    }
    if (data?.kind === 'operation' && data.operation) {
      const operation = data.operation
      const anchor = operation.controlQubit ?? Math.min(...operation.targetQubits)
      const offset = target.qubitIndex - anchor
      const targetQubits = operation.targetQubits.map((qubit) => qubit + offset)
      const controlQubit = operation.controlQubit === undefined ? undefined : operation.controlQubit + offset
      const moved = moveOperation(operation.id, target.column, targetQubits, controlQubit)
      if (moved) setPlacementMessage(`${operation.gateType} moved to column ${target.column}.`)
      else setPlacementMessage('That circuit position is not available.')
    }
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    const data = active.data.current as { gate?: GateDefinition; operation?: QuantumOperation } | undefined
    setActiveDrag({ gate: data?.gate, operation: data?.operation })
  }

  const handleOperationSelect = (operation: QuantumOperation) => {
    setSelectedOperationId(operation.id)
    setPlacementMessage(`${operation.gateType} selected. Press Delete to remove it.`)
  }

  const handleRemoveQubit = () => {
    if (!removeQubit()) setPlacementMessage('Remove the operations on the last qubit before removing it.')
    else setPlacementMessage(undefined)
  }

  const handleClearCircuit = () => {
    clearCircuit()
    clearSimulation()
    setSelectedOperationId(undefined)
    setPlacementMessage('Circuit operations cleared.')
  }

  const handleResetCircuit = () => {
    resetCircuit()
    clearSimulation()
    setSelectedGate(undefined)
    setSelectedOperationId(undefined)
    setPendingMultiQubit(undefined)
    setPlacementMessage('Circuit reset to 4 qubits.')
  }

  const handleRunCircuit = async () => {
    setSimulationLoading()
    try {
      const result = await simulateCircuit(circuit, undefined, shots)
      setSimulationResult(result)
    } catch (error) {
      const message = error instanceof SimulationRequestError ? error.message : 'The simulation failed unexpectedly.'
      setSimulationError(message)
    }
  }

  const confirmIfNeeded = (message: string) => circuit.operations.length === 0 || window.confirm(message)

  const handleNewCircuit = () => {
    if (!confirmIfNeeded('Create a new empty circuit? Unsaved circuit changes will be replaced.')) return
    resetCircuit()
    setSelectedGate(undefined)
    setSelectedOperationId(undefined)
    setPlacementMessage('New circuit created.')
    setActiveMenu(undefined)
  }

  const handleSaveCircuit = () => {
    localStorage.setItem('q-learn-circuit', JSON.stringify(circuit))
    setPlacementMessage('Circuit saved locally in this browser.')
    setActiveMenu(undefined)
  }

  const handleLoadCircuit = () => {
    const saved = localStorage.getItem('q-learn-circuit')
    if (!saved) {
      setPlacementMessage('No saved circuit was found in this browser.')
      return
    }
    try {
      const loaded = JSON.parse(saved)
      if (!Number.isInteger(loaded.qubits) || !Number.isInteger(loaded.classicalBits) || !Array.isArray(loaded.operations)) throw new Error('invalid')
      loadCircuit(loaded)
      setPlacementMessage('Saved circuit loaded.')
      setActiveMenu(undefined)
    } catch {
      setPlacementMessage('The saved circuit is invalid.')
    }
  }

  const handleExportQasm = () => {
    const blob = new Blob([generateOpenQasm(circuit)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'q-learn-circuit.qasm'
    link.click()
    URL.revokeObjectURL(url)
    setActiveMenu(undefined)
  }

  const handleResetWithConfirmation = () => {
    if (!confirmIfNeeded('Reset the circuit to a blank four-qubit circuit?')) return
    handleResetCircuit()
    setActiveMenu(undefined)
  }

  const handleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen?.()
  }

  const searchResults = searchQuery ? [...gateCategories.flatMap((category) => category.gates.map((gate) => `Gate: ${gate.name}`)), 'Help: How to build a circuit', 'Help: Gate guide', 'Help: Keyboard shortcuts', 'Command: Export OpenQASM', 'Command: Run circuit'].filter((item) => item.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 7) : []

  const handleSearchSelect = (result: string) => {
    if (result.startsWith('Gate: ')) {
      const gate = gateCategories.flatMap((category) => category.gates).find((item) => `Gate: ${item.name}` === result)
      if (gate) setSelectedGate(gate)
    } else if (result.includes('build')) setHelpTopic('build')
    else if (result.includes('guide')) setHelpTopic('gates')
    else if (result.includes('shortcuts')) setHelpTopic('shortcuts')
    else if (result.includes('Export')) handleExportQasm()
    else if (result.includes('Run')) handleRunCircuit()
    setSearchQuery('')
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragCancel={() => setActiveDrag(undefined)} onDragEnd={handleDragEnd}>
    <div className={`min-h-screen bg-[#f3f5f2] text-[#17211f] ${motionEnabled ? '' : 'motion-sparing'}`}>
      <TopNavbar searchQuery={searchQuery} onSearchChange={setSearchQuery} searchResults={searchResults} onSearchSelect={handleSearchSelect} settingsOpen={settingsOpen} onSettingsToggle={() => { setSettingsOpen((open) => !open); setActiveMenu(undefined) }} />
      {settingsOpen && <SettingsPanel shots={shots} motionEnabled={motionEnabled} onShotsChange={setShots} onMotionChange={setMotionEnabled} onClose={() => setSettingsOpen(false)} />}
      <main>
        <div className="relative z-20"><CircuitToolbar onAddQubit={addQubit} onRemoveQubit={handleRemoveQubit} onClearCircuit={handleClearCircuit} onResetCircuit={handleResetWithConfirmation} onUndo={undo} onRedo={redo} canUndo={canUndo} canRedo={canRedo} onRun={handleRunCircuit} isRunning={simulation.status === 'loading'} activeMenu={activeMenu} onMenuChange={(menu) => { setActiveMenu(menu); setSettingsOpen(false) }} onZoomIn={() => setZoom((value) => Math.min(1.25, value + 0.1))} onZoomOut={() => setZoom((value) => Math.max(0.8, value - 0.1))} onZoomReset={() => setZoom(1)} /></div>
        {activeMenu && <MenuPanel menu={activeMenu} canUndo={canUndo} canRedo={canRedo} onAction={(action) => { if (action === 'new') handleNewCircuit(); if (action === 'save') handleSaveCircuit(); if (action === 'load') handleLoadCircuit(); if (action === 'export') handleExportQasm(); if (action === 'reset') handleResetWithConfirmation(); if (action === 'undo') undo(); if (action === 'redo') redo(); if (action === 'delete') { if (selectedOperationId) { removeOperation(selectedOperationId); setSelectedOperationId(undefined) } } if (action === 'clear') handleClearCircuit(); if (action === 'palette') setPaletteOpen((value) => !value); if (action === 'qasm') setQasmOpen((value) => !value); if (action === 'fullscreen') handleFullscreen(); if (action === 'help-build') setHelpTopic('build'); if (action === 'help-gates') setHelpTopic('gates'); if (action === 'help-shortcuts') setHelpTopic('shortcuts'); setActiveMenu(undefined) }} />}
        <div className={`grid min-h-[calc(100vh-120px)] grid-cols-1 ${paletteOpen && qasmOpen ? 'lg:grid-cols-[280px_1fr_400px]' : paletteOpen ? 'lg:grid-cols-[280px_1fr]' : qasmOpen ? 'lg:grid-cols-[1fr_400px]' : 'lg:grid-cols-1'}`}>
          {paletteOpen && (
            <aside className="border-b border-[#dbe2dd] bg-[#fbfcfa] p-4 lg:border-r lg:border-b-0 lg:p-5 lg:h-[calc(100vh-120px)] lg:overflow-hidden flex flex-col">
              <OperationsSidebar
                selectedGate={selectedGate}
                pendingMultiQubit={pendingMultiQubit}
                onGateSelect={(gate) => {
                  if (selectedGate?.name === gate.name) {
                    setSelectedGate(undefined)
                    setPendingMultiQubit(undefined)
                    setPlacementMessage(undefined)
                  } else {
                    setSelectedGate(gate)
                    setPendingMultiQubit(undefined)
                    setPlacementMessage(undefined)
                  }
                }}
                onGateDeselect={() => {
                  setSelectedGate(undefined)
                  setPendingMultiQubit(undefined)
                  setPlacementMessage(undefined)
                }}
              />
            </aside>
          )}
          <section className="min-w-0 flex flex-col border-b border-[#dbe2dd] bg-[#eaf0eb] p-4 sm:p-6 lg:border-r lg:border-b-0">
            <div className="mb-4 overflow-hidden rounded-xl border border-[#dbe2dd] shadow-[0_8px_24px_rgba(39,66,53,0.05)]">
              <CircuitCanvas zoom={zoom} selectedGate={selectedGate} pendingMultiQubit={pendingMultiQubit} selectedOperationId={selectedOperationId} onCellClick={handleCellClick} onOperationSelect={handleOperationSelect} onAddQubit={addQubit} />
            </div>
            {placementMessage && <p className="mb-4 text-center text-[11px] font-semibold text-[#6d7975]">{placementMessage}</p>}
            <div className="flex-1 min-h-[300px] rounded-xl border border-[#e5ebe6] bg-white p-4">
              <SimulationResults simulation={simulation} />
            </div>
          </section>
          {qasmOpen && <aside className="bg-[#fbfcfa] p-5 lg:p-6"><QasmCodeEditor circuit={circuit} onCircuitChange={loadCircuit} /></aside>}
        </div>
      </main>
    </div>
    {helpTopic && <HelpPanel topic={helpTopic} onClose={() => setHelpTopic(undefined)} />}
    <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}>{activeDrag?.gate ? <GatePreview gate={activeDrag.gate} overlay /> : activeDrag?.operation ? <OperationPreview operation={activeDrag.operation} /> : null}</DragOverlay>
    </DndContext>
  )
}

type MenuAction = 'new' | 'save' | 'load' | 'export' | 'reset' | 'undo' | 'redo' | 'delete' | 'clear' | 'palette' | 'qasm' | 'fullscreen' | 'help-build' | 'help-gates' | 'help-shortcuts'

function MenuPanel({ menu, canUndo, canRedo, onAction }: { menu: 'File' | 'Edit' | 'View' | 'Help'; canUndo: boolean; canRedo: boolean; onAction: (action: MenuAction) => void }) {
  const items: Record<typeof menu, Array<{ label: string; action: MenuAction; disabled?: boolean }>> = {
    File: [{ label: 'New Circuit', action: 'new' }, { label: 'Save Circuit', action: 'save' }, { label: 'Load Circuit', action: 'load' }, { label: 'Export OpenQASM', action: 'export' }, { label: 'Reset Circuit', action: 'reset' }],
    Edit: [{ label: 'Undo', action: 'undo', disabled: !canUndo }, { label: 'Redo', action: 'redo', disabled: !canRedo }, { label: 'Delete Selected Gate', action: 'delete' }, { label: 'Clear Circuit', action: 'clear' }],
    View: [{ label: 'Toggle Gate Palette', action: 'palette' }, { label: 'Toggle OpenQASM Panel', action: 'qasm' }, { label: 'Toggle Fullscreen', action: 'fullscreen' }],
    Help: [{ label: 'How to Build a Circuit', action: 'help-build' }, { label: 'Gate Guide', action: 'help-gates' }, { label: 'Keyboard Shortcuts', action: 'help-shortcuts' }],
  }
  return <div className="absolute left-4 top-12 z-50 w-56 rounded-xl border border-[#dbe2dd] bg-white p-2 shadow-[0_14px_30px_rgba(39,66,53,0.14)]">{items[menu].map((item) => <button key={item.action} className="block w-full rounded-lg px-3 py-2 text-left text-[11px] font-semibold text-[#5f6e66] transition hover:bg-[#eef3ef] hover:text-[#17211f] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent" type="button" disabled={item.disabled} onClick={() => onAction(item.action)}>{item.label}</button>)}</div>
}
