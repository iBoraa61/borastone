/* bad.js
   Badewannen: Cards (4er-Paging mit Pfeilen) + Detail-Overlay + Zoom
   - Gallery wird dynamisch gebaut (nur vorhandene Bilder)
   - Keine Duplikate
   - Gallery verschwindet, wenn nur 1 Bild vorhanden
*/

// -------------------------
// Mobile Nav (wie Startseite)
// -------------------------
(() => {
  const btn = document.getElementById('navToggle');
  const overlay = document.getElementById('navOverlay');
  const closeBtn = document.getElementById('navClose');
  const drawer = overlay?.querySelector('.navDrawer');

  if (!btn || !overlay || !drawer) return;

  function openNav(){
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    btn.setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  function closeNav(){
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', () => {
    const isOpen = overlay.classList.contains('is-open');
    isOpen ? closeNav() : openNav();
  });

  closeBtn?.addEventListener('click', closeNav);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeNav();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeNav();
  });

  overlay.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => closeNav());
  });
})();

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const gridView = $('.bt-gridView');
  const detail = $('.bt-detail');
  const backBtn = $('.bt-back');

  if (!gridView || !detail) return;

  // Detail fields
  const fKicker = $('#bKicker');
  const fTitle = $('#bTitle');
  const fPrice = $('#bPrice');
  const fDesc = $('#bDesc');
  const fMaterial = $('#bMaterial');
  const fSize = $('#bSize');
  const fWeight = $('#bWeight');
  const fMainImg = $('#bMain');
  const gallery = $('#bGallery');

  // Zoom elements
  const zoomBtn = $('.bt-zoom');
  const zoomOverlay = $('#zoomOverlay');
  const zoomImg = $('#zoomImg');
  const zoomClose = $('.bt-zoomOverlay__close');

  let lastActiveCard = null;

  function lockBody(lock) {
    document.documentElement.style.overflow = lock ? 'hidden' : '';
    document.body.style.overflow = lock ? 'hidden' : '';
  }

  function setText(el, value, fallback = '') {
    if (!el) return;
    el.textContent = value && String(value).trim() ? value : fallback;
  }

  function safeSrc(url) {
    const s = (url && String(url).trim()) ? String(url).trim() : '';
    return s;
  }

  function getKicker(card) {
    const ds = card.dataset;
    if (ds.kicker) return ds.kicker;
    if (ds.material) return String(ds.material).toUpperCase();
    return 'BADEWANNE';
  }

  function getMainFromCard(card) {
    const ds = card.dataset;

    // 1) data-main
    if (safeSrc(ds.main)) return safeSrc(ds.main);

    // 2) img aus der Card
    const img = $('img', $('.card__media', card) || card);
    const src = img?.getAttribute('src') || '';
    return safeSrc(src);
  }

  function readThumbsFromCard(card) {
    const ds = card.dataset;
    const thumbs = [];
    for (let i = 1; i <= 6; i++) {
      const key = `thumb${i}`;
      const val = safeSrc(ds[key]);
      if (val) thumbs.push(val);
    }
    return thumbs;
  }

  function buildGallery(card) {
    if (!gallery) return;

    const mainUrl = getMainFromCard(card);
    const thumbUrls = readThumbsFromCard(card);

    // Uniq list (main zuerst)
    const uniq = [];
    const pushUniq = (u) => {
      const s = safeSrc(u);
      if (!s) return;
      if (!uniq.includes(s)) uniq.push(s);
    };

    pushUniq(mainUrl);
    thumbUrls.forEach(pushUniq);

    // Main Image setzen
    if (fMainImg && uniq[0]) fMainImg.src = uniq[0];

    // Gallery reset
    gallery.innerHTML = '';

    // Wenn es nur 1 Bild gibt: Gallery ausblenden
    if (uniq.length <= 1) {
      gallery.style.display = 'none';
      return;
    }
    gallery.style.display = '';

    // Buttons bauen (max 6)
    uniq.slice(0, 6).forEach((src, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bt-thumb' + (idx === 0 ? ' is-active' : '');
      btn.setAttribute('data-src', src);

      const img = document.createElement('img');
      img.src = src;
      img.alt = 'Detailansicht';

      btn.appendChild(img);
      gallery.appendChild(btn);
    });
  }

  function openDetail() {
    detail.hidden = false;
    lockBody(true);
    detail.scrollTop = 0;
    gridView.style.pointerEvents = 'none';
  }

  function closeDetail() {
    // Zoom sicher schließen
    if (zoomOverlay && !zoomOverlay.hidden) {
      zoomOverlay.hidden = true;
      if (zoomImg) zoomImg.src = '';
    }

    detail.hidden = true;
    lockBody(false);
    gridView.style.pointerEvents = '';

    if (lastActiveCard) lastActiveCard.focus?.();
  }

  function openFromCard(card) {
    const ds = card.dataset;
    lastActiveCard = card;

    const title = ds.title || $('.card__title', card)?.textContent || 'Badewanne';
    const price = ds.price || $('.card__price', card)?.textContent || '';
    const desc = ds.desc || '';

    setText(fKicker, getKicker(card));
    setText(fTitle, title);
    setText(fPrice, price);
    setText(fDesc, desc);

    setText(fMaterial, ds.material || '', '—');
    setText(fSize, ds.size || '', '—');
    setText(fWeight, ds.weight || '', '—');

    buildGallery(card);
    openDetail();
  }

  // Hover stacking effect (pro Page)
  $$('.cardsPage', gridView).forEach((page) => {
    const cards = $$('.card', page);

    cards.forEach((card) => {
      card.setAttribute('tabindex', '0');

      card.addEventListener('mouseenter', () => {
        page.classList.add('is-dim');
        cards.forEach(c => c.classList.remove('is-hover'));
        card.classList.add('is-hover');
      });

      card.addEventListener('mouseleave', () => {
        card.classList.remove('is-hover');
        page.classList.remove('is-dim');
      });

      card.addEventListener('click', () => openFromCard(card));

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openFromCard(card);
        }
      });
    });
  });

  // Carousel paging (4er-Seiten)
  $$('.cardsWrap', gridView).forEach((wrap) => {
    const track = $('.cardsTrack', wrap);
    const pages = $$('.cardsPage', wrap);
    const prev = $('.cardsArrow--prev', wrap);
    const next = $('.cardsArrow--next', wrap);

    if (!track || !pages.length || !prev || !next) return;

    let index = 0;

    function update() {
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

    update();
  });

  // Back + ESC
  backBtn?.addEventListener('click', closeDetail);

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;

    // erst Zoom schließen
    if (zoomOverlay && !zoomOverlay.hidden) {
      zoomOverlay.hidden = true;
      if (zoomImg) zoomImg.src = '';
      return;
    }

    if (!detail.hidden) closeDetail();
  });

  // Gallery thumbs -> swap main (delegiert)
  gallery?.addEventListener('click', (e) => {
    const btn = e.target.closest('.bt-thumb');
    if (!btn) return;

    $$('.bt-thumb', gallery).forEach(t => t.classList.remove('is-active'));
    btn.classList.add('is-active');

    const src = safeSrc(btn.getAttribute('data-src'));
    if (src && fMainImg) fMainImg.src = src;
  });

  // Zoom
  function openZoom() {
    if (!zoomOverlay || !zoomImg || !fMainImg) return;
    if (!safeSrc(fMainImg.src)) return;
    zoomImg.src = fMainImg.src;
    zoomOverlay.hidden = false;
  }

  function closeZoom() {
    if (!zoomOverlay) return;
    zoomOverlay.hidden = true;
    if (zoomImg) zoomImg.src = '';
  }

  zoomBtn?.addEventListener('click', openZoom);
  zoomClose?.addEventListener('click', closeZoom);

  zoomOverlay?.addEventListener('click', (e) => {
    if (e.target === zoomOverlay) closeZoom();
  });
})();

