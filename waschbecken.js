/* waschbecken.js (angepasst / einheitlich)
   - Mobile Burger Menu: IDENTISCH zur bad.js Logik (class-basiert, robust)
   - Tabs (Stand/Wand)
   - Paging Carousel (prev/next) + responsive (4/2/1)
   - Hover stacking (nur Desktop)
   - Detail View + dynamische Gallery (uniq thumbs)
   - Zoom Overlay
*/

(() => {
  // Helpers
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];
  const isTouch = matchMedia('(hover: none)').matches;

  // -------------------------
  // Mobile Burger Menu (EINHEITLICH wie bad.js)
  // Benötigt HTML: .navToggle + #navOverlay (oder .navOverlay) + .navClose
  // Empfehlung im HTML: <div class="navOverlay" id="navOverlay" hidden ...>
  // + CSS: .navOverlay[hidden]{ display:none; }
  // -------------------------
  (() => {
    const btn = qs('.navToggle');
    const overlay = qs('#navOverlay') || qs('.navOverlay');
    const closeBtn = qs('.navClose', overlay || document);

    if (!btn || !overlay) return;

    const openNav = () => {
      // wenn du hidden nutzt:
      overlay.hidden = false;
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      btn.setAttribute('aria-expanded', 'true');
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    };

    const closeNav = () => {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      btn.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      // wenn du hidden nutzt:
      overlay.hidden = true;
    };

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      overlay.classList.contains('is-open') ? closeNav() : openNav();
    });

    closeBtn?.addEventListener('click', closeNav);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeNav();
    });

    // close when clicking a link in mobile nav
    qsa('a', overlay).forEach((a) => a.addEventListener('click', closeNav));

    // ESC closes
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeNav();
    });

    // Wenn man von Mobile -> Desktop resized: Menü zu (verhindert "hängendes" Overlay)
    window.addEventListener('resize', () => {
      if (window.innerWidth > 980 && overlay.classList.contains('is-open')) closeNav();
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

  // Default
  setTab('stand');

  tabs.forEach((btn) => {
    btn.addEventListener('click', () => setTab(btn.dataset.tab));
  });

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

  // Zoom overlay
  const zoomOverlay = qs('#zoomOverlay');
  const zoomImg = qs('#zoomImg');
  const zoomBtn = qs('.wb-zoom');
  const zoomClose = qs('.wb-zoomOverlay__close');

  let lastActiveCard = null;

  function safeStr(v) {
    return v && String(v).trim() ? String(v).trim() : '';
  }

  function lockBody(lock) {
    document.documentElement.style.overflow = lock ? 'hidden' : '';
    document.body.style.overflow = lock ? 'hidden' : '';
  }

  function setText(el, value, fallback = '') {
    if (!el) return;
    const v = safeStr(value);
    el.textContent = v ? v : fallback;
  }

  function getMainFromCard(card) {
    const ds = card.dataset;
    const main = safeStr(ds.main);
    if (main) return main;

    const img = qs('img', qs('.card__media', card) || card);
    return safeStr(img?.getAttribute('src'));
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

    const mainSrc = getMainFromCard(card);
    const thumbs = getThumbs(card, 6);

    const uniq = [];
    const pushUniq = (src) => {
      const s = safeStr(src);
      if (!s) return;
      if (!uniq.includes(s)) uniq.push(s);
    };

    pushUniq(mainSrc);
    thumbs.forEach(pushUniq);

    // main setzen
    if (dMain && uniq[0]) dMain.src = uniq[0];

    // wenn nur 1 bild -> gallery aus
    if (uniq.length <= 1) {
      gallery.style.display = 'none';
      return;
    }
    gallery.style.display = '';

    uniq.slice(0, 6).forEach((src, idx) => {
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
    lastActiveCard = card;

    const ds = card.dataset;

    setText(dType, ds.type, 'WASCHBECKEN');
    setText(dTitle, ds.title, 'Produkt');
    setText(dPrice, ds.price, '');
    setText(dDesc, ds.desc, '');

    setText(sMaterial, ds.specMaterial, '—');
    setText(sSize, ds.specSize, '—');
    setText(sFinish, ds.specFinish, '—');
    setText(sLead, ds.specLead, '—');

    buildGallery(card);

    detail.hidden = false;
    detail.scrollTop = 0;

    lockBody(true);
    qsa('.wb-gridView').forEach((v) => (v.style.pointerEvents = 'none'));
  }

  function closeDetail() {
    if (!detail) return;

    // Zoom schließen falls offen
    if (zoomOverlay && !zoomOverlay.hidden) closeZoom();

    detail.hidden = true;
    lockBody(false);
    qsa('.wb-gridView').forEach((v) => (v.style.pointerEvents = ''));
    lastActiveCard?.focus?.();
  }

  // Card click (nur innerhalb gridView öffnen)
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.wb-gridView .card');
    if (!card) return;
    if (e.target.closest('.cardsArrow')) return;
    openDetail(card);
  });

  backBtn?.addEventListener('click', closeDetail);

  // Thumb click -> swap main
  gallery?.addEventListener('click', (e) => {
    const btn = e.target.closest('.wb-thumb');
    if (!btn) return;

    qsa('.wb-thumb', gallery).forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');

    const src = safeStr(btn.dataset.src);
    if (src && dMain) dMain.src = src;
  });

  // -------------------------
  // Zoom overlay
  // -------------------------
  function openZoom() {
    if (!zoomOverlay || !zoomImg || !dMain) return;
    const src = safeStr(dMain.src);
    if (!src) return;
    zoomImg.src = src;
    zoomOverlay.hidden = false;
    lockBody(true);
  }

  function closeZoom() {
    if (!zoomOverlay || !zoomImg) return;
    zoomOverlay.hidden = true;
    zoomImg.src = '';
    // wenn detail offen bleibt body locked – sonst freigeben
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
  // Carousel pagination: 4 / 2 / 1
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

    // alle Cards aus Track holen
    const allCards = [...track.querySelectorAll('.card')];

    // alte pages entfernen
    [...track.querySelectorAll('.cardsPage')].forEach((p) => p.remove());

    // neu bauen
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
