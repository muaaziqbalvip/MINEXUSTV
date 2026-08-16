/**
 * MINEXUS TV — LIVE CINEMETA / IMDb DATA ENGINE
 * 100% live data — no hardcoded catalog. Powered by the open Cinemeta (Stremio) addon API.
 * Docs: https://v3-cinemeta.strem.io
 */

const CINEMETA_BASE = 'https://v3-cinemeta.strem.io';
const META_IMG_BASE = 'https://images.metahub.space';

// In-memory cache so repeated navigation doesn't refetch the same data in one session
const _cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function _cachedFetch(url) {
  const hit = _cache.get(url);
  if (hit && (Date.now() - hit.time) < CACHE_TTL) return hit.data;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const data = await res.json();
  _cache.set(url, { data, time: Date.now() });
  return data;
}

function mapMetaSummary(meta, type) {
  return {
    id: meta.id,
    title: meta.name,
    type: type,
    year: (meta.releaseInfo || meta.year || '').toString().split('–')[0] || '—',
    rating: meta.imdbRating ? parseFloat(meta.imdbRating).toFixed(1) : null,
    genres: meta.genres || [],
    runtime: meta.runtime || (type === 'series' ? 'TV Series' : ''),
    poster: meta.poster || `${META_IMG_BASE}/poster/medium/${meta.id}/img`,
    backdrop: meta.background || meta.poster || `${META_IMG_BASE}/background/medium/${meta.id}/img`,
    synopsis: meta.description || ''
  };
}

const MinexusAPI = {

  /**
   * Catalog pages: top, popular / by genre. type = 'movie' | 'series'
   * catalogId options vary by Cinemeta; 'top' is the reliable general list.
   */
  async getCatalog(type, catalogId, genre, skip) {
    catalogId = catalogId || 'top';
    const params = [];
    if (genre) params.push(`genre=${encodeURIComponent(genre)}`);
    if (skip) params.push(`skip=${skip}`);

    const url = params.length
      ? `${CINEMETA_BASE}/catalog/${type}/${catalogId}/${params.join('&')}.json`
      : `${CINEMETA_BASE}/catalog/${type}/${catalogId}.json`;

    const data = await _cachedFetch(url);
    return (data.metas || []).map(m => mapMetaSummary(m, type));
  },

  async getTopMovies(skip) {
    return this.getCatalog('movie', 'top', null, skip);
  },

  async getTopSeries(skip) {
    return this.getCatalog('series', 'top', null, skip);
  },

  async getByGenre(type, genre, skip) {
    return this.getCatalog(type, 'top', genre, skip);
  },

  /**
   * Live search across both movies and series.
   * Cinemeta supports a `search=` extra on the top catalog.
   */
  async search(query) {
    if (!query || !query.trim()) return { movies: [], series: [] };
    const q = encodeURIComponent(query.trim());

    const [movieRes, seriesRes] = await Promise.all([
      _cachedFetch(`${CINEMETA_BASE}/catalog/movie/top/search=${q}.json`).catch(() => ({ metas: [] })),
      _cachedFetch(`${CINEMETA_BASE}/catalog/series/top/search=${q}.json`).catch(() => ({ metas: [] }))
    ]);

    let movies = (movieRes.metas || []).map(m => mapMetaSummary(m, 'movie'));
    let series = (seriesRes.metas || []).map(m => mapMetaSummary(m, 'series'));

    // Fallback: if the live search extra returns nothing (addon-side limitation),
    // do a local substring match against whatever top-catalog data is already cached
    // in this session, so the user still gets relevant hits instead of a dead end.
    if (movies.length === 0 && series.length === 0) {
      const needle = query.trim().toLowerCase();
      const localHits = [];
      _cache.forEach((entry, url) => {
        if (!url.includes('/catalog/')) return;
        const type = url.includes('/movie/') ? 'movie' : (url.includes('/series/') ? 'series' : null);
        if (!type) return;
        (entry.data.metas || []).forEach(m => {
          if (m.name && m.name.toLowerCase().includes(needle)) {
            localHits.push(mapMetaSummary(m, type));
          }
        });
      });
      movies = localHits.filter(h => h.type === 'movie');
      series = localHits.filter(h => h.type === 'series');
    }

    return { movies, series };
  },

  /**
   * Full meta detail for a single IMDb ID (includes cast, director, videos/episodes for series)
   */
  async getMeta(type, imdbId) {
    const url = `${CINEMETA_BASE}/meta/${type}/${imdbId}.json`;
    const data = await _cachedFetch(url);
    if (!data || !data.meta) throw new Error('Title not found');
    const meta = data.meta;

    return {
      id: meta.id,
      title: meta.name,
      type: type,
      year: (meta.releaseInfo || meta.year || '').toString(),
      rating: meta.imdbRating ? parseFloat(meta.imdbRating).toFixed(1) : null,
      genres: meta.genres || [],
      runtime: meta.runtime || (type === 'series' ? 'TV Series' : ''),
      director: Array.isArray(meta.director) ? meta.director.join(', ') : (meta.director || ''),
      cast: Array.isArray(meta.cast) ? meta.cast.slice(0, 6).join(', ') : (meta.cast || ''),
      writer: Array.isArray(meta.writer) ? meta.writer.join(', ') : (meta.writer || ''),
      poster: meta.poster || `${META_IMG_BASE}/poster/medium/${meta.id}/img`,
      backdrop: meta.background || meta.poster || `${META_IMG_BASE}/background/medium/${meta.id}/img`,
      synopsis: meta.description || meta.summary || '',
      videos: meta.videos || [], // episodes for series: [{season, episode, title, released, id}]
      country: meta.country || '',
      imdbId: meta.imdb_id || meta.id
    };
  },

  /**
   * Attempt to auto-detect whether an IMDb ID is a movie or series
   * (tries movie first, falls back to series).
   */
  async detectAndGetMeta(imdbId) {
    try {
      return await this.getMeta('movie', imdbId);
    } catch (e) {
      return await this.getMeta('series', imdbId);
    }
  },

  /** Group a series' `videos[]` array into { seasonNumber: [episodes] } */
  groupEpisodesBySeason(videos) {
    const bySeason = {};
    (videos || []).forEach(v => {
      const s = v.season != null ? v.season : 1;
      if (s === 0) return; // skip specials in main nav
      if (!bySeason[s]) bySeason[s] = [];
      bySeason[s].push(v);
    });
    Object.keys(bySeason).forEach(s => {
      bySeason[s].sort((a, b) => (a.episode || 0) - (b.episode || 0));
    });
    return bySeason;
  },

  posterUrl(imdbId) {
    return `${META_IMG_BASE}/poster/medium/${imdbId}/img`;
  },

  backdropUrl(imdbId) {
    return `${META_IMG_BASE}/background/medium/${imdbId}/img`;
  }
};
