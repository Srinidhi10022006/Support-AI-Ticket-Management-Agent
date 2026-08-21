/**
 * app.js – Global shared utilities
 * AI Support Ticket Management Agent
 *
 * Provides: showToast, animateCounter, initCommandPalette,
 *           initChatWidget, toggleDarkMode, renderRing,
 *           renderSkeletons, initDarkMode
 */

(function () {
  'use strict';

  /* ════════════════════════════════════════════════
     DARK MODE
  ════════════════════════════════════════════════ */
  window.initDarkMode = function () {
    const saved = localStorage.getItem('ticketai_theme');
    if (saved === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  window.toggleDarkMode = function () {
    const isLight = document.documentElement.classList.toggle('light');
    localStorage.setItem('ticketai_theme', isLight ? 'light' : 'dark');
    document.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: isLight ? 'light' : 'dark' } }));
  };

  window.normalizeTicketStatus = function (status) {
    const normalized = String(status || 'inprogress').toLowerCase().trim();
    return ['open', 'inprogress', 'waiting', 'resolved', 'closed'].includes(normalized) ? normalized : 'inprogress';
  };

  window.getTicketStatusMeta = function (ticket) {
    const status = window.normalizeTicketStatus(ticket && ticket.status);
    const labelMap = { open: 'Open', inprogress: 'In Progress', waiting: 'Waiting', resolved: 'Resolved', closed: 'Closed' };
    const progressMap = { open: 25, inprogress: 50, waiting: 75, resolved: 100, closed: 100 };
    return {
      status,
      label: labelMap[status] || 'In Progress',
      progress: progressMap[status] || 50,
      isResolved: ['resolved', 'closed'].includes(status),
    };
  };

  window.normalizeTicketCollection = function (tickets) {
    if (!Array.isArray(tickets)) return [];
    return tickets.map(ticket => {
      if (!ticket || typeof ticket !== 'object') return ticket;
      ticket.status = window.normalizeTicketStatus(ticket.status);
      return ticket;
    });
  };

  window.getStoredTickets = function () {
    try {
      const raw = JSON.parse(localStorage.getItem('ticketai_tickets') || '[]');
      return window.normalizeTicketCollection(raw);
    } catch (e) {
      return [];
    }
  };

  window.saveStoredTickets = function (tickets) {
    const normalized = window.normalizeTicketCollection(tickets);
    localStorage.setItem('ticketai_tickets', JSON.stringify(normalized));
    return normalized;
  };

  /**
   * relativeTime(isoString) → human-readable relative timestamp.
   * "Just now" (< 60 s) → "5 minutes ago" → "2 hours ago" → "3 days ago"
   * → "Jul 18, 2026" for anything older than 7 days.
   * Accepts an ISO date string, a JS Date, or a legacy string like "Just now"
   * (treated as "right now" so old data still renders gracefully).
   */
  window.relativeTime = function (value) {
    if (!value) return '—';
    // Legacy plain-string values stored before this fix
    if (typeof value === 'string' && !/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value; // return as-is ("Just now", "2 days ago", etc.)
    }
    let date;
    try { date = new Date(value); } catch (e) { return String(value); }
    if (isNaN(date.getTime())) return String(value);
    const diffMs  = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60)  return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60)  return diffMin + ' minute' + (diffMin === 1 ? '' : 's') + ' ago';
    const diffHr  = Math.floor(diffMin / 60);
    if (diffHr  < 24)  return diffHr  + ' hour'   + (diffHr  === 1 ? '' : 's') + ' ago';
    const diffDay = Math.floor(diffHr  / 24);
    if (diffDay < 7)   return diffDay + ' day'    + (diffDay === 1 ? '' : 's') + ' ago';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Auto-init
  window.initDarkMode();

  /* ════════════════════════════════════════════════
     TOAST NOTIFICATIONS
  ════════════════════════════════════════════════ */
  function getToastContainer() {
    let el = document.getElementById('app-toast-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'app-toast-container';
      el.className = 'toast-container';
      document.body.appendChild(el);
    }
    return el;
  }

  const TOAST_ICONS = {
    success: `<svg class="toast-icon" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M6.5 10l2.5 2.5 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    error:   `<svg class="toast-icon" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    info:    `<svg class="toast-icon" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M10 9v5M10 7v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    warning: `<svg class="toast-icon" viewBox="0 0 20 20" fill="none"><path d="M10 3L17.5 17H2.5L10 3z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 9v4M10 14.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  };
  const CLOSE_ICON = `<svg viewBox="0 0 20 20" fill="none"><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

  window.showToast = function (msg, type = 'info', duration = 4000) {
    const container = getToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      ${TOAST_ICONS[type] || TOAST_ICONS.info}
      <span class="toast-msg">${msg}</span>
      <button class="toast-close" aria-label="Dismiss">${CLOSE_ICON}</button>
    `;
    container.appendChild(toast);

    const close = toast.querySelector('.toast-close');
    function dismiss() {
      toast.classList.add('leaving');
      setTimeout(() => toast.remove(), 240);
    }
    close.addEventListener('click', dismiss);
    setTimeout(dismiss, duration);
  };

  /* ════════════════════════════════════════════════
     ANIMATED COUNTER (count-up on scroll)
  ════════════════════════════════════════════════ */
  window.animateCounter = function (el, target, duration = 1200, suffix = '') {
    const start = 0;
    const startTime = performance.now();
    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      el.textContent = current.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target.toLocaleString() + suffix;
    }
    requestAnimationFrame(update);
  };

  window.initCounters = function () {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.counted) {
          entry.target.dataset.counted = '1';
          const target = parseFloat(entry.target.dataset.count);
          const suffix = entry.target.dataset.suffix || '';
          const duration = parseInt(entry.target.dataset.duration || '1200');
          animateCounter(entry.target, target, duration, suffix);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => observer.observe(el));
  };

  /* ════════════════════════════════════════════════
     CONFIDENCE RINGS (SVG animated)
  ════════════════════════════════════════════════ */
  window.renderRing = function (container, pct, color, label, size = 'normal') {
    const circumference = size === 'lg' ? 202 : 157;
    const offset = circumference - (pct / 100) * circumference;
    const sizeClass = size === 'sm' ? 'ring-sm' : size === 'lg' ? 'ring-lg' : '';
    const dim = size === 'sm' ? 54 : size === 'lg' ? 90 : 70;
    container.innerHTML = `
      <div class="confidence-ring ${sizeClass}">
        <svg width="${dim}" height="${dim}" viewBox="0 0 36 36">
          <circle class="ring-track" cx="18" cy="18" r="15.9"/>
          <circle class="ring-fill" cx="18" cy="18" r="15.9"
            stroke="${color}"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${circumference}"
            data-offset="${offset}"/>
        </svg>
        <div class="ring-value">${pct}%</div>
      </div>
      ${label ? `<div class="ring-label">${label}</div>` : ''}
    `;
    // Animate after paint
    requestAnimationFrame(() => {
      const fill = container.querySelector('.ring-fill');
      if (fill) fill.style.strokeDashoffset = offset;
    });
  };

  window.initRings = function () {
    const rings = document.querySelectorAll('[data-ring]');
    rings.forEach(el => {
      const pct   = parseInt(el.dataset.ring);
      const color = el.dataset.ringColor || 'var(--accent)';
      const label = el.dataset.ringLabel || '';
      const size  = el.dataset.ringSize  || 'normal';
      renderRing(el, pct, color, label, size);
    });
  };

  /* ════════════════════════════════════════════════
     SKELETON LOADERS
  ════════════════════════════════════════════════ */
  window.renderSkeletons = function (container, count = 3, type = 'card') {
    container.innerHTML = Array.from({ length: count }, () => {
      if (type === 'card') {
        return `<div class="skeleton skeleton-card"></div>`;
      } else if (type === 'row') {
        return `<div class="skeleton skeleton-row"></div>`;
      } else {
        return `
          <div class="card" style="margin-bottom:10px;">
            <div class="skeleton skeleton-text w-60" style="margin-bottom:8px;"></div>
            <div class="skeleton skeleton-text w-80" style="margin-bottom:8px;"></div>
            <div class="skeleton skeleton-text w-40"></div>
          </div>`;
      }
    }).join('');
  };

  /* ════════════════════════════════════════════════
     COMMAND PALETTE (Ctrl/Cmd + K)
  ════════════════════════════════════════════════ */
  const PALETTE_DATA = {
    tickets: [
      { id: 'TKT-001', title: 'Cannot connect to office Wi-Fi', status: 'inprogress', priority: 'high',     href: 'agent-ticket-detail.html' },
      { id: 'TKT-002', title: 'Outlook not syncing emails',       status: 'open',       priority: 'medium',   href: 'agent-ticket-detail.html' },
      { id: 'TKT-005', title: 'VPN connection keeps dropping',    status: 'open',       priority: 'high',     href: 'agent-ticket-detail.html' },
      { id: 'TKT-009', title: 'Building B Wi-Fi completely down', status: 'open',       priority: 'critical', href: 'agent-ticket-detail.html' },
      { id: 'TKT-010', title: 'Payroll discrepancy for June',     status: 'inprogress', priority: 'high',     href: 'agent-ticket-detail.html' },
      { id: 'TKT-012', title: 'Slow internet — 3rd floor',        status: 'inprogress', priority: 'medium',   href: 'agent-ticket-detail.html' },
      { id: 'TKT-015', title: 'Cannot access shared drives (VPN)',status: 'open',       priority: 'high',     href: 'agent-ticket-detail.html' },
      { id: 'TKT-018', title: 'Leave application not processing', status: 'resolved',   priority: 'medium',   href: 'agent-ticket-detail.html' },
      { id: 'TKT-023', title: 'Payment gateway error on checkout',status: 'inprogress', priority: 'critical', href: 'agent-ticket-detail.html' },
    ],
    kb: [
      { id: 'KB-001', title: 'How to reset your password',             href: 'admin-kb.html' },
      { id: 'KB-002', title: 'VPN setup guide — Windows & Mac',        href: 'admin-kb.html' },
      { id: 'KB-003', title: 'Wi-Fi network driver troubleshooting',   href: 'admin-kb.html' },
      { id: 'KB-004', title: 'How to submit a payroll correction',     href: 'admin-kb.html' },
      { id: 'KB-005', title: 'Outlook sync issues — common fixes',     href: 'admin-kb.html' },
      { id: 'KB-006', title: 'Shared drive access permissions',        href: 'admin-kb.html' },
    ],
    pages: [
      { title: 'Agent dashboard',     href: 'agent-queue.html',      icon: 'grid' },
      { title: 'Admin analytics',     href: 'admin-analytics.html',  icon: 'chart' },
      { title: 'Knowledge base',      href: 'admin-kb.html',         icon: 'book' },
      { title: 'Customer dashboard',  href: 'user-dashboard.html',   icon: 'user' },
      { title: 'Live demo',           href: 'demo.html',             icon: 'chat' },
    ],
  };

  const ICONS = {
    ticket: `<svg viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 8h6M7 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    book:   `<svg viewBox="0 0 20 20" fill="none"><path d="M4 5a2 2 0 012-2h8a2 2 0 012 2v12l-6-3-6 3V5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    grid:   `<svg viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/></svg>`,
    chart:  `<svg viewBox="0 0 20 20" fill="none"><rect x="2" y="12" width="4" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="8" y="8" width="4" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="14" y="4" width="4" height="14" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>`,
    user:   `<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    chat:   `<svg viewBox="0 0 20 20" fill="none"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v9a1 1 0 01-1 1H6l-4 3V4z" stroke="currentColor" stroke-width="1.5"/></svg>`,
    search: `<svg viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M15 15l2.5 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  };

  function buildPaletteHTML() {
    return `
      <div class="cmd-overlay" id="cmd-overlay">
        <div class="cmd-palette" role="dialog" aria-label="Command palette" aria-modal="true">
          <div class="cmd-input-wrap">
            ${ICONS.search}
            <input type="text" id="cmd-input" placeholder="Search tickets, knowledge base, pages…" autocomplete="off" spellcheck="false" />
            <span style="font-size:.72rem;color:var(--text-muted);white-space:nowrap;font-family:monospace;background:var(--surface-2);border:1px solid var(--border);border-radius:4px;padding:1px 6px;">Esc</span>
          </div>
          <div class="cmd-results" id="cmd-results"></div>
          <div class="cmd-footer">
            <span><kbd class="cmd-key">↑↓</kbd> navigate</span>
            <span><kbd class="cmd-key">↵</kbd> open</span>
            <span><kbd class="cmd-key">Esc</kbd> close</span>
          </div>
        </div>
      </div>`;
  }

  function renderPaletteResults(query) {
    const q = query.trim().toLowerCase();
    const results = document.getElementById('cmd-results');
    if (!results) return;

    let html = '';

    // Pages (always shown when no query, or matched)
    const pages = q ? PALETTE_DATA.pages.filter(p => p.title.toLowerCase().includes(q)) : PALETTE_DATA.pages;
    if (pages.length) {
      html += `<div class="cmd-section-label">Pages</div>`;
      html += pages.map(p => `
        <div class="cmd-item" data-href="${p.href}" role="option">
          <div class="cmd-item-icon">${ICONS[p.icon] || ICONS.grid}</div>
          <div class="cmd-item-text">
            <div class="cmd-item-title">${p.title}</div>
          </div>
        </div>`).join('');
    }

    // Tickets
    const tickets = PALETTE_DATA.tickets.filter(t =>
      !q || t.id.toLowerCase().includes(q) || t.title.toLowerCase().includes(q)
    ).slice(0, 5);
    if (tickets.length) {
      html += `<div class="cmd-section-label">Tickets</div>`;
      html += tickets.map(t => `
        <div class="cmd-item" data-href="${t.href}?id=${t.id}" role="option">
          <div class="cmd-item-icon">${ICONS.ticket}</div>
          <div class="cmd-item-text">
            <div class="cmd-item-title">${t.title}</div>
            <div class="cmd-item-meta">${t.id}</div>
          </div>
          <span class="badge badge-${t.priority} cmd-item-badge">${cap(t.priority)}</span>
        </div>`).join('');
    }

    // Knowledge base
    const kb = PALETTE_DATA.kb.filter(k =>
      !q || k.id.toLowerCase().includes(q) || k.title.toLowerCase().includes(q)
    ).slice(0, 4);
    if (kb.length) {
      html += `<div class="cmd-section-label">Knowledge base</div>`;
      html += kb.map(k => `
        <div class="cmd-item" data-href="${k.href}" role="option">
          <div class="cmd-item-icon">${ICONS.book}</div>
          <div class="cmd-item-text">
            <div class="cmd-item-title">${k.title}</div>
            <div class="cmd-item-meta">${k.id}</div>
          </div>
        </div>`).join('');
    }

    if (!html) {
      html = `<div style="padding:32px;text-align:center;color:var(--text-muted);font-size:.875rem;">No results for "${query}"</div>`;
    }

    results.innerHTML = html;
    bindPaletteItems();
    setPaletteSelected(0);
  }

  let selectedIdx = 0;
  function setPaletteSelected(idx) {
    const items = document.querySelectorAll('.cmd-item');
    items.forEach((el, i) => el.classList.toggle('selected', i === idx));
    selectedIdx = idx;
  }

  function bindPaletteItems() {
    document.querySelectorAll('.cmd-item').forEach((item, i) => {
      item.addEventListener('mouseenter', () => setPaletteSelected(i));
      item.addEventListener('click', () => {
        const href = item.dataset.href;
        if (href) window.location.href = href;
        closePalette();
      });
    });
  }

  function openPalette() {
    const overlay = document.getElementById('cmd-overlay');
    if (!overlay) return;
    overlay.classList.add('open');
    const input = document.getElementById('cmd-input');
    if (input) { input.focus(); input.value = ''; }
    renderPaletteResults('');
  }

  function closePalette() {
    const overlay = document.getElementById('cmd-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  window.initCommandPalette = function () {
    if (document.getElementById('cmd-overlay')) return;
    document.body.insertAdjacentHTML('beforeend', buildPaletteHTML());

    document.getElementById('cmd-overlay').addEventListener('click', function (e) {
      if (e.target === this) closePalette();
    });

    document.getElementById('cmd-input').addEventListener('input', function () {
      renderPaletteResults(this.value);
      setPaletteSelected(0);
    });

    document.getElementById('cmd-input').addEventListener('keydown', function (e) {
      const items = document.querySelectorAll('.cmd-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setPaletteSelected(Math.min(selectedIdx + 1, items.length - 1));
        items[selectedIdx]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setPaletteSelected(Math.max(selectedIdx - 1, 0));
        items[selectedIdx]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        const sel = document.querySelector('.cmd-item.selected');
        if (sel) { window.location.href = sel.dataset.href; closePalette(); }
      } else if (e.key === 'Escape') {
        closePalette();
      }
    });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const overlay = document.getElementById('cmd-overlay');
        if (overlay && overlay.classList.contains('open')) closePalette();
        else openPalette();
      }
      if (e.key === 'Escape') closePalette();
    });
  };

  /* ════════════════════════════════════════════════
     FLOATING ASK AI ENTRY POINT
  ════════════════════════════════════════════════ */
  const CHAT_BOT_AVATAR = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="rgba(255,255,255,0.2)"/><path d="M8 10h8M8 14h5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="17" cy="14" r="3" fill="rgba(255,255,255,0.3)"/><path d="M15.5 14l1 1 2-2" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  function buildChatWidget() {
    return `
      <button class="chat-fab" id="chat-fab-btn" aria-label="Ask AI" title="Ask AI">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v11a2 2 0 01-2 2H6l-4 3V5z" fill="white" opacity="0.9"/>
        </svg>
      </button>`;
  }

  window.initChatWidget = function () {
    if (document.getElementById('chat-fab-btn')) return;
    document.body.insertAdjacentHTML('beforeend', buildChatWidget());

    const fab = document.getElementById('chat-fab-btn');
    if (fab) fab.addEventListener('click', () => window.openAskAI());
  };

  /* Public open / close API — both the FAB and any header button call these */
  window.openAskAI = function () {
    const target = new URL('demo.html', window.location.href);
    target.searchParams.set('mode', 'app');
    target.searchParams.set('return', location.pathname.replace(/^.*[\\/]/, ''));
    window.location.href = target.toString();
  };
  window.closeAskAI = function () {};

  /* ════════════════════════════════════════════════
     UTILITIES
  ════════════════════════════════════════════════ */
  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

  window.escHtml = escHtml;
  window.cap = cap;

  // STATUS_MAP shared across pages
  window.STATUS_MAP = {
    open:       'Open',
    inprogress: 'In Progress',
    waiting:    'Waiting',
    resolved:   'Resolved',
    closed:     'Closed',
  };

  /* ════════════════════════════════════════════════
     USER SESSION (localStorage)
  ════════════════════════════════════════════════ */
  const USER_KEY = 'ticketai_user';
  const ROLE_KEY = 'ticketai_role';

  window.getUser = function() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) || null; } catch(e) { return null; }
  };
  window.setUser = function(data) {
    const existing = window.getUser() || {};
    const merged = Object.assign({}, existing, data);
    localStorage.setItem(USER_KEY, JSON.stringify(merged));
    if (data.role) localStorage.setItem(ROLE_KEY, data.role);
    // Broadcast update so open pages can react
    document.dispatchEvent(new CustomEvent('userUpdated', { detail: merged }));
  };
  window.signOut = function() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ROLE_KEY);
    window.location.href = 'index.html';
  };
  window.getInitials = function(name) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
  };
  window.getUserDashboard = function(role) {
    const map = { customer:'user-dashboard.html', user:'user-dashboard.html',
                  agent:'agent-queue.html', admin:'admin-analytics.html' };
    return map[role] || 'user-dashboard.html';
  };

  // Apply stored user data to common page elements
  window.applyUserToPage = function() {
    const user = window.getUser();
    if (!user) return;
    const initials = window.getInitials(user.name || '');
    const name     = user.name || user.email || 'User';
    const role     = user.role || 'customer';
    const roleLabel = { customer:'Customer', user:'Customer', agent:'Support Agent', admin:'Administrator' }[role] || role;

    // Avatar initials
    document.querySelectorAll('[data-user-initials]').forEach(el => { el.textContent = initials; });
    // Name display
    document.querySelectorAll('[data-user-name]').forEach(el => { el.textContent = name; });
    // Role display
    document.querySelectorAll('[data-user-role]').forEach(el => { el.textContent = roleLabel; });
    // Email
    document.querySelectorAll('[data-user-email]').forEach(el => { el.textContent = user.email || ''; });
    // Welcome heading (first name)
    document.querySelectorAll('[data-user-firstname]').forEach(el => {
      el.textContent = (name.split(' ')[0]) || name;
    });
  };

  /* ════════════════════════════════════════════════
     AI CLASSIFICATION ENGINE (shared, mock)
  ════════════════════════════════════════════════ */

  // Category keyword rules
  const CAT_RULES = [
    { cat:'Network',  team:'IT Support Team',  keywords:['wifi','wi-fi','internet','network','vpn','connect','bandwidth','ethernet','router','switch','firewall','ip ','dns','latency','offline','building','floor'] },
    { cat:'Software', team:'Engineering Team', keywords:['software','crash','bug','error','app','application','install','update','slow','freeze','code','outlook','browser','os','windows','mac','linux','license'] },
    { cat:'Hardware', team:'IT Support Team',  keywords:['laptop','computer','screen','monitor','printer','keyboard','mouse','device','hardware','port','usb','battery','charger','dock'] },
    { cat:'Account',  team:'Billing Team',     keywords:['password','login','account','access','mfa','auth','permission','sign in','locked','reset','2fa','credential','sso'] },
    { cat:'Payment',  team:'Billing Team',     keywords:['payment','pay','invoice','charge','refund','billing','subscription','card','bank','transaction','dispute','receipt'] },
    { cat:'HR',       team:'HR Team',          keywords:['leave','salary','payroll','hr','holiday','vacation','pto','contract','onboard','off-board','benefit','promotion','resignation','policy'] },
  ];

  const PRIORITY_SIGNALS = {
    critical: ['critical','down','completely','outage','breach','hacked','emergency','production down','cannot work','can\'t work','blocked everyone','entire team'],
    high:     ['urgent','immediately','asap','still not','not working','broken','failed','nobody can','can\'t access','lost data','need help now'],
    medium:   ['slow','intermittent','sometimes','occasional','partially','degraded'],
    low:      ['question','wondering','curious','when possible','nice to have','minor','suggestion'],
  };

  const NEGATIVE_WORDS = ['frustrated','angry','terrible','worst','unacceptable','again','ridiculous','disappointing','horrible','awful','hate','still broken','always broken'];
  const POSITIVE_WORDS = ['thanks','great','good','appreciate','helpful','perfect','excellent','love'];

  window.classifyCategory = function(text) {
    const t = text.toLowerCase();
    let best = null, bestCount = 0;
    for (const rule of CAT_RULES) {
      const count = rule.keywords.filter(k => t.includes(k)).length;
      if (count > bestCount) { bestCount = count; best = rule; }
    }
    return best ? { cat: best.cat, team: best.team, confidence: Math.min(50 + bestCount * 12, 95) } : null;
  };

  window.scorePriority = function(text) {
    const t = text.toLowerCase();
    let sentiment = window.detectSentiment(text);
    for (const [p, words] of Object.entries(PRIORITY_SIGNALS)) {
      if (words.some(w => t.includes(w))) return p;
    }
    if (sentiment === 'negative') return 'high';
    return 'medium';
  };

  window.detectSentiment = function(text) {
    const t = text.toLowerCase();
    if (NEGATIVE_WORDS.some(w => t.includes(w))) return 'negative';
    if (POSITIVE_WORDS.some(w => t.includes(w))) return 'positive';
    return 'neutral';
  };

  // Mock knowledge base for resolution suggestions
  const KB_DATA = {
    Network: [
      { q:'Cannot connect to corporate Wi-Fi', conf_base:82, steps:['Go to Settings > Network & Internet > Wi-Fi','Forget the corporate network and reconnect','Enter your corporate credentials again','If prompted for a certificate, accept the corporate root CA','Restart your network adapter if the issue persists'] },
      { q:'VPN keeps disconnecting', conf_base:78, steps:['Update your VPN client to the latest version','Check UDP port 1194 and 443 are not blocked','Switch from Wi-Fi to a wired connection','Reduce MTU to 1350 in VPN advanced settings','Contact IT if issue persists after 3 attempts'] },
      { q:'Slow internet on a specific floor', conf_base:70, steps:['Run a speed test to confirm degradation','Check if it affects all devices or just yours','Restart your device network adapter','Report the floor/room number to IT — this may be an AP issue'] },
    ],
    Software: [
      { q:'Outlook not syncing emails', conf_base:80, steps:['File > Account Settings > Repair your account','Delete and recreate your Outlook profile','Clear the OST cache file','Check mailbox storage quota','Re-add account if issue persists'] },
      { q:'Application keeps crashing', conf_base:74, steps:['Update the application to the latest version','Clear application cache and temporary files','Reinstall the application','Check Windows Event Viewer for error codes','Raise a ticket with the error code if crash continues'] },
    ],
    Hardware: [
      { q:'Laptop screen issues', conf_base:72, steps:['Check display cable is firmly connected','Update display drivers','Test with an external monitor','Check for physical damage or dead pixels','Request hardware replacement if damage confirmed'] },
      { q:'Printer not working', conf_base:76, steps:['Verify printer is online in Windows > Printers','Delete stuck print jobs from the queue','Reinstall the printer driver','Ensure you\'re on the correct network','Contact IT for hardware inspection'] },
    ],
    Account: [
      { q:'Cannot log in to account', conf_base:88, steps:['Use the "Forgot password" link on the login page','Check your email for a password reset link (including Spam)','Ensure Caps Lock is off','If MFA is failing, contact IT to reset your authenticator','Account lockout resets after 30 minutes of inactivity'] },
    ],
    Payment: [
      { q:'Payment not processing', conf_base:75, steps:['Verify your card details and expiry date','Check your bank hasn\'t blocked the transaction','Try a different browser or clear cookies','Contact your bank to authorize the payment','Submit a billing support ticket with your invoice number'] },
    ],
    HR: [
      { q:'Leave application not processing', conf_base:79, steps:['Log in to the HR portal and check "My Requests" status','Ensure your manager has been notified','Resubmit if status shows "Draft"','HR processes leave requests within 2 business days','Email hr@company.com if still unresolved after 3 days'] },
    ],
  };
  window.KB_DATA = KB_DATA;

  window.suggestResolution = function(text, category) {
    const t = text.toLowerCase();
    const catEntries = KB_DATA[category] || [];
    let best = null, bestScore = 0;
    for (const entry of catEntries) {
      const qWords = entry.q.toLowerCase().split(/\W+/);
      const score = qWords.filter(w => w.length > 3 && t.includes(w)).length;
      if (score > bestScore) { bestScore = score; best = entry; }
    }
    if (!best && catEntries.length) best = catEntries[0]; // Fallback to first
    if (!best) return null;
    // Confidence: base adjusted by keyword overlap
    const conf = Math.min(best.conf_base + bestScore * 3, 95);
    return { steps: best.steps, confidence: conf, question: best.q };
  };

  /* ════════════════════════════════════════════════
     AUTO-INIT on DOMContentLoaded
  ════════════════════════════════════════════════ */
  function autoInit() {
    window.initDarkMode();
    initCounters();
    initRings();
    window.applyUserToPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  // Re-apply when user data changes
  document.addEventListener('userUpdated', () => window.applyUserToPage());

})();

