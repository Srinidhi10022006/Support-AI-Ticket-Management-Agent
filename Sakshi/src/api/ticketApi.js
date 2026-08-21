import { http } from './http.js'

export async function createTicket(payload) {
  const { data } = await http.post('/tickets', payload)
  return data
}

export async function getMyTickets(userId) {
  const { data } = await http.get('/tickets/my', { params: { userId } })
  return data
}

export async function getAllTickets() {
  const { data } = await http.get('/tickets')
  return data
}

export async function updateTicketStatus(ticketId, payload) {
  const { data } = await http.put(`/tickets/${ticketId}/status`, payload)
  return data
}

export async function escalateToJira(ticketId) {
  console.log("[JIRA DEBUG] ticketApi.escalateToJira called", ticketId);
  const { data } = await http.post(`/jira/escalate/${ticketId}`)
  return data
}
