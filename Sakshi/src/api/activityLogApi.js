import { http } from './http.js'

export async function getAllActivityLogs() {
  const { data } = await http.get('/activity-logs')
  return data
}
