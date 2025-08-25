// Lightweight app logic for enhanced UX & mobile performance
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

// Adaptive pixel ratio to reduce mobile thermal load
function applyAdaptiveQuality(){
  if (!viewer) return;
  const pr = window.devicePixelRatio;
  // Cap at 1.5 for mobile to save GPU unless high-res requested
  if (pr > 1.5){
    viewer.setAttribute('maximum-scale', '1.5');
  }
}
applyAdaptiveQuality();
window.addEventListener('resize', applyAdaptiveQuality, { passive:true });

// Listen for progress (model-viewer fires progress events 0->1)
viewer.addEventListener('progress', (e) => {
  const value = e.detail.totalProgress;
  progressEl.value = value;
  progressLabel.textContent = Math.round(value * 100) + '%';
  if (value >= 1){
    setTimeout(() => loading.classList.add('hidden'), 250);
  }
});

// Reset camera
resetBtn.addEventListener('click', () => {
  viewer.cameraOrbit = '0deg 65deg 100%';
  viewer.fieldOfView = '35deg';
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

// Double tap to reset
let lastTap = 0;
viewer.addEventListener('pointerup', (e) => {
  const now = Date.now();
  if (now - lastTap < 300){
    resetBtn.click();
  }
  lastTap = now;
}, { passive:true });

// Low power mode when tab hidden
document.addEventListener('visibilitychange', () => {
  viewer.interactionPrompt = document.hidden ? 'none' : 'none';
  viewer.pause && (document.hidden ? viewer.pause() : viewer.play());
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
