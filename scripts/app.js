// Lightweight app logic for enhanced UX & mobile performance (mobile native feel improvements)
const viewer = document.getElementById('viewer');
const loading = document.getElementById('loading');
const progressEl = document.getElementById('progress');
const progressLabel = document.getElementById('progress-label');
const resetBtn = document.getElementById('reset');
const fullscreenBtn = document.getElementById('fullscreen');
const fpsEl = document.getElementById('fps');

// Progressive FPS meter (only when dev tools open or user double taps footer)
let showFPS = false;
let lastTime = performance.now();
let frames = 0;
function loopFPS(ts){
  frames++;
  const dt = ts - lastTime;
  if (dt >= 1000){
    const fps = (frames * 1000 / dt).toFixed(0);
    if (showFPS){
      fpsEl.textContent = fps + ' FPS';
    }
    frames = 0; lastTime = ts;
  }
  requestAnimationFrame(loopFPS);
}
requestAnimationFrame(loopFPS);

// Device detection (lightweight heuristic)
const isMobile = matchMedia('(pointer:coarse)').matches || /Mobi|Android/i.test(navigator.userAgent);

// Adaptive pixel ratio to reduce mobile thermal load & allow crisp desktop
function applyAdaptiveQuality(){
  if (!viewer) return;
  const pr = window.devicePixelRatio;
  const cap = isMobile ? 1.5 : 2.5;
  if (pr > cap){
    viewer.style.setProperty('--pr-scale', (cap/pr).toString());
    // model-viewer lacks direct DPR control; we can downscale via CSS transform if needed later
  }
}
applyAdaptiveQuality();
window.addEventListener('resize', applyAdaptiveQuality, { passive:true });

// Mobile UI auto-hide for more immersive feel
let uiHideTimer;
const toolbar = document.getElementById('toolbar');
const AUTO_HIDE_MS = 2800;
function scheduleHide(){
  if (!isMobile) return; // desktop keep visible
  clearTimeout(uiHideTimer);
  uiHideTimer = setTimeout(() => {
    toolbar?.classList.add('fade-out');
  }, AUTO_HIDE_MS);
}
function showUI(){
  toolbar?.classList.remove('fade-out');
  scheduleHide();
}
['pointerdown','pointerup','wheel','touchstart'].forEach(ev => viewer.addEventListener(ev, showUI, { passive:true }));
scheduleHide();

// Lock zoom focus to model center on mobile (prevents drifting target during pinch)
let centerLock = isMobile; // only on mobile
function enforceCenter(){
  if (centerLock){
    // Ensure cameraTarget stays at auto (= bounding box center)
    const target = viewer.getCameraTarget?.();
    // If user panned (target not near auto center), reset to auto
    // getCameraTarget returns spherical target? It's a Vector3-like object with x,y,z in meters.
    // We can't detect difference against 'auto', so simply reassign.
    viewer.cameraTarget = 'auto auto auto';
  }
}
viewer.addEventListener('camera-change', enforceCenter);

// Fine-tune interpolation for snappier mobile interactions
if (isMobile){
  viewer.interpolationDecay = 90; // lower = less lingering inertia
}

// Listen for progress (model-viewer fires progress events 0->1)
viewer.addEventListener('progress', (e) => {
  const value = e.detail.totalProgress;
  progressEl.value = value;
  progressLabel.textContent = Math.round(value * 100) + '%';
  if (value >= 1){
    setTimeout(() => loading.classList.add('hidden'), 250);
  }
});

// Reset camera (also restore center lock)
resetBtn.addEventListener('click', () => {
  viewer.cameraOrbit = '0deg 65deg 100%';
  viewer.fieldOfView = '35deg';
  if (centerLock){
    viewer.cameraTarget = 'auto auto auto';
  }
});

// Fullscreen toggle
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement){
    viewer.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
});
document.addEventListener('fullscreenchange', () => {
  fullscreenBtn.textContent = document.fullscreenElement ? 'Exit' : 'Full';
});

// Double tap to reset (tap area entire viewer)
let lastTap = 0;
viewer.addEventListener('pointerup', (e) => {
  const now = Date.now();
  if (now - lastTap < 280){
    resetBtn.click();
  }
  lastTap = now;
}, { passive:true });

// Low power mode when tab hidden & restore quick after visible
document.addEventListener('visibilitychange', () => {
  if (document.hidden){
    viewer.pause && viewer.pause();
  } else {
    viewer.play && viewer.play();
    scheduleHide();
  }
});

// Optionally reveal FPS by triple tapping footer
const footer = document.querySelector('footer');
let tapCount = 0; let tapTimer;
footer.addEventListener('pointerup', () => {
  tapCount++;
  clearTimeout(tapTimer);
  tapTimer = setTimeout(() => { tapCount = 0; }, 600);
  if (tapCount >= 3){
    showFPS = !showFPS;
    fpsEl.hidden = !showFPS;
    tapCount = 0;
  }
});

// Pre-warm cache for offline (if service worker ready)
if ('serviceWorker' in navigator){
  navigator.serviceWorker.ready.then(reg => {
    if (reg.active) {
      reg.active.postMessage({ type: 'PRECACHE_OPTIONAL', urls: [ './model.glb' ] });
    }
  });
}
