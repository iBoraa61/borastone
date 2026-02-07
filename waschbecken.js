// Helpers
const qs = (s, el = document) => el.querySelector(s);
const qsa = (s, el = document) => [...el.querySelectorAll(s)];

// -------------------------
// Tabs
// -------------------------
const tabs = qsa('.wb-tabs__btn');
const panels = qsa('.wb-panel');

function setTab(name) {
  tabs.forEach(b => {
    const active = b.dataset.tab === name;
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  panels.forEach(p => p.classList.toggle('is-active', p.dataset.panel === name));
}

// Default: stand
setTab('stand');

// Tab click
tabs.forEach(btn => {
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
        cards.forEach(c => c.classList.remove('is-hover'));
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
const thumbButtons = qsa('.wb-thumb', gallery);

function openDetail(card) {
  dType.textContent = card.dataset.type || '';
  dTitle.textContent = card.dataset.title || '';
  dPrice.textContent = card.dataset.price || '';
  dDesc.textContent = card.dataset.desc || '';

  sMaterial.textContent = card.dataset.specMaterial || '';
  sSize.textContent = card.dataset.specSize || '';
  sFinish.textContent = card.dataset.specFinish || '';
  sLead.textContent = card.dataset.specLead || '';

  const mainSrc = card.dataset.main || '';
  dMain.src = mainSrc;

  const thumbs = [card.dataset.thumb1, card.dataset.thumb2, card.dataset.thumb3, card.dataset.thumb4];
  thumbButtons.forEach((btn, i) => {
    const src = thumbs[i] || mainSrc;
    btn.dataset.src = src;
    const img = qs('img', btn);
    img.src = src;
    btn.classList.toggle('is-active', i === 0);
  });

  detail.hidden = false;
  detail.scrollTop = 0;

  // lock background interactions
  qsa('.wb-gridView').forEach(v => v.style.pointerEvents = 'none');
}

function closeDetail() {
  detail.hidden = true;
  qsa('.wb-gridView').forEach(v => v.style.pointerEvents = '');
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

backBtn.addEventListener('click', closeDetail);

// Thumb click => swap main
thumbButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    thumbButtons.forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    dMain.src = btn.dataset.src;
  });
});

// -------------------------
// Wheel-scroll handling
// Allow scroll in cardsWrap + detail only
// -------------------------
window.addEventListener('wheel', (e) => {
  const inCards = e.target.closest('.cardsWrap');   // ✅ wichtig (statt .cards)
  const inDetail = e.target.closest('.wb-detail');
  if (!inCards && !inDetail) e.preventDefault();
}, { passive: false });

// -------------------------
// Zoom overlay
// -------------------------
const zoomOverlay = document.getElementById('zoomOverlay');
const zoomImg = document.getElementById('zoomImg');
const zoomBtn = document.querySelector('.wb-zoom');
const zoomClose = document.querySelector('.wb-zoomOverlay__close');

function openZoom() {
  zoomImg.src = dMain.src;
  zoomOverlay.hidden = false;
}
function closeZoom() {
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
  // (We check if there are pages and each page has <= perPage and total matches)
  const existingPages = [...track.querySelectorAll('.cardsPage')];
  const existingCount = existingPages.reduce((sum, p) => sum + p.querySelectorAll('.card').length, 0);

  const needsRebuild =
    existingPages.length === 0 ||
    existingCount !== allCards.length ||
    existingPages.some(p => p.querySelectorAll('.card').length > perPage);

  if (!needsRebuild) return;

  // Remove old pages
  existingPages.forEach(p => p.remove());

  // Build new pages
  for (let i = 0; i < allCards.length; i += perPage) {
    const page = document.createElement('div');
    page.className = 'cardsPage';
    allCards.slice(i, i + perPage).forEach(card => page.appendChild(card));
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
    // if only 1 page, disable both
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
  // ✅ build pages automatically (important for WAND with 12 cards)
  paginateCarousel(wrap, 4);

  // init arrows
  initCarousel(wrap);
});

// Bind hover AFTER paginate (important)
bindHoverStacking(document);
