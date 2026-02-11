/* bad.js
   - Mobile Burger Menu (navToggle + navOverlay + navDrawer + navClose)  ✅ wie Waschbecken
   - Cards: Paging Carousel (prev/next) nur Desktop/Tablet
   - Hover stacking nur Desktop (non-touch)
   - Detail View + dynamische Gallery (nur vorhandene Bilder, keine Duplikate)
   - Zoom Overlay
*/

(() => {
  // Helpers
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];
  const isTouch = matchMedia('(hover: none)').matches;

  // -------------------------
  // Mobile Burger Menu (wie Waschbecken)
  // Benötigt HTML: .navToggle + .navOverlay + .navDrawer + .navClose
  // -------------------------
  (() => {
    const btn = qs('.navToggle');
    const overlay = qs('.navOverlay');
    const closeBtn = qs('.navClose', overlay || document);

    if (!btn || !overlay) return;

    const openNav = () => {
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
  })();

  // -------------------------
  // Detail view
  // -------------------------
  const gridView = qs('.bt-gridView');
  const detail = qs('.bt-detail');
  const backBtn = qs('.bt-back');

  if (!gridView || !detail) return;

  const fKicker = qs('#bKicker');
  const fTitle = qs('#bTitle');
  const fPrice = qs('#bPrice');
  const fDesc = qs('#bDesc');
  const fMaterial = qs('#bMaterial');
  const fSize = qs('#bSize');
  const fWeight = qs('#bWeight');
  const fMainImg = qs('#bMain');
  const gallery = qs('#bGallery');

  // Zoom
  const zoomBtn = qs('.bt-zoom');
  const zoomOverlay = qs('#zoomOverlay');
  const zoomImg = qs('#zoomImg');
  const zoomClose = qs('.bt-zoomOverlay__close');

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

  function getKicker(card) {
    const ds = card.dataset;
    return safeStr(ds.kicker) || (safeStr(ds.material) ? safeStr(ds.material).toUpperCase() : 'BADEWANNE');
  }

  function getMainFromCard(card) {
    const ds = card.dataset;
    const main = safeStr(ds.main);
    if (main) return main;

    const img = qs('img', qs('.card__media', card) || card);
    return safeStr(img?.getAttribute('src'));
  }

  function readThumbsFromCard(card, max = 6) {
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

    const mainUrl = getMainFromCard(card);
    const thumbUrls = readThumbsFromCard(card, 6);

    const uniq = [];
    const pushUniq = (u) => {
      const s = safeStr(u);
      if (!s) return;
      if (!uniq.includes(s)) uniq.push(s);
    };

    pushUniq(mainUrl);
    thumbUrls.forEach(pushUniq);

    // main setzen
    if (fMainImg && uniq[0]) fMainImg.src = uniq[0];

    // reset gallery
    gallery.innerHTML = '';

    // wenn nur 1 bild -> verstecken
    if (uniq.length <= 1) {
      gallery.style.display = 'none';
      return;
    }
    gallery.style.display = '';

    uniq.slice(0, 6).forEach((src, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bt-thumb' + (idx === 0 ? ' is-active' : '');
      btn.dataset.src = src;

      const img = document.createElement('img');
      img.src = src;
      img.alt = 'Detailansicht';

      btn.appendChild(img);
      gallery.appendChild(btn);
    });
  }

  function openDetail(card) {
    const ds = card.dataset;
    lastActiveCard = card;

    const title = safeStr(ds.title) || safeStr(qs('.card__title', card)?.textContent) || 'Badewanne';
    const price = safeStr(ds.price) || safeStr(qs('.card__price', card)?.textContent) || '';
    const desc = safeStr(ds.desc);

    setText(fKicker, getKicker(card));
    setText(fTitle, title);
    setText(fPrice, price);
    setText(fDesc, desc);

    setText(fMaterial, ds.material, '—');
    setText(fSize, ds.size, '—');
    setText(fWeight, ds.weight, '—');

    buildGallery(card);

    detail.hidden = false;
    detail.scrollTop = 0;
    lockBody(true);
    gridView.style.pointerEvents = 'none';
  }

  function closeDetail() {
    // zoom schließen falls offen
    if (zoomOverlay && !zoomOverlay.hidden) closeZoom();

    detail.hidden = true;
    lockBody(false);
    gridView.style.pointerEvents = '';
    lastActiveCard?.focus?.();
  }

  // Card click (delegiert)
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.bt-gridView .card');
    if (!card) return;
    if (e.target.closest('.cardsArrow')) return;
    openDetail(card);
  });

  backBtn?.addEventListener('click', closeDetail);

  // Thumbs -> swap main
  gallery?.addEventListener('click', (e) => {
    const btn = e.target.closest('.bt-thumb');
    if (!btn) return;

    qsa('.bt-thumb', gallery).forEach((t) => t.classList.remove('is-active'));
    btn.classList.add('is-active');

    const src = safeStr(btn.dataset.src);
    if (src && fMainImg) fMainImg.src = src;
  });

  // -------------------------
  // Zoom overlay
  // -------------------------
  function openZoom() {
    if (!zoomOverlay || !zoomImg || !fMainImg) return;
    const src = safeStr(fMainImg.src);
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
  // Hover stacking nur Desktop (non-touch)
  // -------------------------
  function bindHoverStacking(root = document) {
    if (isTouch) return;

    root.querySelectorAll('.bt-gridView .cardsPage').forEach((page) => {
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
  // Carousel paging (nur Desktop/Tablet)
  // Mobile: CSS macht Liste + transform:none; hier machen wir einfach nix.
  // -------------------------
  function initCarousel(wrap) {
    const track = qs('.cardsTrack', wrap);
    const pages = qsa('.cardsPage', wrap);
    const prev = qs('.cardsArrow--prev', wrap);
    const next = qs('.cardsArrow--next', wrap);

    if (!track || !pages.length || !prev || !next) return;

    let index = 0;

    function update() {
      // Mobile? -> nicht anfassen
      if (window.innerWidth <= 640) return;

      track.style.transform = `translateX(${-index * 100}%)`;
      prev.disabled = index === 0 || pages.length <= 1;
      next.disabled = index === pages.length - 1 || pages.length <= 1;
    }

    prev.addEventListener('click', () => {
      index = Math.max(0, index - 1);
      update();
    });

    next.addEventListener('click', () => {
      index = Math.min(pages.length - 1, index + 1);
      update();
    });

    window.addEventListener('resize', update);
    update();
  }

  qsa('.bt-gridView .cardsWrap').forEach((wrap) => initCarousel(wrap));
  bindHoverStacking(document);
})();
