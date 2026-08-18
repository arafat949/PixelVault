/* ════════════════════════════════════════
   PIXELVAULT — API Module
   ════════════════════════════════════════ */

const API = (() => {
  const PEXELS_KEY   = 'KQ8bNcNx7MTyhK8HK1Ox0vNv08qr2b6eDZmQ4b6EOx05SnvLhhOwRKRv';
  const UNSPLASH_KEY = 'jn-T6glFXgkV1bLrhWi3C2esUoLouJN4Yx8I-6gQIfY';
  const PIXABAY_KEY  = '54943998-e240b795d08bba5f86f0b26d0';

  async function pexels(query, page = 1, perPage = 16) {
    try {
      const r = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`,
        { headers: { Authorization: PEXELS_KEY } }
      );
      const d = await r.json();
      return (d.photos || []).map(p => ({
        id:           'px' + p.id,
        title:        p.alt || 'Pexels Photo',
        url:          p.src.large,
        thumb:        p.src.medium,
        dl:           p.src.original,
        w:            p.width,
        h:            p.height,
        source:       'pexels',
        photographer: p.photographer,
        color:        p.avg_color,
      }));
    } catch { return []; }
  }

  async function unsplash(query, page = 1, perPage = 16) {
    try {
      const r = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&client_id=${UNSPLASH_KEY}`
      );
      const d = await r.json();
      return (d.results || []).map(p => ({
        id:           'un' + p.id,
        title:        p.alt_description || p.description || 'Unsplash Photo',
        url:          p.urls.regular,
        thumb:        p.urls.small,
        dl:           p.urls.full,
        w:            p.width,
        h:            p.height,
        source:       'unsplash',
        photographer: p.user?.name,
        color:        p.color,
      }));
    } catch { return []; }
  }

  async function pixabay(query, page = 1, perPage = 16) {
    try {
      const r = await fetch(
        `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=${perPage}&page=${page}&safesearch=true`
      );
      const d = await r.json();
      return (d.hits || []).map(p => ({
        id:           'pb' + p.id,
        title:        p.tags || 'Pixabay Photo',
        url:          p.webformatURL,
        thumb:        p.previewURL,
        dl:           p.largeImageURL || p.webformatURL,
        w:            p.webformatWidth,
        h:            p.webformatHeight,
        source:       'pixabay',
        photographer: p.user,
        color:        null,
      }));
    } catch { return []; }
  }

  async function fetchAll(query, page = 1, sources = ['pexels', 'unsplash', 'pixabay']) {
    const tasks = [];
    if (sources.includes('pexels'))   tasks.push(pexels(query, page));
    if (sources.includes('unsplash')) tasks.push(unsplash(query, page));
    if (sources.includes('pixabay'))  tasks.push(pixabay(query, page));

    const results = await Promise.allSettled(tasks);
    const items = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    // Interleave sources for visual variety
    return interleave(items, sources.length);
  }

  function interleave(items, groupCount) {
    if (groupCount <= 1) return items;
    // Round-robin by index
    const groups = Array.from({ length: groupCount }, () => []);
    items.forEach((it, i) => groups[i % groupCount].push(it));
    const out = [];
    const maxLen = Math.max(...groups.map(g => g.length));
    for (let i = 0; i < maxLen; i++) {
      groups.forEach(g => { if (g[i]) out.push(g[i]); });
    }
    return out;
  }

  return { pexels, unsplash, pixabay, fetchAll };
})();
