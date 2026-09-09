import { postJson } from './apiClient'
import type { AnalysisRequest, AnalysisResponse } from '../types/analysis'

export async function analyzeCircuit(request: AnalysisRequest): Promise<AnalysisResponse> {
  const payload = await postJson<unknown>('/analyze-circuit', request)
  if (!isAnalysisResponse(payload)) throw new Error('The analysis service returned an invalid response.')
  return payload
}

function isAnalysisResponse(value: unknown): value is AnalysisResponse {
  if (typeof value !== 'object' || value === null || !('success' in value) || !('issues' in value) || !Array.isArray(value.issues)) return false
  return typeof value.success === 'boolean' && value.issues.every((issue) => typeof issue === 'object' && issue !== null && 'issue' in issue && 'explanation' in issue && 'suggestedImprovement' in issue)
}
