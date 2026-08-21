// login.js – TicketAI Login Page Logic

// Role selection visual update
function selectRole(radio) {
  document.querySelectorAll('.role-option').forEach(el => el.classList.remove('selected'));
  radio.closest('.role-option').classList.add('selected');
}

// Toggle password visibility
function togglePassword() {
  const pw = document.getElementById('password');
  const btn = document.querySelector('.toggle-pass');
  if (pw.type === 'password') {
    pw.type = 'text';
    btn.style.color = 'var(--primary)';
  } else {
    pw.type = 'password';
    btn.style.color = '';
  }
}

// Login handler
function handleLogin(event) {
  event.preventDefault();
  const btn = document.getElementById('login-btn');
  const role = document.querySelector('input[name="role"]:checked')?.value || 'user';

  btn.classList.add('btn-loading');
  btn.disabled = true;

  // Simulate auth — persist role for navbar
  setTimeout(() => {
    btn.classList.remove('btn-loading');
    btn.disabled = false;

    localStorage.setItem('ticketai_role', role);

    const routes = {
      user:  'user-dashboard.html',
      agent: 'agent-dashboard.html',
      admin: 'admin-dashboard.html',
    };
    window.location.href = routes[role] || 'user-dashboard.html';
  }, 1400);
}

// Input enhancement: add .has-value class
document.querySelectorAll('input').forEach(input => {
  input.addEventListener('input', () => {
    input.classList.toggle('has-value', input.value.length > 0);
  });
});
