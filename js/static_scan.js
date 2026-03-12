/**
 * iDROID — Static TV Effects
 *
 * 1. FULL-SCREEN STATIC  — noise a bassa opacità su tutto lo schermo
 * 2. SCAN BAR            — barra di statica intensa che scorre sullo schermo
 *
 * Entrambi i canvas sono figli diretti del <body> così non ereditano
 * il transform: perspective/rotateX del div .idroid.
 */

/* ══════════════════════════════════════════════════════════
   1. FULL-SCREEN STATIC — sfondo noise su tutto il viewport
══════════════════════════════════════════════════════════ */
(function initFullScreenStatic() {
  "use strict";

  const CFG = {
    fps: 20,
    noiseIntensity: 0.9,
    tint: { r: 180, g: 235, b: 255 },
  };

  const canvas = document.createElement("canvas");
  canvas.id = "staticBgCanvas";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  function drawNoise() {
    const w = canvas.width;
    const h = canvas.height;
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;
    const { r, g, b } = CFG.tint;

    for (let i = 0; i < data.length; i += 4) {
      if (Math.random() < CFG.noiseIntensity) {
        const brightness = (Math.random() * 255) | 0;
        data[i] = ((r * brightness) / 255) | 0;
        data[i + 1] = ((g * brightness) / 255) | 0;
        data[i + 2] = ((b * brightness) / 255) | 0;
        data[i + 3] = brightness;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  let last = 0;
  const interval = 1000 / CFG.fps;

  function loop(ts) {
    if (ts - last >= interval) {
      last = ts;
      drawNoise();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

/* ══════════════════════════════════════════════════════════
   2. SCAN BAR — barra luminosa scorrevole
   ──────────────────────────────────────────────────────────
   CONFIGURAZIONE:
   ┌─────────────────┬───────────────────────────────────────────────────────┐
   │ barHeight        │ altezza in px della barra di statica                  │
   │ fps              │ frame al secondo del noise interno alla barra          │
   │ noiseIntensity   │ densità del grain (0.0 – 1.0)                         │
   │ tint             │ tinta RGB del noise                                   │
   │ speed            │ durata in secondi dell'attraversamento completo        │
   │                  │ (valore basso = più veloce, es. 3 = rapido, 12 = lento)│
   │ pauseBetween     │ secondi di pausa tra una discesa/salita e la successiva│
   │ direction        │ 'down' → dall'alto verso il basso                     │
   │                  │ 'up'   → dal basso verso l'alto                       │
   └─────────────────┴───────────────────────────────────────────────────────┘
══════════════════════════════════════════════════════════ */
(function initStaticScanBar() {
  "use strict";

  const CONFIG = {
    barHeight: 180, // px — altezza della barra
    fps: 30, // frame/s del noise interno
    noiseIntensity: 0.85, // densità del grain (0.0 – 1.0)
    tint: { r: 180, g: 235, b: 255 },

    /* ── NUOVI PARAMETRI ── */
    speed: 8, // secondi per attraversare lo schermo (più basso = più veloce)
    pauseBetween: 7, // secondi di pausa tra un passaggio e il successivo
    direction: "up", // 'down' = alto→basso | 'up' = basso→alto
  };

  /* ── Canvas ── */
  const canvas = document.createElement("canvas");
  canvas.id = "staticScanCanvas";
  Object.assign(canvas.style, {
    position: "fixed",
    left: "0",
    width: "100vw",
    pointerEvents: "none",
    zIndex: "99999",
    mixBlendMode: "screen",
    opacity: "0.6",
  });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = CONFIG.barHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  /* ── Disegno del noise sulla barra ── */
  function drawNoise() {
    const w = canvas.width;
    const h = canvas.height;
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;
    const { r, g, b } = CONFIG.tint;
    const intensity = CONFIG.noiseIntensity;

    for (let i = 0; i < data.length; i += 4) {
      if (Math.random() < intensity) {
        const brightness = (Math.random() * 200 + 55) | 0;
        data[i] = ((r * brightness) / 255) | 0;
        data[i + 1] = ((g * brightness) / 255) | 0;
        data[i + 2] = ((b * brightness) / 255) | 0;
        data[i + 3] = brightness;
      }
    }

    /* Sfumatura verticale gaussiana: bordi superiore/inferiore trasparenti */
    for (let y = 0; y < h; y++) {
      const alpha = Math.sin((y / (h - 1)) * Math.PI);
      const rowStart = y * w * 4;
      for (let x = 0; x < w; x++) {
        data[rowStart + x * 4 + 3] = (data[rowStart + x * 4 + 3] * alpha) | 0;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /* ── Loop noise interno (indipendente dall'animazione di posizione) ── */
  let lastNoise = 0;
  const noiseInterval = 1000 / CONFIG.fps;

  function noiseLoop(ts) {
    if (ts - lastNoise >= noiseInterval) {
      lastNoise = ts;
      drawNoise();
    }
    requestAnimationFrame(noiseLoop);
  }
  requestAnimationFrame(noiseLoop);

  /* ── Animazione posizione: gestita via JS per supportare
          speed, pauseBetween e direction senza dover riscrivere
          il keyframe CSS ad ogni cambio di configurazione ── */

  const vh = () => window.innerHeight;
  const barH = () => CONFIG.barHeight;

  /**
   * Calcola posizione translateY in base al progresso (0→1)
   * e alla direzione corrente.
   *
   *  direction 'down': parte sopra lo schermo (−barH) → arriva sotto (vh)
   *  direction 'up':   parte sotto lo schermo (vh)    → arriva sopra (−barH)
   */
  function computeY(progress) {
    const start = CONFIG.direction === "down" ? -barH() : vh();
    const end = CONFIG.direction === "down" ? vh() : -barH();
    return start + (end - start) * progress;
  }

  let animStart = null; // timestamp di inizio corsa corrente
  let isPausing = false; // true durante la pausa tra una corsa e la successiva
  let pauseStart = null; // timestamp di inizio pausa

  function positionLoop(ts) {
    if (isPausing) {
      /* ── Attesa tra una corsa e la successiva ── */
      if (ts - pauseStart >= CONFIG.pauseBetween * 1000) {
        isPausing = false;
        animStart = ts;
      }
      requestAnimationFrame(positionLoop);
      return;
    }

    if (animStart === null) animStart = ts;

    const elapsed = ts - animStart;
    const duration = CONFIG.speed * 1000; // ms
    const progress = Math.min(elapsed / duration, 1);

    canvas.style.transform = `translateY(${computeY(progress)}px)`;

    if (progress >= 1) {
      /* Corsa completata → avvia pausa */
      isPausing = true;
      pauseStart = ts;
      animStart = null;
    }

    requestAnimationFrame(positionLoop);
  }

  requestAnimationFrame(positionLoop);
})();
