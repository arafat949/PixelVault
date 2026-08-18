/* ════════════════════════════════════════
   PIXELVAULT — Auth Module
   ════════════════════════════════════════ */

const Auth = (() => {
  let _users = JSON.parse(localStorage.getItem('pv_users') || '[]');

  function _save() {
    localStorage.setItem('pv_users', JSON.stringify(_users));
  }

  function _hashPass(p) { return btoa(unescape(encodeURIComponent(p))); }

  function init() {
    // Seed demo account
    if (!_users.find(u => u.email === 'demo@pixelvault.app')) {
      _users.push({ id: 'u_demo', fname: 'Demo', lname: 'User', email: 'demo@pixelvault.app', pass: _hashPass('demo123'), joined: new Date().toISOString() });
      _save();
    }

    // Bind form submissions
    document.getElementById('login-form')?.addEventListener('submit', e => { e.preventDefault(); login(); });
    document.getElementById('signup-form')?.addEventListener('submit', e => { e.preventDefault(); signup(); });

    // Switch links
    document.querySelectorAll('[data-switch-auth]').forEach(el => {
      el.addEventListener('click', () => switchPanel(el.dataset.switchAuth));
    });

    // Restore session
    const saved = sessionStorage.getItem('pv_session');
    if (saved) {
      const u = _users.find(u => u.id === JSON.parse(saved).id);
      if (u) { App.loginUser(u); return; }
    }

    UI.showPage('landing');
  }

  function login() {
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const pass  = document.getElementById('login-pass').value;
    const err   = document.getElementById('login-error');
    err.className = 'alert alert-error';

    if (!email || !pass) { showAlert(err, 'Please fill in all fields.'); return; }

    const u = _users.find(u => u.email === email && u.pass === _hashPass(pass));
    if (!u) { showAlert(err, 'Invalid email or password.'); return; }

    sessionStorage.setItem('pv_session', JSON.stringify({ id: u.id }));
    UI.closeModal('auth-modal');
    App.loginUser(u);
  }

  function signup() {
    const fname = document.getElementById('su-fname').value.trim();
    const lname = document.getElementById('su-lname').value.trim();
    const email = document.getElementById('su-email').value.trim().toLowerCase();
    const pass  = document.getElementById('su-pass').value;
    const err   = document.getElementById('signup-error');
    err.className = 'alert alert-error';

    if (!fname || !email || !pass) { showAlert(err, 'Please fill in required fields.'); return; }
    if (pass.length < 6)           { showAlert(err, 'Password must be at least 6 characters.'); return; }
    if (_users.find(u => u.email === email)) { showAlert(err, 'An account with this email already exists.'); return; }

    const u = { id: 'u' + Date.now(), fname, lname, email, pass: _hashPass(pass), joined: new Date().toISOString() };
    _users.push(u);
    _save();

    sessionStorage.setItem('pv_session', JSON.stringify({ id: u.id }));
    UI.closeModal('auth-modal');
    App.loginUser(u);
  }

  function logout() {
    sessionStorage.removeItem('pv_session');
    UI.showPage('landing');
  }

  function switchPanel(mode) {
    document.getElementById('auth-panel-login').style.display  = mode === 'login'  ? 'block' : 'none';
    document.getElementById('auth-panel-signup').style.display = mode === 'signup' ? 'block' : 'none';
  }

  function showAlert(el, msg) {
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 4000);
  }

  return { init, login, signup, logout, switchPanel };
})();
