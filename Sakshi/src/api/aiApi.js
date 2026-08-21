import { http } from './http.js'

export async function analyzeIssue(payload) {
  const { data } = await http.post('/ai/analyze', payload)
  return data
}

