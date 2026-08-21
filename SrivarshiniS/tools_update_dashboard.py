from pathlib import Path
import re

path = Path(r'c:\Ai ticket management System\user-dashboard.html')
text = path.read_text(encoding='utf-8')
pattern = re.compile(r'<script src="js/app\.js"></script>\s*<script src="js/sidebar\.js"></script>\s*<script>.*?</script>\s*<script src="js/navbar\.js" data-page="dashboard"></script>', re.S)
replacement = '''<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
<script src="js/api.js"></script>
<script src="js/app.js"></script>
<script src="js/sidebar.js"></script>
<script>
const currentUser = window.requireAuth(['customer']);
if (!currentUser) {
  throw new Error('Unauthorized');
}

let allTickets = [];
let activeFilter = 'all';
let searchQuery = '';

function updateStats(tickets) {
  document.getElementById('stat-total').textContent = tickets.length;
  document.getElementById('stat-open').textContent = tickets.filter(ticket => !['resolved', 'closed'].includes(window.normalizeTicketStatus(ticket.status))).length;
  document.getElementById('stat-inprogress').textContent = tickets.filter(ticket => window.normalizeTicketStatus(ticket.status) === 'inprogress').length;
  document.getElementById('stat-resolved').textContent = tickets.filter(ticket => ['resolved', 'closed'].includes(window.normalizeTicketStatus(ticket.status))).length;
  const badge = document.getElementById('nav-tickets-badge');
  if (badge) badge.textContent = tickets.filter(ticket => !['resolved', 'closed'].includes(window.normalizeTicketStatus(ticket.status))).length;
}

function renderTickets() {
  const list = document.getElementById('ticket-list');
  const empty = document.getElementById('empty-state');
  const lc = searchQuery.toLowerCase();
  const tickets = allTickets.filter(ticket => {
    const meta = window.getTicketStatusMeta(ticket);
    const matchFilter = activeFilter === 'all' || meta.status === activeFilter;
    const matchSearch = !lc || (ticket.title || '').toLowerCase().includes(lc) || (ticket.ticketId || '').toLowerCase().includes(lc) || (ticket.category || '').toLowerCase().includes(lc);
    return matchFilter && matchSearch;
  });

  if (!tickets.length) {
    list.innerHTML = '';
    const heading = document.getElementById('empty-heading');
    const sub = document.getElementById('empty-sub');
    if (allTickets.length === 0) {
      heading.textContent = 'No tickets yet';
      sub.textContent = 'You haven’t created any tickets yet. Start a conversation with the AI assistant or create a ticket directly.';
    } else {
      heading.textContent = 'No matching tickets';
      sub.textContent = 'Try selecting a different filter above, or clear your search.';
    }
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = tickets.map(ticket => {
    const meta = window.getTicketStatusMeta(ticket);
    const st = meta.status;
    const stLabel = meta.label;
    const progress = meta.progress;
    const isResolved = meta.isResolved;
    const id = ticket.ticketId || ticket._id;
    const subject = ticket.title || 'Untitled ticket';
    const ts = window.relativeTime ? window.relativeTime(ticket.updatedAt || ticket.createdAt) : '';
    return `
    <div class="ticket-card" data-priority="${(ticket.priority || 'medium').toLowerCase()}" onclick="location.href='ticket-detail.html?id=${ticket._id}'">
      <div class="ticket-card-top">
        <span class="ticket-card-id">${id}</span>
        <span class="badge badge-category">${ticket.category || 'General'}</span>
        <span class="badge badge-${st} ${st === 'inprogress' ? 'pulse-badge' : ''}">${stLabel}</span>
        <div class="ticket-card-actions">
          ${isResolved
            ? `<span class="badge" style="background:var(--status-resolved-bg);color:var(--status-resolved-text);border:1px solid var(--status-resolved-border);">✓ Resolved</span>`
            : `<button class="btn btn-success btn-sm" onclick="event.stopPropagation();markTicketSolved('${ticket._id}', event)">Mark Solved</button>`}
        </div>
        <span style="font-size:.72rem;color:var(--text-muted);">${ts}</span>
      </div>
      <div class="ticket-card-subject">${subject}</div>
      <div class="mini-progress" style="margin-top:10px;">
        <div class="mini-progress-bar"><div class="mini-progress-fill" style="width:${progress}%"></div></div>
        <span style="font-size:.68rem;color:var(--text-muted);white-space:nowrap;">${progress}%</span>
      </div>
      <div class="mini-progress-stages">
        <span>Open</span><span>Assigned</span><span>In progress</span><span>Resolved</span>
      </div>
    </div>`;
  }).join('');

  updateStats(tickets);
}

function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll('.filter-pill').forEach(button => button.classList.remove('active'));
  const pill = document.getElementById('pill-' + filter);
  if (pill) pill.classList.add('active');
  renderTickets();
}

function filterTickets() {
  searchQuery = document.getElementById('ticket-search').value;
  renderTickets();
}

async function loadTickets() {
  try {
    const data = await window.apiRequest('/tickets', 'GET');
    allTickets = data.tickets || [];
    renderTickets();
  } catch (error) {
    window.showToast?.(error.message || 'Could not load tickets', 'error');
  }
}

async function markTicketSolved(id, event) {
  if (event) event.stopPropagation();
  try {
    await window.apiRequest(`/tickets/${id}/customer-resolve`, 'PATCH');
    await loadTickets();
    window.showToast?.('🎉 Ticket marked as resolved!', 'success');
  } catch (error) {
    window.showToast?.(error.message || 'Could not update ticket', 'error');
  }
}

function openChatWidget() {
  window.openAskAI();
}

const socket = window.initSocket();
if (socket) {
  socket.on('ticket:statusChanged', loadTickets);
  socket.on('ticket:newReply', loadTickets);
}

window.addEventListener('focus', loadTickets);
initChatWidget();
loadTickets();
</script>
<script src="js/navbar.js" data-page="dashboard"></script>'''
new_text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit(f'expected 1 replacement, got {count}')
path.write_text(new_text, encoding='utf-8')
print('updated user-dashboard.html')
