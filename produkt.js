/* produkt.js
   Standalone product detail page.
   Reads ?src=waschbecken.html&p=TITLE from the URL,
   fetches the source page, extracts the card data and renders it.
*/
(() => {
  const qs  = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];
  const safeStr = (s) => (typeof s === 'string' ? s.trim() : s != null ? String(s).trim() : '');

  const params  = new URLSearchParams(location.search);
  const src     = safeStr(params.get('src'));   // e.g. "waschbecken.html"
  const pTitle  = decodeURIComponent(safeStr(params.get('p')));

  const loadingMsg   = qs('#loadingMsg');
  const detailSection = qs('#detailSection');
  const backBtn      = qs('#backBtn');

  // Back button → source page
  backBtn?.addEventListener('click', () => {
    location.href = src || 'index.html';
  });

  // -------------------------
  // Fetch source page + extract card
  // -------------------------
  if (src && pTitle) {
    fetch(src)
      .then(r => {
        if (!r.ok) throw new Error('Seite nicht gefunden');
        return r.text();
      })
      .then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const card = [...doc.querySelectorAll('.card')].find(c =>
          safeStr(c.dataset.title) === pTitle
        );
        if (!card) {
          showError('Produkt nicht gefunden.');
          return;
        }
        populateDetail(card.dataset);
      })
      .catch(err => showError(err.message));
  } else {
    showError('Kein Produkt angegeben.');
  }

  function showError(msg) {
    if (loadingMsg) {
      loadingMsg.className = 'produkt-error';
      loadingMsg.textContent = '';
      const p = document.createElement('p');
      p.textContent = msg;
      const a = document.createElement('a');
      a.href = src || 'index.html';
      a.textContent = '← Zurück';
      loadingMsg.appendChild(p);
      loadingMsg.appendChild(a);
    }
  }

  // -------------------------
  // Populate detail view
  // -------------------------
  function populateDetail(ds) {
    document.title = 'AMBOSTONE – ' + (safeStr(ds.title) || 'Produkt');

    const setText = (id, val, fallback = '') => {
      const el = document.getElementById(id);
      if (el) el.textContent = safeStr(val) || fallback;
    };

    setText('dType',     ds.type || ds.kicker, 'PRODUKT');
    setText('dTitle',    ds.title,              'Produkt');
    setText('dPrice',    ds.price,              '');
    setText('dDesc',     ds.desc,               '');
    setText('sMaterial', ds.specMaterial || ds.material, '—');
    setText('sSize',     ds.specSize    || ds.size,     '—');
    setText('sFinish',   ds.specFinish  || ds.weight || '', '');
    setText('sLead',     ds.specLead    || '',          '');

    // Labels anpassen je nach Produkttyp
    const finishLabel = qs('#lFinish');
    const leadLabel   = qs('#lLead');
    if (finishLabel && ds.weight && !ds.specFinish) finishLabel.textContent = 'Gewicht';
    if (leadLabel && !ds.specLead) leadLabel.closest('li')?.remove();

    // Form fields
    const subjectField = qs('#subjectField');
    if (subjectField) subjectField.value = 'Anfrage – ' + (safeStr(ds.title) || 'AMBOSTONE');
    const sourceField = qs('#sourceField');
    if (sourceField) sourceField.value = src + ' – ' + (safeStr(ds.title) || 'Produkt');

    buildGallery(ds);
    injectProductMeta(ds);
    injectProductSchema(ds);

    // Show section
    if (loadingMsg) loadingMsg.remove();
    if (detailSection) detailSection.removeAttribute('hidden');
  }

  // -------------------------
  // Gallery
  // -------------------------
  function buildGallery(ds) {
    const gallery = qs('#dGallery');
    const dMain   = qs('#dMain');
    if (!gallery) return;
    gallery.innerHTML = '';

    const uniq = [];
    const pushUniq = (src) => {
      const s = safeStr(src);
      if (!s || uniq.includes(s)) return;
      uniq.push(s);
    };

    pushUniq(ds.main);
    ['thumb1','thumb2','thumb3','thumb4','thumb5'].forEach(k => pushUniq(ds[k]));

    if (dMain && uniq[0]) {
      dMain.src = uniq[0];
      dMain.alt = safeStr(ds.title) || 'Produktbild';
    }

    if (uniq.length <= 1) { gallery.style.display = 'none'; return; }
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

  // -------------------------
  // Dynamic meta + Open Graph
  // -------------------------
  function injectProductMeta(ds) {
    const title = safeStr(ds.title) || 'Produkt';
    const desc  = safeStr(ds.desc)  || 'Hochwertiges Naturstein-Produkt von AMBOSTONE.';
    const img   = safeStr(ds.main)  || '';
    const pageUrl = 'https://ambostone.de/produkt.html' + location.search;
    const imgUrl  = img.startsWith('http') ? img : (img ? 'https://ambostone.de/' + img : '');

    // <title>
    document.title = 'AMBOSTONE \u2013 ' + title;

    // canonical
    const canonical = document.getElementById('canonicalTag');
    if (canonical) canonical.href = pageUrl;

    // og:title
    const ogTitle = document.getElementById('ogTitle');
    if (ogTitle) ogTitle.setAttribute('content', 'AMBOSTONE \u2013 ' + title);

    // og:description
    const ogDesc = document.getElementById('ogDesc');
    if (ogDesc) ogDesc.setAttribute('content', desc.slice(0, 200));

    // og:url
    const ogUrl = document.getElementById('ogUrl');
    if (ogUrl) ogUrl.setAttribute('content', pageUrl);

    // og:image
    if (imgUrl) {
      const ogImage = document.getElementById('ogImage');
      if (ogImage) ogImage.setAttribute('content', imgUrl);
    }

    // meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', desc.slice(0, 160));
  }

  // -------------------------
  // Schema.org Product JSON-LD
  // -------------------------
  function injectProductSchema(ds) {
    const title    = safeStr(ds.title)   || 'Produkt';
    const desc     = safeStr(ds.desc)    || '';
    const priceRaw = safeStr(ds.price)   || '';
    const img      = safeStr(ds.main)    || '';
    const material = safeStr(ds.specMaterial || ds.material) || '';
    const imgUrl   = img.startsWith('http') ? img : (img ? 'https://ambostone.de/' + img : '');
    const pageUrl  = 'https://ambostone.de/produkt.html' + location.search;

    // Parse price string like "ab 750 \u20ac" or "1.200 \u20ac" \u2192 number
    const priceNum = priceRaw.replace(/[^0-9.,]/g, '').replace(',', '.').replace(/\.(?=.*\.)/g, '');
    const priceVal = parseFloat(priceNum) || '';

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': title,
      'description': desc || ('Hochwertiges Naturstein-Produkt von AMBOSTONE: ' + title),
      'brand': { '@type': 'Brand', 'name': 'AMBOSTONE' },
      'url': pageUrl
    };

    if (imgUrl)   schema.image    = imgUrl;
    if (material) schema.material = material;

    if (priceVal) {
      schema.offers = {
        '@type': 'Offer',
        'price': priceVal,
        'priceCurrency': 'EUR',
        'availability': 'https://schema.org/InStock',
        'url': pageUrl,
        'seller': { '@type': 'Organization', 'name': 'AMBOSTONE' }
      };
    }

    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id   = 'productSchema';
    el.textContent = JSON.stringify(schema);
    document.head.appendChild(el);
  }

  // Gallery thumb click
  qs('#dGallery')?.addEventListener('click', (e) => {    const btn = e.target.closest('.wb-thumb');
    if (!btn) return;
    qsa('.wb-thumb').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const dMain = qs('#dMain');
    if (dMain) dMain.src = safeStr(btn.dataset.src);
  });

  // -------------------------
  // Zoom overlay
  // -------------------------
  const zoomBtn     = qs('.wb-zoom');
  const zoomOverlay = qs('#zoomOverlay');
  const zoomImg     = qs('#zoomImg');
  const zoomClose   = qs('.wb-zoomOverlay__close');

  zoomBtn?.addEventListener('click', () => {
    const dMain = qs('#dMain');
    if (!zoomOverlay || !zoomImg || !dMain) return;
    zoomImg.src = safeStr(dMain.src);
    zoomOverlay.hidden = false;
  });
  zoomClose?.addEventListener('click', () => { if (zoomOverlay) zoomOverlay.hidden = true; });
  zoomOverlay?.addEventListener('click', (e) => {
    if (e.target === zoomOverlay) zoomOverlay.hidden = true;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && zoomOverlay && !zoomOverlay.hidden) zoomOverlay.hidden = true;
  });

  // -------------------------
  // Inquiry form
  // -------------------------
  const form       = qs('#inquiryForm');
  const popup      = qs('#bsPopup');
  const popupClose = qs('#bsPopupClose');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        form.reset();
        if (popup) { popup.hidden = false; setTimeout(() => { popup.hidden = true; }, 6000); }
      }
    } catch (_) { /* network error — silently ignore */ }
  });
  popupClose?.addEventListener('click', () => { if (popup) popup.hidden = true; });

  // -------------------------
  // Mobile burger nav
  // -------------------------
  (() => {
    const btn     = qs('.navToggle');
    const overlay = qs('#navOverlay') || qs('.navOverlay');
    const closeBtn = qs('.navClose', overlay || document);
    if (!btn || !overlay) return;

    const openNav = () => {
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
      overlay.hidden = true;
    };

    btn.addEventListener('click', (e) => { e.preventDefault(); overlay.classList.contains('is-open') ? closeNav() : openNav(); });
    closeBtn?.addEventListener('click', closeNav);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeNav(); });
    qsa('a', overlay).forEach(a => a.addEventListener('click', closeNav));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeNav(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 980 && overlay.classList.contains('is-open')) closeNav(); });
  })();

})();
