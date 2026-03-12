/**
 * iDROID — Static TV Effects
 *
 * 1. FULL-SCREEN STATIC  — noise a bassa opacità (0.2) su tutto lo schermo
 * 2. SCAN BAR            — barra di statica intensa che scorre dall'alto verso il basso
 *
 * Entrambi i canvas sono figli diretti del <body> così non ereditano
 * il transform: perspective/rotateX del div .idroid.
 */

/* ══════════════════════════════════════════════════════════
   1. FULL-SCREEN STATIC — sfondo noise su tutto il viewport
══════════════════════════════════════════════════════════ */
(function initFullScreenStatic() {
    'use strict';

    const CFG = {
        fps: 20,
        noiseIntensity: 0.9,
        tint: { r: 180, g: 235, b: 255 },
    };

    const canvas = document.createElement('canvas');
    canvas.id = 'staticBgCanvas';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function drawNoise() {
        const w = canvas.width;
        const h = canvas.height;
        const imageData = ctx.createImageData(w, h);
        const data = imageData.data;
        const { r, g, b } = CFG.tint;

        for (let i = 0; i < data.length; i += 4) {
            if (Math.random() < CFG.noiseIntensity) {
                const brightness = (Math.random() * 255) | 0;
                data[i]     = (r * brightness / 255) | 0;
                data[i + 1] = (g * brightness / 255) | 0;
                data[i + 2] = (b * brightness / 255) | 0;
                data[i + 3] = brightness;
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    let last = 0;
    const interval = 1000 / CFG.fps;

    function loop(ts) {
        if (ts - last >= interval) { last = ts; drawNoise(); }
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

})();


/* ══════════════════════════════════════════════════════════
   2. SCAN BAR — barra luminosa scorrevole
══════════════════════════════════════════════════════════ */
(function initStaticScanBar() {
    'use strict';

    const CONFIG = {
        barHeight: 180,
        fps: 30,
        noiseIntensity: 0.85,
        tint: { r: 180, g: 235, b: 255 },
    };

    const canvas = document.createElement('canvas');
    canvas.id = 'staticScanCanvas';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = CONFIG.barHeight;
    }
    resize();
    window.addEventListener('resize', resize);

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
                data[i]     = (r * brightness / 255) | 0;
                data[i + 1] = (g * brightness / 255) | 0;
                data[i + 2] = (b * brightness / 255) | 0;
                data[i + 3] = brightness;
            }
        }

        // Sfumatura verticale gaussiana: bordi superiore/inferiore trasparenti
        for (let y = 0; y < h; y++) {
            const alpha = Math.sin((y / (h - 1)) * Math.PI);
            const rowStart = y * w * 4;
            for (let x = 0; x < w; x++) {
                const idx = rowStart + x * 4;
                data[idx + 3] = (data[idx + 3] * alpha) | 0;
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    let lastNoise = 0;
    const noiseInterval = 1000 / CONFIG.fps;

    function noiseLoop(ts) {
        if (ts - lastNoise >= noiseInterval) { lastNoise = ts; drawNoise(); }
        requestAnimationFrame(noiseLoop);
    }
    requestAnimationFrame(noiseLoop);

})();