/**
 * La Ferre de Julio · Web Oficial (Pa'l Maestro · Canal 3 Chile)
 * Lee en vivo la hoja CSV publicada en Google Sheets y renderiza el catálogo
 * de videos y productos con la identidad oficial de El Mesón Digital.
 * Soporta enlaces directos por hash (#compacto) o parámetro (?palabra=compacto).
 */
(function () {
  var DEFAULT_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqiCxXEvefty2N3PFOyPdzqKGrBAnW_EIJSvRq3TWZ8bWRIiVTRqKZ9E-RoFRVIHVJLNRGG9DE02ch/pub?gid=1930294825&single=true&output=csv';
  var JULIO_IMG = 'https://shewinho.github.io/palmaestro-web/apps/cachai-o-no-data/img/julio_retrato.png';

  var root = document.getElementById('ferre-links');
  if (!root) return;

  var CSV_URL = root.getAttribute('data-csv') || window.FERRE_CSV_URL || DEFAULT_CSV;
  var JULIO_SRC = root.getAttribute('data-julio') || JULIO_IMG;
  var groups = [];
  var totalProducts = 0;

  // ---------- ICONOS SVG VECTORIALES (ZERO EMOJIS DE SISTEMA) ----------
  var ICO = {
    wrench: '<svg class="fj-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    search: '<svg class="fj-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    back: '<svg class="fj-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
    ext: '<svg class="fj-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    link: '<svg class="fj-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    info: '<svg class="fj-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    bag: '<svg class="fj-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    crown: '<svg class="fj-ico" style="width:15px;height:15px" viewBox="0 0 24 24" fill="currentColor" stroke="#1F2536" stroke-width="1.8" stroke-linejoin="round"><path d="M2 18h20l-2-11-5 5-3-7-3 7-5-5-2 11z"/></svg>',
    tag: '<svg class="fj-ico" style="width:14px;height:14px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".9" fill="currentColor"/></svg>',
    check: '<svg class="fj-ico" style="width:14px;height:14px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
  };

  var BADGE_ACCENTS = ['', 'accent-red', 'accent-blue', 'accent-orange', 'accent-green'];

  // ---------- HELPERS ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
  }

  function parseCSV(text) {
    var rows = [], row = [], cell = '', q = false, i = 0, c;
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (q) {
        if (c === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; }
          else { q = false; }
        } else { cell += c; }
      } else if (c === '"') {
        q = true;
      } else if (c === ',') {
        row.push(cell); cell = '';
      } else if (c === '\n') {
        row.push(cell); rows.push(row); row = []; cell = '';
      } else if (c !== '\r') {
        cell += c;
      }
    }
    if (cell.length || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  function toNum(v) {
    var n = parseFloat(String(v || '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
  }

  function toDate(v) {
    v = String(v || '').trim();
    var m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
    m = v.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
    if (m) return Date.UTC(+m[3], +m[2] - 1, +m[1]);
    return 0;
  }

  function fmtDate(ms) {
    if (!ms) return '';
    var d = new Date(ms);
    var dd = String(d.getUTCDate()).padStart(2, '0');
    var mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    return dd + '/' + mm + '/' + d.getUTCFullYear();
  }

  function fotoUrl(u) {
    u = String(u || '').trim();
    var m = u.match(/drive\.google\.com\/file\/d\/([\w-]+)/) || u.match(/drive\.google\.com\/open\?id=([\w-]+)/);
    return m ? 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w800' : u;
  }

  function storeLabel(link) {
    var u = String(link || '').toLowerCase();
    if (/meli\.la|mercadolibre/.test(u)) return 'Ver en Mercado Libre';
    if (/aliexpress|s\.click\.ali/.test(u)) return 'Ver en AliExpress';
    if (/amzn\.|amazon\./.test(u)) return 'Ver en Amazon';
    if (/sodimac|falabella/.test(u)) return 'Ver en Sodimac';
    if (/easy\.cl/.test(u)) return 'Ver en Easy';
    return 'Ver producto recomendado';
  }

  function starsSvg(n) {
    var rounded = Math.max(0, Math.min(5, Math.round(n * 2) / 2));
    var out = '<span class="fj-stars" aria-label="Nota ' + esc(String(n).replace('.', ',')) + ' de 5">';
    for (var i = 1; i <= 5; i++) {
      var fill = '#E2E8F0';
      if (rounded >= i) fill = '#FFD000';
      else if (rounded >= i - 0.5) fill = '#FDE047';
      out += '<svg width="15" height="15" viewBox="0 0 24 24" fill="' + fill + '" stroke="#1F2536" stroke-width="2" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    }
    return out + '</span>';
  }

  function showToast(txt) {
    var el = document.getElementById('fj-toast-el');
    if (!el) {
      el = document.createElement('div');
      el.id = 'fj-toast-el';
      el.className = 'fj-toast';
      document.body.appendChild(el);
    }
    el.textContent = txt;
    el.classList.add('show');
    clearTimeout(showToast._tm);
    showToast._tm = setTimeout(function () { el.classList.remove('show'); }, 2400);
  }

  // ---------- PARSEO DEL BANCO CSV ----------
  function build(text) {
    var rows = parseCSV(text);
    if (rows.length < 2) return [];
    var head = rows[0].map(norm), map = {}, g = {}, list = [], r, o, key;
    head.forEach(function (h, i) { if (h) map[h] = i; });
    function get(row, name) { return map[name] === undefined ? '' : (row[map[name]] || '').trim(); }

    totalProducts = 0;
    for (r = 1; r < rows.length; r++) {
      var row = rows[r];
      var palabra = get(row, 'palabra').toUpperCase();
      var vis = get(row, 'visible').toLowerCase();
      if (!palabra || vis === 'no' || vis === 'n' || vis === '0' || vis === 'false') continue;
      key = norm(palabra);
      if (!g[key]) {
        g[key] = { key: key, palabra: palabra, video: get(row, 'video'), fecha: 0, orden: r, items: [] };
        list.push(g[key]);
      }
      o = g[key];
      if (!o.video) o.video = get(row, 'video');
      o.fecha = Math.max(o.fecha, toDate(get(row, 'fecha')));
      o.orden = r;
      o.items.push({
        puesto: toNum(get(row, 'puesto')),
        producto: get(row, 'producto'),
        descripcion: get(row, 'descripcion'),
        foto: fotoUrl(get(row, 'foto')),
        nota: toNum(get(row, 'nota')),
        vendidos: get(row, 'vendidos'),
        link: get(row, 'link')
      });
      totalProducts++;
    }
    list.forEach(function (x) {
      x.items.sort(function (a, b) { return b.puesto - a.puesto; });
    });
    list.sort(function (a, b) { return (b.fecha - a.fecha) || (b.orden - a.orden); });
    return list;
  }

  // ---------- BLOQUES COMUNES ----------
  function heroHtml() {
    return (
      '<section class="fj-hero">' +
        '<span class="fj-washi" aria-hidden="true"></span>' +
        '<span class="fj-washi blue" aria-hidden="true"></span>' +
        '<div>' +
          '<div class="fj-kicker">' + ICO.wrench + '<span>Canal 3 · Pa\'l Maestro Chile</span></div>' +
          '<h1 class="fj-title">La Ferre <span class="fj-zine">de Julio</span></h1>' +
          '<p class="fj-sub">Todos los links y herramientas que recomienda Julio Venegas en @pal_maestro. Busca la palabra clave del video o elige directo desde el mesón.</p>' +
          '<div class="fj-hero-pills">' +
            '<span class="fj-stat-pill yellow">' + groups.length + ' video' + (groups.length === 1 ? '' : 's') + '</span>' +
            '<span class="fj-stat-pill blue">' + totalProducts + ' producto' + (totalProducts === 1 ? '' : 's') + '</span>' +
            '<span class="fj-stat-pill">Actualizado en vivo</span>' +
          '</div>' +
        '</div>' +
        '<div class="fj-julio-wrap">' +
          '<div class="fj-julio-frame">' +
            '<img class="fj-julio-img" src="' + esc(JULIO_SRC) + '" alt="Julio Venegas · La Ferre de Julio" onerror="this.parentNode.parentNode.style.display=\'none\'">' +
          '</div>' +
          '<span class="fj-julio-tag">Julio Venegas · Ferretería</span>' +
        '</div>' +
      '</section>'
    );
  }

  function avisoHtml() {
    return (
      '<div class="fj-aviso">' +
        ICO.info +
        '<span><strong>Transparencia del mesón:</strong> algunos enlaces son de afiliado. Si compras a través de ellos, apoyas a Pa\'l Maestro con una pequeña comisión <strong>sin costo extra para ti</strong>.</span>' +
      '</div>'
    );
  }

  // ---------- VISTA 1: CATÁLOGO DE VIDEOS ----------
  function renderList(filter) {
    var f = norm(filter || '');
    var html = '';
    var n = 0;

    groups.forEach(function (x, idx) {
      var haystack = norm(x.palabra + ' ' + x.video + ' ' + x.items.map(function (it) { return it.producto; }).join(' '));
      if (f && haystack.indexOf(f) === -1) return;
      n++;
      var accent = BADGE_ACCENTS[idx % BADGE_ACCENTS.length];
      var fotos = x.items.filter(function (it) { return !!it.foto; });
      var thumbsHtml = '';
      if (fotos.length) {
        thumbsHtml = '<div class="fj-thumbs">' +
          fotos.slice(0, 3).map(function (it) {
            return '<img class="fj-thumb" loading="lazy" referrerpolicy="no-referrer" alt="' + esc(it.producto) + '" src="' + esc(it.foto) + '" onerror="this.style.display=\'none\'">';
          }).join('') +
          (fotos.length > 3 ? '<span class="fj-thumb-more">+' + (fotos.length - 3) + '</span>' : '') +
        '</div>';
      }

      html += (
        '<button type="button" class="fj-vcard" data-k="' + esc(x.key) + '">' +
          '<div>' +
            '<div class="fj-vcard-top">' +
              '<span class="fj-palabra ' + accent + '">' + ICO.tag + 'COMENTA: ' + esc(x.palabra) + '</span>' +
              (x.fecha ? '<span class="fj-vdate">' + esc(fmtDate(x.fecha)) + '</span>' : '') +
            '</div>' +
            '<div class="fj-vtit" style="margin-top:10px">' + esc(x.video || x.palabra) + '</div>' +
          '</div>' +
          thumbsHtml +
          '<div class="fj-vfoot">' +
            '<span class="fj-vcount">' + x.items.length + ' producto' + (x.items.length === 1 ? '' : 's') + '</span>' +
            '<span class="fj-vcta">Ver los links →</span>' +
          '</div>' +
        '</button>'
      );
    });

    var grid = root.querySelector('.fj-grid');
    if (grid) {
      grid.innerHTML = n ? html : (
        '<div class="fj-state-card" style="grid-column:1/-1">' +
          '<div style="font-weight:900;font-size:18px">No encontré esa palabra en el mesón</div>' +
          '<div style="font-style:italic;color:#475569;font-size:13.5px">Revisa cómo la escribiste o toca una de las palabras clave de arriba.</div>' +
        '</div>'
      );
    }
  }

  function renderHome() {
    var chipsHtml = groups.length ? (
      '<div class="fj-chips-row">' +
        '<span class="fj-chips-label">Palabras clave:</span>' +
        groups.map(function (g) {
          return '<button type="button" class="fj-chip" data-open="' + esc(g.key) + '">' + esc(g.palabra) + '</button>';
        }).join('') +
      '</div>'
    ) : '';

    root.innerHTML =
      heroHtml() +
      avisoHtml() +
      '<div class="fj-search-box">' +
        '<div class="fj-search-row">' +
          '<span class="fj-search-ico">' + ICO.search + '</span>' +
          '<input class="fj-buscar" type="search" placeholder="Busca la palabra del video (ej. COMPACTO) o el nombre de una herramienta..." aria-label="Buscar palabra o herramienta">' +
          '<button type="button" class="fj-clear-btn" aria-label="Limpiar búsqueda"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
        '</div>' +
        chipsHtml +
      '</div>' +
      '<div class="fj-grid"></div>';

    renderList('');

    var inp = root.querySelector('.fj-buscar');
    var clr = root.querySelector('.fj-clear-btn');
    inp.addEventListener('input', function (e) {
      var val = e.target.value;
      clr.classList.toggle('show', !!val.trim());
      renderList(val);
    });
    clr.addEventListener('click', function () {
      inp.value = '';
      clr.classList.remove('show');
      renderList('');
      inp.focus();
    });

    root.querySelector('.fj-grid').addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.fj-vcard') : null;
      if (b) location.hash = b.getAttribute('data-k');
    });

    Array.prototype.forEach.call(root.querySelectorAll('.fj-chip'), function (ch) {
      ch.addEventListener('click', function () {
        location.hash = ch.getAttribute('data-open');
      });
    });
  }

  // ---------- VISTA 2: DETALLE DE PRODUCTOS DEL VIDEO ----------
  function renderDetail(x) {
    var itemsHtml = x.items.map(function (p) {
      var rankCls = p.puesto === 1 ? 'rank-1' : (p.puesto === 2 ? 'rank-2' : (p.puesto === 3 ? 'rank-3' : ''));
      var top1Cls = p.puesto === 1 ? ' is-top1' : '';
      var badgeInner = (p.puesto === 1 ? ICO.crown : '') + '#' + esc(p.puesto) + (p.puesto === 1 ? ' · TOP DEL MESÓN' : '');

      return (
        '<article class="fj-prod' + (p.foto ? '' : ' sinfoto') + top1Cls + '">' +
          (p.puesto ? '<span class="fj-puesto ' + rankCls + '">' + badgeInner + '</span>' : '') +
          (p.foto ? '<div class="fj-foto-box"><img class="fj-foto" loading="lazy" referrerpolicy="no-referrer" alt="' + esc(p.producto) + '" src="' + esc(p.foto) + '"></div>' : '') +
          '<div class="fj-pbody">' +
            '<h3 class="fj-pnom">' + esc(p.producto) + '</h3>' +
            ((p.nota || p.vendidos) ? (
              '<div class="fj-meta">' +
                (p.nota ? '<span class="fj-rating-pill">' + starsSvg(p.nota) + '<span>' + esc(String(p.nota).replace('.', ',')) + '</span></span>' : '') +
                (p.vendidos ? '<span class="fj-sold-pill">' + ICO.check + '<span>' + esc(p.vendidos) + ' vendidos</span></span>' : '') +
              '</div>'
            ) : '') +
            (p.descripcion ? '<p class="fj-pdesc">' + esc(p.descripcion) + '</p>' : '') +
            (p.link ? (
              '<div class="fj-pactions">' +
                '<a class="fj-btn fj-cta-buy" href="' + esc(p.link) + '" target="_blank" rel="sponsored nofollow noopener">' +
                  ICO.bag + '<span>' + esc(storeLabel(p.link)) + '</span>' + ICO.ext +
                '</a>' +
              '</div>'
            ) : '') +
          '</div>' +
        '</article>'
      );
    }).join('');

    root.innerHTML =
      '<div class="fj-detail-bar">' +
        '<button type="button" class="fj-btn" id="fjBtnBack">' + ICO.back + '<span>Todos los videos</span></button>' +
        '<button type="button" class="fj-btn blue" id="fjBtnCopyLink">' + ICO.link + '<span>Copiar link directo</span></button>' +
      '</div>' +
      '<section class="fj-detail-hero">' +
        '<span class="fj-washi" aria-hidden="true"></span>' +
        '<span class="fj-palabra" style="background:#FFD000;color:#1F2536">' + ICO.tag + 'COMENTA: ' + esc(x.palabra) + '</span>' +
        '<h2 class="fj-dtit">' + esc(x.video || x.palabra) + '</h2>' +
        '<div class="fj-dmeta">' +
          x.items.length + ' herramienta' + (x.items.length === 1 ? '' : 's') + ' seleccionada' + (x.items.length === 1 ? '' : 's') + ' por Julio Venegas' +
          (x.fecha ? ' · Publicado el ' + esc(fmtDate(x.fecha)) : '') +
        '</div>' +
      '</section>' +
      avisoHtml() +
      '<div class="fj-lista">' + itemsHtml + '</div>' +
      '<div style="margin-top:22px;display:flex;justify-content:center">' +
        '<button type="button" class="fj-btn navy" id="fjBtnBackBottom">' + ICO.back + '<span>Ver todos los videos de La Ferre</span></button>' +
      '</div>';

    var goHome = function () { location.hash = ''; };
    root.querySelector('#fjBtnBack').addEventListener('click', goHome);
    root.querySelector('#fjBtnBackBottom').addEventListener('click', goHome);

    root.querySelector('#fjBtnCopyLink').addEventListener('click', function () {
      var shareUrl = location.href.split('#')[0] + '#' + x.key;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(function () {
          showToast('Link copiado: #' + x.key);
        }).catch(function () {
          prompt('Copia el enlace directo:', shareUrl);
        });
      } else {
        prompt('Copia el enlace directo:', shareUrl);
      }
    });

    Array.prototype.forEach.call(root.querySelectorAll('.fj-foto'), function (im) {
      im.addEventListener('error', function () {
        var box = im.parentNode;
        var card = box && box.parentNode;
        if (box) box.style.display = 'none';
        if (card) card.classList.add('sinfoto');
      });
    });

    if (root.scrollIntoView) {
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ---------- RUTEO POR HASH (#compacto) O QUERY (?palabra=compacto) ----------
  function getRouteKey() {
    var h = norm(decodeURIComponent((location.hash || '').replace(/^#/, '')));
    if (h) return h;
    try {
      var p = new URLSearchParams(location.search).get('palabra');
      if (p) return norm(p);
    } catch (e) {}
    return '';
  }

  function route() {
    var k = getRouteKey();
    var match = null;
    groups.forEach(function (g) { if (g.key === k) match = g; });
    if (match) renderDetail(match);
    else renderHome();
  }

  // ---------- ARRANQUE CON LOADER OFICIAL TETERA + MATE ----------
  function renderLoading() {
    root.innerHTML =
      '<div class="fj-state-card">' +
        '<palmaestro-loader loop size="190" show-status></palmaestro-loader>' +
        '<div style="font-weight:900;font-size:17px">Abriendo el mesón de Julio Venegas...</div>' +
        '<div style="font-style:italic;color:#475569;font-size:13px">Cargando herramientas y links recomendados en vivo</div>' +
      '</div>';
  }

  function renderError() {
    root.innerHTML =
      '<div class="fj-state-card">' +
        '<div style="font-weight:900;font-size:18px;color:#EF3B39">No pude abrir el catálogo ahora</div>' +
        '<div style="font-style:italic;color:#475569;font-size:13.5px">Revisa tu conexión e inténtalo de nuevo en unos segundos.</div>' +
        '<button type="button" class="fj-btn yellow" id="fjRetry">Reintentar</button>' +
      '</div>';
    var b = root.querySelector('#fjRetry');
    if (b) b.addEventListener('click', loadCSV);
  }

  function loadCSV() {
    renderLoading();
    fetch(CSV_URL, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      })
      .then(function (t) {
        groups = build(t);
        window.removeEventListener('hashchange', route);
        window.addEventListener('hashchange', route);
        route();
      })
      .catch(function () {
        renderError();
      });
  }

  loadCSV();
})();
