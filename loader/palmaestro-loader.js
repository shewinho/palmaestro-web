/**
 * Pa´l Maestro — Loader Vectorial Animado (Web Component + Overlay API)
 * Repositorio: https://github.com/shewinho/palmaestro-web
 * Estilo: Flat Moderno Vibrante | Fondo 100% transparente | Sin dependencias
 */
(function () {
  if (customElements.get('palmaestro-loader')) return;

  const SVG_TEMPLATE = `
    <style>
      :host {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: transparent;
        user-select: none;
        font-family: 'Allo', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      }
      .pm-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; background: transparent; }
      .pm-meta { display: none; align-items: center; gap: 8px; margin-bottom: 4px; }
      .pm-meta.visible { display: flex; }
      .pm-badge { padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: 0.01em; }
      .pm-pct { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }
      svg.pm-svg { display: block; width: 100%; height: auto; overflow: visible; background: transparent; }
      .pm-bar-track { display: none; width: 82%; height: 7px; border-radius: 999px; background: rgba(128, 128, 128, 0.22); overflow: hidden; margin-top: 6px; }
      .pm-bar-track.visible { display: block; }
      .pm-bar-fill { height: 100%; width: 0%; border-radius: 999px; background: linear-gradient(90deg, #FF5A1F 0%, #EF3B39 65%, #38BDF8 100%); transition: width 60ms linear; }
      @keyframes pmSparklePop { 0%, 100% { transform: scale(0.7) rotate(0deg); opacity: 0.7; } 50% { transform: scale(1.18) rotate(18deg); opacity: 1; } }
      .pm-sparkle { transform-box: fill-box; transform-origin: center; animation: pmSparklePop 1.2s ease-in-out infinite; }
    </style>
    <div class="pm-wrap">
      <div class="pm-meta" id="pm-meta">
        <span class="pm-badge" id="pm-badge">Prendiendo el fuego...</span>
        <span class="pm-pct" id="pm-pct">0%</span>
      </div>
      <svg class="pm-svg" viewBox="0 0 360 205" role="img" aria-label="Cargando Pa´l Maestro">
        <defs>
          <clipPath id="pm-kettle-clip"><path d="M 150 82 C 130 88, 121 114, 126 135 C 128 141, 134 144, 142 144 L 218 144 C 226 144, 232 141, 234 135 C 239 114, 230 88, 210 82 Z" /></clipPath>
          <clipPath id="pm-mate-clip"><path d="M 204 143 A 29 7.5 0 0 0 261 143 C 262 161, 259 177, 253 186 L 247 180 L 240 187 L 233 180 L 226 187 L 219 180 L 212 186 C 206 177, 203 161, 204 143 Z" /></clipPath>
          <radialGradient id="pm-fire-glow" cx="50%" cy="60%" r="55%">
            <stop offset="0%" stop-color="#FF7A00" stop-opacity="0.52" />
            <stop offset="65%" stop-color="#FFB800" stop-opacity="0.16" />
            <stop offset="100%" stop-color="#FFB800" stop-opacity="0" />
          </radialGradient>
        </defs>
        <ellipse id="ground-shadow" cx="180" cy="186" rx="72" ry="7" fill="#000000" opacity="0.10" />
        <g id="stove-back">
          <ellipse id="burner-glow" cx="180" cy="156" rx="58" ry="24" fill="url(#pm-fire-glow)" opacity="0.25" />
          <path d="M 122 182 C 124 166, 129 149, 137 148 L 223 148 C 231 149, 236 166, 238 182" fill="none" stroke="#2B3347" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M 137 146.5 L 223 146.5" fill="none" stroke="#4D5978" stroke-width="2" stroke-linecap="round" />
          <path d="M 118 182 L 128 182 M 232 182 L 242 182" stroke="#2B3347" stroke-width="5" stroke-linecap="round" />
          <rect x="140" y="168" width="80" height="11" rx="4" fill="#1F2536" />
          <rect x="144" y="168" width="72" height="3.5" rx="1.5" fill="#465270" />
          <circle cx="151" cy="173.5" r="1.7" fill="#6B7A9E" /><circle cx="165" cy="173.5" r="1.7" fill="#6B7A9E" /><circle cx="180" cy="173.5" r="1.7" fill="#6B7A9E" /><circle cx="195" cy="173.5" r="1.7" fill="#6B7A9E" /><circle cx="209" cy="173.5" r="1.7" fill="#6B7A9E" />
        </g>
        <g id="mate-back" opacity="0">
          <ellipse cx="232.5" cy="188" rx="30" ry="5.5" fill="#000000" opacity="0.14" />
          <ellipse cx="232.5" cy="139" rx="29" ry="7.8" fill="#94A3B8" />
          <ellipse cx="232.5" cy="139.6" rx="25.5" ry="6.2" fill="#235727" />
          <g id="mate-water" opacity="0">
            <ellipse cx="232.5" cy="139.6" rx="25.5" ry="6.2" fill="#38BDF8" />
            <ellipse cx="224" cy="139.8" rx="13.5" ry="3.2" fill="#7DD3FC" opacity="0.85" />
          </g>
          <g id="bombilla">
            <path d="M 243 142 L 259 112 C 261 108, 265 106, 269 107" fill="none" stroke="#94A3B8" stroke-width="5.5" stroke-linecap="round" />
            <path d="M 243 142 L 259 112 C 261 108, 265 106, 269 107" fill="none" stroke="#F1F5F9" stroke-width="2" stroke-linecap="round" transform="translate(-1,-0.5)" />
            <circle cx="254" cy="121" r="3.4" fill="#F59E0B" />
            <ellipse cx="270" cy="107.5" rx="4.5" ry="2.5" transform="rotate(14 270 107.5)" fill="#F59E0B" />
          </g>
          <path d="M 232 141 C 236 130, 250 130, 256 140 C 250 144, 240 144, 232 141 Z" fill="#4E8A35" />
          <path d="M 239 135 C 244 132.5, 250 134, 254 139" fill="none" stroke="#76B852" stroke-width="1.6" stroke-linecap="round" opacity="0.85" />
          <circle cx="244" cy="137" r="1.4" fill="#356322" /><circle cx="249" cy="138" r="1.1" fill="#76B852" />
        </g>
        <g id="water-group" opacity="0">
          <path d="M 212 113 Q 226 117, 227 146" fill="none" stroke="#38BDF8" stroke-width="6.5" stroke-linecap="round" />
          <path id="water-flow" d="M 212 113 Q 226 117, 227 146" fill="none" stroke="#E0F7FF" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="6 7" />
        </g>
        <g id="mate-front" opacity="0">
          <g clip-path="url(#pm-mate-clip)">
            <rect x="200" y="138" width="66" height="54" fill="#8D4B26" />
            <path d="M 240 138 L 266 138 L 266 192 L 234 192 C 244 176, 246 158, 240 138 Z" fill="#683316" />
            <path d="M 211 151 C 209 162, 210 172, 214 179" fill="none" stroke="#B96F43" stroke-width="5" stroke-linecap="round" opacity="0.85" />
            <rect x="202" y="158" width="62" height="6" fill="#52260F" opacity="0.35" />
            <path d="M 206 161 L 211 159 L 216 163 L 221 159 L 226 163 L 231 159 L 236 163 L 241 159 L 246 163 L 251 159 L 256 163" fill="none" stroke="#F5B73B" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.85" />
          </g>
          <path d="M 203.5 139 A 29 7.8 0 0 0 261.5 139 L 261 145 A 28.5 7.8 0 0 1 204 145 Z" fill="#E2E8F0" />
          <path d="M 239 146.5 A 29 7.8 0 0 0 261.5 139 L 261 145 A 28.5 7.8 0 0 1 238 152 Z" fill="#CBD5E1" opacity="0.85" />
          <path d="M 209 144 A 27 7 0 0 0 232 146.6" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" opacity="0.9" />
          <path d="M 204.2 145.5 A 28.3 7.6 0 0 0 260.8 145.5" fill="none" stroke="#F59E0B" stroke-width="2.4" stroke-linecap="round" />
          <g id="splash-drops" opacity="0"><circle id="drop-1" cx="222" cy="136" r="2.1" fill="#7DD3FC" /><circle id="drop-2" cx="233" cy="134" r="1.8" fill="#BAE6FD" /></g>
          <g id="mate-steam" opacity="0"><path d="M 222 128 C 219 121, 226 116, 223 109" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" opacity="0.9" /><path d="M 233 124 C 230 117, 237 112, 234 105" fill="none" stroke="#BAE6FD" stroke-width="2.2" stroke-linecap="round" opacity="0.85" /></g>
          <g id="mate-sparkles" opacity="0">
            <path class="pm-sparkle" d="M 274 128 L 276.5 133.5 L 282 136 L 276.5 138.5 L 274 144 L 271.5 138.5 L 266 136 L 271.5 133.5 Z" fill="#FFB800" />
            <path class="pm-sparkle" style="animation-delay: 0.4s" d="M 196 127 L 197.6 130.4 L 201 132 L 197.6 133.6 L 196 137 L 194.4 133.6 L 191 132 L 194.4 130.4 Z" fill="#00C2FF" />
          </g>
        </g>
        <g id="steam-group" opacity="0">
          <g class="steam-puff"><path d="M 0 0 C -6 -6, -2 -16, 7 -15 C 12 -22, 24 -19, 24 -10 C 31 -7, 29 4, 20 5 C 14 10, 3 8, 0 0 Z" fill="#FFFFFF" opacity="0.92" /><path d="M 5 -4 C 8 -10, 17 -10, 19 -4" fill="none" stroke="#BAE6FD" stroke-width="2.5" stroke-linecap="round" /></g>
          <g class="steam-puff"><circle cx="0" cy="0" r="9" fill="#E0F2FE" opacity="0.92" /><circle cx="7" cy="-4" r="6.5" fill="#FFFFFF" opacity="0.95" /></g>
          <g class="steam-puff"><circle cx="0" cy="0" r="6.5" fill="#FFFFFF" opacity="0.88" /><circle cx="5" cy="2" r="4.5" fill="#D8F3FF" opacity="0.9" /></g>
          <g class="steam-puff"><circle cx="0" cy="0" r="4.5" fill="#FFFFFF" opacity="0.85" /></g>
        </g>
        <g id="kettle-group">
          <path d="M 143 92 C 110 88, 102 120, 129 131" fill="none" stroke="#23293A" stroke-width="11" stroke-linecap="round" />
          <path d="M 141 91 C 114 89, 107 115, 127 127" fill="none" stroke="#424D6B" stroke-width="3" stroke-linecap="round" />
          <path d="M 218 106 C 234 104, 245 96, 254 82 L 262 87 C 253 107, 240 124, 223 128 Z" fill="#EF3B39" />
          <path d="M 259 86 L 262 87 C 253 107, 240 124, 223 128 L 224 121 C 238 117, 249 103, 259 86 Z" fill="#C42224" />
          <ellipse cx="258" cy="84.5" rx="4.8" ry="2.2" transform="rotate(32 258 84.5)" fill="#8F1316" />
          <g clip-path="url(#pm-kettle-clip)">
            <rect x="120" y="80" width="120" height="68" fill="#EF3B39" />
            <path d="M 192 80 L 245 80 L 245 148 L 185 148 C 204 134, 210 104, 192 80 Z" fill="#C92325" />
            <rect x="120" y="137" width="120" height="8" fill="#252C3E" />
            <path d="M 145 96 C 138 106, 136 119, 139 128" fill="none" stroke="#FF7E7B" stroke-width="6.5" stroke-linecap="round" />
            <circle cx="153" cy="91" r="3" fill="#FFA8A6" />
          </g>
          <g id="kettle-lid">
            <path d="M 149 84 C 155 68, 205 68, 211 84 Z" fill="#E32C2B" />
            <path d="M 161 77 C 168 72, 178 72, 184 74" fill="none" stroke="#FF7E7B" stroke-width="3" stroke-linecap="round" />
            <rect x="147" y="81.5" width="66" height="5" rx="2.5" fill="#B51B1E" />
            <rect x="176.5" y="68" width="7" height="6" rx="1.5" fill="#1D2230" />
            <circle cx="180" cy="65.5" r="6.5" fill="#252C3E" />
            <circle cx="177.8" cy="63.5" r="2.1" fill="#525F82" />
          </g>
        </g>
        <g id="flames-front">
          <g class="flame" data-x="151" data-base="0.64" data-phase="0.4"><path d="M 151 169 C 143 163, 145 151, 151 142 C 157 151, 159 163, 151 169 Z" fill="#FF5A1F" /><path d="M 151 169 C 146 164, 147 156, 151 150 C 155 156, 156 164, 151 169 Z" fill="#FFC800" /><path d="M 151 169 C 148 166, 149 162, 151 159 C 153 162, 154 166, 151 169 Z" fill="#00D2FF" /></g>
          <g class="flame" data-x="165" data-base="0.86" data-phase="1.7"><path d="M 165 169 C 156 162, 158 146, 165 135 C 172 146, 174 162, 165 169 Z" fill="#FF5A1F" /><path d="M 165 169 C 160 163, 161 152, 165 145 C 169 152, 170 163, 165 169 Z" fill="#FFC800" /><path d="M 165 169 C 162 166, 163 161, 165 158 C 167 161, 168 166, 165 169 Z" fill="#00D2FF" /></g>
          <g class="flame" data-x="180" data-base="1.12" data-phase="3.0"><path d="M 180 169 C 168 161, 170 140, 180 127 C 190 140, 192 161, 180 169 Z" fill="#FF4D1A" /><path d="M 180 169 C 173 162, 175 148, 180 139 C 185 148, 187 162, 180 169 Z" fill="#FFD000" /><path d="M 180 169 C 176 165, 177 159, 180 154 C 183 159, 184 165, 180 169 Z" fill="#00D8FF" /></g>
          <g class="flame" data-x="195" data-base="0.86" data-phase="4.3"><path d="M 195 169 C 186 162, 188 146, 195 135 C 202 146, 204 162, 195 169 Z" fill="#FF5A1F" /><path d="M 195 169 C 190 163, 191 152, 195 145 C 199 152, 200 163, 195 169 Z" fill="#FFC800" /><path d="M 195 169 C 192 166, 193 161, 195 158 C 197 161, 198 166, 195 169 Z" fill="#00D2FF" /></g>
          <g class="flame" data-x="209" data-base="0.64" data-phase="5.5"><path d="M 209 169 C 201 163, 203 151, 209 142 C 215 151, 217 163, 209 169 Z" fill="#FF5A1F" /><path d="M 209 169 C 204 164, 205 156, 209 150 C 213 156, 214 164, 209 169 Z" fill="#FFC800" /><path d="M 209 169 C 206 166, 207 162, 209 159 C 211 162, 212 166, 209 169 Z" fill="#00D2FF" /></g>
        </g>
      </svg>
      <div class="pm-bar-track" id="pm-bar-track"><div class="pm-bar-fill" id="pm-bar-fill"></div></div>
    </div>
  `;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeOutBack = (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);

  class PalMaestroLoaderElement extends HTMLElement {
    static get observedAttributes() {
      return ['progress', 'loop', 'size', 'show-bar', 'show-status', 'text-color'];
    }
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = SVG_TEMPLATE;
      this._targetProgress = 0;
      this._currentProgress = 0;
      this._loop = false;
      this._holdAt100 = 0;
      this._rafId = null;
      this._lastTime = performance.now();
      this._customText = null;
      const s = this.shadowRoot;
      this._els = {
        meta: s.getElementById('pm-meta'), badge: s.getElementById('pm-badge'), pct: s.getElementById('pm-pct'),
        barTrack: s.getElementById('pm-bar-track'), barFill: s.getElementById('pm-bar-fill'),
        stoveBack: s.getElementById('stove-back'), flamesFront: s.getElementById('flames-front'),
        burnerGlow: s.getElementById('burner-glow'), flames: Array.from(s.querySelectorAll('.flame')),
        kettleGroup: s.getElementById('kettle-group'), kettleLid: s.getElementById('kettle-lid'),
        steamGroup: s.getElementById('steam-group'), steamPuffs: Array.from(s.querySelectorAll('.steam-puff')),
        mateBack: s.getElementById('mate-back'), mateFront: s.getElementById('mate-front'),
        mateWater: s.getElementById('mate-water'), mateSteam: s.getElementById('mate-steam'),
        mateSparkles: s.getElementById('mate-sparkles'), splashDrops: s.getElementById('splash-drops'),
        waterGroup: s.getElementById('water-group'), waterFlow: s.getElementById('water-flow'),
        drop1: s.getElementById('drop-1'), drop2: s.getElementById('drop-2'), groundShadow: s.getElementById('ground-shadow')
      };
    }
    connectedCallback() {
      this._syncAttributes();
      this._lastTime = performance.now();
      const tick = (now) => { this._render(now); this._rafId = requestAnimationFrame(tick); };
      this._rafId = requestAnimationFrame(tick);
    }
    disconnectedCallback() { if (this._rafId) cancelAnimationFrame(this._rafId); this._rafId = null; }
    attributeChangedCallback() { this._syncAttributes(); }
    get progress() { return this._targetProgress; }
    set progress(val) {
      const n = clamp(parseFloat(val) || 0, 0, 100);
      this._targetProgress = n;
      if (!this._loop) this.setAttribute('progress', String(n));
    }
    reset() { this._currentProgress = 0; this._targetProgress = 0; this._holdAt100 = 0; }
    setStatusText(text) { this._customText = text || null; }
    _syncAttributes() {
      const size = this.getAttribute('size') || '280';
      this.style.width = /^\d+$/.test(size) ? `${size}px` : size;
      this._loop = this.hasAttribute('loop') && this.getAttribute('loop') !== 'false';
      if (!this._loop && this.hasAttribute('progress')) this._targetProgress = clamp(parseFloat(this.getAttribute('progress')) || 0, 0, 100);
      this._els.meta.classList.toggle('visible', this.hasAttribute('show-status') && this.getAttribute('show-status') !== 'false');
      this._els.barTrack.classList.toggle('visible', this.hasAttribute('show-bar') && this.getAttribute('show-bar') !== 'false');
      this._els.pct.style.color = this.getAttribute('text-color') || 'inherit';
    }
    _updateBadge(p) {
      const b = this._els.badge;
      if (this._customText) { b.textContent = this._customText; b.style.background = 'rgba(239,59,57,0.16)'; b.style.color = '#D92B29'; return; }
      if (p < 45) { b.textContent = 'Prendiendo el fuego...'; b.style.background = 'rgba(255,122,0,0.16)'; b.style.color = '#D95B00'; }
      else if (p < 89) { b.textContent = 'Calentando el agua...'; b.style.background = 'rgba(239,59,57,0.16)'; b.style.color = '#D92B29'; }
      else if (p < 94) { b.textContent = '¡Ya está a punto!'; b.style.background = 'rgba(56,189,248,0.18)'; b.style.color = '#0369A1'; }
      else if (p < 99.5) { b.textContent = 'Sirviendo el mate...'; b.style.background = 'rgba(141,75,38,0.16)'; b.style.color = '#8D4B26'; }
      else { b.textContent = '¡Listo el mate!'; b.style.background = 'rgba(34,197,94,0.18)'; b.style.color = '#15803D'; }
    }
    _render(now) {
      const dt = Math.min((now - this._lastTime) / 1000, 0.05);
      this._lastTime = now;
      const t = now / 1000;
      const e = this._els;
      if (this._loop) {
        if (this._currentProgress < 100) {
          const speed = this._currentProgress < 86 ? 24 : (this._currentProgress < 93 ? 9 : 7.5);
          this._currentProgress = Math.min(100, this._currentProgress + speed * dt);
        } else {
          this._holdAt100 += dt;
          if (this._holdAt100 > 1.3) { this._currentProgress = 0; this._holdAt100 = 0; }
        }
      } else {
        const diff = this._targetProgress - this._currentProgress;
        if (Math.abs(diff) < 0.08) this._currentProgress = this._targetProgress;
        else this._currentProgress += diff * Math.min(1, dt * (this._currentProgress >= 89 ? 7.5 : 14));
      }
      const p = this._currentProgress;
      e.pct.textContent = `${Math.round(p)}%`;
      e.barFill.style.width = `${p}%`;
      this._updateBadge(p);

      const heatFactor = clamp(p / 89, 0, 1);
      const steamIntensity = clamp(clamp((p - 68) / 18, 0, 1) * (1 - clamp((p - 91.5) / 3.5, 0, 1)), 0, 1);
      const moveT = easeInOut(clamp((p - 91.5) / 3.5, 0, 1));
      const pourActive = clamp(clamp((p - 94.6) / 0.9, 0, 1) * (1 - clamp((p - 98.8) / 1.0, 0, 1)), 0, 1);
      const fillT = clamp((p - 95) / 4.2, 0, 1);
      const doneT = easeInOut(clamp((p - 98.8) / 1.2, 0, 1));

      const stoveFade = 1 - easeInOut(clamp((p - 90.5) / 2.8, 0, 1));
      const stoveTransform = `translate(0, ${((1 - stoveFade) * 26).toFixed(2)})`;
      e.stoveBack.setAttribute('opacity', stoveFade.toFixed(3)); e.stoveBack.setAttribute('transform', stoveTransform);
      e.flamesFront.setAttribute('opacity', stoveFade.toFixed(3)); e.flamesFront.setAttribute('transform', stoveTransform);
      e.groundShadow.setAttribute('opacity', (0.10 * stoveFade).toFixed(3));
      e.burnerGlow.setAttribute('opacity', (lerp(0.18, 0.85, heatFactor) * stoveFade).toFixed(3));

      const flamePower = lerp(0.32, 1.22, heatFactor);
      e.flames.forEach((f) => {
        const fx = parseFloat(f.dataset.x), base = parseFloat(f.dataset.base), phase = parseFloat(f.dataset.phase);
        const sy = Math.max(0.18, flamePower * base * (1 + Math.sin(t * 14 + phase) * 0.11 + Math.cos(t * 21 + phase * 1.7) * 0.06));
        const sx = lerp(0.76, 1.10, heatFactor) * (1 + Math.cos(t * 12 + phase) * 0.06);
        f.setAttribute('transform', `translate(${fx}, 169) scale(${sx.toFixed(3)}, ${sy.toFixed(3)}) translate(${-fx}, -169)`);
      });

      const boilRumble = clamp((p - 75) / 14, 0, 1) * (1 - moveT);
      const kx = lerp(0, -44, moveT) + Math.sin(t * 48) * 1.4 * boilRumble;
      const ky = lerp(0, -22, moveT) + Math.cos(t * 54) * 1.1 * boilRumble - doneT * 3;
      const kRot = lerp(0, 36, moveT) - doneT * 12;
      e.kettleGroup.setAttribute('transform', `translate(${kx.toFixed(2)}, ${ky.toFixed(2)}) rotate(${kRot.toFixed(2)}, 180, 108)`);
      e.kettleLid.setAttribute('transform', `translate(0, ${(-Math.abs(Math.sin(t * 24)) * 3.8 * boilRumble).toFixed(2)}) rotate(${(Math.sin(t * 24) * 5 * boilRumble).toFixed(2)}, 180, 82)`);

      e.steamGroup.setAttribute('opacity', steamIntensity.toFixed(3));
      if (steamIntensity > 0.01) {
        e.steamPuffs.forEach((puff, idx) => {
          const cycle = (t * 1.25 + idx * 0.25) % 1;
          puff.setAttribute('transform', `translate(${(258 + cycle * (32 + idx * 6) + Math.sin(cycle * Math.PI * 2 + idx) * 4).toFixed(1)}, ${(82 - cycle * (54 + idx * 5)).toFixed(1)}) scale(${(lerp(0.28, 1.15, cycle) * lerp(0.55, 1.05, steamIntensity)).toFixed(2)})`);
          puff.setAttribute('opacity', Math.sin(cycle * Math.PI).toFixed(2));
        });
      }

      const mateRaw = clamp((p - 91.2) / 3.2, 0, 1);
      const matePop = mateRaw > 0 ? easeOutBack(mateRaw) : 0;
      const mateOp = clamp(mateRaw * 1.6, 0, 1).toFixed(3);
      const mateTransform = `translate(${(232.5 + lerp(35, 0, matePop)).toFixed(1)}, 168) scale(${lerp(0.65, 1, matePop).toFixed(3)}) translate(-232.5, -168)`;
      e.mateBack.setAttribute('opacity', mateOp); e.mateBack.setAttribute('transform', mateTransform);
      e.mateFront.setAttribute('opacity', mateOp); e.mateFront.setAttribute('transform', mateTransform);
      e.mateWater.setAttribute('opacity', fillT.toFixed(3));

      const finishGlow = clamp((p - 98.2) / 1.5, 0, 1);
      e.mateSteam.setAttribute('opacity', (finishGlow * (0.65 + 0.35 * Math.sin(t * 4))).toFixed(2));
      e.mateSteam.setAttribute('transform', `translate(0, ${(-Math.sin(t * 3) * 2.5).toFixed(2)})`);
      e.mateSparkles.setAttribute('opacity', finishGlow.toFixed(2));

      e.waterGroup.setAttribute('opacity', pourActive.toFixed(3));
      e.splashDrops.setAttribute('opacity', pourActive.toFixed(3));
      if (pourActive > 0.01) {
        e.waterFlow.setAttribute('stroke-dashoffset', (-(t * 48) % 26).toFixed(1));
        const d1 = (t * 3.8) % 1, d2 = (t * 3.8 + 0.5) % 1;
        e.drop1.setAttribute('transform', `translate(${(-d1 * 7).toFixed(1)}, ${(-Math.sin(d1 * Math.PI) * 9).toFixed(1)})`);
        e.drop1.setAttribute('opacity', Math.sin(d1 * Math.PI).toFixed(2));
        e.drop2.setAttribute('transform', `translate(${(d2 * 7).toFixed(1)}, ${(-Math.sin(d2 * Math.PI) * 8).toFixed(1)})`);
        e.drop2.setAttribute('opacity', Math.sin(d2 * Math.PI).toFixed(2));
      }
    }
  }

  customElements.define('palmaestro-loader', PalMaestroLoaderElement);

  let overlayEl = null, overlayLoader = null, hideTimer = null;
  function ensureOverlay() {
    if (overlayEl) return;
    overlayEl = document.createElement('div');
    overlayEl.id = 'palmaestro-loader-overlay';
    Object.assign(overlayEl.style, {
      position: 'fixed', inset: '0', zIndex: '99999',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(20, 24, 36, 0.52)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      opacity: '0', transition: 'opacity 240ms ease', pointerEvents: 'auto'
    });
    const box = document.createElement('div');
    Object.assign(box.style, {
      background: 'rgba(255, 248, 238, 0.96)', border: '2.5px solid #1F2536',
      borderRadius: '22px', boxShadow: '6px 6px 0 #1F2536', padding: '18px 24px'
    });
    overlayLoader = document.createElement('palmaestro-loader');
    overlayLoader.setAttribute('size', '280');
    overlayLoader.setAttribute('show-status', '');
    overlayLoader.setAttribute('show-bar', '');
    overlayLoader.setAttribute('text-color', '#1F2536');
    box.appendChild(overlayLoader);
    overlayEl.appendChild(box);
  }

  window.PalMaestroLoader = {
    show(opts = {}) {
      ensureOverlay();
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
      overlayLoader.reset();
      if (opts.size) overlayLoader.setAttribute('size', String(opts.size));
      if (opts.loop) { overlayLoader.setAttribute('loop', ''); }
      else { overlayLoader.removeAttribute('loop'); overlayLoader.progress = opts.progress ?? 0; }
      overlayLoader.setStatusText(opts.text || null);
      if (!overlayEl.isConnected) document.body.appendChild(overlayEl);
      requestAnimationFrame(() => { overlayEl.style.opacity = '1'; });
    },
    setProgress(pct, text) {
      if (!overlayLoader) return;
      overlayLoader.removeAttribute('loop');
      overlayLoader.progress = pct;
      if (text !== undefined) overlayLoader.setStatusText(text);
    },
    finish(delayMs = 1200) {
      if (!overlayLoader) return;
      overlayLoader.removeAttribute('loop');
      overlayLoader.setStatusText(null);
      overlayLoader.progress = 100;
      hideTimer = setTimeout(() => this.hide(), delayMs);
    },
    hide() {
      if (!overlayEl) return;
      overlayEl.style.opacity = '0';
      hideTimer = setTimeout(() => { if (overlayEl && overlayEl.isConnected) overlayEl.remove(); }, 250);
    }
  };
})();
