/* waschbecken.js
   - Tabs (Stand/Wand)
   - 4er Paging Carousel (prev/next)
   - Hover stacking
   - Detail View + dynamische Gallery (zeigt nur vorhandene Bilder)
   - Zoom Overlay
   - (Wheel-Blocker wie vorher)
*/

(() => {
  // Helpers
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];

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

  // Default: stand
  setTab('stand');

  // Tab click
  tabs.forEach((btn) => {
    btn.addEventListener('click', () => setTab(btn.dataset.tab));
  });

  // -------------------------
  // Hover stacking effect
  // (re-bind after DOM changes)
  // -------------------------
  function bindHoverStacking(root = document) {
    root.querySelectorAll('.cardsPage').forEach((page) => {
      const cards = [...page.querySelectorAll('.card')];

      cards.forEach((card) => {
        // avoid double-binding
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
  // Detail view logic
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

  // liest thumb1..thumb6 aus data-attrs (erweitere gern auf 10 wenn du willst)
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

    // unique list: main zuerst, dann thumbs
    const uniq = [];
    const pushUniq = (src) => {
      const s = safeStr(src);
      if (!s) return;
      if (!uniq.includes(s)) uniq.push(s);
    };

    pushUniq(mainSrc);
    thumbs.forEach(pushUniq);

    // Wenn nur 1 Bild existiert: keine Thumbnail-Leiste anzeigen (optional)
    // -> wenn du IMMER 1 Thumb willst, kommentiere die nächste Zeile aus
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

    // ✅ dynamisch: zeigt nur die vorhandenen Bilder
    buildGallery(card);

    detail.hidden = false;
    detail.scrollTop = 0;

    // lock background interactions
    qsa('.wb-gridView').forEach((v) => (v.style.pointerEvents = 'none'));
  }

  function closeDetail() {
    if (!detail) return;
    detail.hidden = true;
    qsa('.wb-gridView').forEach((v) => (v.style.pointerEvents = ''));
  }

  // Delegate click for cards (works even after moving cards into pages)
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;

    // Don't open detail when clicking arrows etc.
    const inArrow = e.target.closest('.cardsArrow');
    if (inArrow) return;

    openDetail(card);
  });

  backBtn?.addEventListener('click', closeDetail);

  // Thumb click => swap main (delegation, weil thumbs dynamisch sind)
  gallery?.addEventListener('click', (e) => {
    const btn = e.target.closest('.wb-thumb');
    if (!btn) return;

    [...gallery.querySelectorAll('.wb-thumb')].forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');

    const src = safeStr(btn.dataset.src);
    if (src) dMain.src = src;
  });

  // -------------------------
  // Wheel-scroll handling
  // Allow scroll in cardsWrap + detail only
  // -------------------------
  window.addEventListener(
    'wheel',
    (e) => {
      const inCards = e.target.closest('.cardsWrap'); // ✅ wichtig (statt .cards)
      const inDetail = e.target.closest('.wb-detail');
      if (!inCards && !inDetail) e.preventDefault();
    },
    { passive: false }
  );

  // -------------------------
  // Zoom overlay
  // -------------------------
  const zoomOverlay = document.getElementById('zoomOverlay');
  const zoomImg = document.getElementById('zoomImg');
  const zoomBtn = document.querySelector('.wb-zoom');
  const zoomClose = document.querySelector('.wb-zoomOverlay__close');

  function openZoom() {
    if (!zoomOverlay || !zoomImg) return;
    zoomImg.src = dMain?.src || '';
    zoomOverlay.hidden = false;
  }
  function closeZoom() {
    if (!zoomOverlay || !zoomImg) return;
    zoomOverlay.hidden = true;
    zoomImg.src = '';
  }

  zoomBtn?.addEventListener('click', openZoom);
  zoomClose?.addEventListener('click', closeZoom);
  zoomOverlay?.addEventListener('click', (e) => {
    if (e.target === zoomOverlay) closeZoom();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && zoomOverlay && !zoomOverlay.hidden) closeZoom();
  });

  // -------------------------
  // Auto: split cards into pages of 4 (for each carousel)
  // Works even if you put all cards in one cardsPage
  // -------------------------
  function paginateCarousel(wrap, perPage = 4) {
    const track = wrap.querySelector('.cardsTrack');
    if (!track) return;

    // Collect all cards inside track (no matter how currently grouped)
    const allCards = [...track.querySelectorAll('.card')];

    // If already perfectly paginated, keep as is
    const existingPages = [...track.querySelectorAll('.cardsPage')];
    const existingCount = existingPages.reduce(
      (sum, p) => sum + p.querySelectorAll('.card').length,
      0
    );

    const needsRebuild =
      existingPages.length === 0 ||
      existingCount !== allCards.length ||
      existingPages.some((p) => p.querySelectorAll('.card').length > perPage);

    if (!needsRebuild) return;

    // Remove old pages
    existingPages.forEach((p) => p.remove());

    // Build new pages
    for (let i = 0; i < allCards.length; i += perPage) {
      const page = document.createElement('div');
      page.className = 'cardsPage';
      allCards.slice(i, i + perPage).forEach((card) => page.appendChild(card));
      track.appendChild(page);
    }
  }

  // -------------------------
  // 4-up carousel paging (prev/next)
  // -------------------------
  function initCarousel(wrap) {
    const track = wrap.querySelector('.cardsTrack');
    const prev = wrap.querySelector('.cardsArrow--prev');
    const next = wrap.querySelector('.cardsArrow--next');

    if (!track || !prev || !next) return;

    let index = 0;

    const getPages = () => [...wrap.querySelectorAll('.cardsPage')];

    function update() {
      const pages = getPages();
      track.style.transform = `translateX(${-index * 100}%)`;
      prev.disabled = index === 0 || pages.length <= 1;
      next.disabled = index === pages.length - 1 || pages.length <= 1;
    }

    prev.addEventListener('click', () => {
      const pages = getPages();
      index = Math.max(0, index - 1);
      if (index > pages.length - 1) index = pages.length - 1;
      update();
    });

    next.addEventListener('click', () => {
      const pages = getPages();
      index = Math.min(pages.length - 1, index + 1);
      update();
    });

    // Reset carousel when switching tabs
    const tabName = wrap.getAttribute('data-carousel');
    const tabBtn = document.querySelector(`.wb-tabs__btn[data-tab="${tabName}"]`);
    tabBtn?.addEventListener('click', () => {
      index = 0;
      update();
    });

    // expose refresh
    wrap.__refreshCarousel = () => {
      index = 0;
      update();
    };

    update();
  }

  // Init all carousels
  document.querySelectorAll('.cardsWrap').forEach((wrap) => {
    paginateCarousel(wrap, 4);
    initCarousel(wrap);
  });

  // Bind hover AFTER paginate (important)
  bindHoverStacking(document);
})();
