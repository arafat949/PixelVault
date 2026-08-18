/* ════════════════════════════════════════
   PIXELVAULT — App Modules
   ════════════════════════════════════════ */

/* ─────────────────────────────
   LIGHTBOX
   ───────────────────────────── */
const Lightbox = (() => {
  let _current = null;
  let _allItems = [];
  let _idx = 0;

  function open(item) {
    if (!item) return;
    _current = item;

    // Rebuild all-items list from current visible grid
    const cards = document.querySelectorAll('.tab-view.active .photo-card[data-id]');
    _allItems = Array.from(cards).map(c => _cardRegistry[c.dataset.id]).filter(Boolean);
    _idx = _allItems.findIndex(it => it.id === item.id);

    const lb = document.getElementById('lightbox');
    document.getElementById('lb-img').src = '';
    document.getElementById('lb-img').src = item.url;
    document.getElementById('lb-title').textContent = item.title || 'Untitled';
    const src = item.source === 'user' ? 'Your upload' : item.source;
    document.getElementById('lb-info').textContent =
      `${src}${item.photographer ? ' · ' + item.photographer : ''} · ${item.w || '?'}×${item.h || '?'}px`;

    const favBtn = document.getElementById('lb-fav-btn');
    favBtn.textContent = Store.isFavorited(item.id) ? '♥ Unfavorite' : '♡ Favorite';

    lb.classList.add('open');
  }

  function close() {
    document.getElementById('lightbox').classList.remove('open');
    _current = null;
  }

  function prev() {
    if (!_allItems.length) return;
    _idx = (_idx - 1 + _allItems.length) % _allItems.length;
    open(_allItems[_idx]);
  }
  function next() {
    if (!_allItems.length) return;
    _idx = (_idx + 1) % _allItems.length;
    open(_allItems[_idx]);
  }

  function download() {
    if (!_current) return;
    const a = document.createElement('a');
    a.href     = _current.dl || _current.url;
    a.download = (_current.title || 'photo').replace(/[^a-z0-9\s]/gi,'').replace(/\s+/g,'_') + '.jpg';
    a.target   = '_blank';
    a.rel      = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    Store.incrementDownloads();
    App.updateStats();
    UI.toast('Download started! ⬇️', 'success');
  }

  function fav() {
    if (!_current) return;
    const added = Store.toggleFavorite(_current);
    document.getElementById('lb-fav-btn').textContent = added ? '♥ Unfavorite' : '♡ Favorite';
    UI.toast(added ? 'Added to favorites ❤️' : 'Removed from favorites', added ? 'success' : 'info');
    App.updateStats();
  }

  return { open, close, prev, next, download, fav };
})();


/* ─────────────────────────────
   EXPLORE
   ───────────────────────────── */
const Explore = (() => {
  let _page    = 1;
  let _results = [];
  let _tag     = '';
  let _debounce;

  async function load(reset = true) {
    if (reset) { _page = 1; _results = []; }

    const q   = document.getElementById('explore-search').value.trim() || _tag || 'photography';
    const src = document.getElementById('explore-source').value;
    const grid = document.getElementById('explore-grid');

    if (reset) UI.showSkeletons('explore-grid', 12);

    let items = [];
    const sources = src === 'all'
      ? ['pexels', 'unsplash', 'pixabay']
      : src === 'mine' ? [] : [src];

    const apiItems = await API.fetchAll(q, _page, sources);
    items.push(...apiItems);

    if (src === 'all' || src === 'mine') {
      const uploads = Store.getUploads().filter(u => {
        const qLow = q.toLowerCase();
        return !qLow || u.title.toLowerCase().includes(qLow) || (u.tags || []).some(t => t.toLowerCase().includes(qLow));
      });
      items.push(...uploads);
    }

    // Remove dupes
    const seen = new Set();
    items = items.filter(it => { if (seen.has(it.id)) return false; seen.add(it.id); return true; });

    if (reset) _results = items;
    else _results.push(...items);

    renderGrid();
  }

  function renderGrid() {
    const grid = document.getElementById('explore-grid');
    if (!_results.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔍</div><p>No photos found. Try a different search or topic.</p></div>`;
      return;
    }
    grid.innerHTML = _results.map(it => UI.photoCard(it)).join('');
  }

  function loadMore() { _page++; load(false); }

  function setTag(t, el) {
    _tag = t;
    document.querySelectorAll('.tag-pill').forEach(p => p.classList.remove('active'));
    if (el) el.classList.add('active');
    load();
  }

  function debounce() {
    clearTimeout(_debounce);
    _debounce = setTimeout(() => load(), 380);
  }

  return { load, loadMore, setTag, debounce, get results() { return _results; } };
})();


/* ─────────────────────────────
   UPLOAD
   ───────────────────────────── */
const Upload = (() => {
  let _file = null;

  function bindZone() {
    const zone  = document.getElementById('drop-zone');
    const input = document.getElementById('file-input');
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('drag-over'); handleFile(e.dataTransfer.files[0]); });
    input.addEventListener('change', () => handleFile(input.files[0]));
  }

  function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { UI.toast('Please select an image file', 'error'); return; }
    if (file.size > 10 * 1024 * 1024)   { UI.toast('File too large (max 10 MB)', 'error'); return; }
    _file = file;
    const reader = new FileReader();
    reader.onload = e => {
      const prev = document.getElementById('img-preview');
      prev.src          = e.target.result;
      prev.style.display = 'block';
    };
    reader.readAsDataURL(file);
    // Auto-fill title from filename
    const nameEl = document.getElementById('up-title');
    if (!nameEl.value) nameEl.value = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  }

  function submit() {
    const title = document.getElementById('up-title').value.trim();
    const desc  = document.getElementById('up-desc').value.trim();
    const tags  = document.getElementById('up-tags').value.trim().split(',').map(t => t.trim()).filter(Boolean);
    const cat   = document.getElementById('up-cat').value;
    const prev  = document.getElementById('img-preview');

    if (!title)                  { UI.toast('Please enter a title', 'error'); return; }
    if (!prev || !prev.src || prev.style.display === 'none') { UI.toast('Please select an image', 'error'); return; }

    const bar    = document.getElementById('upload-progress');
    const fill   = document.getElementById('upload-fill');
    const status = document.getElementById('upload-status');
    bar.classList.add('show');
    status.textContent = 'Uploading…';

    let pct = 0;
    const iv = setInterval(() => {
      pct += Math.random() * 20 + 8;
      if (pct >= 100) {
        pct = 100;
        clearInterval(iv);
        _finalize({ title, desc, tags, cat, url: prev.src });
      }
      fill.style.width = Math.min(pct, 100) + '%';
    }, 60);
  }

  function _finalize({ title, desc, tags, cat, url }) {
    const img = new Image();
    img.onload = () => {
      const item = {
        id:     'up' + Date.now(),
        title, desc, tags, cat, url,
        thumb:  url,
        dl:     url,
        source: 'user',
        w:      img.naturalWidth  || 1200,
        h:      img.naturalHeight || 800,
        uploadedAt: new Date().toISOString(),
        views: 0, downloads: 0,
      };
      Store.addUpload(item);
      App.updateStats();

      // Reset
      document.getElementById('up-title').value = '';
      document.getElementById('up-desc').value  = '';
      document.getElementById('up-tags').value  = '';
      document.getElementById('img-preview').style.display = 'none';
      document.getElementById('img-preview').src = '';
      document.getElementById('upload-progress').classList.remove('show');
      document.getElementById('upload-fill').style.width = '0%';
      document.getElementById('upload-status').textContent = '';
      document.getElementById('file-input').value = '';
      _file = null;

      UI.toast('Photo uploaded successfully!', 'success');
      document.querySelector('[data-tab="gallery"]').click();
    };
    img.src = url;
  }

  return { bindZone, handleFile, submit };
})();


/* ─────────────────────────────
   GALLERY (My Uploads)
   ───────────────────────────── */
const Gallery = (() => {
  function render() {
    const grid  = document.getElementById('gallery-grid');
    const q     = document.getElementById('gallery-search').value.toLowerCase();
    const cat   = document.getElementById('gallery-cat').value;

    const items = Store.getUploads().filter(it => {
      const matchQ   = !q   || it.title.toLowerCase().includes(q) || (it.tags || []).some(t => t.includes(q));
      const matchCat = !cat || it.cat === cat;
      return matchQ && matchCat;
    });

    if (!items.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🗂️</div><p>No uploads yet. Head to Upload to add your first photo.</p></div>`;
      return;
    }
    grid.innerHTML = items.map(it => UI.photoCard(it)).join('');
  }

  function openEdit(id) {
    const it = Store.getUploads().find(u => u.id === id);
    if (!it) return;
    document.getElementById('edit-id').value    = id;
    document.getElementById('edit-title').value = it.title;
    document.getElementById('edit-desc').value  = it.desc || '';
    document.getElementById('edit-tags').value  = (it.tags || []).join(', ');
    document.getElementById('edit-cat').value   = it.cat || 'Other';
    UI.openModal('edit-modal');
  }

  function saveEdit() {
    const id = document.getElementById('edit-id').value;
    Store.updateUpload(id, {
      title: document.getElementById('edit-title').value.trim(),
      desc:  document.getElementById('edit-desc').value.trim(),
      tags:  document.getElementById('edit-tags').value.split(',').map(t => t.trim()).filter(Boolean),
      cat:   document.getElementById('edit-cat').value,
    });
    UI.closeModal('edit-modal');
    render();
    UI.toast('Photo info updated', 'success');
  }

  function confirmDelete(id) {
    if (!confirm('Delete this photo permanently?')) return;
    Store.deleteUpload(id);
    App.updateStats();
    render();
    UI.toast('Photo deleted', 'info');
  }

  return { render, openEdit, saveEdit, confirmDelete };
})();


/* ─────────────────────────────
   FAVORITES
   ───────────────────────────── */
const Favorites = (() => {
  function render() {
    const grid = document.getElementById('favorites-grid');
    const favs = Store.getFavorites();
    if (!favs.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">❤️</div><p>No favorites yet. Heart any photo while browsing to save it here.</p></div>`;
      return;
    }
    grid.innerHTML = favs.map(it => UI.photoCard(it)).join('');
  }
  return { render };
})();


/* ─────────────────────────────
   GLOBAL HELPERS
   ───────────────────────────── */
// (download is now handled by UI delegated handler and Lightbox.download)


/* ─────────────────────────────
   APP (Bootstrap)
   ───────────────────────────── */
const App = (() => {
  let _user = null;

  function loginUser(u) {
    _user = u;
    Store.setUser(u.id);

    // Fill UI
    const fullName = u.fname + (u.lname ? ' ' + u.lname : '');
    document.getElementById('topbar-username').textContent  = fullName;
    document.getElementById('sb-user-name').textContent    = fullName;
    document.getElementById('sb-user-email').textContent   = u.email;
    const initials = (u.fname[0] + (u.lname ? u.lname[0] : '')).toUpperCase();
    document.querySelectorAll('.dyn-avatar').forEach(el => el.textContent = initials);

    updateStats();
    UI.showPage('dashboard');

    // Load explore
    Explore.load();
    renderOverviewRecent();
  }

  function updateStats() {
    document.getElementById('stat-uploads').textContent  = Store.getUploads().length;
    document.getElementById('stat-favs').textContent     = Store.getFavorites().length;
    document.getElementById('stat-dl').textContent       = Store.getDownloads();

    // Update gallery badge in sidebar
    const badge = document.getElementById('gallery-badge');
    if (badge) badge.textContent = Store.getUploads().length || '';
  }

  function renderOverviewRecent() {
    const grid  = document.getElementById('overview-recent-grid');
    const items = Store.getUploads().slice(0, 8);
    if (!items.length) { grid.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;grid-column:1/-1">No uploads yet.</p>`; return; }
    grid.innerHTML = items.map(it => UI.photoCard(it)).join('');
  }

  function init() {
    Auth.init();
    Upload.bindZone();

    // Tab nav
    document.querySelectorAll('[data-tab]').forEach(el => {
      el.addEventListener('click', () => {
        UI.switchTab(el.dataset.tab, el);
        const tab = el.dataset.tab;
        if (tab === 'gallery')   Gallery.render();
        if (tab === 'favorites') Favorites.render();
        if (tab === 'overview')  { updateStats(); renderOverviewRecent(); }
      });
    });

    // Lightbox buttons
    document.getElementById('lb-close-btn').addEventListener('click', () => Lightbox.close());
    document.getElementById('lb-prev').addEventListener('click', () => Lightbox.prev());
    document.getElementById('lb-next').addEventListener('click', () => Lightbox.next());
    document.getElementById('lb-dl-btn').addEventListener('click', () => Lightbox.download());
    document.getElementById('lb-fav-btn').addEventListener('click', () => Lightbox.fav());
    document.getElementById('lightbox').addEventListener('click', function(e) {
      if (e.target === this) Lightbox.close();
    });

    // Lightbox keyboard
    document.addEventListener('keydown', e => {
      if (!document.getElementById('lightbox').classList.contains('open')) return;
      if (e.key === 'ArrowLeft')  Lightbox.prev();
      if (e.key === 'ArrowRight') Lightbox.next();
    });
  }

  return { loginUser, updateStats, renderOverviewRecent, init };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());