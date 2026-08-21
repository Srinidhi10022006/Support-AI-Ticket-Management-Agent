import { http } from './http.js'

export async function loginUser(payload) {
  const { data } = await http.post('/auth/login', payload)
  return data
}