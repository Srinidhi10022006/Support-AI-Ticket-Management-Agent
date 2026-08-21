/**
 * js/api.js  —  TicketPilot Shared API Utility
 * ─────────────────────────────────────────
 * Exports (all on window.*):
 *   apiRequest(endpoint, method, body)  → fetch wrapper with JWT
 *   getCurrentUser()                    → read from localStorage
 *   setCurrentUser(userObj, token)      → persist login
 *   logout()                            → clear & redirect
 *   initSocket()                        → set up Socket.io client
 *   getSocket()                         → get the socket instance
 *
 * Storage keys  (consistent with existing app.js):
 *   ticketpilot_token / ticketai_token  — JWT string
 *   ticketpilot_user  / ticketai_user   — JSON user object  { id, name, email, role, department, … }
 *   ticketpilot_role  / ticketai_role   — role string
 */

(function () {
  'use strict';

  const API_BASE    = 'http://localhost:5000/api';
  const SOCKET_URL  = 'http://localhost:5000';
  const TOKEN_KEY   = 'ticketpilot_token';
  const USER_KEY    = 'ticketpilot_user';
  const ROLE_KEY    = 'ticketpilot_role';
  const LEGACY_TOKEN_KEY = 'ticketai_token';
  const LEGACY_USER_KEY  = 'ticketai_user';
  const LEGACY_ROLE_KEY  = 'ticketai_role';

  /* ────────────────────────────────────────────
     TOKEN HELPERS
  ──────────────────────────────────────────── */
  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY) || null;
  }

  /* ────────────────────────────────────────────
     API REQUEST
     endpoint : string like '/auth/login' or '/tickets'
     method   : 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
     body     : plain object  (serialized to JSON automatically)
  ──────────────────────────────────────────── */
  window.apiRequest = async function (endpoint, method = 'GET', body = null) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const options = { method, headers };
    if (body && method !== 'GET') options.body = JSON.stringify(body);

    let res;
    try {
      res = await fetch(API_BASE + endpoint, options);
    } catch (networkErr) {
      throw new Error('Network error — is the backend running on port 5000?');
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data.message || `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  };

  /* ────────────────────────────────────────────
     USER SESSION
  ──────────────────────────────────────────── */
  window.getCurrentUser = function () {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || localStorage.getItem(LEGACY_USER_KEY)) || null;
    } catch (e) {
      return null;
    }
  };

  /**
   * Persist user info + JWT after a successful login/register.
   * Also calls the existing app.js setUser() for compatibility.
   */
  window.setCurrentUser = function (user, token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(LEGACY_TOKEN_KEY, token);
    }
    localStorage.setItem(USER_KEY,  JSON.stringify(user));
    localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(user));
    localStorage.setItem(ROLE_KEY,  user.role || 'customer');
    localStorage.setItem(LEGACY_ROLE_KEY,  user.role || 'customer');
    // Keep backwards-compat with app.js
    if (window.setUser) window.setUser(user);
  };

  window.logout = function () {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
    localStorage.removeItem(LEGACY_ROLE_KEY);
    // Disconnect socket if active
    if (window._ticketaiSocket) {
      try { window._ticketaiSocket.disconnect(); } catch (_) {}
      window._ticketaiSocket = null;
    }
    window.location.href = 'index.html';
  };

  /* ────────────────────────────────────────────
     ROLE-BASED REDIRECT
  ──────────────────────────────────────────── */
  window.getDashboardUrl = function (role) {
    const map = {
      customer: 'user-dashboard.html',
      agent:    'agent-dashboard.html',
      admin:    'admin-dashboard.html',
    };
    return map[role] || 'user-dashboard.html';
  };

  /**
   * If the user is NOT logged in, redirect to login page.
   * Call at the top of every protected page.
   * Optionally pass allowed roles: requireAuth(['agent','admin'])
   */
  window.requireAuth = function (allowedRoles) {
    const token = getToken();
    const user  = window.getCurrentUser();
    if (!token || !user) {
      window.location.href = 'index.html';
      return null;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      window.location.href = window.getDashboardUrl(user.role);
      return null;
    }
    return user;
  };

  /* ────────────────────────────────────────────
     SOCKET.IO CLIENT
     Loaded via CDN if not already present.
     Safe to call multiple times — returns same socket.
  ──────────────────────────────────────────── */
  window.getSocket = function () {
    return window._ticketaiSocket || null;
  };

  window.initSocket = function () {
    if (window._ticketaiSocket) return window._ticketaiSocket;

    // Socket.io client must already be included via CDN on the page
    if (typeof io === 'undefined') {
      console.warn('[TicketPilot] Socket.io client not loaded. Add the CDN script before api.js.');
      return null;
    }

    const token = getToken();
    const socket = io(SOCKET_URL, {
      auth: { token: token ? 'Bearer ' + token : null },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[Socket.io] Connected:', socket.id);
      // Auto-join user room
      const u = window.getCurrentUser();
      if (u) {
        // Join department room if agent
        if (u.role === 'agent' && u.department) {
          socket.emit('dept:join', { department: u.department });
        }
      }
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.io] Connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.io] Disconnected:', reason);
    });

    window._ticketaiSocket = socket;
    return socket;
  };

  /* ────────────────────────────────────────────
     UTILITY: TICKET URL
  ──────────────────────────────────────────── */
  window.getTicketDetailUrl = function (ticket) {
    const user = window.getCurrentUser();
    if (!user) return '#';
    // Use MongoDB _id or ticketId  (whatever we have)
    const id = ticket._id || ticket.id || ticket.ticketId;
    if (user.role === 'agent' || user.role === 'admin') {
      return `agent-ticket-detail.html?id=${id}`;
    }
    return `ticket-detail.html?id=${id}`;
  };

  /* ────────────────────────────────────────────
     LOADING SKELETON HELPER
  ──────────────────────────────────────────── */
  window.showLoadingSkeleton = function (containerId, rows = 3) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = Array.from({ length: rows }, () => `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:18px;margin-bottom:10px;animation:skeleton-pulse 1.4s ease infinite;">
        <div style="height:14px;background:var(--surface-2);border-radius:4px;width:60%;margin-bottom:10px;"></div>
        <div style="height:12px;background:var(--surface-2);border-radius:4px;width:80%;margin-bottom:8px;"></div>
        <div style="height:12px;background:var(--surface-2);border-radius:4px;width:40%;"></div>
      </div>`).join('');
  };

  /* ────────────────────────────────────────────
     PRIORITY / STATUS BADGE CLASSES
  ──────────────────────────────────────────── */
  window.priorityBadgeClass = function (p) {
    const map = { Critical: 'badge-critical', High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
    return map[p] || 'badge-medium';
  };

  window.statusBadgeClass = function (s) {
    const map = {
      'Open':        'badge-open',
      'In Progress': 'badge-inprogress',
      'Waiting':     'badge-waiting',
      'Resolved':    'badge-resolved',
      'Closed':      'badge-closed',
    };
    return map[s] || 'badge-open';
  };

  window.slaClass = function (ticket) {
    if (!ticket.slaDeadline) return '';
    const remaining = new Date(ticket.slaDeadline) - Date.now();
    if (remaining < 0)           return 'badge-critical';  // breached
    if (remaining < 3600000)     return 'badge-high';      // < 1 hour
    if (remaining < 7200000)     return 'badge-medium';    // < 2 hours
    return 'badge-low';
  };

  window.slaLabel = function (ticket) {
    if (!ticket.slaDeadline) return '';
    const remaining = new Date(ticket.slaDeadline) - Date.now();
    if (remaining < 0) return 'Breached!';
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

})();
