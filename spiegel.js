(() => {
  'use strict';

  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const safeStr = (v) => (typeof v === 'string' ? v : '');

  // Mobile Nav
  const toggle   = qs('.navToggle');
  const overlay  = qs('.navOverlay');
  const closeBtn = qs('#navClose');

  function navOpen() { if (!overlay) return; overlay.hidden = false; overlay.setAttribute('aria-hidden', 'false'); toggle?.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; }
  function navClose() { if (!overlay) return; overlay.hidden = true; overlay.setAttribute('aria-hidden', 'true'); toggle?.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
  toggle?.addEventListener('click', navOpen);
  closeBtn?.addEventListener('click', navClose);
  overlay?.addEventListener('click', (e) => { if (e.target === overlay) navClose(); });

  // Detail view refs
  const detail    = qs('.wb-detail');
  const backBtn   = qs('.wb-back');
  const dType     = qs('#dType');
  const dTitle    = qs('#dTitle');
  const dPrice    = qs('#dPrice');
  const dDesc     = qs('#dDesc');
  const dMain     = qs('#dMain');
  const gallery   = qs('#dGallery');
  const sMaterial = qs('#sMaterial');
  const sSize     = qs('#sSize');
  const sFinish   = qs('#sFinish');
  const sLead     = qs('#sLead');
  const zoomBtn     = qs('.wb-zoom');
  const zoomOverlay = qs('#zoomOverlay');
  const zoomImg     = qs('#zoomImg');
  const zoomClose   = qs('.wb-zoomOverlay__close');

  let lastActiveCard = null;

  function lockBody(lock) { document.body.style.overflow = lock ? 'hidden' : ''; }
  function setText(el, val, fallback = '—') { if (el) el.textContent = safeStr(val) || fallback; }

  function buildGallery(card) {
    if (!gallery) return;
    gallery.innerHTML = '';
    const ds = card.dataset;
    const srcs = [ds.main, ds.thumb1, ds.thumb2, ds.thumb3, ds.thumb4, ds.thumb5].map(safeStr).filter(Boolean);
    const uniq = [...new Set(srcs)];
    if (dMain && uniq[0]) dMain.src = uniq[0];
    if (uniq.length <= 1) { gallery.style.display = 'none'; return; }
    gallery.style.display = '';
    uniq.forEach((src, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'wb-thumb' + (idx === 0 ? ' is-active' : '');
      btn.dataset.src = src;
      const img = document.createElement('img');
      img.src = src; img.alt = 'Detailansicht';
      btn.appendChild(img);
      gallery.appendChild(btn);
    });
  }

  function openDetail(card) {
    if (!detail) return;
    lastActiveCard = card;
    const ds = card.dataset;
    setText(dType,     ds.type,         'SPIEGEL');
    setText(dTitle,    ds.title,        'Produkt');
    setText(dPrice,    ds.price,        '');
    setText(dDesc,     ds.desc,         '');
    setText(sMaterial, ds.specMaterial, '—');
    setText(sSize,     ds.specSize,     '—');
    setText(sFinish,   ds.specFinish,   '—');
    setText(sLead,     ds.specLead,     '—');
    buildGallery(card);
    detail.hidden = false;
    detail.scrollTop = 0;
    lockBody(true);

    const _t = safeStr(ds.title) || 'produkt';
    history.pushState({ p: _t }, '', '?p=' + encodeURIComponent(_t));
  }

  function closeDetail() {
    if (!detail) return;
    if (zoomOverlay && !zoomOverlay.hidden) closeZoom();
    detail.hidden = true;
    lockBody(false);
    lastActiveCard?.focus?.();

    if (location.search) history.pushState(null, '', location.pathname);
  }

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.wb-gridView .card');
    if (!card) return;
    const _t = safeStr(card.dataset.title);
    const url = location.pathname + (_t ? '?p=' + encodeURIComponent(_t) : '');
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  });

  backBtn?.addEventListener('click', closeDetail);

  gallery?.addEventListener('click', (e) => {
    const btn = e.target.closest('.wb-thumb');
    if (!btn) return;
    gallery.querySelectorAll('.wb-thumb').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const src = safeStr(btn.dataset.src);
    if (src && dMain) dMain.src = src;
  });

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
    if (!(detail && !detail.hidden)) lockBody(false);
  }

  zoomBtn?.addEventListener('click', openZoom);
  zoomClose?.addEventListener('click', closeZoom);
  zoomOverlay?.addEventListener('click', (e) => { if (e.target === zoomOverlay) closeZoom(); });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (zoomOverlay && !zoomOverlay.hidden) return closeZoom();
    if (detail && !detail.hidden) return closeDetail();
  });

  // Deep-link: URL ?p=title auto-opens product; browser back closes detail
  window.addEventListener('popstate', () => {
    if (!new URLSearchParams(location.search).get('p') && detail && !detail.hidden) closeDetail();
  });
  const _dp = new URLSearchParams(location.search).get('p');
  if (_dp) {
    const _dc = [...document.querySelectorAll('.card')].find(c => safeStr(c.dataset.title) === decodeURIComponent(_dp));
    if (_dc) {
      document.body.classList.add('is-detail-page');
      openDetail(_dc);
    }
  }
})();
