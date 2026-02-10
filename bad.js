/* bad.js
   Badewannen: Cards (4er-Paging mit Pfeilen) + Detail-Overlay + Zoom
*/

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
    return (url && String(url).trim()) ? url : '';
  }

  function getKicker(card) {
    const ds = card.dataset;
    if (ds.kicker) return ds.kicker;
    if (ds.material) return String(ds.material).toUpperCase();
    return 'BADEWANNE';
  }

  function readThumbsFromCard(card) {
    const ds = card.dataset;
    const thumbs = [];
    for (let i = 1; i <= 6; i++) {
      const key = `thumb${i}`;
      if (ds[key]) thumbs.push(ds[key]);
    }
    return thumbs;
  }

  function buildGallery(thumbUrls, mainUrl) {
    if (!gallery) return;
    gallery.innerHTML = '';

    const uniq = [];
    const pushUniq = (u) => {
      const s = safeSrc(u);
      if (!s) return;
      if (!uniq.includes(s)) uniq.push(s);
    };

    pushUniq(mainUrl);
    thumbUrls.forEach(pushUniq);

    if (!uniq.length) return;

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

  function setMainImage(src) {
    const s = safeSrc(src);
    if (fMainImg && s) fMainImg.src = s;
  }

  function openDetail() {
    detail.hidden = false;
    lockBody(true);
    detail.scrollTop = 0;
    gridView.style.pointerEvents = 'none';
  }

  function closeDetail() {
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
    const main =
      ds.main ||
      $('img', $('.card__media', card) || card)?.getAttribute('src') ||
      '';

    setText(fKicker, getKicker(card));
    setText(fTitle, title);
    setText(fPrice, price);
    setText(fDesc, desc);

    setText(fMaterial, ds.material || '', '—');
    setText(fSize, ds.size || '', '—');
    setText(fWeight, ds.weight || '', '—');

    setMainImage(main);
    buildGallery(readThumbsFromCard(card), main);

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
      prev.disabled = index === 0;
      next.disabled = index === pages.length - 1;
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
  if (backBtn) backBtn.addEventListener('click', closeDetail);

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;

    // erst Zoom schließen
    if (zoomOverlay && !zoomOverlay.hidden) {
      zoomOverlay.hidden = true;
      return;
    }

    if (!detail.hidden) closeDetail();
  });

  // Gallery thumbs -> swap main
  if (gallery) {
    gallery.addEventListener('click', (e) => {
      const btn = e.target.closest('.bt-thumb');
      if (!btn) return;

      $$('.bt-thumb', gallery).forEach(t => t.classList.remove('is-active'));
      btn.classList.add('is-active');

      const src = btn.getAttribute('data-src');
      if (src) setMainImage(src);
    });
  }

  // Zoom
  function openZoom() {
    if (!zoomOverlay || !zoomImg || !fMainImg) return;
    zoomImg.src = fMainImg.src;
    zoomOverlay.hidden = false;
  }

  function closeZoom() {
    if (!zoomOverlay) return;
    zoomOverlay.hidden = true;
    if (zoomImg) zoomImg.src = '';
  }

  if (zoomBtn) zoomBtn.addEventListener('click', openZoom);
  if (zoomClose) zoomClose.addEventListener('click', closeZoom);

  if (zoomOverlay) {
    zoomOverlay.addEventListener('click', (e) => {
      if (e.target === zoomOverlay) closeZoom();
    });
  }
})();
