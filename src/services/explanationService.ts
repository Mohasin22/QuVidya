import { postJson } from './apiClient'
import type { ExplanationRequest, ExplanationResponse } from '../types/explanation'

export async function explainCircuit(request: ExplanationRequest): Promise<ExplanationResponse> {
  const payload = await postJson<unknown>('/explain-circuit', request)
  if (!isExplanationResponse(payload)) throw new Error('The explanation service returned an invalid response.')
  return payload
}

function isExplanationResponse(value: unknown): value is ExplanationResponse {
  if (typeof value !== 'object' || value === null || !('success' in value) || !('explanation' in value)) return false
  const explanation = value.explanation
  return typeof value.success === 'boolean' && typeof explanation === 'object' && explanation !== null && 'overview' in explanation && 'gates' in explanation && 'stateChanges' in explanation && 'observedResult' in explanation && 'concepts' in explanation
}
