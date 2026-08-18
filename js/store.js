/* ════════════════════════════════════════
   PIXELVAULT — Store (Data Layer)
   ════════════════════════════════════════ */

const Store = (() => {
  let _uid = null;

  function setUser(id) { _uid = id; }

  // ── Uploads ──
  function getUploads() {
    const all = JSON.parse(localStorage.getItem('pv_uploads') || '{}');
    return all[_uid] || [];
  }
  function saveUploads(arr) {
    const all = JSON.parse(localStorage.getItem('pv_uploads') || '{}');
    all[_uid] = arr;
    localStorage.setItem('pv_uploads', JSON.stringify(all));
  }
  function addUpload(item) {
    const arr = getUploads();
    arr.unshift(item);
    saveUploads(arr);
    return arr;
  }
  function updateUpload(id, changes) {
    const arr = getUploads();
    const idx = arr.findIndex(u => u.id === id);
    if (idx === -1) return arr;
    arr[idx] = { ...arr[idx], ...changes };
    saveUploads(arr);
    return arr;
  }
  function deleteUpload(id) {
    const arr = getUploads().filter(u => u.id !== id);
    saveUploads(arr);
    return arr;
  }

  // ── Favorites ──
  function getFavorites() {
    const all = JSON.parse(localStorage.getItem('pv_favs') || '{}');
    return all[_uid] || [];
  }
  function saveFavorites(arr) {
    const all = JSON.parse(localStorage.getItem('pv_favs') || '{}');
    all[_uid] = arr;
    localStorage.setItem('pv_favs', JSON.stringify(all));
  }
  function isFavorited(id) {
    return getFavorites().some(f => f.id === id);
  }
  function toggleFavorite(item) {
    const arr = getFavorites();
    const idx = arr.findIndex(f => f.id === item.id);
    if (idx === -1) { arr.push(item); saveFavorites(arr); return true; }
    else            { arr.splice(idx, 1); saveFavorites(arr); return false; }
  }

  // ── Downloads count ──
  let _downloads = 0;
  function incrementDownloads() { _downloads++; return _downloads; }
  function getDownloads() { return _downloads; }

  return {
    setUser,
    getUploads, addUpload, updateUpload, deleteUpload,
    getFavorites, isFavorited, toggleFavorite,
    incrementDownloads, getDownloads,
  };
})();
