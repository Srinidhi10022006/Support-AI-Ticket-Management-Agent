/**
 * navbar.js – Shared authenticated navigation component
 * Renders a full role-aware top navbar on every authenticated page.
 *
 * Usage: <script src="js/navbar.js" data-page="dashboard"></script>
 *        Role is read from localStorage key "ticketpilot_role" (or "ticketai_role")
 */

(function () {
  'use strict';

  /* ─── Brand SVG ─────────────────────────────── */
  const BRAND_SVG = `<svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="34" height="34" rx="9" fill="#1D9E75"/><path d="M23.5 10.5L10.5 16.5L16.5 19.5L19.5 25.5L23.5 10.5Z" fill="white"/><path d="M16.5 19.5L23.5 10.5" stroke="#1D9E75" stroke-width="1.5" stroke-linecap="round"/></svg>`;

  /* ─── Nav configs per role ───────────────────── */
  // Returns nav config merged with live user data from localStorage
  function getNavConfig(role) {
    // Read stored user
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('ticketpilot_user') || localStorage.getItem('ticketai_user')); } catch(e) {}

    // Defaults per role (fallback if no real user stored)
    const DEFAULTS = {
      customer: { avatarBg:'linear-gradient(135deg,#1D9E75,#0EA5E9)', label:'Customer',       pillClass:'role-pill-customer', initials:'??', displayName:'Guest',        email:'' },
      user:     { avatarBg:'linear-gradient(135deg,#1D9E75,#0EA5E9)', label:'Customer',       pillClass:'role-pill-customer', initials:'??', displayName:'Guest',        email:'' },
      agent:    { avatarBg:'linear-gradient(135deg,#7C3AED,#6D28D9)', label:'Support Agent',  pillClass:'role-pill-agent',    initials:'AG', displayName:'Agent',        email:'' },
      admin:    { avatarBg:'linear-gradient(135deg,#DC2626,#B91C1C)', label:'Administrator',  pillClass:'role-pill-admin',    initials:'AD', displayName:'Admin',        email:'' },
    };
    const def = DEFAULTS[role] || DEFAULTS.customer;

    // Override with real data if available
    let displayName = def.displayName;
    let email       = def.email;
    let initials    = def.initials;
    if (stored && stored.name)  { displayName = stored.name; }
    if (stored && stored.email) { email = stored.email; }
    if (displayName !== def.displayName || stored) {
      const parts = displayName.trim().split(/\s+/);
      initials = parts.length >= 2
        ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase()
        : displayName.slice(0,2).toUpperCase();
    }

    const LINKS = {
      customer: [
        { href:'user-dashboard.html', page:'dashboard', label:'Dashboard',  icon:iconGrid() },
        { href:'my-tickets.html',     page:'mytickets', label:'My Tickets', icon:iconList(), badge:'3' },
        { href:'create-ticket.html',  page:'create',    label:'New Ticket', icon:iconPlus() },
      ],
      agent: [
        { href:'agent-queue.html',        page:'dashboard', label:'Dashboard',    icon:iconGrid() },
        { href:'agent-queue.html',        page:'queue',     label:'Ticket Queue', icon:iconList(), badge:'8' },
        { href:'chat.html',               page:'chat',      label:'Chat',         icon:iconChat() },
      ],
      admin: [
        { href:'admin-analytics.html', page:'analytics', label:'Analytics',      icon:iconChart() },
        { href:'agent-queue.html',     page:'queue',     label:'Ticket Queue',   icon:iconList(), badge:'47' },
        { href:'admin-kb.html',        page:'kb',        label:'Knowledge Base', icon:iconBook() },
        { href:'profile.html',         page:'users',     label:'Users',          icon:iconUser() },
      ],
    };
    const links = LINKS[role] || LINKS.customer;

    const EXTRAS = {
      customer: [
        { href:'profile.html',  label:'Profile',       icon:iconUser() },
        { href:'settings.html', label:'Settings',      icon:iconSettings() },
      ],
      agent: [
        { href:'profile.html',  label:'Profile',       icon:iconUser() },
        { href:'settings.html', label:'Settings',      icon:iconSettings() },
      ],
      admin: [
        { href:'profile.html',  label:'Admin Profile', icon:iconUser() },
        { href:'settings.html', label:'Settings',      icon:iconSettings() },
      ],
    };

    return {
      label:        def.label,
      avatarBg:     def.avatarBg,
      pillClass:    def.pillClass,
      initials,
      displayName,
      email,
      links,
      dropdownExtra: EXTRAS[role] || EXTRAS.customer,
    };
  }


  /* ─── SVG helpers ────────────────────────────── */
  function svg(path) { return `<svg viewBox="0 0 20 20" fill="none">${path}</svg>`; }
  function iconGrid()     { return svg('<rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/>'); }
  function iconList()     { return svg('<path d="M4 5h12M4 10h12M4 15h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'); }
  function iconChat()     { return svg('<path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v9a1 1 0 01-1 1H6l-4 3V4z" stroke="currentColor" stroke-width="1.5"/>'); }
  function iconUser()     { return svg('<circle cx="10" cy="7" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'); }
  function iconBell()     { return svg('<path d="M10 2a6 6 0 016 6c0 2-1 4-2 5l1 3H5l1-3C5 14 4 12 4 8a6 6 0 016-6z" stroke="currentColor" stroke-width="1.5"/><path d="M8 16a2 2 0 004 0" stroke="currentColor" stroke-width="1.5"/>'); }
  function iconSettings() { return svg('<circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.41 1.41M14.37 14.37l1.41 1.41M4.22 15.78l1.41-1.41M14.37 5.63l1.41-1.41" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'); }
  function iconChart()    { return svg('<rect x="2" y="12" width="4" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="8" y="8" width="4" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="14" y="4" width="4" height="14" rx="1" stroke="currentColor" stroke-width="1.5"/>'); }
  function iconBook()     { return svg('<path d="M4 5a2 2 0 012-2h8a2 2 0 012 2v12l-6-3-6 3V5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>'); }
  function iconLogout()   { return svg('<path d="M8 5H4a1 1 0 00-1 1v8a1 1 0 001 1h4M13 15l4-5-4-5M17 10H7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'); }
  function iconSearch()   { return svg('<circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M15 15l2.5 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'); }
  function iconChevron()  { return svg('<path d="M5 7l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'); }
  function iconSun()      { return svg('<circle cx="10" cy="10" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.41 1.41M14.37 14.37l1.41 1.41M4.22 15.78l1.41-1.41M14.37 5.63l1.41-1.41" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'); }
  function iconMoon()     { return svg('<path d="M17.5 12A7.5 7.5 0 018 2.5a7.5 7.5 0 100 15 7.5 7.5 0 009.5-5.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>'); }
  function iconPlus()     { return svg('<path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'); }

  /* ─── Detect current page ────────────────────── */
  function detectCurrentPage() {
    const src = document.currentScript;
    if (src && src.dataset.page) return src.dataset.page;
    const path = window.location.pathname.split('/').pop().replace('.html', '');
    if (path.includes('dashboard') || path.includes('queue'))    return 'dashboard';
    if (path.includes('analytics'))  return 'analytics';
    if (path.includes('create'))     return 'create';
    if (path.includes('my-tickets')) return 'mytickets';
    if (path.includes('tickets'))    return 'tickets';
    if (path.includes('chat'))       return 'chat';
    if (path.includes('kb') || path.includes('knowledge')) return 'kb';
    if (path.includes('admin'))      return 'analytics';
    return '';
  }

  /* ─── Build HTML ─────────────────────────────── */
  function buildNavbar(role, config, currentPage) {
    const linksHTML = config.links.map(l => {
      const isActive = l.page === currentPage;
      const badgeHTML = l.badge ? `<span class="nav-link-badge">${l.badge}</span>` : '';
      return `<a href="${l.href}" class="nav-link${isActive ? ' active' : ''}" aria-current="${isActive ? 'page' : 'false'}">
        ${l.icon}${l.label}${badgeHTML}
      </a>`;
    }).join('');

    const dropdownExtrasHTML = config.dropdownExtra.map(d =>
      `<a href="${d.href}" class="dropdown-item">${d.icon}${d.label}</a>`).join('');

    const drawerLinksHTML = config.links.map(l => {
      const isActive = l.page === currentPage;
      const badgeHTML = l.badge ? `<span class="nav-link-badge" style="margin-left:auto;">${l.badge}</span>` : '';
      return `<a href="${l.href}" class="drawer-nav-link${isActive ? ' active' : ''}">
        ${l.icon}${l.label}${badgeHTML}
      </a>`;
    }).join('');

    const drawerExtrasHTML = config.dropdownExtra.map(d =>
      `<a href="${d.href}" class="drawer-nav-link">${d.icon}${d.label}</a>`).join('');

    return `
<!-- TicketPilot Navbar -->
<nav class="ai-navbar" id="ai-navbar" role="navigation" aria-label="Main navigation">

  <!-- Hamburger -->
  <button class="navbar-hamburger" id="nav-hamburger" aria-label="Open menu" aria-expanded="false">
    <span class="hamburger-line"></span>
    <span class="hamburger-line"></span>
    <span class="hamburger-line"></span>
  </button>

  <!-- Brand -->
  <a href="${config.links[0]?.href || 'landing.html'}" class="navbar-brand" aria-label="TicketPilot Home">
    <div class="navbar-brand-icon" style="background:transparent;padding:0;">${BRAND_SVG}</div>
    <span class="navbar-brand-name">TicketPilot</span>
  </a>

  <!-- Desktop nav links -->
  <div class="navbar-links" role="menubar">${linksHTML}</div>

  <!-- Right section -->
  <div class="navbar-right">
    <!-- Search / command palette trigger -->
    <div class="navbar-search" id="navbar-cmd-trigger" title="Search (Ctrl+K)" role="button" tabindex="0">
      ${iconSearch()}
      <span style="font-size:.82rem;color:var(--text-muted);">Search…</span>
      <span class="navbar-cmd-hint">Ctrl K</span>
    </div>

    <!-- Notifications -->
    <button class="navbar-icon-btn" id="notif-btn" aria-label="Notifications" title="Notifications">
      ${iconBell()}
      <span class="navbar-notif-dot" aria-hidden="true"></span>
    </button>

    <!-- Dark mode toggle -->
    <button class="theme-toggle" id="theme-toggle-btn" aria-label="Toggle dark/light mode" title="Toggle theme">
      <span class="icon-sun">${iconSun()}</span>
      <span class="icon-moon">${iconMoon()}</span>
    </button>

    <!-- User dropdown -->
    <div class="navbar-user" id="navbar-user-trigger" role="button" aria-haspopup="true" aria-expanded="false" tabindex="0">
      <div class="navbar-avatar" style="background:${config.avatarBg};" aria-hidden="true">${config.initials}</div>
      <div class="navbar-user-text">
        <span class="navbar-user-name">${config.displayName}</span>
        <span class="navbar-user-role">${config.label}</span>
      </div>
      <span class="navbar-user-chevron">${iconChevron()}</span>

      <!-- Dropdown -->
      <div class="navbar-dropdown" id="user-dropdown" role="menu">
        <div class="dropdown-header">
          <div class="navbar-avatar" style="background:${config.avatarBg};width:34px;height:34px;font-size:.78rem;">${config.initials}</div>
          <div class="dropdown-header-info">
            <div class="dropdown-user-name">${config.displayName}</div>
            <div class="dropdown-user-email">${config.email}</div>
          </div>
        </div>
        <div class="dropdown-section">
          <div style="padding:6px 10px 8px;">
            <span class="role-pill ${config.pillClass}">${config.label}</span>
          </div>
          ${dropdownExtrasHTML}
          <div class="dropdown-divider"></div>
          <a href="index.html" class="dropdown-item dropdown-item-danger" id="logout-btn" role="menuitem">
            ${iconLogout()}Sign out
          </a>
        </div>
      </div>
    </div>
  </div>
</nav>

<!-- Mobile Drawer -->
<div class="navbar-mobile-drawer" id="mobile-drawer" aria-hidden="true">
  <div style="display:flex;align-items:center;gap:10px;padding:0 18px 16px;">
    <div class="navbar-avatar" style="background:${config.avatarBg};width:36px;height:36px;font-size:.82rem;">${config.initials}</div>
    <div>
      <div style="font-size:.875rem;font-weight:600;color:var(--text-primary);">${config.displayName}</div>
      <div style="font-size:.7rem;color:var(--text-muted);">${config.label}</div>
    </div>
  </div>
  <div class="drawer-divider"></div>
  <div class="drawer-section-label">Navigation</div>
  ${drawerLinksHTML}
  <div class="drawer-divider"></div>
  <div class="drawer-section-label">Account</div>
  ${drawerExtrasHTML}
  <div class="drawer-user-section">
    <a href="index.html" class="drawer-nav-link" style="color:#F87171;">
      ${iconLogout()}Sign out
    </a>
  </div>
</div>

<!-- Mobile overlay -->
<div class="navbar-overlay" id="nav-overlay"></div>`;
  }

  /* ─── Mount ──────────────────────────────────── */
  function mount() {
    const role = localStorage.getItem('ticketpilot_role') || localStorage.getItem('ticketai_role') || 'customer';
    const config = getNavConfig(role);
    const currentPage = detectCurrentPage();

    document.body.classList.add('has-navbar');

    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildNavbar(role, config, currentPage);
    while (wrapper.firstElementChild) {
      document.body.insertBefore(wrapper.firstElementChild, document.body.firstChild);
    }

    /* ── Dropdown ── */
    const trigger = document.getElementById('navbar-user-trigger');
    const dropdown = document.getElementById('user-dropdown');

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      trigger.classList.toggle('open', isOpen);
      trigger.setAttribute('aria-expanded', isOpen);
    });
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger.click(); }
      if (e.key === 'Escape') closeDropdown();
    });
    function closeDropdown() {
      dropdown.classList.remove('open');
      trigger.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }
    document.addEventListener('click', closeDropdown);
    dropdown.addEventListener('click', e => e.stopPropagation());

    /* ── Hamburger ── */
    const hamburger = document.getElementById('nav-hamburger');
    const drawer    = document.getElementById('mobile-drawer');
    const overlay   = document.getElementById('nav-overlay');

    function toggleDrawer(open) {
      hamburger.classList.toggle('open', open);
      drawer.classList.toggle('open', open);
      overlay.classList.toggle('open', open);
      drawer.setAttribute('aria-hidden', !open);
      hamburger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }
    hamburger.addEventListener('click', e => { e.stopPropagation(); toggleDrawer(!drawer.classList.contains('open')); });
    overlay.addEventListener('click', () => toggleDrawer(false));
    drawer.querySelectorAll('.drawer-nav-link').forEach(link => link.addEventListener('click', () => toggleDrawer(false)));

    /* ── Command palette trigger ── */
    const cmdTrigger = document.getElementById('navbar-cmd-trigger');
    if (cmdTrigger) {
      cmdTrigger.addEventListener('click', () => {
        if (window.initCommandPalette) { initCommandPalette(); }
        const overlay = document.getElementById('cmd-overlay');
        if (overlay) overlay.classList.add('open');
        const input = document.getElementById('cmd-input');
        if (input) { input.focus(); renderPaletteResultsIfAvailable(''); }
      });
      cmdTrigger.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cmdTrigger.click(); } });
    }

    function renderPaletteResultsIfAvailable(q) {
      // app.js handles this; just re-open
      const cmdOverlay = document.getElementById('cmd-overlay');
      if (!cmdOverlay) {
        if (window.initCommandPalette) initCommandPalette();
      } else {
        cmdOverlay.classList.add('open');
      }
    }

    /* ── Theme toggle ── */
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        if (window.toggleDarkMode) toggleDarkMode();
      });
    }

    /* ── Notifications ── */
    const notifBtn = document.getElementById('notif-btn');
    if (notifBtn) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        let panel = document.getElementById('notif-panel');
        if (panel) { panel.remove(); return; }
        panel = document.createElement('div');
        panel.id = 'notif-panel';
        panel.style.cssText = 'position:fixed;top:62px;right:16px;width:320px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);box-shadow:var(--shadow-lg);z-index:500;overflow:hidden;animation:fadeInUp .18s ease both;';
        panel.innerHTML = `<div style="padding:12px 16px;border-bottom:1px solid var(--border);font-size:.78rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.07em;">Notifications</div>
          <div style="padding:10px;display:flex;flex-direction:column;gap:6px;">
            <div style="padding:10px 12px;background:var(--surface-2);border-radius:var(--radius);font-size:.82rem;"><div style="font-weight:600;margin-bottom:3px;">TKT-001 updated</div><div style="color:var(--text-muted);font-size:.75rem;">Agent Mike Adams replied — 2 min ago</div></div>
            <div style="padding:10px 12px;background:var(--surface-2);border-radius:var(--radius);font-size:.82rem;"><div style="font-weight:600;margin-bottom:3px;">Ticket resolved</div><div style="color:var(--text-muted);font-size:.75rem;">TKT-018 marked resolved — 1h ago</div></div>
            <div style="padding:10px 12px;background:var(--surface-2);border-radius:var(--radius);font-size:.82rem;"><div style="font-weight:600;margin-bottom:3px;">AI resolved your question</div><div style="color:var(--text-muted);font-size:.75rem;">Password reset query — 3h ago</div></div>
          </div>
          <div style="padding:10px 16px;border-top:1px solid var(--border);text-align:center;"><a href="my-tickets.html" style="font-size:.78rem;color:var(--accent);font-weight:600;">View all activity</a></div>`;
        document.body.appendChild(panel);
        setTimeout(() => { document.addEventListener('click', () => panel.remove(), { once:true }); }, 50);
      });
    }

    /* ── Logout ── */
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', e => {
        e.preventDefault();
        if (window.signOut) { window.signOut(); }
        else { localStorage.removeItem('ticketpilot_role'); localStorage.removeItem('ticketpilot_user'); localStorage.removeItem('ticketai_role'); localStorage.removeItem('ticketai_user'); window.location.href = 'index.html'; }
      });
    }
  }

  /* ─── Boot ───────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

})();

