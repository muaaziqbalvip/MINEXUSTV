/**
 * MINEXUS TV — REALTIME DATABASE LAYER
 * Handles: Watchlist, Watch History, Top Users leaderboard, User counters
 *
 * Realtime DB structure:
 * users/{uid}/profile         -> { displayName, email, photoURL, joinedAt, watchCount }
 * users/{uid}/watchlist/{id}  -> { title, poster, type, addedAt }
 * users/{uid}/history/{id}    -> { title, poster, type, lastWatchedAt, watchCount, season, episode }
 * leaderboard/{uid}           -> { displayName, photoURL, watchCount }  (mirrors profile for fast public read)
 */

const MinexusDB = {

  /* ---------------- WATCHLIST ---------------- */

  async getWatchlist(uid) {
    const snap = await db.ref(`users/${uid}/watchlist`).once('value');
    return snap.val() || {};
  },

  async isInWatchlist(uid, itemId) {
    const snap = await db.ref(`users/${uid}/watchlist/${itemId}`).once('value');
    return snap.exists();
  },

  async addToWatchlist(uid, item) {
    await db.ref(`users/${uid}/watchlist/${item.id}`).set({
      title: item.title,
      poster: item.poster || '',
      type: item.type || 'movie',
      year: item.year || '',
      rating: item.rating || '',
      addedAt: firebase.database.ServerValue.TIMESTAMP
    });
  },

  async removeFromWatchlist(uid, itemId) {
    await db.ref(`users/${uid}/watchlist/${itemId}`).remove();
  },

  watchWatchlist(uid, callback) {
    const ref = db.ref(`users/${uid}/watchlist`);
    ref.on('value', (snap) => callback(snap.val() || {}));
    return () => ref.off('value');
  },

  /* ---------------- HISTORY ---------------- */

  async addToHistory(uid, item, extra) {
    extra = extra || {};
    const ref = db.ref(`users/${uid}/history/${item.id}`);
    const snap = await ref.once('value');
    const existing = snap.val();

    await ref.set({
      title: item.title,
      poster: item.poster || '',
      type: item.type || 'movie',
      year: item.year || '',
      rating: item.rating || '',
      lastWatchedAt: firebase.database.ServerValue.TIMESTAMP,
      watchCount: existing ? (existing.watchCount || 0) + 1 : 1,
      season: extra.season || null,
      episode: extra.episode || null
    });

    // Only bump the global counter on a genuinely new title (not repeat plays)
    if (!existing) {
      await db.ref(`users/${uid}/profile/watchCount`).transaction(c => (c || 0) + 1);
      await this._syncLeaderboardEntry(uid);
    }
  },

  async getHistory(uid) {
    const snap = await db.ref(`users/${uid}/history`)
      .orderByChild('lastWatchedAt')
      .limitToLast(50)
      .once('value');
    const val = snap.val() || {};
    // Convert to array, most recent first
    return Object.keys(val)
      .map(id => ({ id, ...val[id] }))
      .sort((a, b) => (b.lastWatchedAt || 0) - (a.lastWatchedAt || 0));
  },

  async clearHistory(uid) {
    await db.ref(`users/${uid}/history`).remove();
  },

  /* ---------------- LEADERBOARD / TOP USERS ---------------- */

  async _syncLeaderboardEntry(uid) {
    const profSnap = await db.ref(`users/${uid}/profile`).once('value');
    const prof = profSnap.val();
    if (!prof) return;
    await db.ref(`leaderboard/${uid}`).set({
      displayName: prof.displayName || 'MINEXUS Viewer',
      photoURL: prof.photoURL || '',
      watchCount: prof.watchCount || 0
    });
  },

  async getTopUsers(limit) {
    limit = limit || 10;
    const snap = await db.ref('leaderboard')
      .orderByChild('watchCount')
      .limitToLast(limit)
      .once('value');
    const val = snap.val() || {};
    return Object.keys(val)
      .map(uid => ({ uid, ...val[uid] }))
      .sort((a, b) => (b.watchCount || 0) - (a.watchCount || 0));
  },

  /* ---------------- PROFILE ---------------- */

  async getProfile(uid) {
    const snap = await db.ref(`users/${uid}/profile`).once('value');
    return snap.val() || {};
  }
};
