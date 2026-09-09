import { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import type { QuantumCircuit } from '../../types/circuit'
import { generateOpenQasm } from '../../services/qasmService'
import { parseOpenQasmToCircuit } from '../../services/qasmParser'

type QasmCodeEditorProps = {
  circuit: QuantumCircuit
  onCircuitChange: (circuit: QuantumCircuit) => void
  readOnly?: boolean
}

export function QasmCodeEditor({ circuit, onCircuitChange, readOnly = false }: QasmCodeEditorProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Update code when circuit changes (from visual editor)
  useEffect(() => {
    const newCode = generateOpenQasm(circuit)
    setCode(newCode)
    setError(null)
  }, [circuit])

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return
    setCode(value)
  }

  const handleApplyCode = () => {
    try {
      const parsedCircuit = parseOpenQasmToCircuit(code)
      onCircuitChange(parsedCircuit)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse OpenQASM code')
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-[12px] font-bold text-[#17211f]">OpenQASM Code</h3>
          <p className="text-[10px] text-[#87938d]">Quantum circuit description</p>
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              onClick={handleApplyCode}
              className="rounded-lg bg-[#1c6b52] px-3 py-1.5 text-[10px] font-medium text-white transition hover:bg-[#165a42]"
            >
              Apply Code
            </button>
          )}
          <button
            onClick={handleCopyCode}
            className="rounded-lg border border-[#dbe2dd] px-3 py-1.5 text-[10px] font-medium text-[#5f6e66] transition hover:bg-[#eef3ef]"
          >
            Copy
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-[#e8caca] bg-[#fff5f5] px-3 py-2 text-[10px] text-[#a44b4b]">
          <strong>Syntax Error:</strong> {error}
        </div>
      )}

      <div className="flex-1 overflow-hidden rounded-lg border border-[#dbe2dd]">
        <Editor
          height="100%"
          defaultLanguage="plaintext"
          value={code}
          onChange={handleEditorChange}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 11,
            lineNumbers: 'on',
            readOnly: readOnly,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>

      {!readOnly && (
        <div className="mt-2 text-[9px] text-[#87938d]">
          Edit the code and click "Apply Code" to update the visual circuit
        </div>
      )}
    </div>
  )
}