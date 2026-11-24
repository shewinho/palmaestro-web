/* ==========================================================================
   ENCUADRANDO ANDO · MOTOR GRÁFICO CANVAS + BUSCADOR + QR ESTILIZADO
   100% client-side para GitHub Pages + Blogger (Pa'l Maestro Chile)
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- CONSTANTES DE HOJAS (mm reales) ---------- */
  const PAPER_MM = {
    a4: { label: 'A4', w: 210, h: 297 },
    a3: { label: 'A3', w: 297, h: 420 },
    a5: { label: 'A5', w: 148, h: 210 },
    letter: { label: 'Carta', w: 215.9, h: 279.4 }
  };

  const FONT_SETS = {
    editorial: {
      display: "'Montserrat', 'Arial Black', sans-serif",
      condensed: "'Oswald', 'Montserrat', sans-serif",
      body: "'Montserrat', 'Segoe UI', sans-serif",
      mono: "'Space Mono', monospace"
    },
    cinema: {
      display: "'Bebas Neue', 'Oswald', sans-serif",
      condensed: "'Bebas Neue', 'Oswald', sans-serif",
      body: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
      mono: "'Space Mono', monospace"
    },
    modern: {
      display: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
      condensed: "'Plus Jakarta Sans', sans-serif",
      body: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
      mono: "'Space Mono', monospace"
    },
    retro: {
      display: "'Space Mono', monospace",
      condensed: "'Oswald', monospace",
      body: "'Space Mono', monospace",
      mono: "'Space Mono', monospace"
    }
  };

  const THEMES = {
    white: { bg: '#FFFFFF', ink: '#111318', muted: '#4B5563', rule: '#111318', card: '#F3F4F6' },
    cream: { bg: '#F7F1E3', ink: '#1E1B18', muted: '#5C5346', rule: '#1E1B18', card: '#EDE4D1' },
    dark: { bg: '#121318', ink: '#F8FAFC', muted: '#A1A8B8', rule: '#F8FAFC', card: '#1F222C' },
    kraft: { bg: '#E6D5B8', ink: '#261D14', muted: '#5D4B38', rule: '#261D14', card: '#D8C3A0' }
  };

  /* ---------- ESTADO GLOBAL ---------- */
  const state = {
    template: 'poster',        // poster | player | keychain
    searchType: 'album',       // album | song | movie | series
    bodyMode: 'tracks',        // tracks | cinema
    paperSize: 'a4',           // a4 | a3 | a5 | letter
    orientation: 'portrait',   // portrait | landscape
    theme: 'white',            // white | cream | dark | kraft | tinted | custom
    customBg: '#FFF4E6',
    fontSet: 'editorial',

    // Datos de contenido
    title: 'CURTAIN CALL: THE HITS',
    subtitle: 'EMINEM',
    year: '2005',
    credit: 'PRODUCED BY EMINEM',
    tracksText: [
      'Intro | 0:33',
      'FACK | 3:25',
      'The Way I Am | 4:51',
      'My Name Is | 4:28',
      'Stan | 6:44',
      'Lose Yourself | 5:26',
      'Shake That | 4:34',
      'Sing For The Moment | 5:40',
      'Without Me | 4:51',
      'Like Toy Soldiers | 4:55',
      'The Real Slim Shady | 4:44',
      'Mockingbird | 4:11',
      'Guilty Conscience | 3:20',
      "Cleanin' Out My Closet | 4:58",
      'Just Lose It | 4:08',
      "When I'm Gone | 4:41",
      'Stan - Live ft. Elton John | 6:22'
    ].join('\n'),
    duration: '1h 17m',
    genre: 'Hip-Hop · Rap',
    cast: 'Eminem, Dido, Elton John, Nate Dogg',
    synopsis: 'Un recorrido por los mayores éxitos y momentos icónicos. Edita cualquier texto o sube tu propia foto para personalizar tu cuadro.',

    // Reproductor
    currentTime: '2:22',
    totalTime: '4:50',
    progressPct: 49,
    favIcon: 'star',
    playState: 'pause',
    badgeRight: 'PM',

    // Fotos
    mainImg: null,
    mainImgUrl: '',
    mainZoom: 100,
    mainX: 0,
    mainY: 0,
    fitContain: false,
    grayscale: false,
    showExplicit: true,

    secondImg: null,
    secondImgUrl: '',
    secondZoom: 100,
    secondX: 0,
    secondY: 0,

    // Paleta
    palette: ['#102542', '#1B2A41', '#244A26', '#7EB36A', '#A85568'],

    // QR
    showQr: true,
    qrUrl: 'https://open.spotify.com/album/71xFWYFtiHC8eP99QB30AA',
    qrLabel: 'ESCANEA EN SPOTIFY',
    qrDots: 'extra-rounded',
    qrCorners: 'extra-rounded',
    qrIcon: 'auto',
    qrColorMode: 'ink',
    qrColor1: '#1F2536',
    qrColor2: '#EF3B39',
    qrImageCache: null,
    qrCacheKey: '',

    // Llavero
    keychainWidthCm: 7.5,
    keychainBg: '#EAEBED',
    cutGuides: true,
    punchHole: true,
    pdfPairs: 4,

    // Pie
    footerNote: '',

    // Series temporadas
    currentSeriesEpisodes: []
  };

  /* ---------- DOM REFS ---------- */
  const $ = (id) => document.getElementById(id);
  const canvas = $('previewCanvas');
  const ctx = canvas.getContext('2d');

  let renderPending = false;
  let qrDebounce = null;

  /* ---------- UTILIDADES DE COLOR ---------- */
  function hexToRgb(hex) {
    const clean = (hex || '#111318').replace('#', '');
    const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
    const n = parseInt(full, 16);
    if (isNaN(n)) return { r: 17, g: 19, b: 24 };
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHex(r, g, b) {
    const toHex = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  function luminance(hex) {
    const { r, g, b } = hexToRgb(hex);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  function mixColor(hexA, hexB, weightB) {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    const w = Math.max(0, Math.min(1, weightB));
    return rgbToHex(
      a.r * (1 - w) + b.r * w,
      a.g * (1 - w) + b.g * w,
      a.b * (1 - w) + b.b * w
    );
  }

  function getActiveTheme() {
    if (state.theme === 'tinted') {
      const base = mixColor(state.palette[3] || state.palette[0] || '#DDE6F0', '#FFFFFF', 0.82);
      const isDark = luminance(base) < 0.45;
      return {
        bg: base,
        ink: isDark ? '#F8FAFC' : '#141824',
        muted: isDark ? '#CBD5E1' : '#475569',
        rule: isDark ? '#F8FAFC' : '#141824',
        card: mixColor(base, isDark ? '#FFFFFF' : '#000000', 0.07)
      };
    }
    if (state.theme === 'custom') {
      const isDark = luminance(state.customBg) < 0.45;
      return {
        bg: state.customBg,
        ink: isDark ? '#F8FAFC' : '#141824',
        muted: isDark ? '#CBD5E1' : '#475569',
        rule: isDark ? '#F8FAFC' : '#141824',
        card: mixColor(state.customBg, isDark ? '#FFFFFF' : '#000000', 0.08)
      };
    }
    return THEMES[state.theme] || THEMES.white;
  }

  /* ---------- EXTRACCIÓN DE PALETA (K-MEANS EN CLIENTE) ---------- */
  function extractPaletteFromImage(img) {
    if (!img) return;
    try {
      const sample = document.createElement('canvas');
      const s = 48;
      sample.width = s;
      sample.height = s;
      const sctx = sample.getContext('2d');
      sctx.drawImage(img, 0, 0, s, s);
      const data = sctx.getImageData(0, 0, s, s).data;

      const pixels = [];
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 120) continue;
        pixels.push([data[i], data[i + 1], data[i + 2]]);
      }
      if (pixels.length < 10) return;

      // Inicialización determinista distribuida
      const k = 5;
      const centroids = [];
      for (let c = 0; c < k; c++) {
        const idx = Math.floor(((c + 0.5) / k) * pixels.length);
        centroids.push(pixels[idx].slice());
      }

      for (let iter = 0; iter < 10; iter++) {
        const sums = Array.from({ length: k }, () => [0, 0, 0, 0]);
        for (let p = 0; p < pixels.length; p++) {
          const px = pixels[p];
          let best = 0;
          let bestDist = Infinity;
          for (let c = 0; c < k; c++) {
            const ct = centroids[c];
            const d = (px[0] - ct[0]) ** 2 + (px[1] - ct[1]) ** 2 + (px[2] - ct[2]) ** 2;
            if (d < bestDist) { bestDist = d; best = c; }
          }
          sums[best][0] += px[0];
          sums[best][1] += px[1];
          sums[best][2] += px[2];
          sums[best][3] += 1;
        }
        for (let c = 0; c < k; c++) {
          if (sums[c][3] > 0) {
            centroids[c][0] = sums[c][0] / sums[c][3];
            centroids[c][1] = sums[c][1] / sums[c][3];
            centroids[c][2] = sums[c][2] / sums[c][3];
          }
        }
      }

      // Ordenar por luminancia de oscuro a claro para efecto editorial
      centroids.sort((a, b) => (0.299 * a[0] + 0.587 * a[1] + 0.114 * a[2]) - (0.299 * b[0] + 0.587 * b[1] + 0.114 * b[2]));
      state.palette = centroids.map(c => rgbToHex(c[0], c[1], c[2]));
      syncPaletteInputs();
      invalidateQr();
      scheduleRender();
    } catch (err) {
      console.warn('No se pudo extraer paleta (CORS):', err);
    }
  }

  function syncPaletteInputs() {
    state.palette.forEach((hex, idx) => {
      const inp = $('palColor' + idx);
      if (inp) inp.value = hex;
    });
  }

  /* ---------- CARGA RÁPIDA DE IMÁGENES (DIRECTO CON CORS FIRST, WSRV SOLO FALLBACK) ---------- */
  function optimizeImdbPosterUrl(url, widthPx) {
    if (!url || !url.includes('media-amazon.com')) return url || '';
    return url.replace(/\._V1_[^.]*\./i, `._V1_UX${widthPx}_.`);
  }

  function loadCorsImage(url, onSuccess, onFail) {
    if (!url) { if (onFail) onFail(); return; }
    const isLocal = url.startsWith('data:') || url.startsWith('blob:');
    const fastUrl = isLocal ? url : optimizeImdbPosterUrl(url, 1200);
    const proxied = isLocal ? url : `https://wsrv.nl/?url=${encodeURIComponent(fastUrl)}&w=1200&we&output=jpg&q=90`;

    const tryLoad = (src, useCors, nextFallback) => {
      const img = new Image();
      if (useCors) img.crossOrigin = 'anonymous';
      img.onload = () => onSuccess(img);
      img.onerror = () => {
        if (nextFallback) nextFallback();
        else if (onFail) onFail();
      };
      img.src = src;
    };

    if (isLocal) {
      tryLoad(url, false);
    } else {
      // iTunes, Amazon IMDb y TVMaze devuelven ACAO: * directo en 40–400ms (mucho más rápido que pasar por proxy)
      tryLoad(fastUrl, true, () => {
        tryLoad(proxied, true, () => {
          tryLoad(fastUrl, false, onFail);
        });
      });
    }
  }

  /* ---------- PORTADA ARTÍSTICA GENERADA POR DEFECTO (SIN DEPENDER DE RED) ---------- */
  function createFallbackArtImage(title, subtitle, palette) {
    const c = document.createElement('canvas');
    c.width = 900;
    c.height = 900;
    const g = c.getContext('2d');
    const [c0, c1, c2, c3, c4] = palette;

    const grad = g.createLinearGradient(0, 0, 900, 900);
    grad.addColorStop(0, c0);
    grad.addColorStop(0.55, c1);
    grad.addColorStop(1, c2);
    g.fillStyle = grad;
    g.fillRect(0, 0, 900, 900);

    // Vinilo y luces geométricas editoriales
    g.save();
    g.globalAlpha = 0.28;
    g.fillStyle = c3;
    g.beginPath();
    g.arc(680, 230, 260, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = c4;
    g.beginPath();
    g.arc(210, 720, 240, 0, Math.PI * 2);
    g.fill();
    g.restore();

    // Disco central
    g.save();
    g.translate(450, 440);
    g.fillStyle = '#0D1017';
    g.beginPath();
    g.arc(0, 0, 270, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.12)';
    g.lineWidth = 3;
    for (let r = 110; r <= 245; r += 26) {
      g.beginPath();
      g.arc(0, 0, r, 0, Math.PI * 2);
      g.stroke();
    }
    g.fillStyle = c3;
    g.beginPath();
    g.arc(0, 0, 88, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#FFF8EE';
    g.beginPath();
    g.arc(0, 0, 20, 0, Math.PI * 2);
    g.fill();
    g.restore();

    // Título sutil sobre arte
    g.fillStyle = 'rgba(255,255,255,0.92)';
    g.textAlign = 'center';
    g.font = '900 54px Montserrat, sans-serif';
    g.fillText((subtitle || '').slice(0, 22).toUpperCase(), 450, 120);
    g.font = '700 32px Montserrat, sans-serif';
    g.fillStyle = 'rgba(255,255,255,0.75)';
    g.fillText((title || '').slice(0, 28).toUpperCase(), 450, 815);

    const img = new Image();
    img.src = c.toDataURL('image/png');
    return img;
  }

  /* ---------- ÍCONOS SVG PARA EL CENTRO DEL QR ---------- */
  function getQrCenterIconDataUrl(iconType, accentColor) {
    let type = iconType;
    if (type === 'auto') {
      const u = (state.qrUrl || '').toLowerCase();
      if (u.includes('spotify')) type = 'spotify';
      else if (u.includes('imdb')) type = 'imdb';
      else if (state.searchType === 'movie' || state.searchType === 'series') type = 'imdb';
      else type = 'spotify';
    }
    if (type === 'none') return '';

    const bg = '#FFFFFF';
    let inner = '';
    if (type === 'spotify') {
      inner = `<circle cx="32" cy="32" r="26" fill="#1DB954"/>
        <path d="M18 25c9-3 20-2 28 2" stroke="#111" stroke-width="4.2" stroke-linecap="round" fill="none"/>
        <path d="M20 33c7-2 16-1.5 23 1.8" stroke="#111" stroke-width="3.6" stroke-linecap="round" fill="none"/>
        <path d="M22 40.5c5.5-1.4 12.5-1 18 1.5" stroke="#111" stroke-width="3.1" stroke-linecap="round" fill="none"/>`;
    } else if (type === 'imdb') {
      inner = `<rect x="6" y="14" width="52" height="36" rx="8" fill="#F5C518" stroke="#111" stroke-width="3"/>
        <text x="32" y="39" text-anchor="middle" font-family="Arial Black, sans-serif" font-weight="900" font-size="18" fill="#111">IMDb</text>`;
    } else if (type === 'heart') {
      inner = `<circle cx="32" cy="32" r="26" fill="${bg}"/>
        <path d="M32 49s-16-9.8-16-21a9.5 9.5 0 0 1 16-6.9A9.5 9.5 0 0 1 48 28c0 11.2-16 21-16 21z" fill="#EF3B39"/>`;
    } else if (type === 'star') {
      inner = `<circle cx="32" cy="32" r="26" fill="${bg}"/>
        <path d="M32 13l5.6 11.4 12.6 1.8-9.1 8.9 2.2 12.5L32 41.7 20.7 47.6l2.2-12.5-9.1-8.9 12.6-1.8z" fill="#FFD000" stroke="#1F2536" stroke-width="2.4" stroke-linejoin="round"/>`;
    } else if (type === 'music') {
      inner = `<circle cx="32" cy="32" r="26" fill="${accentColor}"/>
        <path d="M27 42V22l16-3v19" stroke="#FFF" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <circle cx="23.5" cy="42.5" r="4.8" fill="#FFF"/>
        <circle cx="39.5" cy="38.5" r="4.8" fill="#FFF"/>`;
    } else if (type === 'film') {
      inner = `<circle cx="32" cy="32" r="26" fill="#1F2536"/>
        <rect x="17" y="21" width="30" height="22" rx="3" fill="none" stroke="#FFD000" stroke-width="3"/>
        <line x1="17" y1="27" x2="47" y2="27" stroke="#FFD000" stroke-width="2.6"/>
        <line x1="25" y1="21" x2="22" y2="27" stroke="#FFD000" stroke-width="2.6"/>
        <line x1="34" y1="21" x2="31" y2="27" stroke="#FFD000" stroke-width="2.6"/>
        <line x1="43" y1="21" x2="40" y2="27" stroke="#FFD000" stroke-width="2.6"/>`;
    } else if (type === 'gift') {
      inner = `<circle cx="32" cy="32" r="26" fill="#FFE4EC"/>
        <rect x="17" y="26" width="30" height="21" rx="3" fill="#EF3B39"/>
        <rect x="15" y="22" width="34" height="7" rx="2" fill="#FFD000"/>
        <rect x="29.5" y="22" width="5" height="25" fill="#FFD000"/>
        <path d="M32 22c-6 0-10-4-7-7s7 3 7 7c0-4 4-10 7-7s-1 7-7 7z" fill="#FFD000"/>`;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#FFFFFF"/>${inner}</svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /* ---------- GENERACIÓN DE QR ESTILIZADO (qr-code-styling) ---------- */
  function getQrConfigKey(theme) {
    return [
      state.qrUrl,
      state.qrDots,
      state.qrCorners,
      state.qrIcon,
      state.qrColorMode,
      state.qrColor1,
      state.qrColor2,
      theme.ink,
      state.palette.join(','),
      state.template,
      state.keychainBg
    ].join('|');
  }

  function invalidateQr() {
    state.qrCacheKey = '';
  }

  function ensureQrImage(theme) {
    if (!state.showQr || !state.qrUrl.trim()) return Promise.resolve(null);
    const key = getQrConfigKey(theme);
    if (state.qrCacheKey === key && state.qrImageCache) {
      return Promise.resolve(state.qrImageCache);
    }

    if (typeof window.QRCodeStyling === 'undefined') {
      return Promise.resolve(null);
    }

    // Determinar color del QR
    let dotsOptions = { type: state.qrDots, color: theme.ink };
    let cornerColor = theme.ink;
    let accent = state.palette[0] || theme.ink;

    if (state.template === 'keychain') {
      const kBg = getKeychainCapsuleColor();
      const kInk = luminance(kBg) < 0.45 ? '#FFFFFF' : '#111318';
      dotsOptions.color = kInk;
      cornerColor = kInk;
    }

    if (state.qrColorMode === 'palette') {
      const c1 = state.palette[0] || '#1F2536';
      const c2 = state.palette[4] || state.palette[2] || '#EF3B39';
      accent = c1;
      dotsOptions = {
        type: state.qrDots,
        gradient: {
          type: 'linear',
          rotation: Math.PI / 4,
          colorStops: [
            { offset: 0, color: c1 },
            { offset: 1, color: c2 }
          ]
        }
      };
      cornerColor = c1;
    } else if (state.qrColorMode === 'custom') {
      accent = state.qrColor1;
      dotsOptions = {
        type: state.qrDots,
        gradient: {
          type: 'linear',
          rotation: Math.PI / 4,
          colorStops: [
            { offset: 0, color: state.qrColor1 },
            { offset: 1, color: state.qrColor2 }
          ]
        }
      };
      cornerColor = state.qrColor1;
    }

    const iconUrl = getQrCenterIconDataUrl(state.qrIcon, accent);

    const qr = new window.QRCodeStyling({
      width: 540,
      height: 540,
      type: 'canvas',
      data: state.qrUrl.trim(),
      margin: 8,
      qrOptions: { errorCorrectionLevel: iconUrl ? 'H' : 'M' },
      dotsOptions,
      backgroundOptions: { color: 'rgba(0,0,0,0)' },
      cornersSquareOptions: { type: state.qrCorners, color: cornerColor },
      cornersDotOptions: { type: state.qrCorners === 'square' ? 'square' : 'dot', color: cornerColor },
      image: iconUrl || undefined,
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.34,
        margin: 4
      }
    });

    return qr.getRawData('png').then((blob) => {
      if (!blob) return null;
      return new Promise((resolve) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          state.qrImageCache = img;
          state.qrCacheKey = key;
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(null);
        };
        img.src = url;
      });
    }).catch(() => null);
  }

  /* ---------- DIBUJO DE IMAGEN CON ZOOM, PAN Y RECORTE ---------- */
  function drawCroppedImage(c, img, x, y, w, h, zoom, panX, panY, opts = {}) {
    if (!img) return;
    c.save();
    if (opts.circle) {
      c.beginPath();
      c.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
      c.clip();
    } else if (opts.radius) {
      roundRectPath(c, x, y, w, h, opts.radius);
      c.clip();
    } else {
      c.beginPath();
      c.rect(x, y, w, h);
      c.clip();
    }

    if (state.grayscale) {
      c.filter = 'grayscale(100%) contrast(1.06)';
    }

    const iw = img.naturalWidth || img.width || 1;
    const ih = img.naturalHeight || img.height || 1;
    const useContain = Boolean(opts.contain && !opts.circle);
    const baseScale = useContain ? Math.min(w / iw, h / ih) : Math.max(w / iw, h / ih);
    const scale = baseScale * (zoom / 100);
    const dw = iw * scale;
    const dh = ih * scale;

    if (useContain && opts.backdropColor) {
      c.fillStyle = opts.backdropColor;
      c.fillRect(x, y, w, h);
    }

    const maxShiftX = Math.max(0, (dw - w) / 2);
    const maxShiftY = Math.max(0, (dh - h) / 2);
    const dx = x + (w - dw) / 2 + (panX / 100) * (maxShiftX + w * 0.15);
    const dy = y + (h - dh) / 2 + (panY / 100) * (maxShiftY + h * 0.15);

    c.drawImage(img, dx, dy, dw, dh);
    c.restore();
  }

  function roundRectPath(c, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  /* ---------- SELLO PARENTAL ADVISORY ---------- */
  function drawParentalAdvisory(c, x, y, w) {
    const h = w * 0.62;
    const border = Math.max(1.5, w * 0.024);
    const innerX = x + border * 1.6;
    const innerW = w - border * 3.2;

    c.save();
    // Fondo negro base
    c.fillStyle = '#0B0C0F';
    c.fillRect(x, y, w, h);

    // Marco blanco interior limpio
    c.strokeStyle = '#FFFFFF';
    c.lineWidth = border;
    c.strokeRect(x + border * 1.1, y + border * 1.1, w - border * 2.2, h - border * 2.2);

    // Franja central blanca (strictly inside white border)
    const bandY = y + h * 0.30;
    const bandH = h * 0.40;
    c.fillStyle = '#FFFFFF';
    c.fillRect(innerX, bandY, innerW, bandH);

    c.textAlign = 'center';
    c.textBaseline = 'middle';

    // Línea 1: PARENTAL (auto-ajustado para nunca salirse)
    const topMaxW = innerW * 0.90;
    fitText(c, 'PARENTAL', topMaxW, w * 0.135, w * 0.06, (sz) => `800 ${sz}px Montserrat, sans-serif`);
    c.fillStyle = '#FFFFFF';
    c.fillText('PARENTAL', x + w / 2, y + h * 0.175, topMaxW);

    // Línea 2: ADVISORY
    const midMaxW = innerW * 0.92;
    fitText(c, 'ADVISORY', midMaxW, w * 0.215, w * 0.09, (sz) => `900 ${sz}px Oswald, sans-serif`);
    c.fillStyle = '#0B0C0F';
    c.fillText('ADVISORY', x + w / 2, bandY + bandH * 0.53, midMaxW);

    // Línea 3: EXPLICIT CONTENT
    const botMaxW = innerW * 0.92;
    fitText(c, 'EXPLICIT CONTENT', botMaxW, w * 0.095, w * 0.05, (sz) => `700 ${sz}px Montserrat, sans-serif`);
    c.fillStyle = '#FFFFFF';
    c.fillText('EXPLICIT CONTENT', x + w / 2, y + h * 0.845, botMaxW);
    c.restore();
  }

  /* ---------- AJUSTE DE TEXTO Y ENVOLTURA ---------- */
  function fitText(c, text, maxW, initialSize, minSize, fontBuilder) {
    let size = initialSize;
    while (size > minSize) {
      c.font = fontBuilder(size);
      if (c.measureText(text).width <= maxW) break;
      size -= Math.max(1, (initialSize - minSize) / 28);
    }
    c.font = fontBuilder(size);
    return size;
  }

  function fitWrappedLines(c, text, maxW, maxLines, initialSize, minSize, fontBuilder) {
    const clean = (text || '').trim();
    if (!clean) return { size: initialSize, lines: [] };
    let size = initialSize;
    const step = Math.max(0.8, (initialSize - minSize) / 22);
    while (size >= minSize) {
      c.font = fontBuilder(size);
      const rawLines = wrapLinesRaw(c, clean, maxW);
      if (rawLines.length <= maxLines && rawLines.every(l => c.measureText(l).width <= maxW + 1)) {
        return { size, lines: rawLines };
      }
      size -= step;
    }
    c.font = fontBuilder(minSize);
    return { size: minSize, lines: wrapLines(c, clean, maxW, maxLines) };
  }

  function wrapLinesRaw(c, text, maxW) {
    const words = (text || '').trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (let i = 0; i < words.length; i++) {
      const test = line ? line + ' ' + words[i] : words[i];
      if (c.measureText(test).width <= maxW) {
        line = test;
      } else {
        if (line) lines.push(line);
        line = words[i];
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function truncateText(c, text, maxW) {
    if (c.measureText(text).width <= maxW) return text;
    let out = text;
    while (out.length > 2 && c.measureText(out + '…').width > maxW) {
      out = out.slice(0, -1);
    }
    return out + '…';
  }

  function wrapLines(c, text, maxW, maxLines) {
    const words = (text || '').trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (let i = 0; i < words.length; i++) {
      if (maxLines && lines.length === maxLines - 1) {
        const rest = (line ? line + ' ' : '') + words.slice(i).join(' ');
        lines.push(truncateText(c, rest, maxW));
        line = '';
        break;
      }
      const test = line ? line + ' ' + words[i] : words[i];
      if (c.measureText(test).width <= maxW) {
        line = test;
      } else {
        if (line) lines.push(line);
        line = words[i];
      }
    }
    if (line) lines.push(truncateText(c, line, maxW));
    return lines;
  }

  function parseTracks(raw) {
    return (raw || '')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map((line, i) => {
        const parts = line.split('|');
        const name = (parts[0] || '').trim();
        const dur = parts[1] ? parts[1].trim() : '';
        return { num: i + 1, name, dur };
      });
  }

  /* ---------- BLOQUE PALETA DE 5 COLORES ---------- */
  function drawPaletteBar(c, x, y, w, h) {
    const sw = w / 5;
    state.palette.forEach((col, i) => {
      c.fillStyle = col;
      c.fillRect(x + i * sw, y, sw + 0.6, h);
    });
  }

  /* ---------- BLOQUE QR CON ETIQUETA ---------- */
  function drawQrBlock(c, qrImg, x, y, size, theme, labelText, overrideInk) {
    if (!state.showQr || !qrImg) return;
    const ink = overrideInk || theme.ink;
    c.save();
    c.drawImage(qrImg, x, y, size, size);
    if (labelText && labelText.trim()) {
      c.fillStyle = ink;
      c.textAlign = 'center';
      c.textBaseline = 'top';
      const fs = Math.max(9, size * 0.088);
      c.font = `800 ${fs}px ${FONT_SETS[state.fontSet].body}`;
      c.fillText(truncateText(c, labelText.trim().toUpperCase(), size * 1.15), x + size / 2, y + size + size * 0.04);
    }
    c.restore();
  }

  /* ---------- BLOQUE TRACKLIST 1 Ó 2 COLUMNAS ---------- */
  function drawTracklist(c, tracks, x, y, w, h, theme, fonts) {
    if (!tracks.length) return;
    const useTwoCols = tracks.length > 7 && w > h * 1.1;
    const cols = useTwoCols ? 2 : 1;
    const colGap = useTwoCols ? w * 0.04 : 0;
    const colW = (w - colGap) / cols;
    const rowsPerCol = Math.ceil(tracks.length / cols);

    const rowH = Math.min(h / Math.max(rowsPerCol, 1), w * 0.056);
    const fontSize = Math.max(10, Math.min(rowH * 0.66, w * 0.032));

    c.save();
    c.textBaseline = 'middle';

    tracks.forEach((t, idx) => {
      const col = useTwoCols ? Math.floor(idx / rowsPerCol) : 0;
      const row = useTwoCols ? idx % rowsPerCol : idx;
      const cx = x + col * (colW + colGap);
      const cy = y + row * rowH + rowH * 0.5;
      if (cy > y + h + 2) return;

      const durW = t.dur ? fontSize * 3.1 : 0;
      const numW = fontSize * 1.9;

      // Número
      c.fillStyle = theme.muted;
      c.textAlign = 'left';
      c.font = `700 ${fontSize * 0.92}px ${fonts.body}`;
      c.fillText(`${t.num}.`, cx, cy);

      // Nombre canción/episodio
      c.fillStyle = theme.ink;
      c.font = `700 ${fontSize}px ${fonts.body}`;
      const displayName = state.searchType === 'series' ? t.name : `"${t.name}"`;
      const trimmed = truncateText(c, displayName, colW - numW - durW - fontSize * 0.4);
      c.fillText(trimmed, cx + numW, cy);

      // Duración
      if (t.dur) {
        c.fillStyle = theme.muted;
        c.textAlign = 'right';
        c.font = `700 ${fontSize * 0.92}px ${fonts.mono}`;
        c.fillText(t.dur, cx + colW, cy);
      }
    });
    c.restore();
  }

  /* ---------- BLOQUE FICHA CINE / SERIE (LISTA VERTICAL + DESCRIPCIÓN RODEANDO QR) ---------- */
  function drawCinemaSheet(c, x, y, w, h, theme, fonts, opts = {}) {
    c.save();
    const isLarge = Boolean(opts.isLarge);
    const qrAvoid = opts.qrAvoid || null; // { x, y, w, h } en coordenadas del canvas

    const rows = [
      { k: 'DURACIÓN', v: state.duration || '—', maxLines: 1 },
      { k: 'GÉNERO', v: state.genre || '—', maxLines: 2 },
      { k: 'ACTORES PRINCIPALES', v: state.cast || '—', maxLines: 2 }
    ];

    const labelFs = Math.max(9, w * (isLarge ? 0.025 : 0.024));
    const valFs = Math.max(11, w * (isLarge ? 0.036 : 0.032));
    const rowGap = isLarge ? Math.max(10, h * 0.032) : Math.max(6, h * 0.025);

    let curY = y;
    rows.forEach((m) => {
      // Ancho disponible en esta fila (por si el QR estuviera arriba/al lado, normalmente la lista va arriba del QR)
      const availW = (qrAvoid && (curY + labelFs + valFs > qrAvoid.y))
        ? Math.max(w * 0.45, qrAvoid.x - x)
        : w;

      c.textAlign = 'left';
      c.textBaseline = 'top';
      c.fillStyle = theme.muted;
      c.font = `800 ${labelFs}px ${fonts.body}`;
      c.fillText(m.k, x, curY);
      curY += labelFs * 1.28;

      c.fillStyle = theme.ink;
      const fitted = fitWrappedLines(c, m.v, availW, m.maxLines, valFs, valFs * 0.76, (sz) => `800 ${sz}px ${fonts.body}`);
      c.font = `800 ${fitted.size}px ${fonts.body}`;
      fitted.lines.forEach((ln) => {
        c.fillText(ln, x, curY);
        curY += fitted.size * 1.2;
      });
      curY += rowGap;
    });

    // Separador sutil entre ficha técnica y descripción
    const sepW = (qrAvoid && curY > qrAvoid.y) ? Math.max(w * 0.45, qrAvoid.x - x) : w;
    c.fillStyle = mixColor(theme.bg, theme.ink, 0.22);
    c.fillRect(x, curY - rowGap * 0.35, sepW, Math.max(1, w * 0.0025));

    const synY = curY + rowGap * 0.35;
    const synBottom = y + h;
    const synAvailH = synBottom - synY;
    if (synAvailH < 18 || !state.synopsis.trim()) {
      c.restore();
      return;
    }

    const synFs = Math.max(10.5, isLarge ? Math.min(w * 0.034, synAvailH / 5.5) : Math.min(w * 0.029, synAvailH / 4.2));
    const lineStep = synFs * 1.44;

    c.fillStyle = theme.ink;
    c.font = `500 ${synFs}px ${fonts.body}`;
    c.textAlign = 'left';
    c.textBaseline = 'top';

    // Flujo de texto rodeando el QR (ancho completo arriba del QR, ancho reducido al lado del QR)
    const words = state.synopsis.trim().split(/\s+/).filter(Boolean);
    let wi = 0;
    let ly = synY;

    while (wi < words.length && ly + synFs <= synBottom + 1) {
      const besideQr = Boolean(qrAvoid && (ly + synFs * 1.15 > qrAvoid.y));
      const lineMaxW = besideQr ? Math.max(w * 0.4, qrAvoid.x - x) : w;
      const isLastLine = (ly + lineStep + synFs > synBottom + 1);

      let line = '';
      while (wi < words.length) {
        const test = line ? line + ' ' + words[wi] : words[wi];
        if (c.measureText(test).width <= lineMaxW) {
          line = test;
          wi++;
        } else {
          if (!line) {
            line = truncateText(c, words[wi], lineMaxW);
            wi++;
          }
          break;
        }
      }

      if (isLastLine && wi < words.length) {
        line = truncateText(c, line + ' ' + words[wi], lineMaxW);
        wi = words.length;
      }

      c.fillText(line, x, ly);
      ly += lineStep;
    }

    c.restore();
  }

  /* ==========================================================================
     RENDER 1: PÓSTER / CUADRO (VERTICAL Y HORIZONTAL)
     ========================================================================== */
  function drawPoster(c, W, H, qrImg) {
    const theme = getActiveTheme();
    const fonts = FONT_SETS[state.fontSet];
    const isLandscape = W > H;

    // Fondo de papel
    c.fillStyle = theme.bg;
    c.fillRect(0, 0, W, H);

    const padX = W * 0.055;
    const padY = H * 0.042;
    const innerW = W - padX * 2;
    const innerH = H - padY * 2;
    const ruleH = Math.max(2, Math.min(W, H) * 0.0045);

    if (!isLandscape) {
      /* ---------- PÓSTER VERTICAL (Estilo Curtain Call) ---------- */
      // Header
      const subFs = innerW * 0.044;
      c.fillStyle = theme.ink;
      c.textAlign = 'left';
      c.textBaseline = 'top';
      c.font = `italic 800 ${subFs}px ${fonts.display}`;
      c.fillText(truncateText(c, (state.subtitle || '').toUpperCase(), innerW * 0.78), padX, padY);

      const titleY = padY + subFs * 1.2;
      const yearText = (state.year || '').trim();
      const yearFs = innerW * 0.056;
      let yearW = 0;
      if (yearText) {
        c.font = `800 ${yearFs}px ${fonts.condensed}`;
        yearW = c.measureText(yearText).width + innerW * 0.04;
      }

      const titleText = (state.title || 'SIN TÍTULO').toUpperCase();
      const titleFs = fitText(c, titleText, innerW - yearW, innerW * 0.068, innerW * 0.032, (sz) => `italic 900 ${sz}px ${fonts.display}`);
      c.fillStyle = theme.ink;
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      const titleBaseline = titleY + innerW * 0.066;
      c.fillText(titleText, padX, titleBaseline);

      if (yearText) {
        c.textAlign = 'right';
        c.font = `italic 800 ${yearFs}px ${fonts.condensed}`;
        c.fillText(yearText, padX + innerW, titleBaseline);
      }

      // Línea divisoria superior
      const rule1Y = titleBaseline + innerH * 0.015;
      c.fillStyle = theme.rule;
      c.fillRect(padX, rule1Y, innerW, ruleH);

      // Portada central
      const artY = rule1Y + ruleH + innerH * 0.016;
      const artH = innerW * 0.97; // Cuadrado editorial generoso
      const img = state.mainImg;
      drawCroppedImage(c, img, padX, artY, innerW, artH, state.mainZoom, state.mainX, state.mainY, {
        contain: state.fitContain,
        backdropColor: theme.bg
      });

      if (state.showExplicit) {
        const paW = innerW * 0.21;
        drawParentalAdvisory(c, padX + innerW - paW - innerW * 0.025, artY + artH - paW * 0.62 - innerW * 0.025, paW);
      }

      // Franja de crédito + Paleta 5 colores
      const creditY = artY + artH + innerH * 0.014;
      const palW = innerW * 0.285;
      const palH = innerH * 0.034;
      drawPaletteBar(c, padX + innerW - palW, creditY, palW, palH);

      const creditText = (state.credit || '').toUpperCase();
      if (creditText) {
        const creditMaxW = innerW - palW - innerW * 0.032;
        fitText(c, creditText, creditMaxW, innerW * 0.042, innerW * 0.022, (sz) => `italic 700 ${sz}px ${fonts.display}`);
        c.fillStyle = theme.ink;
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        c.fillText(truncateText(c, creditText, creditMaxW), padX, creditY + palH * 0.52);
      }

      // Línea divisoria inferior
      const rule2Y = creditY + palH + innerH * 0.012;
      c.fillStyle = theme.rule;
      c.fillRect(padX, rule2Y, innerW, ruleH);

      // Zona inferior: Tracklist/Ficha Cine + QR
      const footerReserve = state.footerNote.trim() ? innerH * 0.026 : 0;
      const bodyY = rule2Y + ruleH + innerH * 0.016;
      const bodyH = (padY + innerH - footerReserve) - bodyY;

      const hasQr = state.showQr && qrImg;
      const qrSize = hasQr ? Math.min(innerW * 0.215, bodyH * 0.80) : 0;
      const bodyW = hasQr ? innerW - qrSize - innerW * 0.035 : innerW;

      if (state.bodyMode === 'cinema') {
        const qrAvoidV = hasQr
          ? {
              x: padX + innerW - qrSize - innerW * 0.03,
              y: bodyY + Math.max(0, (bodyH - qrSize - qrSize * 0.14) / 2) - innerH * 0.008,
              w: qrSize + innerW * 0.03,
              h: qrSize * 1.18
            }
          : null;
        drawCinemaSheet(c, padX, bodyY, innerW, bodyH, theme, fonts, { isLarge: false, qrAvoid: qrAvoidV });
      } else {
        drawTracklist(c, parseTracks(state.tracksText), padX, bodyY, bodyW, bodyH, theme, fonts);
      }

      if (hasQr) {
        const qx = padX + innerW - qrSize;
        const qy = bodyY + Math.max(0, (bodyH - qrSize - qrSize * 0.14) / 2);
        drawQrBlock(c, qrImg, qx, qy, qrSize, theme, state.qrLabel);
      }

      // Nota al pie opcional
      if (state.footerNote.trim()) {
        c.fillStyle = theme.muted;
        c.textAlign = 'center';
        c.textBaseline = 'bottom';
        c.font = `700 ${innerW * 0.017}px ${fonts.mono}`;
        c.fillText(state.footerNote.trim().toUpperCase(), W / 2, padY + innerH);
      }
    } else {
      /* ---------- PÓSTER HORIZONTAL (Sin espacios vacíos: Cine vs Música) ---------- */
      const hPadX = W * 0.04;
      const hPadY = H * 0.048;
      const hInnerW = W - hPadX * 2;
      const hInnerH = H - hPadY * 2;
      const colGap = hInnerW * 0.038;

      const isCinemaLayout = state.bodyMode === 'cinema' || state.searchType === 'movie' || state.searchType === 'series';
      const tracks = parseTracks(state.tracksText);

      let artW, artH, artX, artY;
      if (isCinemaLayout) {
        // Películas y series: SOLO la portada ocupa toda la altura de la mitad izquierda (~2:3 real)
        artH = hInnerH;
        artW = Math.min(hInnerW * 0.48, artH * 0.69);
        artX = hPadX;
        artY = hPadY;
      } else {
        // Música (álbum/canción cuadrada): portada cuadrada lo más grande posible ocupando la izquierda
        const maxRatio = tracks.length > 12 ? 0.56 : 0.61;
        const sq = Math.min(hInnerH, hInnerW * maxRatio);
        artW = sq;
        artH = sq;
        artX = hPadX;
        artY = hPadY + (hInnerH - sq) / 2;
      }

      drawCroppedImage(c, state.mainImg, artX, artY, artW, artH, state.mainZoom, state.mainX, state.mainY, {
        contain: isCinemaLayout ? false : state.fitContain,
        backdropColor: theme.bg
      });

      if (state.showExplicit) {
        const paW = Math.min(artW * 0.24, artH * 0.24);
        drawParentalAdvisory(c, artX + artW - paW - artW * 0.03, artY + artH - paW * 0.62 - artW * 0.03, paW);
      }

      // Columna derecha SIMÉTRICA: empieza a la misma altura superior (artY) y termina en la misma base (artY + artH) que la portada
      const rightX = artX + artW + colGap;
      const rightW = (hPadX + hInnerW) - rightX;
      const colTop = artY;
      const colBottom = artY + artH;
      const colH = artH;

      // Subtítulo / Artista / Director (alineado exacto con el borde superior de la portada)
      const subFs = rightW * 0.056;
      c.fillStyle = theme.ink;
      c.textAlign = 'left';
      c.textBaseline = 'top';
      c.font = `italic 800 ${subFs}px ${fonts.display}`;
      c.fillText(truncateText(c, (state.subtitle || '').toUpperCase(), rightW * 0.80), rightX, colTop);

      // Título principal + Año
      const yearText = (state.year || '').trim();
      const yearFs = rightW * 0.066;
      let yearW = 0;
      if (yearText) {
        c.font = `italic 800 ${yearFs}px ${fonts.condensed}`;
        yearW = c.measureText(yearText).width + rightW * 0.04;
      }

      const titleText = (state.title || 'SIN TÍTULO').toUpperCase();
      const titleBaseline = colTop + subFs * 1.22 + rightW * 0.076;
      fitText(c, titleText, rightW - yearW, rightW * 0.088, rightW * 0.038, (sz) => `italic 900 ${sz}px ${fonts.display}`);
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      c.fillText(truncateText(c, titleText, rightW - yearW), rightX, titleBaseline);

      if (yearText) {
        c.textAlign = 'right';
        c.font = `italic 800 ${yearFs}px ${fonts.condensed}`;
        c.fillText(yearText, rightX + rightW, titleBaseline);
      }

      // Línea divisoria superior
      const rule1Y = titleBaseline + colH * 0.022;
      c.fillStyle = theme.rule;
      c.fillRect(rightX, rule1Y, rightW, ruleH);

      // Franja de Crédito + Paleta de 5 colores en la mitad derecha
      const palY = rule1Y + ruleH + colH * 0.022;
      const palH = colH * 0.052;
      const palW = rightW * 0.42;
      drawPaletteBar(c, rightX + rightW - palW, palY, palW, palH);

      if (state.credit.trim()) {
        const creditMaxW = rightW - palW - rightW * 0.04;
        const cTxt = state.credit.trim().toUpperCase();
        fitText(c, cTxt, creditMaxW, rightW * 0.042, rightW * 0.024, (sz) => `italic 700 ${sz}px ${fonts.display}`);
        c.fillStyle = theme.ink;
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        c.fillText(truncateText(c, cTxt, creditMaxW), rightX, palY + palH * 0.52);
      }

      // Segunda regla fina
      const rule2Y = palY + palH + colH * 0.02;
      c.fillStyle = theme.rule;
      c.fillRect(rightX, rule2Y, rightW, Math.max(1.5, ruleH * 0.7));

      // Bloque central + QR alineado exacto con el borde inferior de la portada (colBottom)
      const contentY = rule2Y + ruleH + colH * 0.026;
      const hasQr = state.showQr && qrImg;
      const qrSize = hasQr ? Math.min(colH * 0.25, rightW * 0.30) : 0;
      const qrLabelExtra = hasQr && state.qrLabel.trim() ? qrSize * 0.14 : 0;
      const qrTotalH = hasQr ? qrSize + qrLabelExtra : 0;
      const qrX = rightX + rightW - qrSize;
      const qrY = colBottom - qrTotalH;

      const footerReserve = state.footerNote.trim() ? colH * 0.04 : 0;

      if (state.bodyMode === 'cinema') {
        const cineH = Math.max(60, (colBottom - footerReserve) - contentY);
        const qrAvoid = hasQr
          ? {
              x: qrX - rightW * 0.04,
              y: qrY - colH * 0.02,
              w: qrSize + rightW * 0.04,
              h: qrTotalH + colH * 0.02
            }
          : null;
        drawCinemaSheet(c, rightX, contentY, rightW, cineH, theme, fonts, { isLarge: true, qrAvoid });
      } else {
        const bottomBarH = hasQr ? qrTotalH + colH * 0.02 : footerReserve;
        const bodyH = Math.max(40, (colBottom - bottomBarH) - contentY);
        drawTracklist(c, tracks, rightX, contentY, rightW, bodyH, theme, fonts);
      }

      // QR en esquina inferior derecha (borde inferior alineado con portada)
      if (hasQr) {
        drawQrBlock(c, qrImg, qrX, qrY, qrSize, theme, state.qrLabel);
      }

      // Nota al pie opcional (alineada a la base izquierda de la columna)
      if (state.footerNote.trim()) {
        c.fillStyle = theme.muted;
        c.textAlign = 'left';
        c.textBaseline = 'bottom';
        c.font = `700 ${rightW * 0.024}px ${fonts.mono}`;
        c.fillText(truncateText(c, state.footerNote.trim().toUpperCase(), rightW - qrSize - 16), rightX, colBottom);
      }
    }
  }

  /* ==========================================================================
     RENDER 2: PLACA REPRODUCTOR (Estilo Without Me)
     ========================================================================== */
  function drawFavIcon(c, type, cx, cy, r, color) {
    if (type === 'none') return;
    c.save();
    c.fillStyle = color;
    if (type === 'star') {
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const ang = (Math.PI / 5) * i - Math.PI / 2;
        const rad = i % 2 === 0 ? r : r * 0.44;
        const px = cx + Math.cos(ang) * rad;
        const py = cy + Math.sin(ang) * rad;
        if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.closePath();
      c.fill();
    } else if (type === 'heart') {
      c.beginPath();
      c.moveTo(cx, cy + r * 0.85);
      c.bezierCurveTo(cx - r * 1.4, cy + r * 0.05, cx - r * 1.15, cy - r * 1.05, cx, cy - r * 0.3);
      c.bezierCurveTo(cx + r * 1.15, cy - r * 1.05, cx + r * 1.4, cy + r * 0.05, cx, cy + r * 0.85);
      c.fill();
    } else if (type === 'fire') {
      // Llama vectorial limpia (sin emoji de sistema)
      c.beginPath();
      c.moveTo(cx, cy - r * 1.0);
      c.bezierCurveTo(cx + r * 0.65, cy - r * 0.35, cx + r * 0.95, cy + r * 0.25, cx + r * 0.55, cy + r * 0.78);
      c.bezierCurveTo(cx + r * 0.22, cy + r * 1.05, cx - r * 0.22, cy + r * 1.05, cx - r * 0.55, cy + r * 0.78);
      c.bezierCurveTo(cx - r * 0.95, cy + r * 0.25, cx - r * 0.55, cy - r * 0.35, cx, cy - r * 1.0);
      c.closePath();
      c.fill();
    }
    c.restore();
  }

  function drawPlaybackControls(c, cx, cy, unit, ink, bg) {
    c.save();
    // Botón central circular
    const circleR = unit * 0.56;
    c.fillStyle = ink;
    c.beginPath();
    c.arc(cx, cy, circleR, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = bg;
    if (state.playState === 'pause') {
      const bw = circleR * 0.25;
      const bh = circleR * 0.84;
      const gap = circleR * 0.14;
      roundRectPath(c, cx - gap - bw, cy - bh / 2, bw, bh, bw * 0.35);
      c.fill();
      roundRectPath(c, cx + gap, cy - bh / 2, bw, bh, bw * 0.35);
      c.fill();
    } else {
      const tr = circleR * 0.46;
      c.beginPath();
      c.moveTo(cx - tr * 0.55, cy - tr * 0.85);
      c.lineTo(cx + tr * 0.95, cy);
      c.lineTo(cx - tr * 0.55, cy + tr * 0.85);
      c.closePath();
      c.fill();
    }

    // Anterior y Siguiente
    const sideOffset = unit * 1.35;
    const iconH = unit * 0.48;
    const barW = unit * 0.11;
    c.fillStyle = ink;

    // Prev
    const px = cx - sideOffset;
    c.fillRect(px - iconH * 0.52, cy - iconH / 2, barW, iconH);
    c.beginPath();
    c.moveTo(px - iconH * 0.35, cy);
    c.lineTo(px + iconH * 0.48, cy - iconH / 2);
    c.lineTo(px + iconH * 0.48, cy + iconH / 2);
    c.closePath();
    c.fill();

    // Next
    const nx = cx + sideOffset;
    c.fillRect(nx + iconH * 0.52 - barW, cy - iconH / 2, barW, iconH);
    c.beginPath();
    c.moveTo(nx + iconH * 0.35, cy);
    c.lineTo(nx - iconH * 0.48, cy - iconH / 2);
    c.lineTo(nx - iconH * 0.48, cy + iconH / 2);
    c.closePath();
    c.fill();

    c.restore();
  }

  function drawPlayer(c, W, H, qrImg) {
    const theme = getActiveTheme();
    const fonts = FONT_SETS[state.fontSet];
    const isLandscape = W > H;

    c.fillStyle = theme.bg;
    c.fillRect(0, 0, W, H);

    if (!isLandscape) {
      const padX = W * 0.085;
      const padY = H * 0.055;
      const innerW = W - padX * 2;
      const artSize = Math.min(innerW, H * 0.52);
      const artX = (W - artSize) / 2;
      const artY = padY;

      drawCroppedImage(c, state.mainImg, artX, artY, artSize, artSize, state.mainZoom, state.mainX, state.mainY, {
        contain: state.fitContain,
        backdropColor: theme.bg
      });
      if (state.showExplicit) {
        const paW = artSize * 0.21;
        drawParentalAdvisory(c, artX + artSize - paW - artSize * 0.03, artY + artSize - paW * 0.62 - artSize * 0.03, paW);
      }

      // Título + Artista + Estrella/Corazón
      const infoY = artY + artSize + H * 0.034;
      const favR = artSize * 0.04;
      const playerTitleMaxW = state.favIcon === 'none' ? artSize : artSize - favR * 3.5;
      const rawTitle = state.title || 'Sin título';
      const titleFs = fitText(c, rawTitle, playerTitleMaxW, artSize * 0.068, artSize * 0.03, (sz) => `900 ${sz}px ${fonts.display}`);
      c.fillStyle = theme.ink;
      c.textAlign = 'left';
      c.textBaseline = 'top';
      c.fillText(truncateText(c, rawTitle, playerTitleMaxW), artX, infoY);

      const subFs = artSize * 0.044;
      c.fillStyle = theme.muted;
      c.font = `600 ${subFs}px ${fonts.body}`;
      c.fillText(truncateText(c, state.subtitle || '', playerTitleMaxW), artX, infoY + titleFs * 1.15);

      drawFavIcon(c, state.favIcon, artX + artSize - favR, infoY + titleFs * 0.85, favR, theme.ink);

      // Barra de progreso
      const barY = infoY + titleFs * 1.15 + subFs * 1.75;
      const barH = Math.max(4, innerW * 0.01);
      c.fillStyle = mixColor(theme.bg, theme.ink, 0.22);
      roundRectPath(c, artX, barY, artSize, barH, barH / 2);
      c.fill();

      const progW = artSize * (state.progressPct / 100);
      c.fillStyle = theme.ink;
      roundRectPath(c, artX, barY, Math.max(barH, progW), barH, barH / 2);
      c.fill();

      c.beginPath();
      c.arc(artX + progW, barY + barH / 2, barH * 1.5, 0, Math.PI * 2);
      c.fill();

      const timeFs = innerW * 0.027;
      c.fillStyle = theme.muted;
      c.font = `700 ${timeFs}px ${fonts.mono}`;
      c.textBaseline = 'top';
      c.textAlign = 'left';
      c.fillText(state.currentTime || '0:00', artX, barY + barH * 2.4);
      c.textAlign = 'right';
      c.fillText(state.totalTime || '0:00', artX + artSize, barY + barH * 2.4);

      // Controles reproducción
      const ctrlY = barY + H * 0.088;
      drawPlaybackControls(c, W / 2, ctrlY, innerW * 0.095, theme.ink, theme.bg);

      // Fila inferior: QR + Firma derecha
      const footerY = H - padY;
      const qrSize = Math.min(innerW * 0.24, Math.max(80, footerY - (ctrlY + innerW * 0.075) - H * 0.03));
      if (state.showQr && qrImg && qrSize > 40) {
        drawQrBlock(c, qrImg, artX, footerY - qrSize - (state.qrLabel ? qrSize * 0.14 : 0), qrSize, theme, state.qrLabel);
      }

      if (state.badgeRight.trim()) {
        const bText = state.badgeRight.trim().toUpperCase();
        const bFs = innerW * 0.044;
        c.font = `900 ${bFs}px ${fonts.display}`;
        const bw = c.measureText(bText).width + innerW * 0.05;
        const bh = bFs * 1.45;
        const bx = artX + artSize - bw;
        const by = footerY - bh - H * 0.012;
        c.strokeStyle = theme.ink;
        c.lineWidth = Math.max(2, innerW * 0.005);
        roundRectPath(c, bx, by, bw, bh, bh * 0.18);
        c.stroke();
        c.fillStyle = theme.ink;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(bText, bx + bw / 2, by + bh / 2 + 1);
      }
    } else {
      /* ---------- PLACA REPRODUCTOR HORIZONTAL ---------- */
      const padX = W * 0.06;
      const padY = H * 0.09;
      const innerW = W - padX * 2;
      const innerH = H - padY * 2;
      const artSize = Math.min(innerH, innerW * 0.44);
      const artY = (H - artSize) / 2;

      drawCroppedImage(c, state.mainImg, padX, artY, artSize, artSize, state.mainZoom, state.mainX, state.mainY, { radius: artSize * 0.02 });
      if (state.showExplicit) {
        const paW = artSize * 0.22;
        drawParentalAdvisory(c, padX + artSize - paW - artSize * 0.03, artY + artSize - paW * 0.62 - artSize * 0.03, paW);
      }

      const rightX = padX + artSize + innerW * 0.055;
      const rightW = padX + innerW - rightX;
      const favR = rightW * 0.042;

      let cy = artY + artSize * 0.06;
      const titleFs = fitText(c, state.title || 'Sin título', rightW - favR * 3, rightW * 0.082, rightW * 0.04, (sz) => `900 ${sz}px ${fonts.display}`);
      c.fillStyle = theme.ink;
      c.textAlign = 'left';
      c.textBaseline = 'top';
      c.fillText(state.title || 'Sin título', rightX, cy);

      const subFs = rightW * 0.05;
      c.fillStyle = theme.muted;
      c.font = `600 ${subFs}px ${fonts.body}`;
      c.fillText(truncateText(c, state.subtitle || '', rightW - favR * 3), rightX, cy + titleFs * 1.18);

      drawFavIcon(c, state.favIcon, rightX + rightW - favR, cy + titleFs * 0.85, favR, theme.ink);

      // Barra progreso
      const barY = cy + titleFs * 1.18 + subFs * 1.9;
      const barH = Math.max(4, rightW * 0.012);
      c.fillStyle = mixColor(theme.bg, theme.ink, 0.22);
      roundRectPath(c, rightX, barY, rightW, barH, barH / 2);
      c.fill();

      const progW = rightW * (state.progressPct / 100);
      c.fillStyle = theme.ink;
      roundRectPath(c, rightX, barY, Math.max(barH, progW), barH, barH / 2);
      c.fill();
      c.beginPath();
      c.arc(rightX + progW, barY + barH / 2, barH * 1.55, 0, Math.PI * 2);
      c.fill();

      const timeFs = rightW * 0.032;
      c.fillStyle = theme.muted;
      c.font = `700 ${timeFs}px ${fonts.mono}`;
      c.textAlign = 'left';
      c.fillText(state.currentTime || '0:00', rightX, barY + barH * 2.5);
      c.textAlign = 'right';
      c.fillText(state.totalTime || '0:00', rightX + rightW, barY + barH * 2.5);

      // Controles + QR abajo
      const ctrlY = barY + innerH * 0.19;
      drawPlaybackControls(c, rightX + rightW * 0.34, ctrlY, rightW * 0.11, theme.ink, theme.bg);

      if (state.showQr && qrImg) {
        const qrSize = Math.min(rightW * 0.30, artSize * 0.38);
        drawQrBlock(c, qrImg, rightX + rightW - qrSize, artY + artSize - qrSize - (state.qrLabel ? qrSize * 0.13 : 0), qrSize, theme, state.qrLabel);
      }
    }
  }

  /* ==========================================================================
     RENDER 3: LLAVERO DOBLE CARA EN CÁPSULA (Estilo Me Porto Bonito)
     ========================================================================== */
  function getKeychainCapsuleColor() {
    if (state.keychainBg === 'palette') {
      return mixColor(state.palette[3] || state.palette[0] || '#EAEBED', '#FFFFFF', 0.72);
    }
    return state.keychainBg || '#EAEBED';
  }

  function drawKeychainPair(c, W, H, qrImg, opts = {}) {
    const fonts = FONT_SETS[state.fontSet];
    const capsuleBg = getKeychainCapsuleColor();
    const isDark = luminance(capsuleBg) < 0.45;
    const ink = isDark ? '#F8FAFC' : '#111318';
    const muted = isDark ? '#CBD5E1' : '#334155';

    if (!opts.transparentBg) {
      c.fillStyle = '#FFFFFF';
      c.fillRect(0, 0, W, H);
    }

    const padX = W * 0.07;
    const capW = W - padX * 2;
    const capH = capW * 0.39;
    const gap = capH * 0.28;
    const totalH = capH * 2 + gap;
    const startY = (H - totalH) / 2;
    const radius = capH * 0.34;

    const drawCapsuleShell = (x, y, labelTag) => {
      c.save();
      roundRectPath(c, x, y, capW, capH, radius);
      c.fillStyle = capsuleBg;
      c.fill();

      if (state.cutGuides) {
        c.strokeStyle = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(31,37,54,0.35)';
        c.lineWidth = Math.max(1.5, capW * 0.003);
        c.setLineDash([capW * 0.012, capW * 0.009]);
        c.stroke();
        c.setLineDash([]);
      }

      if (state.punchHole) {
        const hx = x + capW * 0.055;
        const hy = y + capH * 0.5;
        const hr = capH * 0.068;
        c.beginPath();
        c.arc(hx, hy, hr, 0, Math.PI * 2);
        c.fillStyle = '#FFFFFF';
        c.fill();
        c.strokeStyle = isDark ? '#94A3B8' : '#475569';
        c.lineWidth = Math.max(1.5, capW * 0.003);
        c.stroke();
      }

      if (labelTag && !opts.hideSideLabels) {
        c.fillStyle = '#64748B';
        c.font = `700 ${Math.max(10, capW * 0.017)}px ${fonts.mono}`;
        c.textAlign = 'left';
        c.textBaseline = 'bottom';
        c.fillText(labelTag, x + radius * 0.35, y - capH * 0.055);
      }
      c.restore();
    };

    /* ---- CARA A (Anverso: Foto circular izquierda + QR estilizado + ondas/detalle) ---- */
    const y1 = startY;
    drawCapsuleShell(padX, y1, 'ANVERSO (CARA A)');

    const holeShift = state.punchHole ? capW * 0.075 : capW * 0.02;
    const imgSize = capH * 0.78;
    const imgY1 = y1 + (capH - imgSize) / 2;
    const imgX1 = padX + holeShift + capW * 0.025;
    drawCroppedImage(c, state.mainImg, imgX1, imgY1, imgSize, imgSize, state.mainZoom, state.mainX, state.mainY, { circle: true });

    // Zona derecha Cara A: QR centrado + texto en hasta 2 líneas sin cortar palabras
    const rightAreaX = imgX1 + imgSize + capW * 0.04;
    const rightAreaEnd = padX + capW - capW * 0.045;
    const rightAreaW = rightAreaEnd - rightAreaX;
    if (state.showQr && qrImg) {
      const qrSize = Math.min(capH * 0.78, rightAreaW * 0.48);
      const qy = y1 + (capH - qrSize) / 2;

      if (state.qrLabel.trim() && rightAreaW - qrSize > capW * 0.20) {
        const qx2 = rightAreaEnd - qrSize;
        const textMaxW = Math.max(20, qx2 - rightAreaX - capW * 0.032);
        c.drawImage(qrImg, qx2, qy, qrSize, qrSize);

        const lblText = state.qrLabel.trim().toUpperCase();
        const subText = (state.subtitle || '').trim();
        const lblFit = fitWrappedLines(c, lblText, textMaxW, 2, capH * 0.11, capH * 0.068, (sz) => `800 ${sz}px ${fonts.display}`);
        const subFit = fitWrappedLines(c, subText, textMaxW, 2, capH * 0.095, capH * 0.065, (sz) => `italic 600 ${sz}px ${fonts.body}`);

        const lblH = lblFit.lines.length * (lblFit.size * 1.18);
        const subGap = subFit.lines.length ? capH * 0.055 : 0;
        const subH = subFit.lines.length * (subFit.size * 1.2);
        const totalTextH = lblH + subGap + subH;
        let curY = y1 + (capH - totalTextH) / 2;

        c.fillStyle = ink;
        c.textAlign = 'left';
        c.textBaseline = 'top';
        c.font = `800 ${lblFit.size}px ${fonts.display}`;
        lblFit.lines.forEach((ln) => {
          c.fillText(ln, rightAreaX, curY);
          curY += lblFit.size * 1.18;
        });

        if (subFit.lines.length) {
          curY += subGap;
          c.fillStyle = muted;
          c.font = `italic 600 ${subFit.size}px ${fonts.body}`;
          subFit.lines.forEach((ln) => {
            c.fillText(ln, rightAreaX, curY);
            curY += subFit.size * 1.2;
          });
        }
      } else {
        const qx = rightAreaX + (rightAreaW - qrSize) / 2;
        c.drawImage(qrImg, qx, qy, qrSize, qrSize);
      }
    } else {
      // Sin QR: mostrar título en hasta 2 líneas centrado
      const tFit = fitWrappedLines(c, state.title || '', rightAreaW, 2, capH * 0.20, capH * 0.095, (sz) => `900 ${sz}px ${fonts.display}`);
      c.fillStyle = ink;
      c.textAlign = 'center';
      c.textBaseline = 'top';
      c.font = `900 ${tFit.size}px ${fonts.display}`;
      const th = tFit.lines.length * (tFit.size * 1.15);
      let ty = y1 + (capH - th) / 2;
      tFit.lines.forEach((ln) => {
        c.fillText(ln, rightAreaX + rightAreaW / 2, ty);
        ty += tFit.size * 1.15;
      });
    }

    /* ---- CARA B (Reverso: Título y Artista en hasta 2 líneas + 2ª foto circular) ---- */
    const y2 = startY + capH + gap;
    drawCapsuleShell(padX, y2, 'REVERSO (CARA B)');

    const imgX2 = padX + capW - imgSize - capW * 0.045;
    const imgY2 = y2 + (capH - imgSize) / 2;
    const img2 = state.secondImg || state.mainImg;
    const z2 = state.secondImg ? state.secondZoom : state.mainZoom;
    const x2 = state.secondImg ? state.secondX : state.mainX;
    const py2 = state.secondImg ? state.secondY : state.mainY;
    drawCroppedImage(c, img2, imgX2, imgY2, imgSize, imgSize, z2, x2, py2, { circle: true });

    const textX = padX + holeShift + capW * 0.032;
    const textMaxW = Math.max(40, imgX2 - textX - capW * 0.042);
    const rawKeyTitle = state.title || 'Sin título';
    const rawKeySub = (state.subtitle || '').trim();
    const rawKeyYear = (state.year || '').trim();

    const titleFit = fitWrappedLines(c, rawKeyTitle, textMaxW, 2, capH * 0.20, capH * 0.092, (sz) => `900 ${sz}px ${fonts.display}`);
    const subFitB = fitWrappedLines(c, rawKeySub, textMaxW, 2, capH * 0.13, capH * 0.074, (sz) => `italic 600 ${sz}px ${fonts.body}`);
    const yearFs = capH * 0.074;

    const titleBlockH = titleFit.lines.length * (titleFit.size * 1.14);
    const subGapB = subFitB.lines.length ? capH * 0.045 : 0;
    const subBlockH = subFitB.lines.length * (subFitB.size * 1.18);
    const showYear = Boolean(rawKeyYear) && (titleBlockH + subGapB + subBlockH + yearFs * 1.5 < capH * 0.78);
    const yearGapB = showYear ? capH * 0.04 : 0;
    const totalBH = titleBlockH + subGapB + subBlockH + (showYear ? yearGapB + yearFs : 0);

    let cyB = y2 + (capH - totalBH) / 2;
    c.textAlign = 'left';
    c.textBaseline = 'top';

    c.fillStyle = ink;
    c.font = `900 ${titleFit.size}px ${fonts.display}`;
    titleFit.lines.forEach((ln) => {
      c.fillText(ln, textX, cyB);
      cyB += titleFit.size * 1.14;
    });

    if (subFitB.lines.length) {
      cyB += subGapB;
      c.fillStyle = muted;
      c.font = `italic 600 ${subFitB.size}px ${fonts.body}`;
      subFitB.lines.forEach((ln) => {
        c.fillText(ln, textX, cyB);
        cyB += subFitB.size * 1.18;
      });
    }

    if (showYear) {
      cyB += yearGapB;
      c.fillStyle = muted;
      c.font = `700 ${yearFs}px ${fonts.mono}`;
      c.fillText(truncateText(c, rawKeyYear, textMaxW), textX, cyB);
    }
  }

  /* ---------- DIMENSIONES DE PREVIEW Y EXPORTACIÓN ---------- */
  function getCanvasPixelDimensions(dpi) {
    if (state.template === 'keychain') {
      const scale = dpi / 120;
      return { w: Math.round(1200 * scale), h: Math.round(1120 * scale) };
    }
    const paper = PAPER_MM[state.paperSize] || PAPER_MM.a4;
    const mmW = state.orientation === 'landscape' ? paper.h : paper.w;
    const mmH = state.orientation === 'landscape' ? paper.w : paper.h;
    return {
      w: Math.round((mmW / 25.4) * dpi),
      h: Math.round((mmH / 25.4) * dpi)
    };
  }

  function updatePreviewMeta() {
    const el = $('previewMeta');
    if (!el) return;
    if (state.template === 'keychain') {
      const wCm = Number(state.keychainWidthCm || 7.5).toFixed(1).replace('.', ',');
      const hCm = (Number(state.keychainWidthCm || 7.5) * 0.39).toFixed(1).replace('.', ',');
      el.textContent = `Llavero Doble Cara · ${wCm} × ${hCm} cm reales`;
      return;
    }
    const p = PAPER_MM[state.paperSize] || PAPER_MM.a4;
    const ori = state.orientation === 'landscape' ? 'Horizontal' : 'Vertical';
    const mmW = Math.round(state.orientation === 'landscape' ? p.h : p.w);
    const mmH = Math.round(state.orientation === 'landscape' ? p.w : p.h);
    const tplName = state.template === 'player' ? 'Placa Reproductor' : 'Póster';
    el.textContent = `${tplName} · ${p.label} ${ori} (${mmW} × ${mmH} mm)`;
  }

  async function renderToCanvas(targetCanvas, targetCtx, dpi, opts = {}) {
    const dims = getCanvasPixelDimensions(dpi);
    targetCanvas.width = dims.w;
    targetCanvas.height = dims.h;
    const theme = getActiveTheme();
    const qrImg = await ensureQrImage(theme);

    targetCtx.save();
    targetCtx.clearRect(0, 0, dims.w, dims.h);
    if (state.template === 'poster') {
      drawPoster(targetCtx, dims.w, dims.h, qrImg);
    } else if (state.template === 'player') {
      drawPlayer(targetCtx, dims.w, dims.h, qrImg);
    } else {
      drawKeychainPair(targetCtx, dims.w, dims.h, qrImg, opts);
    }
    targetCtx.restore();
  }

  function scheduleRender() {
    if (renderPending) return;
    renderPending = true;
    requestAnimationFrame(async () => {
      renderPending = false;
      updatePreviewMeta();
      await renderToCanvas(canvas, ctx, 110);
      notifyIframeHeight();
    });
  }

  function scheduleQrRender() {
    invalidateQr();
    clearTimeout(qrDebounce);
    qrDebounce = setTimeout(() => scheduleRender(), 140);
  }

  /* ==========================================================================
     EXPORTACIÓN PNG Y PDF (ALTA RESOLUCIÓN 300 DPI)
     ========================================================================== */
  function safeFileName() {
    const clean = (state.title || 'encuadrando-ando')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const suffix = state.template === 'keychain' ? 'llavero' : `${state.paperSize}-${state.orientation}`;
    return `${clean || 'diseno'}-${suffix}`;
  }

  async function exportPng() {
    const status = $('exportStatus');
    const btn = $('btnDownloadPng');
    const dpi = Number($('exportQuality').value) || 300;
    btn.disabled = true;
    status.textContent = `Generando PNG en ${dpi} DPI...`;

    try {
      const off = document.createElement('canvas');
      const octx = off.getContext('2d');
      await renderToCanvas(off, octx, dpi);

      const dataUrl = off.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${safeFileName()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      status.textContent = `✓ PNG descargado (${off.width} × ${off.height} px · ${dpi} DPI).`;
    } catch (err) {
      console.error(err);
      status.textContent = '⚠ No se pudo exportar la imagen externa por restricciones de red. Prueba subir la foto desde tu equipo.';
    } finally {
      btn.disabled = false;
    }
  }

  async function exportPdf() {
    const status = $('exportStatus');
    const btn = $('btnDownloadPdf');
    const dpi = Number($('exportQuality').value) || 300;
    if (!window.jspdf || !window.jspdf.jsPDF) {
      status.textContent = '⚠ Librería PDF aún cargando, intenta en un segundo.';
      return;
    }

    btn.disabled = true;
    status.textContent = 'Armando PDF a tamaño real para imprimir...';

    try {
      const { jsPDF } = window.jspdf;

      if (state.template === 'keychain') {
        // Hoja A4 con medidas reales en milímetros (1 ó 4 pares)
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const off = document.createElement('canvas');
        const octx = off.getContext('2d');
        await renderToCanvas(off, octx, 300, { hideSideLabels: true });
        const imgData = off.toDataURL('image/jpeg', 0.94);

        const capWmm = Math.max(40, Math.min(120, Number(state.keychainWidthCm || 7.5) * 10));
        // En el canvas de llavero la cápsula ocupa 86% del ancho total
        const blockW = capWmm / 0.86;
        const blockH = blockW * (off.height / off.width);
        const pairs = Number(state.pdfPairs) === 1 ? 1 : 4;

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(70, 80, 95);
        pdf.text(`Encuadrando ando · Llavero doble cara (${(capWmm / 10).toFixed(1)} cm) — Imprimir al 100% (Sin ajustar a página)`, 15, 14);

        if (pairs === 1) {
          const x = (210 - blockW) / 2;
          const y = 30;
          pdf.addImage(imgData, 'JPEG', x, y, blockW, blockH);
        } else {
          const cols = blockW * 2 + 16 <= 200 ? 2 : 1;
          const rows = cols === 2 ? 2 : 3;
          const startX = (210 - (cols * blockW + (cols - 1) * 10)) / 2;
          const startY = 24;
          for (let r = 0; r < rows; r++) {
            for (let col = 0; col < cols; col++) {
              const px = startX + col * (blockW + 10);
              const py = startY + r * (blockH + 10);
              if (py + blockH < 292) {
                pdf.addImage(imgData, 'JPEG', px, py, blockW, blockH);
              }
            }
          }
        }
        pdf.save(`${safeFileName()}.pdf`);
        status.textContent = `✓ PDF A4 listo para imprimir a escala real (${(capWmm / 10).toFixed(1)} cm).`;
      } else {
        const paper = PAPER_MM[state.paperSize] || PAPER_MM.a4;
        const mmW = state.orientation === 'landscape' ? paper.h : paper.w;
        const mmH = state.orientation === 'landscape' ? paper.w : paper.h;

        const off = document.createElement('canvas');
        const octx = off.getContext('2d');
        await renderToCanvas(off, octx, dpi);
        const imgData = off.toDataURL('image/jpeg', 0.94);

        const pdf = new jsPDF({
          orientation: state.orientation,
          unit: 'mm',
          format: [mmW, mmH]
        });
        pdf.addImage(imgData, 'JPEG', 0, 0, mmW, mmH);
        pdf.save(`${safeFileName()}.pdf`);
        status.textContent = `✓ PDF ${paper.label} ${state.orientation === 'landscape' ? 'Horizontal' : 'Vertical'} listo para imprimir.`;
      }
    } catch (err) {
      console.error(err);
      status.textContent = '⚠ Error generando PDF. Prueba bajar calidad a 180 DPI o usar una foto local.';
    } finally {
      btn.disabled = false;
    }
  }

  /* ==========================================================================
     BUSCADORES GRATUITOS (iTunes + Odesli Spotify + TVMaze + Wikidata IMDb)
     ========================================================================== */
  function fetchJsonp(url) {
    return new Promise((resolve, reject) => {
      const cbName = '__eaJsonp_' + Math.random().toString(36).slice(2);
      const sep = url.includes('?') ? '&' : '?';
      const script = document.createElement('script');
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('JSONP timeout'));
      }, 9000);

      function cleanup() {
        clearTimeout(timer);
        delete window[cbName];
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[cbName] = (data) => {
        cleanup();
        resolve(data);
      };
      script.onerror = () => {
        cleanup();
        reject(new Error('JSONP error'));
      };
      script.src = `${url}${sep}callback=${cbName}`;
      document.head.appendChild(script);
    });
  }

  async function fetchItunes(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (_) {
      return await fetchJsonp(url);
    }
  }

  function formatMs(ms) {
    if (!ms || isNaN(ms)) return '';
    const totalSec = Math.round(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function upgradeItunesArtwork(url) {
    if (!url) return '';
    return url.replace(/\d+x\d+bb\./i, '1000x1000bb.');
  }

  async function resolveSpotifyLink(appleUrl, fallbackQuery) {
    const badge = $('qrUrlBadge');
    badge.textContent = 'Buscando Spotify...';
    try {
      if (appleUrl) {
        const res = await fetch(`https://api.odesli.co/v1-alpha.1/links?url=${encodeURIComponent(appleUrl)}`);
        if (res.ok) {
          const data = await res.json();
          const sp = data?.linksByPlatform?.spotify?.url;
          if (sp) {
            state.qrUrl = sp;
            $('inpQrUrl').value = sp;
            badge.textContent = '✓ Spotify exacto';
            scheduleQrRender();
            return;
          }
        }
      }
    } catch (_) { /* fallback below */ }

    const fallback = `https://open.spotify.com/search/${encodeURIComponent(fallbackQuery)}`;
    state.qrUrl = fallback;
    $('inpQrUrl').value = fallback;
    badge.textContent = 'Spotify búsqueda';
    scheduleQrRender();
  }

  function fetchImdbSuggest(query) {
    return new Promise((resolve, reject) => {
      const slug = (query || '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 20);
      if (!slug) { resolve([]); return; }

      const first = slug[0];
      const cbName = 'imdb$' + slug;
      const script = document.createElement('script');
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('IMDb JSONP timeout'));
      }, 9000);

      function cleanup() {
        clearTimeout(timer);
        try { delete window[cbName]; } catch (_) { window[cbName] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[cbName] = (data) => {
        cleanup();
        const raw = Array.isArray(data?.d) ? data.d : [];
        const titles = raw.filter(x => x.id && /^tt\d+$/i.test(x.id));
        resolve(titles);
      };
      script.onerror = () => {
        cleanup();
        reject(new Error('IMDb JSONP error'));
      };
      script.src = `https://v2.sg.media-imdb.com/suggests/${first}/${slug}.json`;
      document.head.appendChild(script);
    });
  }

  async function enrichMovieFromWikidata(imdbId) {
    if (!imdbId || !/^tt\d+$/i.test(imdbId)) return;
    try {
      // Paso 1: consulta mínima ultrarrápida para obtener solo el QID de la película
      const sparql = `SELECT ?item WHERE { ?item wdt:P345 "${imdbId}". } LIMIT 1`;
      const wdRes = await fetch('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(sparql), {
        headers: { Accept: 'application/sparql-results+json' }
      });
      if (!wdRes.ok) return;
      const wdData = await wdRes.json();
      const itemUri = wdData?.results?.bindings?.[0]?.item?.value;
      const qid = itemUri ? itemUri.split('/').pop() : '';
      if (!qid || !/^Q\d+$/i.test(qid)) return;

      // Paso 2: API REST rápida de Wikidata (claims + sitelinks sin explosión cartesiana)
      const entRes = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=claims|sitelinks&format=json&origin=*`);
      if (!entRes.ok) return;
      const entData = await entRes.json();
      const entity = entData?.entities?.[qid];
      if (!entity) return;

      const claims = entity.claims || {};
      const mins = Number(claims.P2047?.[0]?.mainsnak?.datavalue?.value?.amount);
      if (mins && !isNaN(mins)) {
        const h = Math.floor(mins / 60);
        const m = Math.round(mins % 60);
        state.duration = h > 0 ? `${h}h ${m}m` : `${m} min`;
        state.totalTime = state.duration;
      }

      const dirQid = claims.P57?.[0]?.mainsnak?.datavalue?.value?.id || '';
      const genreQids = (claims.P136 || []).map(x => x?.mainsnak?.datavalue?.value?.id).filter(Boolean).slice(0, 3);
      const castQids = (claims.P161 || []).map(x => x?.mainsnak?.datavalue?.value?.id).filter(Boolean).slice(0, 4);

      const esTitle = entity.sitelinks?.eswiki?.title || '';
      const enTitle = entity.sitelinks?.enwiki?.title || '';
      const labelIds = [...new Set([dirQid, ...genreQids, ...castQids].filter(Boolean))];

      // Paso 3: etiquetas (director/género/reparto) + sinopsis de Wikipedia EN PARALELO
      const [labelsData, wikiData] = await Promise.all([
        labelIds.length
          ? fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${labelIds.join('|')}&props=labels&languages=es|en&format=json&origin=*`)
              .then(r => r.ok ? r.json() : null)
              .catch(() => null)
          : Promise.resolve(null),
        (esTitle || enTitle)
          ? fetch(`https://${esTitle ? 'es' : 'en'}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(esTitle || enTitle)}`)
              .then(r => r.ok ? r.json() : null)
              .catch(() => null)
          : Promise.resolve(null)
      ]);

      const getLabel = (id) => {
        const e = labelsData?.entities?.[id]?.labels;
        return e?.es?.value || e?.en?.value || '';
      };

      const dir = dirQid ? getLabel(dirQid) : '';
      if (dir) {
        state.subtitle = dir.toUpperCase();
        state.credit = `DIRIGIDA POR ${dir.toUpperCase()}`;
      }

      const genres = genreQids.map(getLabel).filter(Boolean);
      if (genres.length) {
        const cleanGenres = genres.map(g => g.replace(/^cine de /i, '').replace(/^\w/, c => c.toUpperCase()));
        state.genre = cleanGenres.join(' · ');
      }

      const existingCast = (state.cast || '').split(',').map(s => s.trim()).filter(s => s && s !== '—');
      const wdCast = castQids.map(getLabel).filter(Boolean);
      const mergedCast = [...existingCast];
      wdCast.forEach((a) => {
        if (mergedCast.length < 4 && !mergedCast.some(e => e.toLowerCase() === a.toLowerCase())) {
          mergedCast.push(a);
        }
      });
      if (mergedCast.length) {
        state.cast = mergedCast.slice(0, 4).join(', ');
      }

      if (wikiData?.extract) {
        state.synopsis = wikiData.extract.slice(0, 720);
      }

      syncFormFromState();
      scheduleRender();
    } catch (_) { /* keep IMDb fields cleanly */ }
  }

  async function runSearch(query) {
    const q = (query || '').trim();
    const status = $('searchStatus');
    const resultsEl = $('searchResults');
    $('seasonPickerWrap').hidden = true;

    if (!q) {
      status.textContent = 'Escribe un nombre para buscar.';
      return;
    }

    status.textContent = 'Buscando en el catálogo...';
    resultsEl.innerHTML = '';

    try {
      if (state.searchType === 'album') {
        const data = await fetchItunes(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=album&limit=12`);
        renderSearchResults(data.results || [], 'album');
      } else if (state.searchType === 'song') {
        const data = await fetchItunes(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=12`);
        renderSearchResults(data.results || [], 'song');
      } else if (state.searchType === 'movie') {
        const items = await fetchImdbSuggest(q);
        const movies = items.filter(x => x.qid === 'movie' || x.q === 'feature' || !x.qid);
        renderSearchResults(movies.length ? movies : items, 'movie');
      } else if (state.searchType === 'series') {
        const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        renderSearchResults(data || [], 'series');
      }
    } catch (err) {
      console.error(err);
      status.textContent = '⚠ No pudimos conectar con el buscador. Revisa tu conexión o rellena los datos a mano en la pestaña 2.';
    }
  }

  function renderSearchResults(items, type) {
    const resultsEl = $('searchResults');
    const status = $('searchStatus');
    resultsEl.innerHTML = '';

    if (!items.length) {
      status.textContent = 'No encontramos resultados. Prueba con otro nombre o en inglés.';
      return;
    }

    status.textContent = `Encontramos ${items.length} opciones. Haz clic en una para cargarla en tu diseño:`;

    items.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ea-result-item';

      let thumb = '';
      let title = '';
      let sub = '';
      let tag = '';
      let isPoster = false;

      if (type === 'album') {
        thumb = item.artworkUrl100 || '';
        title = item.collectionName || '';
        sub = `${item.artistName || ''} · ${(item.releaseDate || '').slice(0, 4)}`;
        tag = `${item.trackCount || '?'} temas`;
      } else if (type === 'song') {
        thumb = item.artworkUrl100 || '';
        title = item.trackName || '';
        sub = `${item.artistName || ''} · ${item.collectionName || ''}`;
        tag = formatMs(item.trackTimeMillis) || 'Canción';
      } else if (type === 'movie') {
        const rawThumb = item.i?.[0] || '';
        thumb = rawThumb ? optimizeImdbPosterUrl(rawThumb, 180) : '';
        title = item.l || '';
        sub = [item.y || '', item.s || ''].filter(Boolean).join(' · ');
        tag = item.y ? `${item.y} · IMDb` : 'IMDb';
        isPoster = true;
      } else if (type === 'series') {
        const sh = item.show || {};
        thumb = sh.image?.medium || '';
        title = sh.name || '';
        const yr = (sh.premiered || '').slice(0, 4);
        const net = sh.network?.name || sh.webChannel?.name || '';
        sub = [yr, net, (sh.genres || []).slice(0, 2).join(', ')].filter(Boolean).join(' · ');
        tag = sh.rating?.average ? `★ ${sh.rating.average}` : 'Serie';
        isPoster = true;
      }

      btn.innerHTML = `
        <img class="ea-result-thumb ${isPoster ? 'is-poster' : ''}" src="${thumb}" alt="" loading="lazy" />
        <div class="ea-result-info">
          <div class="ea-result-title"></div>
          <div class="ea-result-sub"></div>
        </div>
        <span class="ea-result-tag"></span>
      `;
      btn.querySelector('.ea-result-title').textContent = title;
      btn.querySelector('.ea-result-sub').textContent = sub;
      btn.querySelector('.ea-result-tag').textContent = tag;

      btn.addEventListener('click', () => selectSearchItem(item, type));
      resultsEl.appendChild(btn);
    });
  }

  async function selectSearchItem(item, type) {
    const status = $('searchStatus');
    $('seasonPickerWrap').hidden = true;

    if (type === 'album') {
      status.textContent = 'Cargando portada y lista completa de canciones...';
      state.title = item.collectionName || '';
      state.subtitle = item.artistName || '';
      state.year = (item.releaseDate || '').slice(0, 4);
      state.credit = item.copyright ? item.copyright.replace(/^℗\s*\d{4}\s*/, '').slice(0, 44) : `ÁLBUM DE ${state.subtitle.toUpperCase()}`;
      state.genre = item.primaryGenreName || 'Música';
      state.showExplicit = item.collectionExplicitness === 'explicit';
      state.fitContain = false;
      state.bodyMode = 'tracks';
      state.qrLabel = 'ESCANEA EN SPOTIFY';

      const artUrl = upgradeItunesArtwork(item.artworkUrl100);
      loadMainArtwork(artUrl);
      resolveSpotifyLink(item.collectionViewUrl, `${state.subtitle} ${state.title}`);

      // Buscar tracklist completo del álbum
      try {
        const lookup = await fetchItunes(`https://itunes.apple.com/lookup?id=${item.collectionId}&entity=song`);
        const songs = (lookup.results || []).filter(r => r.wrapperType === 'track');
        if (songs.length) {
          state.tracksText = songs.map(s => `${s.trackName} | ${formatMs(s.trackTimeMillis)}`).join('\n');
          const totalMs = songs.reduce((acc, s) => acc + (s.trackTimeMillis || 0), 0);
          state.duration = formatMs(totalMs);
          state.totalTime = formatMs(songs[0].trackTimeMillis) || '3:45';
          status.textContent = `✓ Álbum cargado con ${songs.length} canciones (${state.duration}).`;
        }
      } catch (_) {
        status.textContent = '✓ Álbum cargado. Puedes editar las canciones en la pestaña 2.';
      }
      syncFormFromState();
      scheduleRender();
    } else if (type === 'song') {
      status.textContent = 'Cargando canción y buscando link de Spotify...';
      state.title = item.trackName || '';
      state.subtitle = item.artistName || '';
      state.year = (item.releaseDate || '').slice(0, 4);
      state.credit = item.collectionName ? `DEL ÁLBUM ${item.collectionName.toUpperCase()}` : state.subtitle.toUpperCase();
      state.totalTime = formatMs(item.trackTimeMillis) || '3:30';
      state.currentTime = formatMs((item.trackTimeMillis || 210000) * 0.45);
      state.progressPct = 45;
      state.showExplicit = item.trackExplicitness === 'explicit';
      state.fitContain = false;
      state.qrLabel = 'ESCANEA EN SPOTIFY';
      state.tracksText = `${state.title} | ${state.totalTime}`;

      // Sugerir plantilla Reproductor si estaba en Póster sin álbum
      const artUrl = upgradeItunesArtwork(item.artworkUrl100);
      loadMainArtwork(artUrl);
      resolveSpotifyLink(item.trackViewUrl, `${state.subtitle} ${state.title}`);
      status.textContent = `✓ Canción cargada (${state.totalTime}). Prueba también la plantilla Placa Reproductor o Llavero.`;
      syncFormFromState();
      scheduleRender();
    } else if (type === 'movie') {
      status.textContent = 'Cargando póster HD de IMDb y datos de la película...';
      const imdbId = item.id || '';
      state.title = item.l || '';
      state.subtitle = 'PELÍCULA';
      state.year = item.y ? String(item.y) : '';
      state.credit = item.s ? `PROTAGONIZADA POR ${item.s.toUpperCase()}` : 'PELÍCULA';
      state.duration = '—';
      state.genre = 'Cine';
      state.cast = item.s || '—';
      state.synopsis = '';
      state.totalTime = '2:00';
      state.currentTime = '0:42';
      state.showExplicit = false;
      state.fitContain = true;
      state.bodyMode = 'cinema';
      state.qrLabel = 'VER EN IMDb';
      state.qrUrl = imdbId ? `https://www.imdb.com/title/${imdbId}/` : `https://www.imdb.com/find/?q=${encodeURIComponent(state.title)}&s=tt`;
      $('inpQrUrl').value = state.qrUrl;
      $('qrUrlBadge').textContent = imdbId ? 'IMDb exacto' : 'IMDb búsqueda';
      scheduleQrRender();

      const artUrl = item.i?.[0] || '';
      if (artUrl) loadMainArtwork(artUrl);
      syncFormFromState();
      scheduleRender();

      await enrichMovieFromWikidata(imdbId);
      status.textContent = `Película cargada (${state.year || 'Cine'}${state.duration && state.duration !== '—' ? ' · ' + state.duration : ''}) con QR directo a IMDb.`;
    } else if (type === 'series') {
      const sh = item.show || {};
      status.textContent = 'Cargando serie, reparto, episodios y enlace de IMDb...';
      state.title = sh.name || '';
      const net = sh.network?.name || sh.webChannel?.name || 'SERIE TV';
      state.subtitle = net.toUpperCase();
      const startY = (sh.premiered || '').slice(0, 4);
      const endY = (sh.ended || '').slice(0, 4);
      state.year = endY && endY !== startY ? `${startY}–${endY}` : startY;
      state.credit = `${net.toUpperCase()} · SERIE ORIGINAL`;
      state.duration = sh.averageRuntime ? `${sh.averageRuntime} min/ep` : '45 min/ep';
      state.genre = (sh.genres || []).slice(0, 3).join(' · ') || 'Serie';
      state.cast = 'Cargando reparto...';
      state.synopsis = (sh.summary || '').replace(/<[^>]+>/g, '').trim();
      state.showExplicit = false;
      state.fitContain = true;
      state.qrLabel = 'VER EN IMDb';

      if (sh.externals?.imdb) {
        state.qrUrl = `https://www.imdb.com/title/${sh.externals.imdb}/`;
        $('inpQrUrl').value = state.qrUrl;
        $('qrUrlBadge').textContent = 'IMDb exacto';
      } else {
        state.qrUrl = `https://www.imdb.com/find/?q=${encodeURIComponent(state.title)}&s=tt`;
        $('inpQrUrl').value = state.qrUrl;
        $('qrUrlBadge').textContent = 'IMDb búsqueda';
      }
      scheduleQrRender();

      const artUrl = sh.image?.original || sh.image?.medium || '';
      loadMainArtwork(artUrl);

      // Cargar reparto principal + episodios en paralelo
      fetch(`https://api.tvmaze.com/shows/${sh.id}/cast`)
        .then(r => r.ok ? r.json() : [])
        .then(castList => {
          const names = [...new Set((castList || []).map(c => c.person?.name).filter(Boolean))].slice(0, 4);
          state.cast = names.length ? names.join(', ') : '—';
          syncFormFromState();
          scheduleRender();
        })
        .catch(() => { state.cast = '—'; });

      // Cargar episodios para permitir elegir temporada
      try {
        const epRes = await fetch(`https://api.tvmaze.com/shows/${sh.id}/episodes`);
        if (epRes.ok) {
          const eps = await epRes.json();
          state.currentSeriesEpisodes = eps || [];
          const seasons = [...new Set(eps.map(e => e.season))].sort((a, b) => a - b);
          if (seasons.length) {
            const sel = $('seasonSelect');
            sel.innerHTML = `<option value="overview">Ficha general (sinopsis y datos)</option>` +
              seasons.map(s => `<option value="${s}">Temporada ${s} (${eps.filter(e => e.season === s).length} episodios)</option>`).join('');
            sel.value = String(seasons[0]);
            $('seasonPickerWrap').hidden = false;
            applySeriesSeason(String(seasons[0]));
            status.textContent = `✓ Serie cargada (${seasons.length} temp. · ${eps.length} episodios). Elige temporada o ficha arriba.`;
          } else {
            state.bodyMode = 'cinema';
            status.textContent = '✓ Serie cargada con enlace directo a IMDb.';
          }
        }
      } catch (_) {
        state.bodyMode = 'cinema';
        status.textContent = '✓ Serie cargada.';
      }
      syncFormFromState();
      scheduleRender();
    }
  }

  function applySeriesSeason(val) {
    if (val === 'overview') {
      state.bodyMode = 'cinema';
    } else {
      const sNum = Number(val);
      const eps = state.currentSeriesEpisodes.filter(e => e.season === sNum);
      state.bodyMode = 'tracks';
      state.credit = `TEMPORADA ${sNum} · ${eps.length} EPISODIOS`;
      state.tracksText = eps.map(e => `${e.name} | ${e.runtime ? e.runtime + 'm' : ''}`).join('\n');
    }
    syncFormFromState();
    scheduleRender();
  }

  function loadMainArtwork(url) {
    state.mainImgUrl = url;
    state.mainZoom = 100;
    state.mainX = 0;
    state.mainY = 0;
    loadCorsImage(url, (img) => {
      state.mainImg = img;
      extractPaletteFromImage(img);
      scheduleRender();
    }, () => {
      state.mainImg = createFallbackArtImage(state.title, state.subtitle, state.palette);
      scheduleRender();
    });
  }

  /* ==========================================================================
     DEMOS RÁPIDOS (1 CLIC)
     ========================================================================== */
  function loadDemo(kind) {
    if (kind === 'album') {
      state.template = 'poster';
      state.searchType = 'album';
      state.bodyMode = 'tracks';
      state.orientation = 'portrait';
      state.theme = 'white';
      state.title = 'CURTAIN CALL: THE HITS';
      state.subtitle = 'EMINEM';
      state.year = '2005';
      state.credit = 'PRODUCED BY EMINEM';
      state.showExplicit = true;
      state.fitContain = false;
      state.qrUrl = 'https://open.spotify.com/album/71xFWYFtiHC8eP99QB30AA';
      state.qrLabel = 'ESCANEA EN SPOTIFY';
      state.palette = ['#102542', '#1B2A41', '#244A26', '#7EB36A', '#A85568'];
      state.tracksText = [
        'Intro | 0:33', 'FACK | 3:25', 'The Way I Am | 4:51', 'My Name Is | 4:28',
        'Stan | 6:44', 'Lose Yourself | 5:26', 'Shake That | 4:34', 'Sing For The Moment | 5:40',
        'Without Me | 4:51', 'Like Toy Soldiers | 4:55', 'The Real Slim Shady | 4:44',
        'Mockingbird | 4:11', 'Guilty Conscience | 3:20', "Cleanin' Out My Closet | 4:58",
        'Just Lose It | 4:08', "When I'm Gone | 4:41", 'Stan - Live ft. Elton John | 6:22'
      ].join('\n');
      $('searchInput').value = 'Curtain Call Eminem';
      state.mainImg = createFallbackArtImage(state.title, state.subtitle, state.palette);
      // Intentar cargar portada real de iTunes silenciosamente
      fetchItunes('https://itunes.apple.com/search?term=Curtain+Call+The+Hits+Eminem&media=music&entity=album&limit=1')
        .then(d => { if (d.results?.[0]?.artworkUrl100) loadMainArtwork(upgradeItunesArtwork(d.results[0].artworkUrl100)); })
        .catch(() => {});
    } else if (kind === 'movie') {
      state.template = 'poster';
      state.searchType = 'movie';
      state.bodyMode = 'cinema';
      state.theme = 'cream';
      state.title = 'INTERSTELLAR';
      state.subtitle = 'CHRISTOPHER NOLAN';
      state.year = '2014';
      state.credit = 'DIRIGIDA POR CHRISTOPHER NOLAN';
      state.duration = '2h 49m';
      state.genre = 'Ciencia ficción · Drama · Aventura';
      state.cast = 'Matthew McConaughey, Anne Hathaway, Jessica Chastain, Michael Caine';
      state.synopsis = 'Interstellar es una película épica de ciencia ficción y drama dirigida por Christopher Nolan. Cuando la Tierra se vuelve inhabitable en un futuro cercano, un granjero y expiloto de la NASA emprende una misión a través de un agujero de gusano para buscar un nuevo hogar para la humanidad.';
      state.showExplicit = false;
      state.fitContain = true;
      state.qrUrl = 'https://www.imdb.com/title/tt0816692/';
      state.qrLabel = 'VER EN IMDb';
      state.palette = ['#0B132B', '#1C2541', '#3A506B', '#C9A96E', '#E8DFCA'];
      $('searchInput').value = 'Interstellar';
      state.mainImg = createFallbackArtImage(state.title, state.subtitle, state.palette);
      fetchImdbSuggest('interstellar')
        .then(list => { if (list?.[0]?.i?.[0]) loadMainArtwork(list[0].i[0]); })
        .catch(() => {});
    } else if (kind === 'series') {
      state.template = 'poster';
      state.searchType = 'series';
      state.bodyMode = 'tracks';
      state.theme = 'dark';
      state.title = 'BREAKING BAD';
      state.subtitle = 'AMC · VINCE GILLIGAN';
      state.year = '2008–2013';
      state.credit = 'TEMPORADA 1 · 7 EPISODIOS';
      state.duration = '47 min/ep';
      state.genre = 'Drama · Crimen · Thriller';
      state.cast = 'Bryan Cranston, Aaron Paul, Anna Gunn, Dean Norris';
      state.showExplicit = false;
      state.fitContain = true;
      state.qrUrl = 'https://www.imdb.com/title/tt0903747/';
      state.qrLabel = 'VER EN IMDb';
      state.palette = ['#0D1F12', '#1B4332', '#2D6A4F', '#74C69D', '#D9A404'];
      state.tracksText = [
        'Pilot | 58m', "Cat's in the Bag... | 48m", "...And the Bag's in the River | 48m",
        'Cancer Man | 48m', 'Gray Matter | 48m', 'Crazy Handful of Nothin\' | 48m',
        'A No-Rough-Stuff-Type Deal | 48m'
      ].join('\n');
      $('searchInput').value = 'Breaking Bad';
      state.mainImg = createFallbackArtImage(state.title, state.subtitle, state.palette);
      fetch('https://api.tvmaze.com/singlesearch/shows?q=breaking+bad')
        .then(r => r.json())
        .then(sh => { if (sh?.image?.original) loadMainArtwork(sh.image.original); })
        .catch(() => {});
    } else if (kind === 'gift') {
      state.template = 'player';
      state.theme = 'cream';
      state.title = 'Nuestra Canción';
      state.subtitle = 'Para ti, con todo mi cariño ♥';
      state.year = '2026';
      state.currentTime = '1:43';
      state.totalTime = '3:45';
      state.progressPct = 46;
      state.favIcon = 'heart';
      state.playState = 'pause';
      state.badgeRight = '♥';
      state.showExplicit = false;
      state.qrUrl = 'https://open.spotify.com/';
      state.qrLabel = 'ESCÚCHALA AQUÍ';
      state.qrIcon = 'heart';
      state.qrColorMode = 'palette';
      state.palette = ['#3B1D2A', '#7A2E4B', '#C94C6D', '#F29CB0', '#FDE2E8'];
      state.mainImg = createFallbackArtImage('SUBE TU FOTO', 'MODO REGALO', state.palette);
      activateTab('content');
    }

    syncFormFromState();
    invalidateQr();
    scheduleRender();
  }

  /* ==========================================================================
     SINCRONIZACIÓN UI <-> ESTADO
     ========================================================================== */
  function activateTab(tabName) {
    document.querySelectorAll('.ea-tab').forEach(b => {
      const on = b.dataset.tab === tabName;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('.ea-panel').forEach(p => {
      p.classList.toggle('is-active', p.id === `panel-${tabName}`);
    });
    notifyIframeHeight();
  }

  function updateVisibilityByTemplate() {
    const isPoster = state.template === 'poster';
    const isPlayer = state.template === 'player';
    const isKeychain = state.template === 'keychain';

    $('posterHeaderExtras').hidden = !isPoster;
    $('posterBodyControls').hidden = !isPoster;
    $('fieldPlayerWrap').hidden = !isPlayer;
    $('secondPhotoWrap').hidden = !isKeychain;
    $('paletteSection').hidden = isPlayer;
    $('posterFormatWrap').hidden = isKeychain;
    $('keychainFormatWrap').hidden = !isKeychain;

    $('fieldTracksWrap').hidden = state.bodyMode !== 'tracks';
    $('fieldMovieWrap').hidden = state.bodyMode !== 'cinema';
    $('qrCustomColorsWrap').hidden = state.qrColorMode !== 'custom';
    $('customBgWrap').hidden = state.theme !== 'custom';

    document.querySelectorAll('[data-template]').forEach(b => {
      b.classList.toggle('is-active', b.dataset.template === state.template);
    });
    document.querySelectorAll('[data-search-type]').forEach(b => {
      b.classList.toggle('is-active', b.dataset.searchType === state.searchType);
    });
    document.querySelectorAll('[data-body-mode]').forEach(b => {
      b.classList.toggle('is-active', b.dataset.bodyMode === state.bodyMode);
    });
    document.querySelectorAll('[data-orient]').forEach(b => {
      b.classList.toggle('is-active', b.dataset.orient === state.orientation);
    });
  }

  function syncFormFromState() {
    $('inpTitle').value = state.title;
    $('inpSubtitle').value = state.subtitle;
    $('inpYear').value = state.year;
    $('inpCredit').value = state.credit;
    $('inpTracks').value = state.tracksText;
    $('inpDuration').value = state.duration;
    $('inpGenre').value = state.genre;
    $('inpCast').value = state.cast;
    $('inpSynopsis').value = state.synopsis;

    $('inpCurrentTime').value = state.currentTime;
    $('inpTotalTime').value = state.totalTime;
    $('inpProgressRange').value = state.progressPct;
    $('lblProgressPct').textContent = state.progressPct + '%';
    $('selFavIcon').value = state.favIcon;
    $('selPlayState').value = state.playState;
    $('inpBadgeRight').value = state.badgeRight;

    $('rngMainZoom').value = state.mainZoom;
    $('lblMainZoom').textContent = state.mainZoom + '%';
    $('rngMainX').value = state.mainX;
    $('rngMainY').value = state.mainY;
    $('chkFitContain').checked = state.fitContain;
    $('chkGrayscale').checked = state.grayscale;
    $('chkExplicit').checked = state.showExplicit;

    $('chkShowQr').checked = state.showQr;
    $('inpQrUrl').value = state.qrUrl;
    $('inpQrLabel').value = state.qrLabel;
    $('selQrDots').value = state.qrDots;
    $('selQrCorners').value = state.qrCorners;
    $('selQrIcon').value = state.qrIcon;
    $('selQrColorMode').value = state.qrColorMode;

    $('selPaperSize').value = state.paperSize;
    $('selTheme').value = state.theme;
    $('selFont').value = state.fontSet;
    $('inpFooterNote').value = state.footerNote;
    $('inpKeychainWidthCm').value = state.keychainWidthCm;
    $('selKeychainBg').value = state.keychainBg;
    $('chkCutGuides').checked = state.cutGuides;
    $('chkPunchHole').checked = state.punchHole;
    $('selPdfPairs').value = String(state.pdfPairs);

    syncPaletteInputs();
    updateVisibilityByTemplate();
  }

  function handleLocalFileUpload(file, isSecond) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        if (isSecond) {
          state.secondImg = img;
          state.secondZoom = 100;
          state.secondX = 0;
          state.secondY = 0;
          $('rngSecondZoom').value = 100;
          $('lblSecondZoom').textContent = '100%';
          $('rngSecondX').value = 0;
          $('rngSecondY').value = 0;
        } else {
          state.mainImg = img;
          state.mainZoom = 100;
          state.mainX = 0;
          state.mainY = 0;
          $('rngMainZoom').value = 100;
          $('lblMainZoom').textContent = '100%';
          $('rngMainX').value = 0;
          $('rngMainY').value = 0;
          extractPaletteFromImage(img);
        }
        scheduleRender();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function notifyIframeHeight() {
    if (window.parent && window.parent !== window) {
      const h = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: 'pm-encuadrando-height', height: h }, '*');
    }
  }

  /* ==========================================================================
     EVENT LISTENERS
     ========================================================================== */
  function bindEvents() {
    // Tabs
    document.querySelectorAll('.ea-tab').forEach(btn => {
      btn.addEventListener('click', () => activateTab(btn.dataset.tab));
    });

    // Plantillas
    document.querySelectorAll('[data-template]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.template = btn.dataset.template;
        updateVisibilityByTemplate();
        invalidateQr();
        scheduleRender();
      });
    });

    // Demos rápidos
    document.querySelectorAll('[data-demo]').forEach(btn => {
      btn.addEventListener('click', () => loadDemo(btn.dataset.demo));
    });

    // Buscador
    document.querySelectorAll('[data-search-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.searchType = btn.dataset.searchType;
        updateVisibilityByTemplate();
        const ph = {
          album: 'Ej: Curtain Call Eminem, Un Verano Sin Ti, Dark Side of the Moon...',
          song: 'Ej: Without Me Eminem, Me Porto Bonito, Bohemian Rhapsody...',
          movie: 'Ej: Interstellar, El Padrino, Spirited Away, Matrix...',
          series: 'Ej: Breaking Bad, Stranger Things, The Office, Arcane...'
        };
        $('searchInput').placeholder = ph[state.searchType] || '';
      });
    });

    $('searchForm').addEventListener('submit', (e) => {
      e.preventDefault();
      runSearch($('searchInput').value);
    });

    $('seasonSelect').addEventListener('change', (e) => applySeriesSeason(e.target.value));
    $('btnGoToPhoto').addEventListener('click', () => activateTab('content'));

    // Modo cuerpo póster
    document.querySelectorAll('[data-body-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.bodyMode = btn.dataset.bodyMode;
        updateVisibilityByTemplate();
        scheduleRender();
      });
    });

    // Orientación
    document.querySelectorAll('[data-orient]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.orientation = btn.dataset.orient;
        updateVisibilityByTemplate();
        scheduleRender();
      });
    });

    // Inputs de texto directo
    const bindInput = (id, prop, isQr) => {
      $(id).addEventListener('input', (e) => {
        state[prop] = e.target.value;
        if (isQr) scheduleQrRender();
        else scheduleRender();
      });
    };
    bindInput('inpTitle', 'title');
    bindInput('inpSubtitle', 'subtitle');
    bindInput('inpYear', 'year');
    bindInput('inpCredit', 'credit');
    bindInput('inpTracks', 'tracksText');
    bindInput('inpDuration', 'duration');
    bindInput('inpGenre', 'genre');
    bindInput('inpCast', 'cast');
    bindInput('inpSynopsis', 'synopsis');
    bindInput('inpCurrentTime', 'currentTime');
    bindInput('inpTotalTime', 'totalTime');
    bindInput('inpBadgeRight', 'badgeRight');
    bindInput('inpQrUrl', 'qrUrl', true);
    bindInput('inpQrLabel', 'qrLabel');
    bindInput('inpFooterNote', 'footerNote');

    // Progress slider
    $('inpProgressRange').addEventListener('input', (e) => {
      state.progressPct = Number(e.target.value);
      $('lblProgressPct').textContent = state.progressPct + '%';
      scheduleRender();
    });

    // Selects
    const bindSelect = (id, prop, refreshQr) => {
      $(id).addEventListener('change', (e) => {
        state[prop] = e.target.value;
        updateVisibilityByTemplate();
        if (refreshQr) scheduleQrRender();
        else scheduleRender();
      });
    };
    bindSelect('selFavIcon', 'favIcon');
    bindSelect('selPlayState', 'playState');
    bindSelect('selQrDots', 'qrDots', true);
    bindSelect('selQrCorners', 'qrCorners', true);
    bindSelect('selQrIcon', 'qrIcon', true);
    bindSelect('selQrColorMode', 'qrColorMode', true);
    bindSelect('selPaperSize', 'paperSize');
    bindSelect('selTheme', 'theme', true);
    bindSelect('selFont', 'fontSet');
    bindSelect('selKeychainBg', 'keychainBg', true);
    bindSelect('selPdfPairs', 'pdfPairs');

    $('inpCustomBg').addEventListener('input', (e) => {
      state.customBg = e.target.value;
      scheduleQrRender();
    });
    $('inpQrColor1').addEventListener('input', (e) => { state.qrColor1 = e.target.value; scheduleQrRender(); });
    $('inpQrColor2').addEventListener('input', (e) => { state.qrColor2 = e.target.value; scheduleQrRender(); });
    $('inpKeychainWidthCm').addEventListener('input', (e) => { state.keychainWidthCm = Number(e.target.value) || 7.5; scheduleRender(); });

    // Checkboxes
    const bindCheck = (id, prop, refreshQr) => {
      $(id).addEventListener('change', (e) => {
        state[prop] = e.target.checked;
        if (refreshQr) scheduleQrRender();
        else scheduleRender();
      });
    };
    bindCheck('chkFitContain', 'fitContain');
    bindCheck('chkGrayscale', 'grayscale');
    bindCheck('chkExplicit', 'showExplicit');
    bindCheck('chkShowQr', 'showQr', true);
    bindCheck('chkCutGuides', 'cutGuides');
    bindCheck('chkPunchHole', 'punchHole');

    // Fotos y sliders de encuadre
    $('inpMainPhoto').addEventListener('change', (e) => handleLocalFileUpload(e.target.files?.[0], false));
    $('inpSecondPhoto').addEventListener('change', (e) => handleLocalFileUpload(e.target.files?.[0], true));
    $('btnUseSamePhoto').addEventListener('click', () => { state.secondImg = null; scheduleRender(); });
    $('btnExtractPalette').addEventListener('click', () => extractPaletteFromImage(state.mainImg));
    $('btnResetPhotoCrop').addEventListener('click', () => {
      state.mainZoom = 100; state.mainX = 0; state.mainY = 0;
      $('rngMainZoom').value = 100; $('lblMainZoom').textContent = '100%';
      $('rngMainX').value = 0; $('rngMainY').value = 0;
      scheduleRender();
    });

    $('rngMainZoom').addEventListener('input', (e) => { state.mainZoom = Number(e.target.value); $('lblMainZoom').textContent = state.mainZoom + '%'; scheduleRender(); });
    $('rngMainX').addEventListener('input', (e) => { state.mainX = Number(e.target.value); scheduleRender(); });
    $('rngMainY').addEventListener('input', (e) => { state.mainY = Number(e.target.value); scheduleRender(); });

    $('rngSecondZoom').addEventListener('input', (e) => { state.secondZoom = Number(e.target.value); $('lblSecondZoom').textContent = state.secondZoom + '%'; scheduleRender(); });
    $('rngSecondX').addEventListener('input', (e) => { state.secondX = Number(e.target.value); scheduleRender(); });
    $('rngSecondY').addEventListener('input', (e) => { state.secondY = Number(e.target.value); scheduleRender(); });

    // Paleta editable
    for (let i = 0; i < 5; i++) {
      $('palColor' + i).addEventListener('input', (e) => {
        state.palette[i] = e.target.value;
        if (state.qrColorMode === 'palette' || state.theme === 'tinted') scheduleQrRender();
        else scheduleRender();
      });
    }

    // Exportar
    $('btnDownloadPng').addEventListener('click', exportPng);
    $('btnDownloadPdf').addEventListener('click', exportPdf);

    // ResizeObserver para Blogger iframe
    if (window.ResizeObserver) {
      new ResizeObserver(() => notifyIframeHeight()).observe($('eaApp'));
    }
  }

  /* ---------- ARRANQUE ---------- */
  function init() {
    bindEvents();
    loadDemo('album');
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => scheduleRender());
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
