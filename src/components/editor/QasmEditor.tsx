import Editor from '@monaco-editor/react'
import { Check, Code2, Copy } from 'lucide-react'
import { useState } from 'react'
import { useCircuitStore } from '../../store/circuitStore'
import { generateOpenQasm } from '../../services/qasmService'

export function QasmEditor() {
  const circuit = useCircuitStore((state) => state.circuit)
  const [copied, setCopied] = useState(false)
  const code = generateOpenQasm(circuit)

  const copyCode = async () => {
    await navigator.clipboard?.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return <section className="overflow-hidden rounded-2xl border border-[#dbe2dd] bg-[#1c2925] text-white"><div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6"><div className="flex items-center gap-2"><Code2 size={16} className="text-[#a8cbbc]" /><div><p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#a8cbbc]">OpenQASM</p><h2 className="mt-1 text-[14px] font-extrabold">Read-only code</h2></div></div><button className="grid size-7 place-items-center rounded-md text-[#a8cbbc] transition hover:bg-white/10 hover:text-white" type="button" aria-label="Copy OpenQASM" onClick={copyCode}>{copied ? <Check size={14} /> : <Copy size={14} />}</button></div><div className="h-[360px] bg-[#15211d]"><Editor height="100%" language="plaintext" theme="vs-dark" value={code} options={{ readOnly: true, minimap: { enabled: false }, lineNumbers: 'on', fontSize: 12, fontFamily: 'DM Mono, monospace', padding: { top: 16, bottom: 16 }, scrollBeyondLastLine: false, wordWrap: 'off', renderLineHighlight: 'none' }} /></div></section>
}
