/**
 * MINEXUS TV — OFFICIAL ENGINE (2026)
 * Live Cinemeta-powered streaming platform with Firebase Auth + Realtime Database
 * Developed by Muaaz Iqbal
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. SECURITY & BRAND PROTECTION
     ========================================================================== */
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    return false;
  });

  document.addEventListener('keydown', function (e) {
    if (
      e.key === 'F12' || e.keyCode === 123 ||
      (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
      (e.ctrlKey && ['U', 'u', 'S', 's'].includes(e.key))
    ) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  /* ==========================================================================
     2. STREAMING SERVERS (obfuscated endpoints)
     ========================================================================== */
  const _0x_s1 = 'aHR0cHM6Ly9raXNzNDI0ZGlkLmNvbS9wbGF5Lw==';
  const _0x_s2 = 'aHR0cHM6Ly92aWRzcmMudG8vZW1iZWQv';
  const _0x_s3 = 'aHR0cHM6Ly9wbGF5ZXIuYXV0b2VtYmVkLmNjL2VtYmVkLw==';
  const _0x_s4 = 'aHR0cHM6Ly92aWRsaW5rLnByby8=';
  const _0x_s5 = 'aHR0cHM6Ly93d3cuMmVtYmVkLmNjL2VtYmVkdHYv';

  function _decode(b64) {
    try { return atob(b64); } catch (e) { return ''; }
  }

  const SERVERS = {
    server1: {
      name: 'MINEXUS Server 1 (Ultra HD Fast)',
      buildUrl: (id) => `${_decode(_0x_s1)}${id}`
    },
    server2: {
      name: 'MINEXUS Server 2 (High Speed)',
      buildUrl: (id, type, s, ep) => type === 'series'
        ? `${_decode(_0x_s2)}tv/${id}/${s}/${ep}`
        : `${_decode(_0x_s2)}movie/${id}`
    },
    server3: {
      name: 'MINEXUS Server 3 (Cloud Multi)',
      buildUrl: (id, type, s, ep) => type === 'series'
        ? `${_decode(_0x_s3)}tv/${id}/${s}/${ep}`
        : `${_decode(_0x_s3)}movie/${id}`
    },
    server4: {
      name: 'MINEXUS Server 4 (4K Stream)',
      buildUrl: (id, type, s, ep) => type === 'series'
        ? `${_decode(_0x_s4)}tv/${id}/${s}/${ep}`
        : `${_decode(_0x_s4)}movie/${id}`
    },
    server5: {
      name: 'MINEXUS Server 5 (Backup Engine)',
      buildUrl: (id, type, s, ep) => type === 'series'
        ? `${_decode(_0x_s5)}${id}&s=${s}&e=${ep}`
        : `https://www.2embed.cc/embed/${id}`
    }
  };

  /* ==========================================================================
     3. GLOBAL STATE
     ========================================================================== */
  const STATE = {
    catalog: [],           // currently loaded/rendered items (session cache)
    filtered: [],
    activeFilter: 'all',
    searchQuery: '',
    heroList: [],
    heroIndex: 0,
    heroTimer: null,
    watchlist: {},          // { imdbId: {...} } — synced live from Firebase when logged in
    activeMovie: null,
    activeServer: 'server1',
    activeSeason: 1,
    activeEpisode: 1,
    seriesMeta: null,       // full meta incl. videos[] when playing a series
    isLoadingCatalog: false,
    searchResultsOverride: null, // when set, the grid shows these exact search results instead of filtered catalog
    catalogSkip: 0,
    user: null,
    deferredInstallPrompt: null
  };

  window.STATE = STATE; // exposed for debugging / other modules

  function showToast(message, type) {
    type = type || 'info';
    const icons = { success: 'fa-circle-check', warning: 'fa-triangle-exclamation', error: 'fa-circle-xmark', info: 'fa-circle-info' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
    const container = document.getElementById('toastContainer');
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, 3500);
  }
  window.showToast = showToast;

  /* ==========================================================================
     4. DOM REFERENCES
     ========================================================================== */
  const DOM = {};

  function cacheDom() {
    const ids = [
      'navbar', 'navAll', 'navMovies', 'navSeries', 'navTrending', 'navBollywood', 'navTop', 'navWatchlist',
      'searchInput', 'searchClearBtn', 'searchDropdown', 'directPlayNavBtn', 'mobileMenuBtn', 'mobileNav',
      'heroSection', 'heroBackdrop', 'heroPill', 'heroTypeBadge', 'heroImdbRating', 'heroRatingVal', 'heroTitle',
      'heroMeta', 'heroYear', 'heroRuntime', 'heroGenres', 'heroSynopsis', 'heroPlayBtn', 'heroInfoBtn',
      'heroWatchlistBtn', 'heroIndicators',
      'directPlayForm', 'directImdbInput',
      'movieGrid', 'movieCountBadge', 'emptyState', 'resetFiltersBtn', 'filterPillsWrap', 'sectionHeading', 'sectionSubtext',
      'loadMoreBtn', 'catalogLoader',
      'playerModal', 'playerModalBackdrop', 'closePlayerBtn', 'playerMovieTitle', 'serverButtonsWrap',
      'videoFrameContainer', 'videoLoader', 'cinemaIframe',
      'seriesControlsSection', 'seasonSelect', 'prevEpisodeBtn', 'nextEpisodeBtn', 'currentEpPill', 'episodesGrid',
      'activeServerStatus', 'theaterModeBtn', 'shareMovieBtn', 'playerWatchlistToggle',
      'playerPosterImg', 'playerTagsRow', 'playerDescription', 'playerSpecsGrid', 'recommendationsRow',
      'infoModal', 'infoModalBackdrop', 'infoModalClose', 'infoBannerImg', 'infoTitle', 'infoRatingPill',
      'infoTypeBadge', 'infoMetaRow', 'infoPlot', 'infoDetailsTable', 'infoPlayNowBtn', 'infoWatchlistBtn',
      'toastContainer',
      // Bottom Tab Bar
      'bottomTabBar', 'tabHome', 'tabMovies', 'tabSeries', 'tabSearch', 'tabAccount',
      // Auth
      'authModal', 'authModalBackdrop', 'authModalClose', 'authTabLogin', 'authTabSignup',
      'loginForm', 'loginEmail', 'loginPassword', 'loginSubmitBtn', 'forgotPasswordLink',
      'signupForm', 'signupName', 'signupEmail', 'signupPassword', 'signupSubmitBtn',
      'googleSignInBtn', 'googleSignUpBtn', 'authError', 'authGateNote',
      'navUserArea', 'userAvatarBtn', 'userMenu', 'userMenuName', 'userMenuEmail', 'userMenuWatchCount',
      'logoutBtn', 'navHistoryBtn',
      // Install
      'installBannerBtn'
    ];
    ids.forEach(id => { DOM[id] = document.getElementById(id); });
    DOM.navLinks = document.querySelectorAll('.nav-link');
    DOM.mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    DOM.chipBtns = document.querySelectorAll('.chip-btn');
  }

  /* ==========================================================================
     5. AUTH MODAL & GATE
     ========================================================================== */
  let pendingPlayItem = null; // item the guest tried to play before being gated

  function openAuthModal(reason) {
    DOM.authModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    DOM.authError.style.display = 'none';
    DOM.authError.textContent = '';
    if (reason) {
      DOM.authGateNote.textContent = reason;
      DOM.authGateNote.style.display = 'block';
    } else {
      DOM.authGateNote.style.display = 'none';
    }
    switchAuthTab('login');
  }

  function closeAuthModal() {
    DOM.authModal.classList.remove('active');
    document.body.style.overflow = '';
    pendingPlayItem = null;
  }

  function switchAuthTab(tab) {
    const isLogin = tab === 'login';
    DOM.authTabLogin.classList.toggle('active', isLogin);
    DOM.authTabSignup.classList.toggle('active', !isLogin);
    DOM.loginForm.style.display = isLogin ? 'flex' : 'none';
    DOM.signupForm.style.display = isLogin ? 'none' : 'flex';
    DOM.authError.style.display = 'none';
  }

  function setAuthError(msg) {
    DOM.authError.textContent = msg;
    DOM.authError.style.display = 'flex';
  }

  function setButtonLoading(btn, loading, label) {
    if (loading) {
      btn.dataset.originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + (label || 'Please wait...');
      btn.disabled = true;
    } else {
      btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
      btn.disabled = false;
    }
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = DOM.loginEmail.value.trim();
    const password = DOM.loginPassword.value;
    setAuthError('');
    setButtonLoading(DOM.loginSubmitBtn, true, 'Signing in...');
    try {
      await MinexusAuth.signInWithEmail(email, password);
      showToast('Welcome back to MINEXUS TV!', 'success');
      closeAuthModal();
      resolvePendingPlay();
    } catch (err) {
      setAuthError(friendlyAuthError(err));
    } finally {
      setButtonLoading(DOM.loginSubmitBtn, false);
    }
  }

  async function handleSignupSubmit(e) {
    e.preventDefault();
    const name = DOM.signupName.value.trim();
    const email = DOM.signupEmail.value.trim();
    const password = DOM.signupPassword.value;
    setAuthError('');

    if (password.length < 6) {
      setAuthError('Password kam se kam 6 characters ka hona chahiye.');
      return;
    }

    setButtonLoading(DOM.signupSubmitBtn, true, 'Creating account...');
    try {
      await MinexusAuth.signUpWithEmail(email, password, name);
      showToast('Account ban gaya! Welcome to MINEXUS TV.', 'success');
      closeAuthModal();
      resolvePendingPlay();
    } catch (err) {
      setAuthError(friendlyAuthError(err));
    } finally {
      setButtonLoading(DOM.signupSubmitBtn, false);
    }
  }

  async function handleGoogleSignIn() {
    setAuthError('');
    try {
      await MinexusAuth.signInWithGoogle();
      showToast('Signed in with Google!', 'success');
      closeAuthModal();
      resolvePendingPlay();
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError(friendlyAuthError(err));
      }
    }
  }

  async function handleForgotPassword() {
    const email = DOM.loginEmail.value.trim();
    if (!email) {
      setAuthError('Pehle apna email address likhein, phir reset link bhejenge.');
      return;
    }
    try {
      await MinexusAuth.sendPasswordReset(email);
      showToast('Password reset link aapke email pe bhej diya gaya hai.', 'success');
    } catch (err) {
      setAuthError(friendlyAuthError(err));
    }
  }

  function resolvePendingPlay() {
    if (pendingPlayItem) {
      const item = pendingPlayItem;
      pendingPlayItem = null;
      openCinemaPlayer(item);
    }
  }

  function requireAuth(item, reason) {
    if (MinexusAuth.isLoggedIn()) return true;
    pendingPlayItem = item || null;
    openAuthModal(reason || 'MINEXUS TV par movies/series dekhne ke liye login zaroori hai.');
    return false;
  }

  function updateAuthUI(user) {
    if (user) {
      DOM.navUserArea.style.display = 'flex';
      DOM.userAvatarBtn.innerHTML = user.photoURL
        ? `<img src="${user.photoURL}" alt="${user.displayName || 'User'}">`
        : `<span class="avatar-initial">${(user.displayName || user.email || 'U').charAt(0).toUpperCase()}</span>`;
      DOM.userMenuName.textContent = user.displayName || 'MINEXUS Viewer';
      DOM.userMenuEmail.textContent = user.email || '';
      MinexusDB.getProfile(user.uid).then(p => {
        DOM.userMenuWatchCount.textContent = p.watchCount || 0;
      });
    } else {
      DOM.navUserArea.style.display = 'none';
      DOM.userMenu.classList.remove('open');
    }
  }

  /* ==========================================================================
     6. CATALOG LOADING (100% Live Cinemeta Data)
     ========================================================================== */
  async function loadInitialCatalog() {
    setLoading(true);
    try {
      const [movies, series] = await Promise.all([
        MinexusAPI.getTopMovies(0),
        MinexusAPI.getTopSeries(0)
      ]);
      STATE.catalog = [...movies, ...series];
      STATE.heroList = movies.filter(m => m.rating && parseFloat(m.rating) >= 8.0).slice(0, 6);
      if (!STATE.heroList.length) STATE.heroList = movies.slice(0, 6);

      renderHeroCarousel();
      applyFilters('all');
    } catch (err) {
      console.error(err);
      showToast('Live catalog load nahi ho saka. Internet connection check karein.', 'error');
      DOM.emptyState.style.display = 'block';
    } finally {
      setLoading(false);
    }
  }

  async function loadMoreCatalog() {
    if (STATE.isLoadingCatalog) return;
    setLoading(true);
    STATE.catalogSkip += 20;
    try {
      const type = STATE.activeFilter === 'series' ? 'series' : (STATE.activeFilter === 'movies' ? 'movie' : null);
      let more = [];
      if (type) {
        more = await MinexusAPI.getCatalog(type, 'top', null, STATE.catalogSkip);
      } else {
        const [m, s] = await Promise.all([
          MinexusAPI.getTopMovies(STATE.catalogSkip),
          MinexusAPI.getTopSeries(STATE.catalogSkip)
        ]);
        more = [...m, ...s];
      }
      const existingIds = new Set(STATE.catalog.map(c => c.id));
      const fresh = more.filter(m => !existingIds.has(m.id));
      STATE.catalog.push(...fresh);
      applyFilters(STATE.activeFilter, true);
      if (!fresh.length) showToast('Aur titles nahi milein.', 'info');
    } catch (err) {
      showToast('Aur titles load karne mein masla hua.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function setLoading(isLoading) {
    STATE.isLoadingCatalog = isLoading;
    if (DOM.catalogLoader) DOM.catalogLoader.style.display = isLoading ? 'flex' : 'none';
    if (DOM.loadMoreBtn) DOM.loadMoreBtn.disabled = isLoading;
  }

  /* ==========================================================================
     7. HERO CAROUSEL
     ========================================================================== */
  function renderHeroCarousel() {
    if (!STATE.heroList.length) return;

    DOM.heroIndicators.innerHTML = STATE.heroList
      .map((_, i) => `<button class="indicator-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></button>`)
      .join('');

    DOM.heroIndicators.querySelectorAll('.indicator-dot').forEach(btn => {
      btn.addEventListener('click', (e) => {
        showHeroSlide(parseInt(e.currentTarget.dataset.index, 10));
        restartHeroTimer();
      });
    });

    showHeroSlide(0);
    startHeroTimer();
  }

  function showHeroSlide(index) {
    const item = STATE.heroList[index];
    if (!item) return;
    STATE.heroIndex = index;

    DOM.heroSection.classList.add('fade-transition');
    setTimeout(() => DOM.heroSection.classList.remove('fade-transition'), 400);

    DOM.heroBackdrop.style.backgroundImage = `url('${item.backdrop}')`;
    DOM.heroTitle.textContent = item.title;
    DOM.heroRatingVal.textContent = item.rating || '—';
    DOM.heroTypeBadge.textContent = item.type === 'series' ? 'TV SERIES' : 'MOVIE';
    DOM.heroYear.textContent = item.year;
    DOM.heroRuntime.textContent = item.runtime || '';
    DOM.heroGenres.textContent = (item.genres || []).join(', ');
    DOM.heroSynopsis.textContent = item.synopsis || 'MINEXUS TV par 4K Ultra HD streaming.';

    const inWatch = !!STATE.watchlist[item.id];
    DOM.heroWatchlistBtn.innerHTML = inWatch ? '<i class="fas fa-bookmark"></i>' : '<i class="far fa-bookmark"></i>';

    DOM.heroPlayBtn.onclick = () => { if (requireAuth(item)) openCinemaPlayer(item); };
    DOM.heroInfoBtn.onclick = () => openInfoModal(item);
    DOM.heroWatchlistBtn.onclick = () => toggleWatchlist(item, DOM.heroWatchlistBtn);

    DOM.heroIndicators.querySelectorAll('.indicator-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  function startHeroTimer() {
    clearInterval(STATE.heroTimer);
    STATE.heroTimer = setInterval(() => {
      showHeroSlide((STATE.heroIndex + 1) % STATE.heroList.length);
    }, 7000);
  }

  function restartHeroTimer() {
    clearInterval(STATE.heroTimer);
    startHeroTimer();
  }

  /* ==========================================================================
     8. CATALOG GRID RENDERING & FILTERS
     ========================================================================== */
  function renderCatalog(list) {
    if (!list.length) {
      DOM.movieGrid.innerHTML = '';
      DOM.emptyState.style.display = 'block';
      DOM.movieCountBadge.textContent = '0 titles found';
      return;
    }

    DOM.emptyState.style.display = 'none';
    DOM.movieCountBadge.textContent = `${list.length} Titles Available`;
    DOM.movieGrid.innerHTML = list.map(createMovieCardHTML).join('');

    DOM.movieGrid.querySelectorAll('.movie-card').forEach(card => {
      const id = card.dataset.id;
      let item = STATE.catalog.find(c => c.id === id);
      if (!item && STATE.watchlistItemsCache && STATE.watchlistItemsCache[id]) {
        item = { id, ...STATE.watchlistItemsCache[id] };
      }
      if (!item) return;

      card.querySelector('.play-card-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (requireAuth(item)) openCinemaPlayer(item);
      });
      card.querySelector('.info-card-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openInfoModal(item);
      });
      card.querySelector('.bookmark-card-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWatchlist(item, e.currentTarget);
      });
      card.addEventListener('click', () => { if (requireAuth(item)) openCinemaPlayer(item); });
    });
  }

  function createMovieCardHTML(item) {
    const isSaved = !!STATE.watchlist[item.id];
    const typeLabel = item.type === 'series' ? 'TV SHOW' : 'MOVIE';
    return `
      <article class="movie-card" data-id="${item.id}" tabindex="0">
        <div class="card-poster-wrap">
          <img src="${item.poster}" alt="${escapeHtml(item.title)}" loading="lazy" class="card-poster-img"
               onerror="this.onerror=null;this.src='https://via.placeholder.com/300x450/141724/2fa8ff?text=${encodeURIComponent(item.title)}';">
          <div class="card-rating-badge"><i class="fas fa-star"></i> ${item.rating || 'N/A'}</div>
          <div class="card-type-tag ${item.type}">${typeLabel}</div>
          <button class="bookmark-card-btn ${isSaved ? 'active' : ''}" title="Watchlist">
            <i class="${isSaved ? 'fas' : 'far'} fa-bookmark"></i>
          </button>
          <div class="card-hover-overlay">
            <button class="play-card-btn" title="Stream on MINEXUS"><i class="fas fa-play"></i></button>
            <button class="info-card-btn" title="Info & Synopsis"><i class="fas fa-info"></i></button>
          </div>
        </div>
        <div class="card-info">
          <h3 class="card-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h3>
          <div class="card-meta"><span>${item.year || ''}</span><span class="meta-dot">•</span><span>${item.runtime || 'HD'}</span></div>
        </div>
      </article>
    `;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function updateHeading(title, subtitle) {
    if (DOM.sectionHeading) DOM.sectionHeading.textContent = title;
    if (DOM.sectionSubtext) DOM.sectionSubtext.textContent = subtitle;
  }

  /* ==========================================================================
     8b. PERSONALIZED "RECOMMENDED FOR YOU" (based on watch history genres)
     ========================================================================== */
  async function renderPersonalizedRow() {
    const wrap = document.getElementById('personalizedRow');
    const section = document.getElementById('personalizedSection');
    if (!wrap || !section) return;

    if (!MinexusAuth.isLoggedIn()) {
      section.style.display = 'none';
      return;
    }

    try {
      const history = await MinexusDB.getHistory(MinexusAuth.currentUser.uid);
      if (!history.length) { section.style.display = 'none'; return; }

      // Count genres from the titles actually present in the loaded catalog that match history
      const genreCounts = {};
      history.forEach(h => {
        const match = STATE.catalog.find(c => c.id === h.id);
        (match && match.genres || []).forEach(g => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      });

      const topGenres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]).slice(0, 3);
      if (!topGenres.length) { section.style.display = 'none'; return; }

      const historyIds = new Set(history.map(h => h.id));
      const picks = STATE.catalog.filter(c =>
        !historyIds.has(c.id) && (c.genres || []).some(g => topGenres.includes(g))
      ).slice(0, 12);

      if (!picks.length) { section.style.display = 'none'; return; }

      section.style.display = 'block';
      document.getElementById('personalizedSubtext').textContent =
        `Based on your love for ${topGenres.join(', ')}`;
      wrap.innerHTML = picks.map(createMovieCardHTML).join('');

      wrap.querySelectorAll('.movie-card').forEach(card => {
        const id = card.dataset.id;
        const item = STATE.catalog.find(c => c.id === id);
        if (!item) return;
        card.querySelector('.play-card-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          if (requireAuth(item)) openCinemaPlayer(item);
        });
        card.querySelector('.info-card-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          openInfoModal(item);
        });
        card.querySelector('.bookmark-card-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          toggleWatchlist(item, e.currentTarget);
        });
        card.addEventListener('click', () => { if (requireAuth(item)) openCinemaPlayer(item); });
      });
    } catch (err) {
      section.style.display = 'none';
    }
  }

  async function applyFilters(filterKey, skipRerenderNav) {
    STATE.activeFilter = filterKey;

    if (!skipRerenderNav) {
      DOM.navLinks.forEach(nav => nav.classList.toggle('active', nav.dataset.category === filterKey));
      DOM.mobileNavLinks.forEach(nav => nav.classList.toggle('active', nav.dataset.category === filterKey));
      // Sync bottom tab bar highlight for the two categories it directly maps to
      if (filterKey === 'movies' || filterKey === 'all') {
        [DOM.tabHome, DOM.tabMovies, DOM.tabSeries].forEach(b => b.classList.remove('active'));
        (filterKey === 'movies' ? DOM.tabMovies : DOM.tabHome).classList.add('active');
      } else if (filterKey === 'series') {
        [DOM.tabHome, DOM.tabMovies, DOM.tabSeries].forEach(b => b.classList.remove('active'));
        DOM.tabSeries.classList.add('active');
      }
    }

    let results = [...STATE.catalog];

    if (filterKey === 'movies') {
      results = results.filter(i => i.type === 'movie');
      updateHeading('🎬 Movies', 'Live IMDb-powered movie catalog on MINEXUS TV');
    } else if (filterKey === 'series') {
      results = results.filter(i => i.type === 'series');
      updateHeading('📺 TV Series & Web Shows', 'All seasons and episodes ready for streaming');
    } else if (filterKey === 'trending') {
      results = results.filter(i => i.rating && parseFloat(i.rating) >= 7.5);
      updateHeading('🔥 Trending & Popular Now', 'Most watched titles on MINEXUS TV worldwide');
    } else if (filterKey === 'bollywood') {
      results = results.filter(i => (i.genres || []).some(g => ['bollywood', 'hindi'].includes(g.toLowerCase())) || /india/i.test(i.country || ''));
      updateHeading('🇮🇳 Bollywood & Hindi Cinema', 'Latest Hindi blockbuster movies and Indian web series');
    } else if (filterKey === 'top') {
      results = results.filter(i => i.rating && parseFloat(i.rating) >= 8.5);
      updateHeading('⭐ Top Rated IMDb Hall of Fame', 'Critically acclaimed masterpieces rated 8.5+');
    } else if (filterKey === 'watchlist') {
      if (!MinexusAuth.isLoggedIn()) {
        results = [];
        updateHeading('🔖 My Watchlist', 'Login to see your saved titles');
      } else {
        const wl = Object.keys(STATE.watchlist).map(id => ({ id, ...STATE.watchlist[id] }));
        STATE.watchlistItemsCache = STATE.watchlist;
        results = wl;
        updateHeading('🔖 My Watchlist', 'Your bookmarked movies and TV series');
      }
    } else {
      updateHeading('🧭 Discover MINEXUS TV', 'Live IMDb catalog — movies & series in Ultra HD');
    }

    // Local text search across whatever's currently loaded
    if (STATE.searchQuery) {
      const q = STATE.searchQuery.toLowerCase();
      results = results.filter(i => i.title.toLowerCase().includes(q));
    }

    STATE.filtered = results;
    renderCatalog(results);
  }

  /* ==========================================================================
     9. LIVE SEARCH (Cinemeta-powered with auto-suggestions)
     ========================================================================== */
  let searchDebounce = null;

  function handleSearchInput(query) {
    STATE.searchQuery = query;
    DOM.searchClearBtn.style.display = query ? 'flex' : 'none';

    clearTimeout(searchDebounce);
    if (!query.trim()) {
      DOM.searchDropdown.style.display = 'none';
      STATE.searchResultsOverride = null;
      applyFilters(STATE.activeFilter);
      return;
    }

    searchDebounce = setTimeout(async () => {
      // Instant local filter of whatever's already loaded, for zero-latency feedback
      applyFilters(STATE.activeFilter);

      // Live server-side search (IMDb + Cinemeta) for anything not already in the loaded catalog
      DOM.searchDropdown.innerHTML = `<div class="search-dropdown-item search-loading"><i class="fas fa-spinner fa-spin"></i> Searching MINEXUS live catalog...</div>`;
      DOM.searchDropdown.style.display = 'block';

      try {
        const { movies, series } = await MinexusAPI.search(query);
        const results = [...movies, ...series];

        if (!results.length) {
          DOM.searchDropdown.innerHTML = `
            <div class="search-dropdown-item direct-imdb-hint" data-query="${escapeHtml(query)}">
              <i class="fas fa-play-circle"></i>
              <div><strong>Direct Play IMDb ID: "${escapeHtml(query)}"</strong><small>Agar ye ek IMDb ID hai, MINEXUS par stream karein</small></div>
            </div>`;
          // Nothing found anywhere — reflect that in the main grid too instead of showing stale results
          STATE.searchResultsOverride = [];
          renderCatalog([]);
        } else {
          // Merge into main catalog so cards/watchlist/play all work normally
          const existingIds = new Set(STATE.catalog.map(c => c.id));
          results.forEach(r => { if (!existingIds.has(r.id)) STATE.catalog.push(r); });

          DOM.searchDropdown.innerHTML = results.slice(0, 8).map(m => `
            <div class="search-dropdown-item" data-id="${m.id}">
              <img src="${m.poster}" alt="${escapeHtml(m.title)}" onerror="this.style.display='none'">
              <div class="search-item-info">
                <span class="search-item-title">${escapeHtml(m.title)}</span>
                <span class="search-item-meta">${m.year || ''} • <i class="fas fa-star"></i> ${m.rating || 'N/A'} • ${m.type === 'series' ? 'TV Series' : 'Movie'}</span>
              </div>
            </div>
          `).join('');

          // Show ALL matched results (not just the dropdown's top 8) in the main grid below —
          // this is the "full search results page" behavior.
          STATE.searchResultsOverride = results;
          updateHeading(`🔎 Search Results for "${escapeHtml(query)}"`, `${results.length} titles found across MINEXUS live catalog`);
          renderCatalog(results);
        }
      } catch (err) {
        DOM.searchDropdown.innerHTML = `<div class="search-dropdown-item search-loading">Search fail hui. Try again.</div>`;
      }

      DOM.searchDropdown.style.display = 'block';
      bindSearchDropdownClicks();
    }, 450);
  }

  function bindSearchDropdownClicks() {
    DOM.searchDropdown.querySelectorAll('.search-dropdown-item[data-id], .search-dropdown-item[data-query]').forEach(item => {
      item.addEventListener('click', () => {
        DOM.searchDropdown.style.display = 'none';
        if (item.dataset.id) {
          const match = STATE.catalog.find(c => c.id === item.dataset.id);
          if (match && requireAuth(match)) openCinemaPlayer(match);
        } else if (item.dataset.query) {
          handleDirectPlay(item.dataset.query);
        }
      });
    });
  }

  /* ==========================================================================
     10. WATCHLIST (Firebase Realtime DB, requires login)
     ========================================================================== */
  async function toggleWatchlist(item, btnEl) {
    if (!requireAuth(item, 'Watchlist mein save karne ke liye login karein.')) return;

    const uid = MinexusAuth.currentUser.uid;
    const isSaved = !!STATE.watchlist[item.id];

    try {
      if (isSaved) {
        await MinexusDB.removeFromWatchlist(uid, item.id);
        showToast(`${item.title} watchlist se hata diya gaya.`, 'info');
      } else {
        await MinexusDB.addToWatchlist(uid, item);
        showToast(`${item.title} watchlist mein add ho gaya!`, 'success');
      }
      // STATE.watchlist updates via the live listener (watchWatchlist), which re-renders icons.
      if (btnEl) {
        btnEl.classList.toggle('active');
        const icon = btnEl.querySelector('i');
        if (icon) icon.className = isSaved ? 'far fa-bookmark' : 'fas fa-bookmark';
      }
    } catch (err) {
      showToast('Watchlist update nahi ho saka.', 'error');
    }
  }

  function startWatchlistSync(uid) {
    MinexusDB.watchWatchlist(uid, (wl) => {
      STATE.watchlist = wl;
      updateWatchlistCount();
      // Refresh visible grid bookmark states without a full reload
      if (STATE.activeFilter === 'watchlist') {
        applyFilters('watchlist');
      } else {
        document.querySelectorAll('.movie-card').forEach(card => {
          const id = card.dataset.id;
          const btn = card.querySelector('.bookmark-card-btn');
          if (!btn) return;
          const saved = !!wl[id];
          btn.classList.toggle('active', saved);
          const icon = btn.querySelector('i');
          if (icon) icon.className = saved ? 'fas fa-bookmark' : 'far fa-bookmark';
        });
      }
    });
  }

  function updateWatchlistCount() {
    const count = Object.keys(STATE.watchlist || {}).length;
    const badge = document.getElementById('watchlistCount');
    if (badge) badge.textContent = count;
  }

  /* ==========================================================================
     11. CINEMA PLAYER (movies + series with season/episode nav)
     ========================================================================== */
  async function openCinemaPlayer(item) {
    STATE.activeMovie = item;
    STATE.activeServer = 'server1';
    STATE.activeSeason = 1;
    STATE.activeEpisode = 1;
    STATE.seriesMeta = null;

    DOM.playerModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    DOM.playerMovieTitle.textContent = item.title;
    DOM.videoLoader.style.display = 'flex';
    DOM.cinemaIframe.src = '';
    updateHistoryUrl(item);

    document.querySelectorAll('.server-btn').forEach(b => b.classList.toggle('active', b.dataset.server === 'server1'));

    if (item.type === 'series') {
      DOM.seriesControlsSection.style.display = 'block';
      await loadSeriesEpisodes(item);
    } else {
      DOM.seriesControlsSection.style.display = 'none';
      loadPlayerStream();
    }

    renderPlayerMeta(item);
    logWatchToHistory(item);
  }

  function updateHistoryUrl(item) {
    const slug = (item.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const url = `/${item.type}/${item.id}${slug ? '-' + slug : ''}`;
    try { window.history.pushState({ id: item.id }, item.title, url); } catch (e) { /* non-critical */ }
    document.title = `${item.title} — Watch on MINEXUS TV`;
  }

  async function loadSeriesEpisodes(item) {
    try {
      const meta = await MinexusAPI.getMeta('series', item.id);
      STATE.seriesMeta = meta;
      const bySeason = MinexusAPI.groupEpisodesBySeason(meta.videos);
      const seasons = Object.keys(bySeason).map(Number).sort((a, b) => a - b);

      if (!seasons.length) {
        // No episode metadata available — still allow direct S1E1 play
        STATE.activeSeason = 1;
        STATE.activeEpisode = 1;
        loadPlayerStream();
        DOM.episodesGrid.innerHTML = '<p class="no-episodes-msg">Episode list abhi available nahi, direct stream try karein.</p>';
        return;
      }

      DOM.seasonSelect.innerHTML = seasons.map(s => `<option value="${s}">Season ${s}</option>`).join('');
      STATE.activeSeason = seasons[0];
      renderEpisodesGrid(bySeason, STATE.activeSeason);

      DOM.seasonSelect.onchange = () => {
        STATE.activeSeason = parseInt(DOM.seasonSelect.value, 10);
        STATE.activeEpisode = 1;
        renderEpisodesGrid(bySeason, STATE.activeSeason);
        loadPlayerStream();
      };

      STATE.activeEpisode = bySeason[STATE.activeSeason][0].episode || 1;
      loadPlayerStream();
    } catch (err) {
      showToast('Series episode data load nahi ho saka.', 'error');
      STATE.activeSeason = 1;
      STATE.activeEpisode = 1;
      loadPlayerStream();
    }
  }

  function renderEpisodesGrid(bySeason, season) {
    const episodes = bySeason[season] || [];
    DOM.episodesGrid.innerHTML = episodes.map(ep => `
      <button class="episode-chip ${ep.episode === STATE.activeEpisode ? 'active' : ''}" data-ep="${ep.episode}">
        <span class="ep-num">E${ep.episode}</span>
        <span class="ep-title">${escapeHtml(ep.title || 'Episode ' + ep.episode)}</span>
      </button>
    `).join('');

    DOM.episodesGrid.querySelectorAll('.episode-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        STATE.activeEpisode = parseInt(chip.dataset.ep, 10);
        DOM.episodesGrid.querySelectorAll('.episode-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        DOM.currentEpPill.textContent = `S${STATE.activeSeason}: E${STATE.activeEpisode}`;
        loadPlayerStream();
        logWatchToHistory(STATE.activeMovie);
      });
    });

    DOM.currentEpPill.textContent = `S${STATE.activeSeason}: E${STATE.activeEpisode}`;

    DOM.prevEpisodeBtn.onclick = () => stepEpisode(-1, bySeason);
    DOM.nextEpisodeBtn.onclick = () => stepEpisode(1, bySeason);
  }

  function stepEpisode(direction, bySeason) {
    const episodes = bySeason[STATE.activeSeason] || [];
    const idx = episodes.findIndex(e => e.episode === STATE.activeEpisode);
    const nextIdx = idx + direction;
    if (nextIdx >= 0 && nextIdx < episodes.length) {
      STATE.activeEpisode = episodes[nextIdx].episode;
      renderEpisodesGrid(bySeason, STATE.activeSeason);
      loadPlayerStream();
      logWatchToHistory(STATE.activeMovie);
    } else {
      showToast(direction > 0 ? 'Ye season ka last episode hai.' : 'Ye season ka pehla episode hai.', 'info');
    }
  }

  function loadPlayerStream() {
    if (!STATE.activeMovie) return;
    const server = SERVERS[STATE.activeServer];
    const url = server.buildUrl(STATE.activeMovie.id, STATE.activeMovie.type, STATE.activeSeason, STATE.activeEpisode);

    DOM.videoLoader.style.display = 'flex';
    DOM.cinemaIframe.src = url;
    DOM.activeServerStatus.textContent = `Active: ${server.name}`;

    DOM.cinemaIframe.onload = () => { DOM.videoLoader.style.display = 'none'; };
    setTimeout(() => { DOM.videoLoader.style.display = 'none'; }, 4000);
  }

  function setServer(serverId) {
    STATE.activeServer = serverId;
    document.querySelectorAll('.server-btn').forEach(b => b.classList.toggle('active', b.dataset.server === serverId));
    loadPlayerStream();
  }

  /* ---- Real Fullscreen + Auto-Landscape Rotation ---- */
  async function toggleRealFullscreen() {
    const el = DOM.videoFrameContainer;
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;

    try {
      if (!isFullscreen) {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        else if (el.webkitEnterFullscreen) el.webkitEnterFullscreen(); // iOS Safari video fallback

        // Auto-rotate to landscape on phones that support the Screen Orientation lock API
        if (screen.orientation && screen.orientation.lock) {
          try { await screen.orientation.lock('landscape'); } catch (e) { /* not all browsers allow this, non-critical */ }
        }
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();

        if (screen.orientation && screen.orientation.unlock) {
          try { screen.orientation.unlock(); } catch (e) { /* non-critical */ }
        }
      }
    } catch (err) {
      // Fallback: at least give a full-viewport theater experience if the native API is blocked
      el.classList.toggle('theater-mode');
    }
  }

  // Keep icon + theater-mode class in sync with actual fullscreen state (covers Esc key exits too)
  function bindFullscreenSync() {
    const onChange = () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      DOM.videoFrameContainer.classList.toggle('theater-mode', isFs);
      if (DOM.theaterModeBtn) {
        DOM.theaterModeBtn.innerHTML = isFs
          ? '<i class="fas fa-compress-arrows-alt"></i>'
          : '<i class="fas fa-expand-arrows-alt"></i>';
      }
      if (!isFs && screen.orientation && screen.orientation.unlock) {
        try { screen.orientation.unlock(); } catch (e) { /* non-critical */ }
      }
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
  }

  function closeCinemaPlayer() {
    DOM.playerModal.classList.remove('active');
    document.body.style.overflow = '';
    DOM.cinemaIframe.src = '';
    STATE.activeMovie = null;
    try { window.history.pushState({}, 'MINEXUS TV', '/'); } catch (e) {}
    document.title = 'MINEXUS TV — Watch Movies & Series Online in 4K';
  }

  function renderPlayerMeta(item) {
    DOM.playerPosterImg.src = item.poster;
    DOM.playerTagsRow.innerHTML = (item.genres || []).map(g => `<span class="player-tag">${escapeHtml(g)}</span>`).join('');
    DOM.playerDescription.textContent = item.synopsis || '';
    DOM.playerSpecsGrid.innerHTML = `
      <div class="spec-item"><strong>Year</strong><span>${item.year || '—'}</span></div>
      <div class="spec-item"><strong>Rating</strong><span><i class="fas fa-star"></i> ${item.rating || 'N/A'}</span></div>
      <div class="spec-item"><strong>Type</strong><span>${item.type === 'series' ? 'TV Series' : 'Movie'}</span></div>
      ${item.runtime ? `<div class="spec-item"><strong>Runtime</strong><span>${item.runtime}</span></div>` : ''}
    `;

    const isSaved = !!STATE.watchlist[item.id];
    DOM.playerWatchlistToggle.innerHTML = isSaved
      ? '<i class="fas fa-bookmark"></i> In Watchlist'
      : '<i class="far fa-bookmark"></i> Add to Watchlist';

    renderRecommendations(item);
  }

  function renderRecommendations(item) {
    const related = STATE.catalog
      .filter(c => c.id !== item.id && c.type === item.type &&
        (c.genres || []).some(g => (item.genres || []).includes(g)))
      .slice(0, 10);

    const pool = related.length ? related : STATE.catalog.filter(c => c.id !== item.id).slice(0, 10);

    DOM.recommendationsRow.innerHTML = pool.map(m => `
      <div class="rec-card" data-id="${m.id}">
        <img src="${m.poster}" alt="${escapeHtml(m.title)}" loading="lazy">
        <span>${escapeHtml(m.title)}</span>
      </div>
    `).join('');

    DOM.recommendationsRow.querySelectorAll('.rec-card').forEach(card => {
      card.addEventListener('click', () => {
        const match = STATE.catalog.find(c => c.id === card.dataset.id);
        if (match) openCinemaPlayer(match);
      });
    });
  }

  async function logWatchToHistory(item) {
    if (!MinexusAuth.isLoggedIn() || !item) return;
    clearTimeout(logWatchToHistory._debounce);
    logWatchToHistory._debounce = setTimeout(async () => {
      try {
        await MinexusDB.addToHistory(MinexusAuth.currentUser.uid, item, {
          season: item.type === 'series' ? STATE.activeSeason : null,
          episode: item.type === 'series' ? STATE.activeEpisode : null
        });
        renderPersonalizedRow(); // keep "Recommended For You" fresh as taste data grows
      } catch (err) { /* non-critical */ }
    }, 800); // debounce rapid episode switching so we don't hammer the DB
  }

  /* ==========================================================================
     12. INFO MODAL
     ========================================================================== */
  function openInfoModal(item) {
    DOM.infoModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    DOM.infoBannerImg.src = item.backdrop || item.poster;
    DOM.infoTitle.textContent = item.title;
    DOM.infoRatingPill.innerHTML = `<i class="fas fa-star"></i> ${item.rating || 'N/A'}`;
    DOM.infoTypeBadge.textContent = item.type === 'series' ? 'TV SERIES' : 'MOVIE';
    DOM.infoMetaRow.textContent = `${item.year || ''} • ${item.runtime || ''} • ${(item.genres || []).join(', ')}`;
    DOM.infoPlot.textContent = item.synopsis || 'MINEXUS TV par 4K Ultra HD streaming available.';

    // Fetch full detail (cast/director) lazily for a richer info view
    DOM.infoDetailsTable.innerHTML = `<div class="info-detail-loading"><i class="fas fa-spinner fa-spin"></i> Details load ho rahi hain...</div>`;
    MinexusAPI.getMeta(item.type, item.id).then(full => {
      DOM.infoDetailsTable.innerHTML = `
        ${full.director ? `<div class="info-detail-row"><strong>Director</strong><span>${escapeHtml(full.director)}</span></div>` : ''}
        ${full.cast ? `<div class="info-detail-row"><strong>Cast</strong><span>${escapeHtml(full.cast)}</span></div>` : ''}
        ${full.writer ? `<div class="info-detail-row"><strong>Writer</strong><span>${escapeHtml(full.writer)}</span></div>` : ''}
        ${full.country ? `<div class="info-detail-row"><strong>Country</strong><span>${escapeHtml(full.country)}</span></div>` : ''}
      `;
    }).catch(() => { DOM.infoDetailsTable.innerHTML = ''; });

    const isSaved = !!STATE.watchlist[item.id];
    DOM.infoWatchlistBtn.innerHTML = isSaved ? '<i class="fas fa-bookmark"></i> In Watchlist' : '<i class="far fa-bookmark"></i> Watchlist';
    DOM.infoWatchlistBtn.onclick = () => toggleWatchlist(item, DOM.infoWatchlistBtn);
    DOM.infoPlayNowBtn.onclick = () => { closeInfoModal(); if (requireAuth(item)) openCinemaPlayer(item); };
  }

  function closeInfoModal() {
    DOM.infoModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  /* ==========================================================================
     13. DIRECT IMDb PLAY
     ========================================================================== */
  async function handleDirectPlay(rawId) {
    if (!rawId) return;
    let id = rawId.trim();
    if (!id.startsWith('tt') && /^\d+$/.test(id)) id = 'tt' + id;

    if (!/^tt\d+$/.test(id)) {
      showToast('IMDb ID sahi format mein likhein (e.g. tt1375666)', 'warning');
      return;
    }

    if (!requireAuth({ id, title: 'IMDb Direct Play', type: 'movie', poster: MinexusAPI.posterUrl(id) })) return;

    let item = STATE.catalog.find(c => c.id === id);
    if (!item) {
      showToast('Title dhoonda ja raha hai...', 'info');
      try {
        item = await MinexusAPI.detectAndGetMeta(id);
        STATE.catalog.unshift(item);
      } catch (err) {
        showToast('Ye IMDb ID nahi mila. ID check karein.', 'error');
        return;
      }
    }

    DOM.directImdbInput.value = '';
    openCinemaPlayer(item);
  }

  /* ==========================================================================
     14. PWA INSTALL PROMPT
     ========================================================================== */
  function setupPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      STATE.deferredInstallPrompt = e;
      if (DOM.installBannerBtn) DOM.installBannerBtn.style.display = 'flex';
    });

    if (DOM.installBannerBtn) {
      DOM.installBannerBtn.addEventListener('click', async () => {
        if (!STATE.deferredInstallPrompt) return;
        STATE.deferredInstallPrompt.prompt();
        const { outcome } = await STATE.deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') showToast('MINEXUS TV install ho raha hai!', 'success');
        STATE.deferredInstallPrompt = null;
        DOM.installBannerBtn.style.display = 'none';
      });
    }

    window.addEventListener('appinstalled', () => {
      showToast('MINEXUS TV successfully install ho gaya!', 'success');
      if (DOM.installBannerBtn) DOM.installBannerBtn.style.display = 'none';
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => { /* non-critical */ });
    }
  }

  /* ==========================================================================
     15. EVENT LISTENERS
     ========================================================================== */
  /* ==========================================================================
     15b. BOTTOM TAB BAR NAVIGATION
     ========================================================================== */
  function setActiveTab(tab) {
    [DOM.tabHome, DOM.tabMovies, DOM.tabSeries, DOM.tabSearch, DOM.tabAccount].forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    if (tab === 'home') {
      STATE.searchResultsOverride = null;
      applyFilters('all');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'movies') {
      applyFilters('movies');
      window.scrollTo({ top: DOM.movieGrid.offsetTop - 140, behavior: 'smooth' });
    } else if (tab === 'series') {
      applyFilters('series');
      window.scrollTo({ top: DOM.movieGrid.offsetTop - 140, behavior: 'smooth' });
    } else if (tab === 'search') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => DOM.searchInput.focus(), 300);
    } else if (tab === 'account') {
      if (MinexusAuth.isLoggedIn()) {
        DOM.userMenu.classList.add('open');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        openAuthModal('Login karein apna MINEXUS TV account access karne ke liye.');
      }
    }
  }

  function setupEventListeners() {
    // Category Nav (desktop + mobile)
    document.querySelectorAll('[data-category]').forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.mobileNav.classList.remove('open');
        STATE.searchResultsOverride = null;
        applyFilters(btn.dataset.category);
        DOM.searchInput.value = '';
        STATE.searchQuery = '';
      });
    });

    DOM.mobileMenuBtn.addEventListener('click', () => DOM.mobileNav.classList.toggle('open'));

    // Bottom Tab Bar (mobile native-app style navigation)
    DOM.tabHome.addEventListener('click', () => setActiveTab('home'));
    DOM.tabMovies.addEventListener('click', () => setActiveTab('movies'));
    DOM.tabSeries.addEventListener('click', () => setActiveTab('series'));
    DOM.tabSearch.addEventListener('click', () => setActiveTab('search'));
    DOM.tabAccount.addEventListener('click', () => setActiveTab('account'));

    // Search
    DOM.searchInput.addEventListener('input', (e) => handleSearchInput(e.target.value));
    DOM.searchClearBtn.addEventListener('click', () => {
      DOM.searchInput.value = '';
      STATE.searchQuery = '';
      STATE.searchResultsOverride = null;
      DOM.searchClearBtn.style.display = 'none';
      DOM.searchDropdown.style.display = 'none';
      applyFilters(STATE.activeFilter);
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-box-wrap')) DOM.searchDropdown.style.display = 'none';
    });

    // Direct Play
    DOM.directPlayForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleDirectPlay(DOM.directImdbInput.value.trim());
    });
    DOM.directPlayNavBtn.addEventListener('click', () => {
      DOM.directImdbInput.focus();
      DOM.directImdbInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    DOM.chipBtns.forEach(chip => {
      chip.addEventListener('click', () => handleDirectPlay(chip.dataset.imdb));
    });

    DOM.resetFiltersBtn.addEventListener('click', () => {
      DOM.searchInput.value = '';
      STATE.searchQuery = '';
      STATE.searchResultsOverride = null;
      DOM.searchClearBtn.style.display = 'none';
      applyFilters('all');
    });

    if (DOM.loadMoreBtn) DOM.loadMoreBtn.addEventListener('click', loadMoreCatalog);

    // Player Modal
    DOM.closePlayerBtn.addEventListener('click', closeCinemaPlayer);
    DOM.playerModalBackdrop.addEventListener('click', closeCinemaPlayer);
    DOM.serverButtonsWrap.querySelectorAll('.server-btn').forEach(btn => {
      btn.addEventListener('click', () => setServer(btn.dataset.server));
    });
    DOM.theaterModeBtn.addEventListener('click', toggleRealFullscreen);
    DOM.shareMovieBtn.addEventListener('click', () => {
      if (!STATE.activeMovie) return;
      const shareData = {
        title: `MINEXUS TV - Watch ${STATE.activeMovie.title}`,
        text: `Stream ${STATE.activeMovie.title} in 4K on MINEXUS TV!`,
        url: window.location.href
      };
      if (navigator.share) {
        navigator.share(shareData).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        showToast('MINEXUS TV link copied to clipboard!', 'success');
      }
    });
    DOM.playerWatchlistToggle.addEventListener('click', () => {
      if (STATE.activeMovie) toggleWatchlist(STATE.activeMovie, DOM.playerWatchlistToggle);
    });

    // Info Modal
    DOM.infoModalClose.addEventListener('click', closeInfoModal);
    DOM.infoModalBackdrop.addEventListener('click', closeInfoModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (DOM.playerModal.classList.contains('active')) closeCinemaPlayer();
        if (DOM.infoModal.classList.contains('active')) closeInfoModal();
        if (DOM.authModal.classList.contains('active')) closeAuthModal();
      }
    });

    // Auth Modal
    DOM.authModalClose.addEventListener('click', closeAuthModal);
    DOM.authModalBackdrop.addEventListener('click', closeAuthModal);
    DOM.authTabLogin.addEventListener('click', () => switchAuthTab('login'));
    DOM.authTabSignup.addEventListener('click', () => switchAuthTab('signup'));
    DOM.loginForm.addEventListener('submit', handleLoginSubmit);
    DOM.signupForm.addEventListener('submit', handleSignupSubmit);
    DOM.googleSignInBtn.addEventListener('click', handleGoogleSignIn);
    DOM.googleSignUpBtn.addEventListener('click', handleGoogleSignIn);
    DOM.forgotPasswordLink.addEventListener('click', (e) => { e.preventDefault(); handleForgotPassword(); });

    // User Menu
    DOM.userAvatarBtn.addEventListener('click', () => DOM.userMenu.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-user-area')) DOM.userMenu.classList.remove('open');
    });
    DOM.logoutBtn.addEventListener('click', async () => {
      await MinexusAuth.signOut();
      showToast('Logout ho gaye. Phir milenge!', 'info');
      DOM.userMenu.classList.remove('open');
      applyFilters('all');
    });
    if (DOM.navHistoryBtn) {
      DOM.navHistoryBtn.addEventListener('click', () => {
        DOM.userMenu.classList.remove('open');
        showWatchHistory();
      });
    }

    // Footer share
    const footerShare = document.getElementById('footerShareBtn');
    if (footerShare) {
      footerShare.addEventListener('click', (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(window.location.href);
        showToast('MINEXUS TV link copied!', 'success');
      });
    }

    // Browser back/forward for deep-linked movie URLs
    window.addEventListener('popstate', () => {
      if (!STATE.activeMovie) return;
      closeCinemaPlayer();
    });
  }

  async function showWatchHistory() {
    if (!MinexusAuth.isLoggedIn()) { openAuthModal(); return; }
    const history = await MinexusDB.getHistory(MinexusAuth.currentUser.uid);
    const items = history.map(h => ({
      id: h.id, title: h.title, poster: h.poster, type: h.type, year: h.year, rating: h.rating
    }));
    STATE.filtered = items;
    updateHeading('🕒 Watch History', 'Titles you previously streamed on MINEXUS TV');
    renderCatalog(items);
    window.scrollTo({ top: DOM.movieGrid.offsetTop - 100, behavior: 'smooth' });
  }

  /* ==========================================================================
     16. DEEP LINK HANDLING (open a movie directly from a shared /movie/tt.../ URL)
     ========================================================================== */
  async function handleDeepLink() {
    const path = window.location.pathname;
    const match = path.match(/^\/(movie|series)\/(tt\d+)/);
    if (!match) return;
    const [, type, id] = match;
    try {
      const item = await MinexusAPI.getMeta(type, id);
      if (requireAuth(item)) openCinemaPlayer(item);
    } catch (err) { /* invalid deep link id, ignore */ }
  }

  /* ==========================================================================
     17. APP INITIALIZATION
     ========================================================================== */
  function initApp() {
    cacheDom();
    setupEventListeners();
    bindFullscreenSync();
    setupPWAInstall();
    updateWatchlistCount();
    loadInitialCatalog();

    MinexusAuth.init((user) => {
      STATE.user = user;
      updateAuthUI(user);
      if (user) {
        startWatchlistSync(user.uid);
        renderPersonalizedRow();
      } else {
        STATE.watchlist = {};
        updateWatchlistCount();
        const section = document.getElementById('personalizedSection');
        if (section) section.style.display = 'none';
      }
    });

    handleDeepLink();
  }

  document.addEventListener('DOMContentLoaded', initApp);
})();