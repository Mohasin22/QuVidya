import { AlertCircle, CheckCircle2, LoaderCircle, ScanSearch, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { analyzeCircuit } from '../../services/analysisService'
import { explainCircuit } from '../../services/explanationService'
import { useCircuitStore } from '../../store/circuitStore'
import type { AnalysisIssue } from '../../types/analysis'
import type { ExplanationContent } from '../../types/explanation'

export function AIExplanation() {
  const circuit = useCircuitStore((state) => state.circuit)
  const simulation = useCircuitStore((state) => state.simulation)
  const [explanation, setExplanation] = useState<ExplanationContent>()
  const [issues, setIssues] = useState<AnalysisIssue[]>()
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string>()

  const generateExplanation = async () => {
    setIsLoading(true)
    setError(undefined)
    try {
      const response = await explainCircuit({ circuit, gatesUsed: [...new Set(circuit.operations.map((operation) => operation.gateType))], simulationResults: simulation.result, learnerLevel: 'beginner' })
      setExplanation(response.explanation)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to generate an explanation.')
    } finally {
      setIsLoading(false)
    }
  }

  const runAnalysis = async () => {
    setIsAnalyzing(true)
    setError(undefined)
    try {
      const response = await analyzeCircuit({ circuit, learnerLevel: 'beginner' })
      setIssues(response.issues)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to analyze the circuit.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return <section className="relative overflow-hidden rounded-2xl bg-[#193d32] p-5 text-white sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><Sparkles size={18} className="mb-5 text-[#f4bd58]" /><p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#a8cbbc]">AI learning assistant</p><h2 className="mt-2 text-[17px] font-extrabold leading-6">Understand and improve your circuit.</h2></div><div className="flex gap-2"><button className="flex shrink-0 items-center gap-2 rounded-lg border border-[#a8cbbc]/40 px-3 py-2 text-[10px] font-extrabold text-[#d7e8dc] transition hover:border-white hover:bg-white/10 disabled:cursor-wait disabled:opacity-70" type="button" onClick={runAnalysis} disabled={isAnalyzing}>{isAnalyzing ? <LoaderCircle size={13} className="animate-spin" /> : <ScanSearch size={13} />}{isAnalyzing ? 'Analyzing...' : 'Analyze circuit'}</button><button className="flex shrink-0 items-center gap-2 rounded-lg bg-[#f4d490] px-3 py-2 text-[10px] font-extrabold text-[#193d32] transition hover:bg-white disabled:cursor-wait disabled:opacity-70" type="button" onClick={generateExplanation} disabled={isLoading}>{isLoading ? <LoaderCircle size={13} className="animate-spin" /> : <Sparkles size={13} />}{isLoading ? 'Generating...' : 'Generate explanation'}</button></div></div>{error && <div className="mt-5 flex items-start gap-2 rounded-lg border border-[#efb4a9]/40 bg-[#602f2b]/40 p-3 text-[10px] leading-5 text-[#ffd5ce]"><AlertCircle size={14} className="mt-0.5 shrink-0" />{error}</div>}{issues && <AnalysisResults issues={issues} />}{explanation && <div className="mt-6 grid gap-5 border-t border-white/15 pt-5 text-[11px] leading-5 text-[#d7e8dc] lg:grid-cols-2"><ExplanationBlock title="What it does" text={explanation.overview} /><ExplanationBlock title="Gate guide" text={explanation.gates.join(' ')} /><ExplanationBlock title="State changes" text={explanation.stateChanges} /><ExplanationBlock title="Observed result" text={explanation.observedResult} /><div className="lg:col-span-2"><p className="mb-1 font-extrabold text-[#f4d490]">Key concepts</p><ul className="list-disc space-y-1 pl-4">{explanation.concepts.map((concept) => <li key={concept}>{concept}</li>)}</ul></div></div>}{!issues && !explanation && <p className="mt-3 max-w-xl text-[11px] leading-5 text-[#c0d8ca]">Analyze the circuit for common mistakes or generate a plain-language explanation of its gates and results.</p>}</section>
}

function AnalysisResults({ issues }: { issues: AnalysisIssue[] }) {
  return <div className="mt-6 border-t border-white/15 pt-5"><div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#a8cbbc]">Circuit analysis</p><span className="font-mono text-[10px] text-[#c0d8ca]">{issues.length} {issues.length === 1 ? 'finding' : 'findings'}</span></div>{issues.length === 0 ? <div className="flex items-center gap-2 rounded-lg bg-[#245846] p-3 text-[11px] text-[#d7e8dc]"><CheckCircle2 size={15} className="text-[#a8d1b2]" /> No issues found. The circuit is ready for simulation.</div> : <div className="grid gap-3 lg:grid-cols-2">{issues.map((item, index) => <article key={`${item.issue}-${index}`} className="rounded-xl border border-white/15 bg-white/[0.06] p-3 text-[10px] leading-5"><div className="flex items-start justify-between gap-2"><h3 className="font-extrabold text-[#fff1c8]">{item.issue}</h3><span className="shrink-0 rounded-full bg-[#f4d490]/15 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[#f4d490]">{item.severity}</span></div><p className="mt-2 text-[#d7e8dc]"><strong className="text-white">Explanation:</strong> {item.explanation}</p><p className="mt-2 text-[#c0d8ca]"><strong className="text-[#f4d490]">Suggested improvement:</strong> {item.suggestedImprovement}</p></article>)}</div>}</div>
}

function ExplanationBlock({ title, text }: { title: string; text: string }) {
  return <div><p className="mb-1 font-extrabold text-[#f4d490]">{title}</p><p>{text}</p></div>
}
