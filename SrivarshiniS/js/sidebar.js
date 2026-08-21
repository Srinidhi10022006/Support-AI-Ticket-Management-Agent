/**
 * sidebar.js – Hydrates every sidebar's user card and wires
 * Profile / Settings / Sign-out links from the shared ticketai_user session.
 *
 * Include AFTER app.js on any page that has a static sidebar:
 *   <script src="js/sidebar.js"></script>
 */
(function () {
  'use strict';

  /* ── read stored user ── */
  function getUser() {
    try { return JSON.parse(localStorage.getItem('ticketai_user')) || null; }
    catch (e) { return null; }
  }

  function getInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  const ROLE_LABELS = {
    customer : 'Customer',
    user     : 'Customer',
    agent    : 'Support Agent',
    admin    : 'Administrator',
  };

  /* ── hydrate sidebar user card ── */
  function hydrateSidebar() {
    const user = getUser();
    const role = localStorage.getItem('ticketai_role') || 'customer';

    const name     = (user && user.name)  || 'Guest';
    const email    = (user && user.email) || '';
    const initials = getInitials(name);
    const roleLabel = ROLE_LABELS[role] || role;

    // Avatar initials
    document.querySelectorAll('.sidebar-user .avatar, .sidebar-user [data-user-initials]')
      .forEach(el => { el.textContent = initials; });

    // Name
    document.querySelectorAll('.sidebar-user-name, [data-user-name]')
      .forEach(el => { el.textContent = name; });

    // Role label
    document.querySelectorAll('.sidebar-user-role, [data-user-role]')
      .forEach(el => { el.textContent = roleLabel; });

    // Topbar mini-avatar initials (non-navbar pages that have their own)
    document.querySelectorAll('.avatar.avatar-sm:not([data-no-hydrate])')
      .forEach(el => { el.textContent = initials; });

    // Welcome heading (first name only)
    document.querySelectorAll('[data-user-firstname]')
      .forEach(el => { el.textContent = name.split(' ')[0] || name; });

    // Inline "Welcome back, Jane" headings (look for the pattern)
    document.querySelectorAll('h2').forEach(h => {
      if (/Welcome back,\s+\w/i.test(h.textContent)) {
        h.textContent = 'Welcome back, ' + (name.split(' ')[0] || name);
      }
    });
  }

  /* ── wire sidebar navigation links ── */
  function wireSidebarLinks() {
    // Profile links (any nav-item that contains "Profile")
    document.querySelectorAll('.nav-item, .sidebar-nav a').forEach(a => {
      const text = a.textContent.trim();
      if (text === 'Profile') {
        a.href = 'profile.html';
        a.removeAttribute('onclick');
      }
      if (text === 'Settings') {
        a.href = 'settings.html';
        a.removeAttribute('onclick');
      }
    });

    // Sign-out links — use window.logout() from api.js for full cleanup (socket + storage)
    document.querySelectorAll('a[href="index.html"]').forEach(a => {
      const text = a.textContent.trim();
      if (text === 'Sign out' || text.toLowerCase().includes('sign out')) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          if (window.logout) {
            window.logout();
          } else {
            localStorage.removeItem('ticketai_token');
            localStorage.removeItem('ticketai_user');
            localStorage.removeItem('ticketai_role');
            window.location.href = 'index.html';
          }
        });
      }
    });
  }

  /* ── listen for user data changes from profile saves ── */
  function listenForUpdates() {
    document.addEventListener('userUpdated', hydrateSidebar);
    window.addEventListener('storage', function (e) {
      if (e.key === 'ticketai_user') hydrateSidebar();
    });
  }

  /* ── boot ── */
  function boot() {
    hydrateSidebar();
    wireSidebarLinks();
    listenForUpdates();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
