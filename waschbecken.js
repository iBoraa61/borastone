/* waschbecken.js
   - Tabs (Stand/Wand)
   - Paging Carousel (prev/next) + responsive (4/2/1)
   - Hover stacking (nur Desktop)
   - Detail View + dynamische Gallery
   - Zoom Overlay
   - Mobile Burger Menu (navToggle + navOverlay + navDrawer)
*/

(() => {
  // Helpers
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];

  const isTouch = matchMedia('(hover: none)').matches;

  // -------------------------
  // Mobile Burger Menu (navOverlay/navDrawer)
  // Benötigt HTML: .navToggle + .navOverlay + .navDrawer + .navClose
  // -------------------------
  (() => {
    const btn = qs('.navToggle');
    const overlay = qs('.navOverlay');
    const closeBtn = qs('.navClose', overlay || document);

    if (!btn || !overlay) return;

    const openNav = () => {
      overlay.classList.add('is-open');
      document.body.classList.add('is-navOpen');
      btn.setAttribute('aria-expanded', 'true');
    };

    const closeNav = () => {
      overlay.classList.remove('is-open');
      document.body.classList.remove('is-navOpen');
      btn.setAttribute('aria-expanded', 'false');
    };

    btn.addEventListener('click', () => {
      const isOpen = overlay.classList.contains('is-open');
      if (isOpen) closeNav();
      else openNav();
    });

    closeBtn?.addEventListener('click', closeNav);

    // click outside drawer closes
    overlay.addEventListener('click', (e) => {
      const drawer = qs('.navDrawer', overlay);
      if (!drawer) return;
      if (e.target === overlay) closeNav();
    });

    // close when clicking a link in mobile nav
    qsa('a', overlay).forEach((a) => a.addEventListener('click', closeNav));

    // ESC closes
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeNav();
    });
  })();

  // -------------------------
  // Tabs
  // -------------------------
  const tabs = qsa('.wb-tabs__btn');
  const panels = qsa('.wb-panel');

  function setTab(name) {
    tabs.forEach((b) => {
      const active = b.dataset.tab === name;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    panels.forEach((p) => p.classList.toggle('is-active', p.dataset.panel === name));
  }

  setTab('stand');
  tabs.forEach((btn) => btn.addEventListener('click', () => setTab(btn.dataset.tab)));

  // -------------------------
  // Hover stacking (nur Desktop / non-touch)
  // -------------------------
  function bindHoverStacking(root = document) {
    if (isTouch) return;

    root.querySelectorAll('.cardsPage').forEach((page) => {
      const cards = [...page.querySelectorAll('.card')];

      cards.forEach((card) => {
        if (card.__hoverBound) return;
        card.__hoverBound = true;

        card.addEventListener('mouseenter', () => {
          page.classList.add('is-dim');
          cards.forEach((c) => c.classList.remove('is-hover'));
          card.classList.add('is-hover');
        });

        card.addEventListener('mouseleave', () => {
          card.classList.remove('is-hover');
          page.classList.remove('is-dim');
        });
      });
    });
  }

  // -------------------------
  // Detail view
  // -------------------------
  const detail = qs('.wb-detail');
  const backBtn = qs('.wb-back');

  const dType = qs('#dType');
  const dTitle = qs('#dTitle');
  const dPrice = qs('#dPrice');
  const dDesc = qs('#dDesc');
  const dMain = qs('#dMain');

  const sMaterial = qs('#sMaterial');
  const sSize = qs('#sSize');
  const sFinish = qs('#sFinish');
  const sLead = qs('#sLead');

  const gallery = qs('#dGallery');

  function safeStr(v) {
    return (v && String(v).trim()) ? String(v).trim() : '';
  }

  function lockBody(lock) {
    document.documentElement.style.overflow = lock ? 'hidden' : '';
    document.body.style.overflow = lock ? 'hidden' : '';
  }

  function getThumbs(card, max = 6) {
    const ds = card.dataset;
    const out = [];
    for (let i = 1; i <= max; i++) {
      const v = safeStr(ds[`thumb${i}`]);
      if (v) out.push(v);
    }
    return out;
  }

  function buildGallery(card) {
    if (!gallery) return;
    gallery.innerHTML = '';

    const mainSrc = safeStr(card.dataset.main);
    const thumbs = getThumbs(card, 6);

    const uniq = [];
    const pushUniq = (src) => {
      const s = safeStr(src);
      if (!s) return;
      if (!uniq.includes(s)) uniq.push(s);
    };

    pushUniq(mainSrc);
    thumbs.forEach(pushUniq);

    if (uniq.length <= 1) return;

    uniq.forEach((src, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'wb-thumb' + (idx === 0 ? ' is-active' : '');
      btn.dataset.src = src;

      const img = document.createElement('img');
      img.src = src;
      img.alt = 'Detailansicht';

      btn.appendChild(img);
      gallery.appendChild(btn);
    });
  }

  function openDetail(card) {
    if (!detail) return;

    dType.textContent = safeStr(card.dataset.type);
    dTitle.textContent = safeStr(card.dataset.title);
    dPrice.textContent = safeStr(card.dataset.price);
    dDesc.textContent = safeStr(card.dataset.desc);

    sMaterial.textContent = safeStr(card.dataset.specMaterial);
    sSize.textContent = safeStr(card.dataset.specSize);
    sFinish.textContent = safeStr(card.dataset.specFinish);
    sLead.textContent = safeStr(card.dataset.specLead);

    const mainSrc = safeStr(card.dataset.main);
    dMain.src = mainSrc;

    buildGallery(card);

    detail.hidden = false;
    detail.scrollTop = 0;

    lockBody(true);
    qsa('.wb-gridView').forEach((v) => (v.style.pointerEvents = 'none'));
  }

  function closeDetail() {
    if (!detail) return;
    detail.hidden = true;

    // falls Zoom offen war
    if (zoomOverlay && !zoomOverlay.hidden) closeZoom();

    lockBody(false);
    qsa('.wb-gridView').forEach((v) => (v.style.pointerEvents = ''));
  }

  // Card click (nur innerhalb gridView öffnen)
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.wb-gridView .card');
    if (!card) return;
    if (e.target.closest('.cardsArrow')) return;
    openDetail(card);
  });

  backBtn?.addEventListener('click', closeDetail);

  // Thumb click
  gallery?.addEventListener('click', (e) => {
    const btn = e.target.closest('.wb-thumb');
    if (!btn) return;

    [...gallery.querySelectorAll('.wb-thumb')].forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');

    const src = safeStr(btn.dataset.src);
    if (src) dMain.src = src;
  });

  // -------------------------
  // Zoom overlay
  // -------------------------
  const zoomOverlay = qs('#zoomOverlay');
  const zoomImg = qs('#zoomImg');
  const zoomBtn = qs('.wb-zoom');
  const zoomClose = qs('.wb-zoomOverlay__close');

  function openZoom() {
    if (!zoomOverlay || !zoomImg) return;
    zoomImg.src = dMain?.src || '';
    zoomOverlay.hidden = false;
    lockBody(true);
  }

  function closeZoom() {
    if (!zoomOverlay || !zoomImg) return;
    zoomOverlay.hidden = true;
    zoomImg.src = '';
    // Body bleibt gelockt, wenn Detail offen ist
    if (!(detail && !detail.hidden)) lockBody(false);
  }

  zoomBtn?.addEventListener('click', openZoom);
  zoomClose?.addEventListener('click', closeZoom);
  zoomOverlay?.addEventListener('click', (e) => {
    if (e.target === zoomOverlay) closeZoom();
  });

  // ESC: Zoom zuerst, sonst Detail schließen
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (zoomOverlay && !zoomOverlay.hidden) return closeZoom();
    if (detail && !detail.hidden) return closeDetail();
  });

  // -------------------------
  // Wheel-blocker NUR Desktop
  // -------------------------
  if (!isTouch) {
    window.addEventListener(
      'wheel',
      (e) => {
        const inCards = e.target.closest('.cardsWrap');
        const inDetail = e.target.closest('.wb-detail');
        if (!inCards && !inDetail) e.preventDefault();
      },
      { passive: false }
    );
  }

  // -------------------------
  // Carousel pagination: 4 / 2 / 1
  // WICHTIG: Cards nur aus dem jeweiligen wrap sammeln
  // -------------------------
  function getPerPage() {
    const w = window.innerWidth;
    if (w <= 640) return 1;
    if (w <= 900) return 2;
    return 4;
  }

  function paginateCarousel(wrap, perPage) {
    const track = qs('.cardsTrack', wrap);
    if (!track) return;

    // NUR cards aus diesem track (nicht aus Detail!)
    const allCards = [...track.querySelectorAll('.card')];

    // pages platt machen und neu bauen (sicher & einfach)
    [...track.querySelectorAll('.cardsPage')].forEach((p) => p.remove());

    for (let i = 0; i < allCards.length; i += perPage) {
      const page = document.createElement('div');
      page.className = 'cardsPage';
      allCards.slice(i, i + perPage).forEach((card) => page.appendChild(card));
      track.appendChild(page);
    }
  }

  function initCarousel(wrap) {
    const track = qs('.cardsTrack', wrap);
    const prev = qs('.cardsArrow--prev', wrap);
    const next = qs('.cardsArrow--next', wrap);
    if (!track || !prev || !next) return;

    let index = 0;

    const getPages = () => [...wrap.querySelectorAll('.cardsPage')];

    function update() {
      const pages = getPages();
      if (index > pages.length - 1) index = Math.max(0, pages.length - 1);

      track.style.transform = `translateX(${-index * 100}%)`;
      prev.disabled = index === 0 || pages.length <= 1;
      next.disabled = index === pages.length - 1 || pages.length <= 1;
    }

    prev.addEventListener('click', () => {
      index = Math.max(0, index - 1);
      update();
    });

    next.addEventListener('click', () => {
      index = Math.min(getPages().length - 1, index + 1);
      update();
    });

    // Reset carousel when switching tabs
    const tabName = wrap.getAttribute('data-carousel');
    const tabBtn = qs(`.wb-tabs__btn[data-tab="${tabName}"]`);
    tabBtn?.addEventListener('click', () => {
      index = 0;
      update();
    });

    // responsive rebuild on resize
    let lastPerPage = getPerPage();
    window.addEventListener('resize', () => {
      const now = getPerPage();
      if (now === lastPerPage) return;
      lastPerPage = now;

      paginateCarousel(wrap, now);
      index = 0;
      bindHoverStacking(document);
      update();
    });

    update();
  }

  // Init
  document.querySelectorAll('.cardsWrap').forEach((wrap) => {
    paginateCarousel(wrap, getPerPage());
    initCarousel(wrap);
  });

  bindHoverStacking(document);
})();
