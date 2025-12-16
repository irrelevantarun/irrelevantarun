/* ---------- Smooth scrolling for in-page anchors ---------- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ---------- Parallax for floating shapes ---------- */
document.addEventListener('mousemove', (e) => {
  const shapes = document.querySelectorAll('.shape');
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;

  shapes.forEach((shape, index) => {
    const speed = (index + 1) * 18;
    const xPos = (x - 0.5) * speed;
    const yPos = (y - 0.5) * speed;
    let extra = '';
    if (shape.classList.contains('shape-square')) extra = ' rotate(45deg)';
    // Avoid forcing transform when pinned; pinned CSS will override appropriately.
    shape.style.transform = `translate(${xPos}px, ${yPos}px)${extra}`;
  });
});

/* ============================
   Theme system (auto-contrast)
   ============================ */
const colorSchemes = [
  { bg: '#FFF5E1' }, { bg: '#FFE5F2' }, { bg: '#E8E4FF' },
  { bg: '#E5FFF5' }, { bg: '#FFF4DD' }, { bg: '#E5F2FF' },
  { bg: '#2D1B69' }, { bg: '#1A4D2E' }, { bg: '#4A0E4E' }
];
let currentThemeIndex = 0;

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}
function isDark(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
  return luminance < 140;
}
function applyTheme(scheme) {
  const bg = scheme.bg;
  const rgb = hexToRgb(bg) || { r: 255, g: 255, b: 255 };
  const darkBg = isDark(bg);
  const autoText = darkBg ? '#FFFFFF' : '#000000';

  document.body.style.backgroundColor = bg;
  document.body.style.color = autoText;

  const nav = document.querySelector('.nav');
  if (nav) {
    nav.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.95)`;
    nav.style.borderColor = autoText;
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.style.color = autoText;
    });
  }

  document.querySelectorAll('.project-card').forEach(card => {
    card.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.85)`;
    card.style.borderColor = autoText;
  });

  document.querySelectorAll('h1, h2, h3, p, span, li, .logo, .section-title, .project-info h3, .project-info p').forEach(el => {
    if (
      el.classList.contains('highlight-pink') ||
      el.classList.contains('highlight-turquoise') ||
      el.classList.contains('highlight-yellow') ||
      el.classList.contains('highlight-blue') ||
      el.classList.contains('tag') ||
      el.classList.contains('skill')
    ) return;
    el.style.color = autoText;
  });

  document.querySelectorAll('footer').forEach(f => {
    f.style.borderColor = autoText;
    f.style.color = autoText;
  });

  const hint = document.querySelector('.click-hint');
  if (hint) hint.style.color = autoText;
}
function changeTheme(e) {
  if (e.target.closest && (e.target.closest('a') || e.target.closest('button'))) return;
  currentThemeIndex = (currentThemeIndex + 1) % colorSchemes.length;
  applyTheme(colorSchemes[currentThemeIndex]);
}
document.addEventListener('click', changeTheme);
applyTheme(colorSchemes[currentThemeIndex]);

/* ============================================================
   Robust overlays for clickable shapes
   ============================================================ */
(function reliableShapeOverlays(){
  ['hotfix-shape-click-style','shape-click-overlay-style','reliable-shape-overlay-style'].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.remove();
  });
  document.querySelectorAll('style').forEach(s=>{
    try { if (s.innerText && s.innerText.includes('2147483646')) s.remove(); } catch(e){}
  });

  const nav = document.querySelector('.nav');
  if (nav) nav.style.zIndex = 1100;

  const container = document.querySelector('.floating-shapes');
  if (container) {
    container.style.pointerEvents = 'none';
    container.style.zIndex = 20;
  }

  const styleId = 'reliable-shape-overlay-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.appendChild(document.createTextNode(`
      .__shape_overlay {
        position: fixed;
        background: transparent;
        pointer-events: auto;
        z-index: 2147483645;
      }
      .floating-shapes a { pointer-events: none !important; }
      .floating-shapes a img, .floating-shapes a * { pointer-events: none !important; }
    `));
    document.head.appendChild(style);
  }

  let overlays = [];

  function buildOverlays(){
    overlays.forEach(o => o.el.remove());
    overlays = [];

    const shapes = Array.from(document.querySelectorAll('.floating-shapes .shape'));
    shapes.forEach((shape, idx) => {
      let anchor = shape.tagName === 'A' ? shape : shape.querySelector('a') || shape.closest('a');
      if (!anchor || !anchor.href) return;

      const sRect = shape.getBoundingClientRect();
      const aRect = anchor.getBoundingClientRect();

      const width = Math.max(Math.round(Math.max(sRect.width, aRect.width)), 44);
      const height = Math.max(Math.round(Math.max(sRect.height, aRect.height)), 44);

      const centerX = Math.round((sRect.left + sRect.right) / 2);
      const centerY = Math.round((sRect.top + sRect.bottom) / 2);

      const left = centerX - Math.round(width / 2);
      const top = centerY - Math.round(height / 2);

      const ov = document.createElement('div');
      ov.className = '__shape_overlay';
      ov.style.left = left + 'px';
      ov.style.top = top + 'px';
      ov.style.width = width + 'px';
      ov.style.height = height + 'px';
      ov.setAttribute('data-shape-index', String(idx));
      ov.setAttribute('aria-hidden', 'true');

      ov.addEventListener('click', function(ev){
        ev.stopImmediatePropagation?.();
        ev.stopPropagation?.();

        if (ev.ctrlKey || ev.metaKey || ev.button === 1 || anchor.target === '_blank') {
          try { window.open(anchor.href, '_blank'); return; } catch(e) {}
        }
        window.location.href = anchor.href;
      }, { capture: true });

      ov.addEventListener('auxclick', function(ev){
        if (ev.button === 1) {
          ev.stopImmediatePropagation?.();
          ev.stopPropagation?.();
          try { window.open(anchor.href, '_blank'); } catch(e){}
        }
      }, { capture: true });

      document.body.appendChild(ov);
      overlays.push({ el: ov, anchor, shape });
    });

    // developer diagnostic
    console.log('Shape overlays built:', overlays.length);
  }

  setTimeout(buildOverlays, 80);
  let t;
  function scheduleBuild(){ clearTimeout(t); t = setTimeout(buildOverlays, 120); }
  window.addEventListener('resize', scheduleBuild);
  window.addEventListener('orientationchange', scheduleBuild);
  window.addEventListener('scroll', scheduleBuild, { passive: true });
  window.addEventListener('load', () => setTimeout(buildOverlays, 120));

  window.__shapeOverlayDiagnostic = function(){
    return overlays.map(o=>{
      const s = o.shape.getBoundingClientRect();
      const a = o.anchor.getBoundingClientRect();
      const ov = o.el.getBoundingClientRect();
      const centerEl = document.elementFromPoint(Math.round((s.left+s.right)/2), Math.round((s.top+s.bottom)/2));
      return {
        anchorHref: o.anchor.href,
        shapeClass: o.shape.className,
        shapeRect: s,
        anchorRect: a,
        overlayRect: ov,
        centerElementTag: centerEl ? (centerEl.tagName + (centerEl.className?'.'+centerEl.className:'')) : null,
        overlayAttached: !!o.el.parentElement
      };
    });
  };
})();

/* ===========================
   Pin/unpin IIFE — Chrome-tuned robust
   - detaches watchers during clone animation
   - heroRectBefore snapshot to ignore tiny reflows
   - hysteresis, cooldown, post-action lock, transition guard
   =========================== */
(function pinShapesChromeTunedFull() {
  const hero = document.querySelector('.hero');
  const shapesContainer = document.querySelector('.floating-shapes');
  if (!hero || !shapesContainer) return;

  // tuning (Chrome-friendly)
  const ANIM_MS = 300;
  const COOLDOWN_MS = 60;
  const HYSTERESIS_MS = 140;
  const POST_ACTION_LOCK_MS = 360; // larger safety margin
  const TRANSITION_BUFFER_MS = 320; // longer buffer to absorb Chrome layout thrash

  let isAnimating = false;
  let overlay = null;
  let queuedAction = null;
  let runId = 0;
  let currentPinnedState = null;
  let actionCooldown = false;

  // hysteresis bookkeeping
  let lastShouldPin = null;
  let lastShouldPinChangeTime = 0;

  // short post-action lock
  let postActionLockUntil = 0;

  // guard to ignore detector while clones animate / layout stabilizes
  let inTransition = false;

  // last hero rect snapshot (used to ignore tiny shifts)
  let heroRectBefore = null;

  // rAF handle
  let raf = null;
  function now() { return performance.now(); }

  function getScrollbarWidth() { return Math.max(0, window.innerWidth - document.documentElement.clientWidth); }
  function updatePinnedRightOffset(el) {
    const baseInset = 12;
    const total = baseInset + getScrollbarWidth();
    if (el) el.style.setProperty('--pinned-right', total + 'px');
    else shapesContainer.style.setProperty('--pinned-right', total + 'px');
  }

  function createOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = '__shapes_clone_overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 2147483643,
      overflow: 'visible'
    });
    document.body.appendChild(overlay);
    return overlay;
  }
  function removeOverlay() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
  }

  function createCloneFromShape(shape) {
    const rect = shape.getBoundingClientRect();
    const clone = shape.cloneNode(true);
    clone.classList.add('__clone');
    Object.assign(clone.style, {
      position: 'fixed',
      left: rect.left + 'px',
      top: rect.top + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
      margin: '0',
      transform: 'none',
      transition: 'transform ' + ANIM_MS + 'ms cubic-bezier(.22,.9,.28,1), opacity ' + ANIM_MS + 'ms linear',
      pointerEvents: 'none',
      zIndex: 2147483644,
      willChange: 'transform, opacity'
    });
    return { clone, rect };
  }

  function computePinnedTargets(clonesInfo) {
    const rightOffset = parseFloat(getComputedStyle(shapesContainer).getPropertyValue('--pinned-right')) || (12 + getScrollbarWidth());
    const topOffset = window.innerHeight * 0.18;
    const gap = 70;
    const vw = window.innerWidth;
    const size = 64;

    const extraRight = 24;

    return clonesInfo.map((cInfo, index) => {
      const x = vw - rightOffset - size;
      const y = topOffset + index * (size + gap);
      return { left: x, top: y, width: size, height: size };
    });
  }

  function sleep(ms, myRunId) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(myRunId === runId);
      }, ms);
    });
  }

  async function animateClonesToPinned(clonesInfo, myRunId) {
    createOverlay();
    const targets = computePinnedTargets(clonesInfo);
    clonesInfo.forEach(ci => overlay.appendChild(ci.clone));
    overlay.offsetHeight;

    clonesInfo.forEach((ci, idx) => {
      const target = targets[idx];
      const from = ci.rect;
      const dx = target.left - from.left;
      const dy = target.top - from.top;
      const scale = target.width / from.width;
      ci.clone.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
      ci.clone.style.opacity = '1';
    });

    return await sleep(ANIM_MS + 12, myRunId);
  }

  async function animateClonesToHome(clonesInfo, homeRects, myRunId) {
    clonesInfo.forEach((ci, idx) => {
      const hr = homeRects[idx];
      const from = ci.rect;
      const dx = hr.left - from.left;
      const dy = hr.top - from.top;
      const scale = hr.width / from.width;
      ci.clone.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    });
    return await sleep(ANIM_MS + 12, myRunId);
  }

  function cleanupClones(clonesInfo) {
    try {
      if (clonesInfo && clonesInfo.length) clonesInfo.forEach(ci => { if (ci.clone && ci.clone.parentNode) ci.clone.remove(); });
    } catch (e) {}
    removeOverlay();
  }

  function startCooldown() {
    actionCooldown = true;
    setTimeout(() => { actionCooldown = false; }, ANIM_MS + COOLDOWN_MS);
  }

  // helper to set post-action lock and lastShouldPin timestamp to avoid immediate flip
  function markActionStability(shouldPin) {
    lastShouldPin = shouldPin;
    lastShouldPinChangeTime = now();
    postActionLockUntil = now() + POST_ACTION_LOCK_MS;
    queuedAction = null;
  }

  // detector (rAF-throttled)
  function checkAndToggle() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;

      // guard: if transition in-flight, ignore
      if (inTransition) return;

      const heroRect = hero.getBoundingClientRect();
      const visibleThreshold = window.innerHeight * 0.08;
      const heroVisible = heroRect.bottom > visibleThreshold && heroRect.top < window.innerHeight;
      const shouldPin = !heroVisible;

      const t = now();

      // respect post-action lock: ignore toggles until lock expires
      if (t < postActionLockUntil) return;

      // If we have a heroRectBefore snapshot, and the change in top/bottom is tiny,
      // consider it a harmless layout shift and ignore it.
      if (heroRectBefore) {
        const topDiff = Math.abs(heroRect.top - heroRectBefore.top);
        const bottomDiff = Math.abs(heroRect.bottom - heroRectBefore.bottom);
        // threshold tuned to tolerate Chrome reflow noise
        if (topDiff <= 6 && bottomDiff <= 6) {
          return;
        }
      }

      if (lastShouldPin === null || shouldPin !== lastShouldPin) {
        lastShouldPin = shouldPin;
        lastShouldPinChangeTime = t;
        return;
      }

      if (t - lastShouldPinChangeTime < HYSTERESIS_MS) return;

      if (shouldPin === currentPinnedState) return;

      if (isAnimating && queuedAction === (shouldPin ? 'pin' : 'unpin')) return;

      if (shouldPin) pin();
      else unpinSmooth();
    });
  }

  // helpers to attach/detach watchers
  function attachWatchers() {
    window.addEventListener('scroll', checkAndToggle, { passive: true });
    window.addEventListener('resize', checkAndToggle);
  }
  function detachWatchers() {
    window.removeEventListener('scroll', checkAndToggle, { passive: true });
    window.removeEventListener('resize', checkAndToggle);
    if (raf) { cancelAnimationFrame(raf); raf = null; }
  }

  // start watchers
  attachWatchers();

  async function pin() {
    if (currentPinnedState === true) return;
    if (actionCooldown) return;

    currentPinnedState = true; // immediate desired state
    markActionStability(true); // prevent immediate opposite toggles
    inTransition = true;

    // snapshot hero rect before layout mutation
    heroRectBefore = hero.getBoundingClientRect();

    // detach watchers so layout changes can't trigger a flip mid-animation
    detachWatchers();

    const myRunId = ++runId;
    if (isAnimating) {
      if (queuedAction !== 'pin') queuedAction = 'pin';
      inTransition = false;
      attachWatchers();
      heroRectBefore = null;
      return;
    }
    isAnimating = true;
    startCooldown();
    updatePinnedRightOffset();

    const shapes = Array.from(document.querySelectorAll('.floating-shapes .shape'));
    if (shapes.length === 0) {
      shapesContainer.classList.add('pinned');
      shapesContainer.style.pointerEvents = 'none';
      isAnimating = false;
      inTransition = false;
      heroRectBefore = null;
      attachWatchers();
      return;
    }

    const clonesInfo = shapes.map(s => createCloneFromShape(s));
    shapes.forEach(s => { s.style.visibility = 'hidden'; });

    const finished = await animateClonesToPinned(clonesInfo, myRunId);
    if (!finished || myRunId !== runId) {
      cleanupClones(clonesInfo);
      shapes.forEach(s => { s.style.visibility = ''; });
      isAnimating = false;
      inTransition = false;
      heroRectBefore = null;
      attachWatchers();
      if (queuedAction) { const q = queuedAction; queuedAction = null; if (q === 'pin') pin(); else if (q === 'unpin') unpinSmooth(); }
      return;
    }

    // finalize pinned state
    shapesContainer.classList.add('pinned');
    shapesContainer.style.pointerEvents = 'none';

    cleanupClones(clonesInfo);
    shapes.forEach(s => { s.style.visibility = ''; });

    // re-mark stability after layout settled
    markActionStability(true);

    // schedule a couple of reflows to settle layout (helps avoid transient flips)
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
      setTimeout(() => window.dispatchEvent(new Event('resize')), 120);
    });

    // keep detector silent for a buffer while layout settles, then reattach
    setTimeout(() => {
      inTransition = false;
      heroRectBefore = null;
      attachWatchers();
      lastShouldPin = currentPinnedState;
      lastShouldPinChangeTime = now();
    }, ANIM_MS + TRANSITION_BUFFER_MS);

    isAnimating = false;
    if (queuedAction) { const q = queuedAction; queuedAction = null; if (q === 'unpin') unpinSmooth(); else if (q === 'pin') pin(); }
  }

  async function unpinSmooth() {
    if (currentPinnedState === false) return;
    if (actionCooldown) return;

    currentPinnedState = false;
    markActionStability(false);
    inTransition = true;

    // snapshot hero rect before layout mutation
    heroRectBefore = hero.getBoundingClientRect();

    detachWatchers();

    const myRunId = ++runId;
    if (isAnimating) {
      if (queuedAction !== 'unpin') queuedAction = 'unpin';
      inTransition = false;
      attachWatchers();
      heroRectBefore = null;
      return;
    }
    isAnimating = true;
    startCooldown();
    updatePinnedRightOffset();

    const shapes = Array.from(document.querySelectorAll('.floating-shapes .shape'));
    if (shapes.length === 0) {
      shapesContainer.classList.remove('pinned');
      isAnimating = false;
      inTransition = false;
      heroRectBefore = null;
      attachWatchers();
      return;
    }

    const pinnedRects = shapes.map(s => s.getBoundingClientRect());
    shapes.forEach(s => { s.style.visibility = 'hidden'; });

    shapesContainer.classList.remove('pinned');
    document.body.offsetHeight;
    const homeRects = shapes.map(s => s.getBoundingClientRect());
    shapesContainer.classList.add('pinned');

    const clonesInfo = shapes.map((s, i) => {
      const data = createCloneFromShape(s);
      data.rect = pinnedRects[i];
      data.clone.style.left = data.rect.left + 'px';
      data.clone.style.top = data.rect.top + 'px';
      data.clone.style.width = data.rect.width + 'px';
      data.clone.style.height = data.rect.height + 'px';
      return data;
    });

    shapes.forEach(s => { s.style.visibility = 'hidden'; });

    createOverlay();
    clonesInfo.forEach(ci => overlay.appendChild(ci.clone));
    overlay.offsetHeight;

    const finished = await animateClonesToHome(clonesInfo, homeRects, myRunId);
    if (!finished || myRunId !== runId) {
      cleanupClones(clonesInfo);
      shapes.forEach(s => { s.style.visibility = ''; });
      isAnimating = false;
      inTransition = false;
      heroRectBefore = null;
      attachWatchers();
      if (queuedAction) { const q = queuedAction; queuedAction = null; if (q === 'pin') pin(); else if (q === 'unpin') unpinSmooth(); }
      return;
    }

    shapesContainer.classList.remove('pinned');
    shapes.forEach(s => { s.style.visibility = ''; });

    cleanupClones(clonesInfo);

    // re-mark stability after layout settled
    markActionStability(false);

    setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 60);

    // keep detector quiet briefly to avoid re-bounce, then reattach watchers
    setTimeout(() => {
      inTransition = false;
      heroRectBefore = null;
      attachWatchers();
      lastShouldPin = currentPinnedState;
      lastShouldPinChangeTime = now();
    }, ANIM_MS + TRANSITION_BUFFER_MS);

    isAnimating = false;
    if (queuedAction) { const q = queuedAction; queuedAction = null; if (q === 'pin') pin(); else if (q === 'unpin') unpinSmooth(); }
  }

  // initial load state
  setTimeout(() => {
    const heroRect = hero.getBoundingClientRect();
    const visibleThreshold = window.innerHeight * 0.08;
    const heroVisible = heroRect.bottom > visibleThreshold && heroRect.top < window.innerHeight;
    const shouldPin = !heroVisible;
    if (shouldPin) {
      shapesContainer.classList.add('pinned');
      shapesContainer.style.pointerEvents = 'none';
      updatePinnedRightOffset();
      currentPinnedState = true;
    } else {
      shapesContainer.classList.remove('pinned');
      currentPinnedState = false;
    }
    lastShouldPin = currentPinnedState;
    lastShouldPinChangeTime = now();
    postActionLockUntil = now() + POST_ACTION_LOCK_MS;
    inTransition = false;
    heroRectBefore = null;
  }, 60);

  // debug toggle
  window.__toggleShapePin = function(force) {
    if (force === true) { pin(); return; }
    if (force === false) { unpinSmooth(); return; }
    if (isAnimating) return;
    if (shapesContainer.classList.contains('pinned')) unpinSmooth();
    else pin();
  };

})();



  // redirect to whatsapp
document.addEventListener("DOMContentLoaded", function () {
  const whatsappBtn = document.getElementById("footer-whatsapp");

  if (!whatsappBtn) return;

  // Your message
  const message = "Hey Arun! I saw your website. Up for a chat?";
  const encodedMessage = encodeURIComponent(message);

  // OPTIONAL: add your number (remove + , spaces, hyphens)
  // Example: India number +91 9876543210 → "919876543210"
  const phoneNumber = "+91 9483676007"; // leave empty to open only with message

  whatsappBtn.addEventListener("click", function (e) {
    e.preventDefault();

    // Choose correct URL
    const url = phoneNumber
      ? `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`
      : `https://api.whatsapp.com/send?text=${encodedMessage}`;

    // Open in a new tab (desktop & mobile)
    window.open(url, "_blank", "noopener,noreferrer");
  });
});





