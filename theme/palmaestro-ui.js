/**
 * Pa´l Maestro — Interfaz Dinámica (Blogger + GitHub Pages)
 * Carga config/palmaestro-config.json y renderiza la Caja de Herramientas,
 * cinta de obra, stickers clickeables, contador LED de mates y nota rápida.
 */
(function () {
  const BASE_URL = window.PM_ASSETS_BASE || 'https://shewinho.github.io/palmaestro-web';

  const FALLBACK_CONFIG = {
    instagramUrl: 'https://www.instagram.com/pal_maestro?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
    instagramHandle: '@pal_maestro',
    communityUrl: 'https://www.palmaestro.xyz/p/unete-la-comunidad.html',
    recommendedUrl: 'https://www.palmaestro.xyz/p/la-ferre-de-julio.html',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/playlist/5Q0M7po6pOm2tTCV2frJnq?utm_source=generator&theme=0',
    spotifyVideoUrl: 'https://i.imgur.com/r1K8RJY.mp4',
    mascotNormalUrl: 'https://i.imgur.com/UC74mKB.png',
    mascotHoverUrl: 'https://i.imgur.com/im8u7vC.png',
    marqueeItems: [
      'BIENVENIDO AL MESÓN DIGITAL DE PA´L MAESTRO',
      'TETERA LISTA PARA CHASQUILLEAR',
      'DIMENSIONADOR DE TABLAS GRATIS',
      'PLAYLIST PA´ MAESTREAR ACTUALIZADA',
      'SÍGUENOS EN @PAL_MAESTRO'
    ],
    quickNote: {
      label: 'Nota rápida del mesón',
      text: 'Hola maquinon@s, busquen y vean lo que quieran, se los permito. Todas las herramientas son gratuitas y pensadas para el taller o la casa.'
    },
    matesBaseCount: 4821,
    tools: [
      {
        id: 'dimensionador',
        title: 'Dimensionador de Tablas',
        tech: 'Planchas 1,22×2,44 m · Optimización de cortes · HTML',
        description: 'Calcula tus cortes de madera antes de ir a la barraca y ahorra material.',
        url: 'https://www.palmaestro.xyz/p/dimensionador.html',
        badge: 'Activa',
        badgeColor: '#22C55E',
        badgeText: '#FFFFFF',
        theme: 'blue',
        icon: 'ruler'
      },
      {
        id: 'descargador',
        title: 'Descargador de Videos',
        tech: 'Respaldo rápido · MP4 / Audio · Sin publicidad',
        description: 'Guarda tutoriales y referencias técnicas para verlos incluso sin señal.',
        url: 'https://www.palmaestro.xyz/p/descargar-videos-gratis.html',
        badge: 'En proceso',
        badgeColor: '#FFD000',
        badgeText: '#1F2536',
        theme: 'orange',
        icon: 'download'
      },
      {
        id: 'excels',
        title: 'Excels Útiles',
        tech: 'Formato .xlsx / Sheets · Cubicaciones y presupuestos',
        description: 'Tablas probadas en obra para ordenar materiales, costos y avances.',
        url: 'https://www.palmaestro.xyz/p/utilidades-pamaestro.html',
        badge: 'Planillas',
        badgeColor: '#FFFFFF',
        badgeText: '#1F2536',
        theme: 'green',
        icon: 'chart'
      },
      {
        id: 'mas-utilidades',
        title: '+ Más Utilidades',
        tech: 'Calculadoras · Links útiles · Recursos propios',
        description: 'Revisa todas las herramientas y nuevos programas HTML en camino.',
        url: 'https://www.palmaestro.xyz/p/utilidades-pamaestro.html',
        badge: 'Próximamente',
        badgeColor: '#FFFFFF',
        badgeText: '#1F2536',
        theme: 'yellow',
        icon: 'wrench',
        dashed: true
      }
    ],
    stickers: [
      { label: '3/4"', bg: '#FFD000', color: '#1F2536', rotate: -6, icon: 'ruler', message: 'Consejo del maestro: «Mide dos veces, corta una».' },
      { label: '80°C', bg: '#EF3B39', color: '#FFFFFF', rotate: 4, icon: 'flame', message: 'Agua a 80°C en la tetera, nunca hervida para el mate.' },
      { label: 'Chasquilla', bg: '#38BDF8', color: '#1F2536', rotate: -3, icon: 'wrench', message: 'Regla de oro: un buen plano evita 3 viajes a la ferretería.' }
    ]
  };

  const ICONS = {
    ruler: `<svg class="ico-svg ico-ruler" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/></svg>`,
    download: `<svg class="ico-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><g class="ico-dl-arrow"><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></g></svg>`,
    chart: `<svg class="ico-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line class="ico-bar-1" x1="8" y1="17" x2="8" y2="11"/><line class="ico-bar-2" x1="12" y1="17" x2="12" y2="7"/><line class="ico-bar-3" x1="16" y1="17" x2="16" y2="13"/></svg>`,
    wrench: `<svg class="ico-svg ico-wrench" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
    flame: `<svg class="ico-svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1 3 4 4 4 8a4 4 0 1 1-8 0c0-2 1-4 4-8Z"/></svg>`,
    tag: `<svg class="ico-svg ico-tag" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".7" fill="currentColor"/></svg>`,
    wheel: `<svg class="ico-svg ico-wrench" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/></svg>`,
    sparkles: `<svg class="ico-svg ico-wrench" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/><path d="M5 3v4M3 5h4M19 17v4M17 19h4"/></svg>`,
    frame: `<svg class="ico-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2.5"/><rect x="6.5" y="6.5" width="11" height="8" rx="1"/><line x1="6.5" y1="17.5" x2="12.5" y2="17.5"/><circle cx="16.5" cy="17.5" r="1" fill="currentColor"/></svg>`,
    convert: `<svg class="ico-svg ico-wrench" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>`
  };

  const THEME_STYLES = {
    blue: { pat: 'pat-blue-soft', icoBg: '#38BDF8', icoColor: '#1F2536' },
    orange: { pat: 'pat-orange-soft', icoBg: '#FF5A1F', icoColor: '#FFFFFF' },
    green: { pat: 'pat-green-soft', icoBg: '#22C55E', icoColor: '#FFFFFF' },
    yellow: { pat: 'pat-yellow-soft', icoBg: '#FFD000', icoColor: '#1F2536' }
  };

  let toastTimer = null;
  function showToast(msg) {
    let el = document.getElementById('pm-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'pm-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.style.display = 'none'; }, 2800);
  }
  window.pmShowToast = showToast;

  function renderMarquee(items) {
    const track = document.getElementById('pm-marquee-track');
    if (!track || !Array.isArray(items) || !items.length) return;
    const html = items.map((t) => `<span>• ${t}</span>`).join('');
    track.innerHTML = html + html;
  }

  function renderTools(tools) {
    const slot = document.getElementById('pm-tools-slot');
    if (!slot || !Array.isArray(tools)) return;
    slot.innerHTML = tools.map((tool) => {
      const st = THEME_STYLES[tool.theme] || THEME_STYLES.blue;
      const boxClass = tool.dashed ? 'pm-coupon' : 'pm-btn';
      const iconSvg = ICONS[tool.icon] || ICONS.wrench;
      return `
        <a href="${tool.url}" class="pat-trigger ${st.pat} ${boxClass} pm-tool-tile pm-tool-link">
          <div class="pm-tool-top">
            <div class="pm-tool-ico" style="background:${st.icoBg}; color:${st.icoColor};">${iconSvg}</div>
            <span class="pm-badge" style="background:${tool.badgeColor || '#FFF'}; color:${tool.badgeText || '#1F2536'};">${tool.badge || ''}</span>
          </div>
          <div>
            <h3 class="pm-title-xl pm-tool-name">${tool.title}</h3>
            <div class="pm-tech-italic" style="margin-top:4px;">${tool.tech || ''}</div>
          </div>
          <p class="pm-tool-desc">${tool.description || ''}</p>
        </a>
      `;
    }).join('');
  }

  function renderStickers(stickers) {
    const slot = document.getElementById('pm-stickers-slot');
    if (!slot || !Array.isArray(stickers)) return;
    slot.innerHTML = stickers.map((st, idx) => `
      <button type="button" class="pm-sticker pm-sticker-pill" data-idx="${idx}"
              style="background:${st.bg}; color:${st.color}; transform:rotate(${st.rotate || 0}deg);">
        ${ICONS[st.icon] || ''}
        <span>${st.label}</span>
      </button>
    `).join('');

    slot.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const st = stickers[Number(btn.dataset.idx)];
        if (st && st.message) showToast(st.message);
      });
    });
  }

  function initMateCounter(baseCount) {
    const led = document.getElementById('pm-led-counter');
    const btn = document.getElementById('pm-btn-mate');
    if (!led || !btn) return;
    const saved = parseInt(localStorage.getItem('pm_mates_extra') || '0', 10) || 0;
    let total = (baseCount || 4821) + saved;
    led.textContent = String(total).padStart(6, '0');

    btn.addEventListener('click', () => {
      total += 1;
      const newExtra = (parseInt(localStorage.getItem('pm_mates_extra') || '0', 10) || 0) + 1;
      localStorage.setItem('pm_mates_extra', String(newExtra));
      led.textContent = String(total).padStart(6, '0');
      showToast(`Mate #${total} servido. ¡Gracias por pasar por el mesón!`);
    });
  }

  function renderQuickNote(note) {
    const labelEl = document.getElementById('pm-note-label');
    const textEl = document.getElementById('pm-note-text');
    if (!note) return;
    if (labelEl && note.label) labelEl.textContent = note.label;
    if (textEl && note.text) textEl.textContent = note.text;
  }

  function wireLoaderTransitions() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a.pm-tool-link');
      if (!link || !window.PalMaestroLoader) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || link.target === '_blank') return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;

      e.preventDefault();
      window.PalMaestroLoader.show({ progress: 0 });
      let p = 0;
      const iv = setInterval(() => {
        p = Math.min(100, p + 18);
        window.PalMaestroLoader.setProgress(p);
        if (p >= 100) {
          clearInterval(iv);
          setTimeout(() => { window.location.href = href; }, 420);
        }
      }, 75);
    });
  }

  function initHandLogo() {
    const badges = document.querySelectorAll('.pm-brand-badge');
    if (!badges.length) return;

    const F_PIVOTS = [28.25, 40.2, 52.3, 64.15];
    const REST = {
      handRot: -20, handY: 0,
      fLen: [1, 1, 1, 1],
      fRot: [-2, -0.5, 0.5, 2],
      thumbRot: 42, thumbLen: 1
    };
    const GESTURES = [
      {
        name: 'Saludo',
        handRot: -16, handY: -2,
        fLen: [1, 1, 1, 1],
        fRot: [-5, -1.5, 1.5, 5],
        thumbRot: 46, thumbLen: 1,
        waveAmp: 12, waveFreq: 11
      },
      {
        name: 'Amor y Paz',
        handRot: -6, handY: -2,
        fLen: [0.14, 0.14, 1.03, 1.05],
        fRot: [0, 0, -10, 12],
        thumbRot: -18, thumbLen: 0.32,
        waveAmp: 3, waveFreq: 5
      },
      {
        name: 'Rock',
        handRot: -8, handY: -3,
        fLen: [1.06, 0.14, 0.14, 1.05],
        fRot: [-11, 0, 0, 11],
        thumbRot: 48, thumbLen: 0.92,
        waveAmp: 5, waveFreq: 9
      },
      {
        name: '¡Wena!',
        handRot: -22, handY: -2,
        fLen: [1.08, 0.14, 0.14, 0.14],
        fRot: [-18, 0, 0, 0],
        thumbRot: 54, thumbLen: 1.05,
        waveAmp: 10, waveFreq: 10
      }
    ];

    badges.forEach((badge) => {
      badge.innerHTML = `
        <svg class="pm-hand-svg" viewBox="0 0 100 100" aria-label="Logo mano Pa´l Maestro">
          <g class="pm-hand-root">
            <g class="pm-f0"><rect x="23.5" y="29" width="9.5" height="31" rx="4.75" fill="#FFFFFF" /></g>
            <g class="pm-f1"><rect x="35.2" y="19" width="10" height="41" rx="5" fill="#FFFFFF" /></g>
            <g class="pm-f2"><rect x="47.3" y="16" width="10" height="44" rx="5" fill="#FFFFFF" /></g>
            <g class="pm-f3"><rect x="59.4" y="22" width="9.5" height="38" rx="4.75" fill="#FFFFFF" /></g>
            <path d="M 23.5 52 C 23.5 48, 68.9 48, 68.9 52 L 68.9 71 C 68.9 81, 62.5 87, 53 87 L 39.5 87 C 30 87, 23.5 81, 23.5 71 Z" fill="#FFFFFF" />
            <rect x="32.5" y="80" width="27.5" height="36" fill="#FFFFFF" />
            <g class="pm-thumb"><rect x="59" y="42" width="11" height="36" rx="5.5" fill="#FFFFFF" /></g>
          </g>
        </svg>
      `;

      const handRoot = badge.querySelector('.pm-hand-root');
      const fingers = [0, 1, 2, 3].map((i) => badge.querySelector(`.pm-f${i}`));
      const thumbGroup = badge.querySelector('.pm-thumb');
      const host = badge.closest('.pm-brand') || badge;

      let activeIdx = 0;
      let isHovered = false;
      let touchTimer = null;
      const cur = {
        handRot: REST.handRot, handY: REST.handY,
        fLen: [...REST.fLen], fRot: [...REST.fRot],
        thumbRot: REST.thumbRot, thumbLen: REST.thumbLen, waveMix: 0
      };

      host.addEventListener('mouseenter', () => {
        isHovered = true;
        badge.setAttribute('title', `Pa´l Maestro · ${GESTURES[activeIdx].name}`);
      });
      host.addEventListener('mouseleave', () => {
        isHovered = false;
        activeIdx = (activeIdx + 1) % GESTURES.length;
      });
      badge.addEventListener('touchstart', () => {
        isHovered = true;
        badge.classList.add('pm-active');
        if (touchTimer) clearTimeout(touchTimer);
        touchTimer = setTimeout(() => {
          isHovered = false;
          badge.classList.remove('pm-active');
          activeIdx = (activeIdx + 1) % GESTURES.length;
        }, 1200);
      }, { passive: true });

      let last = performance.now();
      function tick(now) {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        const t = now / 1000;
        const k = Math.min(1, dt * 11);
        const g = isHovered ? GESTURES[activeIdx] : REST;

        cur.handRot += (g.handRot - cur.handRot) * k;
        cur.handY += (g.handY - cur.handY) * k;
        cur.thumbRot += (g.thumbRot - cur.thumbRot) * k;
        cur.thumbLen += (g.thumbLen - cur.thumbLen) * k;
        cur.waveMix += ((isHovered ? 1 : 0) - cur.waveMix) * Math.min(1, dt * 8);

        for (let i = 0; i < 4; i++) {
          cur.fLen[i] += (g.fLen[i] - cur.fLen[i]) * Math.min(1, dt * 13);
          cur.fRot[i] += (g.fRot[i] - cur.fRot[i]) * Math.min(1, dt * 12);
        }

        const activeG = GESTURES[activeIdx];
        const wave = Math.sin(t * activeG.waveFreq) * activeG.waveAmp * cur.waveMix;
        handRoot.setAttribute('transform', `translate(0, ${cur.handY.toFixed(2)}) rotate(${(cur.handRot + wave).toFixed(2)}, 48, 86)`);

        for (let i = 0; i < 4; i++) {
          const px = F_PIVOTS[i];
          fingers[i].setAttribute('transform', `translate(${px}, 54) rotate(${cur.fRot[i].toFixed(2)}) scale(1, ${cur.fLen[i].toFixed(3)}) translate(${-px}, -54)`);
        }
        thumbGroup.setAttribute('transform', `translate(64.5, 73) rotate(${cur.thumbRot.toFixed(2)}) scale(1, ${cur.thumbLen.toFixed(3)}) translate(-64.5, -73)`);

        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  function initRansomWordmark() {
    const brandTitles = document.querySelectorAll('.pm-brand-title');
    brandTitles.forEach((el) => {
      el.innerHTML = `
        <span class="pm-ransom-wordmark" aria-label="Pa´l Maestro">
          <span class="pm-cut cut-p">p</span>
          <span class="pm-cut cut-a1">a</span>
          <span class="pm-cut cut-apos">&rsquo;</span>
          <span class="pm-cut cut-L">L</span>
          <span class="pm-cut cut-m">m</span>
          <span class="pm-cut cut-a2">a</span>
          <span class="pm-cut cut-e">e</span>
          <span class="pm-cut cut-s">s</span>
          <span class="pm-cut cut-t">t</span>
          <span class="pm-cut cut-R">R</span>
          <span class="pm-cut cut-o">o</span>
        </span>
      `;

      const wm = el.querySelector('.pm-ransom-wordmark');
      const cuts = Array.from(wm.querySelectorAll('.pm-cut'));

      function pop(letter) {
        if (!letter || !letter.classList.contains('pm-cut')) return;
        letter.classList.add('pop');
        clearTimeout(letter._t);
        letter._t = setTimeout(() => letter.classList.remove('pop'), 340);
      }

      cuts.forEach((c) => {
        c.addEventListener('mouseenter', () => pop(c));
      });

      wm.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        if (!touch) return;
        const hit = document.elementFromPoint(touch.clientX, touch.clientY);
        if (hit && hit.classList.contains('pm-cut')) pop(hit);
      }, { passive: true });

      wm.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        if (!touch) return;
        const hit = document.elementFromPoint(touch.clientX, touch.clientY);
        if (hit && hit.classList.contains('pm-cut')) pop(hit);
      }, { passive: true });

      // Ola sutil de bienvenida al entrar al sitio
      setTimeout(() => {
        cuts.forEach((c, i) => setTimeout(() => pop(c), i * 50));
      }, 380);
    });

    // Aplica el guiño de recorte fanzine en los títulos principales de sección
    document.querySelectorAll('h1.pm-title-xl, h2.pm-title-xl, #extras-left h2, #extras-right h2').forEach((h) => {
      const txt = h.textContent.trim();
      if (txt === 'Caja de Herramientas') {
        h.innerHTML = 'Caja de <span class="pm-zine-accent">Herramientas</span>';
      } else if (txt === 'Pa´ leer e indagar') {
        h.innerHTML = 'Pa´ leer e <span class="pm-zine-accent pink">indagar</span>';
      } else if (txt === 'Lo más mejor') {
        h.innerHTML = 'Lo más <span class="pm-zine-accent navy">mejor</span>';
      } else if (txt === 'Temas del mesón') {
        h.innerHTML = 'Temas del <span class="pm-zine-accent">mesón</span>';
      }
    });
  }

  async function boot() {
    initHandLogo();
    initRansomWordmark();
    let cfg = FALLBACK_CONFIG;
    try {
      const res = await fetch(`${BASE_URL}/config/palmaestro-config.json?v=${Math.floor(Date.now() / 60000)}`);
      if (res.ok) cfg = Object.assign({}, FALLBACK_CONFIG, await res.json());
    } catch (_) {
      // Usa FALLBACK_CONFIG si aún no está publicado GitHub Pages
    }

    renderMarquee(cfg.marqueeItems);
    renderTools(cfg.tools);
    renderStickers(cfg.stickers);
    initMateCounter(cfg.matesBaseCount);
    renderQuickNote(cfg.quickNote);
    if (cfg.recommendedUrl) {
      document.querySelectorAll('a[href*="compras-recomendadas.html"]').forEach((a) => {
        a.setAttribute('href', cfg.recommendedUrl);
      });
    }
    wireLoaderTransitions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
