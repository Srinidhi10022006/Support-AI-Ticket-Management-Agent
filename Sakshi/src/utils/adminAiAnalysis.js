export function buildAdminAnalysisInput(ticket) {
  if (!ticket) return null

  return {
    subject: ticket.subject ?? '',
    issueType: ticket.issueType ?? '',
    description: ticket.description ?? '',
    priority: ticket.priority ?? '',
    employeeName: ticket.employeeName ?? ticket.userName ?? '',
    department: ticket.department ?? '',
  }
}
