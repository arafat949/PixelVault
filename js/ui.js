/* ════════════════════════════════════════
   PIXELVAULT — UI Module (Fixed)
   ════════════════════════════════════════ */

// Global item registry — avoids inline JSON entirely
const _cardRegistry = {};

const UI = (() => {
  // ── Pages ──
  function showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById('page-' + name);
    if (el) el.classList.add('active');
  }

  // ── Modals ──
  function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('open');
    requestAnimationFrame(() => el.classList.add('visible'));
  }
  function closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('visible');
    setTimeout(() => el.classList.remove('open'), 250);
  }

  // Close on backdrop click
  document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-backdrop')) closeModal(e.target.id);
  });
  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.open').forEach(m => closeModal(m.id));
      if (document.getElementById('lightbox').classList.contains('open')) Lightbox.close();
    }
  });

  // ── Toast ──
  function toast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span class="toast-icon"></span><span>${msg}</span>`;
    container.appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
  }

  // ── Tab switcher ──
  function switchTab(name, navEl) {
    document.querySelectorAll('.tab-view').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const tab = document.getElementById('tab-' + name);
    if (tab) tab.classList.add('active');
    if (navEl) navEl.classList.add('active');
  }

  // ── Skeleton loaders ──
  function showSkeletons(containerId, count = 12) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = Array(count).fill(
      `<div class="skeleton" style="aspect-ratio:4/3;border-radius:var(--r-lg);"></div>`
    ).join('');
  }

  // ── Build photo card — uses data-id, NO inline JSON ──
  function photoCard(item) {
    // Store item in registry by id
    _cardRegistry[item.id] = item;

    const faved    = Store.isFavorited(item.id);
    const isOwn    = item.source === 'user';
    const src      = item.source;
    const srcLabel = src === 'user' ? 'Mine' : src.charAt(0).toUpperCase() + src.slice(1);
    const id       = item.id;

    const editBtn   = isOwn ? `<button class="photo-action-btn" data-action="edit"   data-id="${id}" title="Edit">✏️</button>` : '';
    const deleteBtn = isOwn ? `<button class="photo-action-btn" data-action="delete" data-id="${id}" title="Delete">🗑️</button>` : '';

    return `
      <div class="photo-card" data-action="lightbox" data-id="${id}">
        <img src="${escapeAttr(item.thumb || item.url)}" alt="${escapeAttr(item.title)}" loading="lazy">
        <span class="photo-src-badge"><span class="badge badge-${src}">${srcLabel}</span></span>
        <div class="photo-overlay">
          <div class="photo-title">${escapeHTML(item.title)}</div>
          <div class="photo-actions">
            <button class="photo-action-btn" data-action="lightbox" data-id="${id}" title="View">🔍</button>
            <button class="photo-action-btn ${faved ? 'faved' : ''}" data-action="fav" data-id="${id}" title="Favorite">
              ${faved ? '♥' : '♡'}
            </button>
            <button class="photo-action-btn" data-action="download" data-id="${id}" title="Download">⬇️</button>
            ${editBtn}${deleteBtn}
          </div>
        </div>
      </div>`;
  }

  // ── Global delegated event handler ──
  document.addEventListener('click', e => {
    const btn  = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id     = btn.dataset.id;
    const item   = _cardRegistry[id];

    if (!item && action !== 'edit' && action !== 'delete') return;

    e.stopPropagation();

    switch (action) {
      case 'lightbox':
        Lightbox.open(item);
        break;
      case 'fav':
        const added = Store.toggleFavorite(item);
        btn.textContent = added ? '♥' : '♡';
        btn.classList.toggle('faved', added);
        toast(added ? 'Added to favorites ❤️' : 'Removed from favorites', added ? 'success' : 'info');
        App.updateStats();
        break;
      case 'download':
        _doDownload(item);
        break;
      case 'edit':
        Gallery.openEdit(id);
        break;
      case 'delete':
        Gallery.confirmDelete(id);
        break;
    }
  });

  function _doDownload(item) {
    const a = document.createElement('a');
    a.href     = item.dl || item.url;
    a.download = (item.title || 'photo').replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_') + '.jpg';
    a.target   = '_blank';
    a.rel      = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    Store.incrementDownloads();
    App.updateStats();
    toast('Download started! ⬇️', 'success');
  }

  // ── Helpers ──
  function escapeHTML(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function escapeAttr(s) { return escapeHTML(s); }

  return { showPage, openModal, closeModal, toast, switchTab, showSkeletons, photoCard, escapeHTML };
})();