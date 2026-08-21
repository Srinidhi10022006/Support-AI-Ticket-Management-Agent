/**
 * interactions.js – Micro-interaction layer
 * Purely additive: no existing classes/IDs renamed or removed.
 * Adds: ripple, char counters, page fade-in, loading state polish,
 *       button press, form focus, skeleton rows, live search flash.
 */
(function () {
  'use strict';

  /* ── 1. Page content fade-in on load ── */
  function initPageFadeIn() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.28s ease';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.style.opacity = '1';
      });
    });
  }

  /* ── 2. Button ripple effect ── */
  function createRipple(e) {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top  - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    ripple.style.cssText = `
      position:absolute;width:${size}px;height:${size}px;
      left:${x}px;top:${y}px;
      border-radius:50%;
      background:rgba(255,255,255,0.25);
      transform:scale(0);
      pointer-events:none;
      animation:rippleAnim 0.5s ease-out both;`;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  function initRipples() {
    // Inject keyframe once
    if (!document.getElementById('ripple-style')) {
      const style = document.createElement('style');
      style.id = 'ripple-style';
      style.textContent = `
        @keyframes rippleAnim {
          to { transform: scale(2.5); opacity: 0; }
        }
        .btn { overflow: hidden; position: relative; }`;
      document.head.appendChild(style);
    }
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', createRipple);
    });
  }

  /* ── 3. Character counter ── */
  function initCharCounters() {
    // Attach to any textarea or input with maxlength
    document.querySelectorAll('textarea[maxlength], input[maxlength]').forEach(el => {
      const max = parseInt(el.getAttribute('maxlength'), 10);
      if (!max) return;

      // Look for an existing sibling hint, or create counter element
      let counter = el.parentElement.querySelector('.char-counter');
      if (!counter) {
        counter = document.createElement('span');
        counter.className = 'char-counter';
        el.insertAdjacentElement('afterend', counter);
      }

      function updateCounter() {
        const len = el.value.length;
        const remaining = max - len;
        const pct = len / max;
        counter.textContent = `${len} / ${max}`;
        counter.classList.remove('warn', 'danger');
        if (pct >= 1) {
          counter.classList.add('danger');
        } else if (pct >= 0.80) {
          counter.classList.add('warn');
        }
      }

      el.addEventListener('input', updateCounter);
      updateCounter(); // init
    });
  }

  /* ── 4. Input focus label lift / icon color ── */
  function initInputFeedback() {
    document.querySelectorAll('.form-group input, .form-group textarea, .form-group select').forEach(el => {
      const wrapper = el.closest('.input-wrapper');
      el.addEventListener('focus', () => {
        if (wrapper) wrapper.classList.add('focused');
      });
      el.addEventListener('blur', () => {
        if (wrapper) wrapper.classList.remove('focused');
      });
    });

    // Inject focused style once
    if (!document.getElementById('focus-style')) {
      const style = document.createElement('style');
      style.id = 'focus-style';
      style.textContent = `
        .input-wrapper.focused { border-radius: var(--radius); }
        .input-wrapper.focused .input-icon { color: var(--primary); }`;
      document.head.appendChild(style);
    }
  }

  /* ── 5. Enhance login form submit — loading state ── */
  function initLoginFormPolish() {
    const form = document.getElementById('login-form') || document.querySelector('form[onsubmit*="handleLogin"]');
    if (!form) return;
    form.addEventListener('submit', function () {
      const btn = document.getElementById('login-btn');
      if (btn && !btn.classList.contains('btn-loading')) {
        btn.classList.add('btn-loading');
        btn.disabled = true;
      }
    });
  }

  /* ── 6. Enhance ticket submit — loading state ── */
  function initTicketFormPolish() {
    const form = document.getElementById('create-form');
    if (!form) return;
    form.addEventListener('submit', function () {
      const btn = document.getElementById('submit-btn');
      if (btn && !btn.classList.contains('btn-loading')) {
        btn.classList.add('btn-loading');
        btn.disabled = true;
      }
    });
  }

  /* ── 7. Table row keyboard nav (Enter = click) ── */
  function initTableA11y() {
    document.querySelectorAll('tbody tr[onclick]').forEach(row => {
      row.setAttribute('tabindex', '0');
      row.setAttribute('role', 'link');
      row.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          row.click();
        }
      });
    });
  }

  /* ── 8. Skeleton loader for async table fills ── */
  // Show 5 skeleton rows until data arrives in any tbody that starts empty
  function initSkeletons() {
    document.querySelectorAll('tbody[id]').forEach(tbody => {
      if (tbody.innerHTML.trim() === '') {
        const cols = tbody.closest('table')?.querySelectorAll('thead th').length || 6;
        tbody.innerHTML = Array.from({length: 5}, () =>
          `<tr>${Array.from({length: cols}, () =>
            `<td><span class="skeleton skeleton-text" style="width:${60+Math.random()*30|0}%"></span></td>`
          ).join('')}</tr>`
        ).join('');
      }
    });
  }

  /* ── 9. Smooth badge pop when status/priority badges change ── */
  function initBadgePop() {
    // Use a MutationObserver to detect badge text/class changes and apply the pop animation
    const observer = new MutationObserver(mutations => {
      mutations.forEach(m => {
        const el = m.target.nodeType === 1 ? m.target : m.target.parentElement;
        if (el && el.classList.contains('badge')) {
          el.classList.remove('badge-pop');
          void el.offsetWidth; // reflow
          el.classList.add('badge-pop');
        }
      });
    });
    document.querySelectorAll('.badge').forEach(badge => {
      observer.observe(badge, { characterData: true, childList: true, attributes: true, subtree: true });
    });
  }

  /* ── 10. Filter/select live-feedback flash ── */
  function initSelectFeedback() {
    document.querySelectorAll('select').forEach(sel => {
      sel.addEventListener('change', function () {
        this.style.transition = 'background 0.2s';
        this.style.background = '#EFF6FF';
        setTimeout(() => { this.style.background = ''; }, 350);
      });
    });
  }

  /* ── 11. Live search input — debounce visual feedback ── */
  function initSearchFeedback() {
    document.querySelectorAll('input[type="search"]').forEach(input => {
      let timer;
      input.addEventListener('input', function () {
        clearTimeout(timer);
        this.style.borderColor = 'var(--primary)';
        timer = setTimeout(() => { this.style.borderColor = ''; }, 600);
      });
    });
  }

  /* ── 12. Button keyboard press visual ── */
  function initButtonKeyPress() {
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          btn.style.transform = 'scale(0.96)';
        }
      });
      btn.addEventListener('keyup', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ── 13. Role option card keyboard select (login) ── */
  function initRoleCardA11y() {
    document.querySelectorAll('.role-option').forEach(label => {
      label.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const radio = label.querySelector('input[type="radio"]');
          if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', {bubbles: true}));
          }
        }
      });
      label.setAttribute('tabindex', '0');
    });
  }

  /* ── 14. Chat message - scroll to bottom smoothly ── */
  function initChatScroll() {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;
    const observer = new MutationObserver(() => {
      messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
    });
    observer.observe(messages, { childList: true, subtree: true });
  }

  /* ── 15. SLA timer color pulse when < 30min ── */
  function initSLATimerPulse() {
    const timer = document.getElementById('sla-timer');
    if (!timer) return;

    // Inject pulse keyframe once
    if (!document.getElementById('sla-pulse-style')) {
      const style = document.createElement('style');
      style.id = 'sla-pulse-style';
      style.textContent = `
        @keyframes slaPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        .sla-urgent { animation: slaPulse 1.2s ease-in-out infinite; }`;
      document.head.appendChild(style);
    }

    const originalUpdate = window.updateSLA;
    if (typeof originalUpdate === 'function') {
      window.updateSLA = function () {
        originalUpdate();
        const seconds = parseInt(timer.textContent?.replace(/:/g,'')) || 0;
        if (seconds < 1800) { // < 30 minutes
          timer.classList.add('sla-urgent');
        }
      };
    }
  }

  /* ── 16. Smooth page-body reveal for multi-column layouts ── */
  function initSectionReveal() {
    if (!('IntersectionObserver' in window)) return;
    const style = document.createElement('style');
    style.textContent = `
      .reveal-ready { opacity: 0; transform: translateY(18px); transition: opacity 0.4s ease, transform 0.4s ease; }
      .reveal-visible { opacity: 1; transform: translateY(0); }`;
    document.head.appendChild(style);

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('reveal-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });

    // Mark cards inside .page-body for reveal (skip first viewport)
    document.querySelectorAll('.page-body > .card, .page-body > div > .card').forEach((card, i) => {
      if (i > 1) {
        card.classList.add('reveal-ready');
        io.observe(card);
      }
    });
  }

  /* ── 17. Step tab active class smooth switch ── */
  function initStepTabTransitions() {
    // step tabs already have inline styles set by JS;
    // inject a transitioning helper
    document.querySelectorAll('.step-tab').forEach(tab => {
      tab.style.transition = 'background 0.22s, color 0.22s';
    });
  }

  /* ── 18. Priority bar row entrance animation ── */
  function initPriorityBarAnimate() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes barGrow { from { width: 0 !important; } }
      .priority-bar-row div div div { animation: barGrow 0.7s cubic-bezier(0.4,0,0.2,1) both; }`;
    document.head.appendChild(style);
  }

  /* ── Boot ── */
  function init() {
    initPageFadeIn();
    initRipples();
    initCharCounters();
    initInputFeedback();
    initLoginFormPolish();
    initTicketFormPolish();
    initTableA11y();
    initBadgePop();
    initSelectFeedback();
    initSearchFeedback();
    initButtonKeyPress();
    initRoleCardA11y();
    initChatScroll();
    initSLATimerPulse();
    initSectionReveal();
    initStepTabTransitions();
    initPriorityBarAnimate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
