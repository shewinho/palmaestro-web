/* ==========================================================================
   YA NOMÁH · CONTROLADOR DE INTERFAZ Y FLUJOS (PA'L MAESTRO CHILE)
   ========================================================================== */
(function () {
  'use strict';

  const E = window.YaNomahEngines;
  const $ = (id) => document.getElementById(id);

  const state = {
    mode: 'convert', // convert | pdf | ocr | zip
    queue: [],       // { id, file, category, ext, target, status, result, thumbUrl, error }
    pdfOp: 'merge',  // merge | split | rotate | compress | img2pdf
    pdfFiles: [],    // File[]
    ocrFile: null,   // File | null
    ocrPages: null,  // pages for searchable PDF export
    zipOp: 'pack',   // pack | unpack
    zipFiles: [],    // File[] for pack
    zipEntries: []   // extracted entries for unpack
  };

  let uidCounter = 1;
  let toastTimer = null;

  /* ---------- UTILIDADES UI ---------- */
  function showToast(msg, duration = 2800) {
    const el = $('ynToast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), duration);
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function notifyIframeHeight() {
    if (window.parent && window.parent !== window) {
      const h = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: 'pm-ya-nomah-height', height: h }, '*');
      window.parent.postMessage({ type: 'pm-iframe-height', height: h }, '*');
    }
  }

  function loaderShow(text, pct = 8) {
    if (window.PalMaestroLoader) {
      window.PalMaestroLoader.show({ progress: pct, text, size: 250 });
    }
  }

  function loaderProgress(pct, text) {
    if (window.PalMaestroLoader) {
      window.PalMaestroLoader.setProgress(pct, text);
    }
  }

  function loaderFinish(delay = 900) {
    if (window.PalMaestroLoader) {
      window.PalMaestroLoader.finish(delay);
    }
  }

  function loaderHide() {
    if (window.PalMaestroLoader) {
      window.PalMaestroLoader.hide();
    }
  }

  function readGlobalOptions() {
    return {
      quality: Number($('rngQuality').value) || 88,
      maxSize: Number($('selResize').value) || 0,
      pdfScale: Number($('selPdfDpi').value) || 2,
      videoPreset: $('selVideoPreset').value || 'balanced',
      grayscale: $('chkGrayscale').checked,
      mergeImagesPdf: $('chkMergeImagesPdf').checked,
      ocrLang: $('selOcrLang').value || 'spa'
    };
  }

  /* ---------- CAMBIO DE MODOS ---------- */
  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll('.yn-mode-card').forEach((btn) => {
      const active = btn.dataset.mode === mode;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    $('panelConvert').classList.toggle('is-hidden', mode !== 'convert');
    $('panelPdf').classList.toggle('is-hidden', mode !== 'pdf');
    $('panelOcr').classList.toggle('is-hidden', mode !== 'ocr');
    $('panelZip').classList.toggle('is-hidden', mode !== 'zip');

    const copyByMode = {
      convert: {
        title: 'Tira tus archivos acá, ya nomáh',
        desc: 'Arrastra uno o varios archivos, toca para elegir desde tu equipo o pega una captura con <kbd>Ctrl+V</kbd>.',
        hint: 'JPG · PNG · WebP · AVIF · HEIC · SVG · PDF · DOCX · XLSX · CSV · JSON · YAML · MD · HTML · MP4 · MOV · WebM · MP3 · WAV · OGG · ZIP'
      },
      pdf: {
        title: 'Suelta tus PDFs (o fotos) para el Taller PDF',
        desc: 'Puedes unir varios PDFs, separar páginas, girar planos o bajar el peso de documentos grandes.',
        hint: 'Archivos PDF (o JPG / PNG / WebP / HEIC si eliges «Fotos → PDF»)'
      },
      ocr: {
        title: 'Suelta una foto o PDF escaneado para leer su texto',
        desc: 'Ideal para guías escaneadas, boletas, facturas, planos o fotos de apuntes. También puedes pegar con <kbd>Ctrl+V</kbd>.',
        hint: 'PDF escaneado · JPG · PNG · WebP · HEIC · BMP · Salida en Texto, Word (.docx) o PDF buscable'
      },
      zip: {
        title: state.zipOp === 'unpack' ? 'Suelta tu archivo .ZIP para abrirlo' : 'Tira los archivos que quieras meter en el .ZIP',
        desc: 'Todo se comprime o extrae directo en tu navegador sin subir nada a servidores externos.',
        hint: 'Cualquier tipo de archivo para comprimir · Archivo .ZIP para explorar y extraer'
      }
    };

    const c = copyByMode[mode];
    $('dropHeading').textContent = c.title;
    $('dropSubdesc').innerHTML = c.desc;
    $('dropHint').textContent = c.hint;
    notifyIframeHeight();
  }

  /* ---------- INGRESO DE ARCHIVOS (DROP / INPUT / PASTE) ---------- */
  async function handleIncomingFiles(fileList) {
    const files = Array.from(fileList || []).filter((f) => f && f.size >= 0);
    if (!files.length) return;

    if (state.mode === 'convert') {
      addFilesToConvertQueue(files);
    } else if (state.mode === 'pdf') {
      addFilesToPdfWorkshop(files);
    } else if (state.mode === 'ocr') {
      setOcrFile(files[0]);
    } else if (state.mode === 'zip') {
      if (state.zipOp === 'unpack' || (files.length === 1 && E.getExt(files[0].name) === 'zip' && !state.zipFiles.length)) {
        setZipOp('unpack');
        await loadZipToInspect(files[0]);
      } else {
        state.zipFiles.push(...files);
        renderZipPanel();
        showToast(`${files.length} archivo(s) listos para empaquetar en ZIP.`);
      }
    }
    notifyIframeHeight();
  }

  /* ---------- COLA DE CONVERSIÓN UNIVERSAL ---------- */
  function addFilesToConvertQueue(files) {
    let added = 0;
    for (const file of files) {
      const category = E.detectCategory(file);
      const ext = E.getExt(file.name) || 'bin';
      const targets = E.getTargetsForFile(file);
      const target = E.getDefaultTarget(file);
      let thumbUrl = '';
      if (category === 'image' && ext !== 'heic' && ext !== 'heif') {
        thumbUrl = URL.createObjectURL(file);
      }
      state.queue.push({
        id: 'f' + (uidCounter++),
        file,
        category,
        ext,
        targets,
        target,
        status: targets.length ? 'ready' : 'unsupported',
        result: null,
        thumbUrl,
        error: targets.length ? '' : 'Formato no reconocido para conversión automática'
      });
      added++;
    }
    renderConvertQueue();
    if (added) showToast(`${added} archivo(s) agregados a la cola.`);
  }

  function updateBatchFormatOptions() {
    const sel = $('selBatchFormat');
    if (!state.queue.length) {
      sel.innerHTML = '<option value="">Elegir formato...</option>';
      return;
    }
    // Formatos comunes entre todos los archivos en cola (o la unión si hay varios tipos)
    const sets = state.queue.filter((i) => i.targets.length).map((i) => new Set(i.targets));
    let common = [];
    if (sets.length) {
      common = Array.from(sets[0]).filter((fmt) => sets.every((s) => s.has(fmt)));
    }
    const wrap = $('batchFormatWrap');
    if (!common.length) {
      wrap.classList.add('is-hidden');
      return;
    }
    wrap.classList.remove('is-hidden');
    sel.innerHTML = '<option value="">Elegir formato...</option>' +
      common.map((fmt) => `<option value="${fmt}">${fmt.toUpperCase()} · ${E.TARGET_LABELS[fmt] || fmt}</option>`).join('');
  }

  function renderConvertQueue() {
    const hasItems = state.queue.length > 0;
    $('convertToolbar').classList.toggle('is-hidden', !hasItems);
    $('formatShowcase').classList.toggle('is-hidden', hasItems);
    $('queueCountPill').textContent = `${state.queue.length} archivo${state.queue.length === 1 ? '' : 's'}`;
    updateBatchFormatOptions();

    const listEl = $('queueList');
    if (!hasItems) {
      listEl.innerHTML = '';
      $('doneBar').classList.add('is-hidden');
      notifyIframeHeight();
      return;
    }

    const catColors = {
      image: '#E0F7FF',
      pdf: '#FFE8DD',
      sheet: '#DCFCE7',
      data: '#DCFCE7',
      doc: '#FFF3BF',
      video: '#FCE7F3',
      audio: '#FCE7F3',
      archive: '#E2E8F0',
      unknown: '#F1F5F9'
    };

    listEl.innerHTML = state.queue.map((item) => {
      const thumbHtml = item.thumbUrl
        ? `<img src="${item.thumbUrl}" alt="" loading="lazy" />`
        : `<span>${escapeHtml(item.ext.slice(0, 4))}</span>`;

      let statusTag = '';
      if (item.status === 'working') statusTag = '<span class="yn-status-tag st-working">Convirtiendo...</span>';
      else if (item.status === 'done') {
        const outSize = item.result ? E.formatBytes(item.result.blob.size) : '';
        statusTag = `<span class="yn-status-tag st-done">Listo · ${escapeHtml(outSize)}</span>`;
      } else if (item.status === 'error' || item.status === 'unsupported') {
        statusTag = `<span class="yn-status-tag st-error">${escapeHtml(item.error || 'Error')}</span>`;
      } else {
        statusTag = '<span class="yn-status-tag">En espera</span>';
      }

      const noteHtml = item.result && item.result.note
        ? `<span class="pm-tech-italic">${escapeHtml(item.result.note)}</span>`
        : '';

      const selectHtml = item.targets.length
        ? `<select class="yn-select yn-item-select" data-id="${item.id}" aria-label="Formato destino para ${escapeHtml(item.file.name)}">
            ${item.targets.map((t) => `<option value="${t}" ${t === item.target ? 'selected' : ''}>${t.toUpperCase()} — ${escapeHtml(E.TARGET_LABELS[t] || t)}</option>`).join('')}
          </select>`
        : '<span class="pm-tech-italic">Sin destino disponible</span>';

      const actionBtn = item.status === 'done'
        ? `<button type="button" class="yn-icon-btn btn-dl" data-action="download" data-id="${item.id}" aria-label="Descargar ${escapeHtml(item.result.filename)}">
            <svg class="yn-ico yn-ico-dl" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Bajar</span>
          </button>`
        : (item.targets.length
          ? `<button type="button" class="yn-icon-btn btn-go" data-action="convert-one" data-id="${item.id}" aria-label="Convertir ${escapeHtml(item.file.name)}">
              <svg class="yn-ico yn-ico-spin-soft" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span>Convertir</span>
            </button>`
          : '');

      return `
        <article class="yn-file-item ${item.status === 'done' ? 'is-done' : ''} ${item.status === 'error' ? 'is-error' : ''}">
          <div class="yn-file-thumb" style="background:${catColors[item.category] || '#FFF8EE'}" aria-hidden="true">${thumbHtml}</div>
          <div class="yn-file-meta">
            <p class="yn-file-name" title="${escapeHtml(item.file.name)}">${escapeHtml(item.file.name)}</p>
            <div class="yn-file-sub">
              <span class="pm-tech-italic">${escapeHtml(item.ext.toUpperCase())} · ${escapeHtml(E.formatBytes(item.file.size))}</span>
              ${statusTag}
              ${noteHtml}
            </div>
          </div>
          <div class="yn-file-target">
            <span class="yn-arrow-badge" aria-hidden="true">→</span>
            ${selectHtml}
          </div>
          <div class="yn-file-actions">
            ${actionBtn}
            <button type="button" class="yn-icon-btn btn-del" data-action="remove" data-id="${item.id}" aria-label="Quitar ${escapeHtml(item.file.name)}" title="Quitar de la cola">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </article>`;
    }).join('');

    const doneCount = state.queue.filter((i) => i.status === 'done').length;
    $('doneBar').classList.toggle('is-hidden', doneCount < 2);
    if (doneCount >= 2) {
      $('doneSummary').textContent = `¡Listo el mate! ${doneCount} archivos convertidos`;
      $('doneDetail').textContent = 'Puedes bajar cada uno por separado o llevártelos todos juntos en un ZIP.';
    }
    notifyIframeHeight();
  }

  async function convertSingleQueueItem(item, manageLoader = true) {
    if (!item || !item.target) return;
    item.status = 'working';
    item.error = '';
    renderConvertQueue();

    if (manageLoader) loaderShow(`Convirtiendo ${item.file.name}...`, 10);
    try {
      const options = readGlobalOptions();
      const result = await E.convertAny(item.file, item.target, options, (pct, msg) => {
        if (manageLoader) loaderProgress(pct, msg);
      });
      item.result = result;
      item.status = 'done';
      if (manageLoader) {
        loaderFinish(850);
        showToast(`¡Listo! ${result.filename}`);
      }
    } catch (err) {
      console.error(err);
      item.status = 'error';
      item.error = err && err.message ? err.message : 'No se pudo convertir este archivo';
      if (manageLoader) {
        loaderHide();
        showToast('Error: ' + item.error, 4000);
      }
    }
    renderConvertQueue();
  }

  async function convertAllQueue() {
    const pending = state.queue.filter((i) => i.targets.length && i.status !== 'done');
    const list = pending.length ? pending : state.queue.filter((i) => i.targets.length);
    if (!list.length) return;

    const options = readGlobalOptions();
    const allImagesToPdf = options.mergeImagesPdf && list.length > 1 && list.every((i) => i.category === 'image' && i.target === 'pdf');

    loaderShow('Prendiendo el fuego para tus archivos...', 6);

    if (allImagesToPdf) {
      try {
        const res = await E.imagesToSinglePdf(list.map((i) => i.file), 'a4', options, (pct, msg) => loaderProgress(pct, msg));
        list.forEach((item) => {
          item.status = 'done';
          item.result = res;
        });
        loaderFinish(900);
        renderConvertQueue();
        triggerDownload(res.blob, res.filename);
        showToast('¡PDF único creado con todas tus fotos!');
        return;
      } catch (err) {
        loaderHide();
        showToast('Error al juntar fotos en PDF: ' + err.message, 4000);
        return;
      }
    }

    let ok = 0;
    for (let idx = 0; idx < list.length; idx++) {
      const item = list[idx];
      const basePct = Math.round((idx / list.length) * 90);
      const span = 90 / list.length;
      item.status = 'working';
      item.error = '';
      renderConvertQueue();
      try {
        const res = await E.convertAny(item.file, item.target, options, (subPct, msg) => {
          loaderProgress(Math.min(95, Math.round(basePct + (subPct / 100) * span)), `[${idx + 1}/${list.length}] ${msg}`);
        });
        item.result = res;
        item.status = 'done';
        ok++;
      } catch (err) {
        console.error(err);
        item.status = 'error';
        item.error = err && err.message ? err.message : 'Error al convertir';
      }
      renderConvertQueue();
    }

    if (ok > 0) {
      loaderFinish(950);
      if (list.length === 1 && list[0].result) {
        triggerDownload(list[0].result.blob, list[0].result.filename);
      }
      showToast(`¡Listo! ${ok} de ${list.length} archivo(s) convertidos.`);
    } else {
      loaderHide();
      showToast('No se pudo convertir ningún archivo. Revisa el detalle en cada tarjeta.', 4000);
    }
  }

  async function downloadAllConvertedZip() {
    const done = state.queue.filter((i) => i.status === 'done' && i.result);
    if (!done.length) return;
    loaderShow('Armando paquete ZIP...', 20);
    try {
      const JSZip = await E.ensureJsZip();
      const zip = new JSZip();
      const usedNames = new Map();
      for (const item of done) {
        let name = item.result.filename;
        if (usedNames.has(name)) {
          const count = usedNames.get(name) + 1;
          usedNames.set(name, count);
          const ext = E.getExt(name);
          name = `${E.getBaseName(name)}-${count}.${ext}`;
        } else {
          usedNames.set(name, 1);
        }
        zip.file(name, item.result.blob);
      }
      const blob = await zip.generateAsync({ type: 'blob' }, (m) => loaderProgress(Math.round(20 + m.percent * 0.78), 'Empaquetando...'));
      loaderFinish(700);
      triggerDownload(blob, 'convertidos-ya-nomah.zip');
      showToast('ZIP descargado con todos tus archivos.');
    } catch (err) {
      loaderHide();
      showToast('Error al crear ZIP: ' + err.message, 4000);
    }
  }

  /* ---------- TALLER PDF ---------- */
  function setPdfOp(op) {
    state.pdfOp = op;
    document.querySelectorAll('[data-pdf-op]').forEach((btn) => {
      const active = btn.dataset.pdfOp === op;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('[data-for-op]').forEach((el) => {
      el.classList.toggle('is-hidden', el.dataset.forOp !== op);
    });
    const labels = {
      merge: 'Unir PDFs en 1 archivo',
      split: 'Dividir / Extraer páginas',
      rotate: 'Rotar y descargar PDF',
      compress: 'Comprimir PDF',
      img2pdf: 'Crear PDF con estas fotos'
    };
    $('lblPdfRun').textContent = labels[op] || 'Ejecutar acción PDF';
    renderPdfList();
  }

  function addFilesToPdfWorkshop(files) {
    const valid = files.filter((f) => {
      const cat = E.detectCategory(f);
      return state.pdfOp === 'img2pdf' ? cat === 'image' : cat === 'pdf';
    });
    if (!valid.length) {
      showToast(state.pdfOp === 'img2pdf' ? 'En «Fotos → PDF» agrega imágenes (JPG, PNG, WebP, HEIC).' : 'Agrega archivos PDF para esta acción.', 3500);
      return;
    }
    if (state.pdfOp === 'split' || state.pdfOp === 'rotate' || state.pdfOp === 'compress') {
      state.pdfFiles = [valid[0]];
    } else {
      state.pdfFiles.push(...valid);
    }
    renderPdfList();
  }

  function renderPdfList() {
    const el = $('pdfFileList');
    const runBtn = $('btnPdfRun');
    if (!state.pdfFiles.length) {
      el.innerHTML = `<p class="yn-empty-mini">${state.pdfOp === 'img2pdf' ? 'Suelta tus fotos (JPG, PNG, WebP, HEIC) en la zona superior.' : 'Suelta tus archivos PDF en la zona superior para empezar.'}</p>`;
      runBtn.disabled = true;
      return;
    }

    const needMulti = state.pdfOp === 'merge';
    runBtn.disabled = needMulti && state.pdfFiles.length < 2;

    el.innerHTML = state.pdfFiles.map((f, idx) => `
      <div class="yn-mini-row">
        <div class="yn-mini-row-info">
          <strong>${idx + 1}. ${escapeHtml(f.name)}</strong>
          <span class="pm-tech-italic">${escapeHtml(E.formatBytes(f.size))}</span>
        </div>
        <div class="yn-mini-row-btns">
          ${(state.pdfOp === 'merge' || state.pdfOp === 'img2pdf') ? `
            <button type="button" class="yn-icon-btn" data-pdf-move="up" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''} aria-label="Subir archivo">↑</button>
            <button type="button" class="yn-icon-btn" data-pdf-move="down" data-idx="${idx}" ${idx === state.pdfFiles.length - 1 ? 'disabled' : ''} aria-label="Bajar archivo">↓</button>
          ` : ''}
          <button type="button" class="yn-icon-btn btn-del" data-pdf-remove="${idx}" aria-label="Quitar archivo">✕</button>
        </div>
      </div>`).join('');
    notifyIframeHeight();
  }

  async function runPdfWorkshop() {
    if (!state.pdfFiles.length) return;
    loaderShow('Procesando PDF en tu navegador...', 10);
    try {
      let res;
      if (state.pdfOp === 'merge') {
        res = await E.mergePdfs(state.pdfFiles, (p, m) => loaderProgress(p, m));
      } else if (state.pdfOp === 'split') {
        res = await E.splitPdf(state.pdfFiles[0], $('inpPdfRange').value, (p, m) => loaderProgress(p, m));
      } else if (state.pdfOp === 'rotate') {
        res = await E.rotatePdf(state.pdfFiles[0], $('selPdfRotate').value, $('inpRotatePages').value, (p, m) => loaderProgress(p, m));
      } else if (state.pdfOp === 'compress') {
        res = await E.compressPdf(state.pdfFiles[0], $('selPdfCompress').value, (p, m) => loaderProgress(p, m));
      } else if (state.pdfOp === 'img2pdf') {
        res = await E.imagesToSinglePdf(state.pdfFiles, $('selImgPdfPage').value, readGlobalOptions(), (p, m) => loaderProgress(p, m));
      }
      loaderFinish(900);
      triggerDownload(res.blob, res.filename);
      showToast(res.note ? `¡Listo! ${res.note}` : `¡Listo! Descargado ${res.filename}`, 3800);
    } catch (err) {
      console.error(err);
      loaderHide();
      showToast('Error PDF: ' + err.message, 4000);
    }
  }

  /* ---------- PANEL OCR ---------- */
  function setOcrFile(file) {
    const cat = E.detectCategory(file);
    if (cat !== 'image' && cat !== 'pdf') {
      showToast('Para OCR sube una imagen (JPG/PNG/WebP/HEIC) o un PDF.', 3400);
      return;
    }
    state.ocrFile = file;
    state.ocrPages = null;
    $('btnOcrRun').disabled = false;
    $('ocrFileBar').innerHTML = `
      <div class="yn-mini-row">
        <div class="yn-mini-row-info">
          <strong>${escapeHtml(file.name)}</strong>
          <span class="pm-tech-italic">${escapeHtml(E.getExt(file.name).toUpperCase())} · ${escapeHtml(E.formatBytes(file.size))} · Listo para leer texto</span>
        </div>
      </div>`;
    $('ocrResultBox').classList.add('is-hidden');
    showToast('Archivo cargado para OCR.');
    notifyIframeHeight();
  }

  async function runOcrPanel() {
    if (!state.ocrFile) return;
    const lang = $('selOcrLang').value;
    const mode = $('selOcrMode').value;
    const outputPref = $('selOcrOutput').value;

    loaderShow('Preparando motor OCR...', 8);
    try {
      const res = await E.runOcrSingleFile(state.ocrFile, {
        lang,
        mode,
        outputFormat: 'raw',
        keepPages: true
      }, (p, m) => loaderProgress(p, m));

      state.ocrPages = res.pages;
      $('txtOcrOutput').value = res.text || '(No se detectó texto legible en el archivo)';
      const words = (res.text || '').trim().split(/\s+/).filter(Boolean).length;
      const ocrPagesCount = res.pages.filter((p) => p.usedOcr).length;
      $('lblOcrStats').textContent = `${words} palabras · ${res.pages.length} pág. (${ocrPagesCount} con OCR)`;
      $('ocrResultBox').classList.remove('is-hidden');

      if (outputPref === 'searchable-pdf') {
        const pdfRes = await E.buildSearchablePdfFromPages(res.pages, `${E.getBaseName(state.ocrFile.name)}-buscable.pdf`, (p, m) => loaderProgress(p, m));
        triggerDownload(pdfRes.blob, pdfRes.filename);
        showToast('¡PDF buscable descargado y texto listo!');
      } else {
        showToast('¡Texto extraído! Puedes copiarlo o bajarlo en TXT, Word o PDF buscable.');
      }
      loaderFinish(850);
    } catch (err) {
      console.error(err);
      loaderHide();
      showToast('Error en OCR: ' + err.message, 4000);
    }
    notifyIframeHeight();
  }

  /* ---------- CAJA ZIP ---------- */
  function setZipOp(op) {
    state.zipOp = op;
    document.querySelectorAll('[data-zip-op]').forEach((btn) => {
      const active = btn.dataset.zipOp === op;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    $('zipPackFooter').classList.toggle('is-hidden', op !== 'pack');
    if (state.mode === 'zip') setMode('zip');
    renderZipPanel();
  }

  async function loadZipToInspect(file) {
    loaderShow('Abriendo archivo ZIP...', 25);
    try {
      state.zipEntries = await E.inspectZip(file);
      loaderFinish(500);
      renderZipPanel();
      showToast(`ZIP abierto: ${state.zipEntries.length} archivo(s) encontrados.`);
    } catch (err) {
      loaderHide();
      showToast('No se pudo abrir el ZIP: ' + err.message, 4000);
    }
  }

  function renderZipPanel() {
    const el = $('zipFileList');
    if (state.zipOp === 'pack') {
      $('btnZipCreate').disabled = state.zipFiles.length === 0;
      if (!state.zipFiles.length) {
        el.innerHTML = '<p class="yn-empty-mini">Suelta archivos arriba para empaquetarlos en un .ZIP limpio.</p>';
        return;
      }
      el.innerHTML = state.zipFiles.map((f, idx) => `
        <div class="yn-mini-row">
          <div class="yn-mini-row-info">
            <strong>${escapeHtml(f.name)}</strong>
            <span class="pm-tech-italic">${escapeHtml(E.formatBytes(f.size))}</span>
          </div>
          <div class="yn-mini-row-btns">
            <button type="button" class="yn-icon-btn btn-del" data-zip-remove="${idx}" aria-label="Quitar">✕</button>
          </div>
        </div>`).join('');
    } else {
      if (!state.zipEntries.length) {
        el.innerHTML = '<p class="yn-empty-mini">Suelta un archivo .ZIP en la zona superior para explorar y extraer su contenido.</p>';
        return;
      }
      el.innerHTML = state.zipEntries.map((item, idx) => `
        <div class="yn-mini-row">
          <div class="yn-mini-row-info">
            <strong>${escapeHtml(item.path)}</strong>
            <span class="pm-tech-italic">${escapeHtml(E.formatBytes(item.uncompressedSize))}</span>
          </div>
          <div class="yn-mini-row-btns">
            <button type="button" class="yn-icon-btn btn-go" data-zip-send="${idx}" title="Enviar al Conversor Total">Convertir</button>
            <button type="button" class="yn-icon-btn btn-dl" data-zip-extract="${idx}">Bajar</button>
          </div>
        </div>`).join('');
    }
    notifyIframeHeight();
  }

  /* ---------- DEMOS RÁPIDOS (PRUEBAS SIN SUBIR ARCHIVOS) ---------- */
  async function loadDemoImage() {
    setMode('convert');
    const c = document.createElement('canvas');
    c.width = 960; c.height = 600;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#FFF8EE'; ctx.fillRect(0, 0, 960, 600);
    ctx.fillStyle = '#38BDF8'; ctx.fillRect(40, 40, 880, 120);
    ctx.strokeStyle = '#1F2536'; ctx.lineWidth = 6; ctx.strokeRect(40, 40, 880, 520);
    ctx.fillStyle = '#1F2536'; ctx.font = '900 44px system-ui, sans-serif';
    ctx.fillText("PA'L MAESTRO · YA NOMÁH", 76, 118);
    ctx.fillStyle = '#FFD000'; ctx.fillRect(76, 200, 360, 290); ctx.strokeRect(76, 200, 360, 290);
    ctx.fillStyle = '#EF3B39'; ctx.beginPath(); ctx.arc(680, 345, 130, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1F2536'; ctx.font = '700 28px system-ui, sans-serif';
    ctx.fillText('Imagen de muestra', 110, 310);
    ctx.fillText('960 × 600 px · PNG', 110, 360);
    const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
    addFilesToConvertQueue([new File([blob], 'plano-muestra-palmaestro.png', { type: 'image/png' })]);
  }

  function loadDemoCsv() {
    setMode('convert');
    const csv = [
      'Material,Unidad,Cantidad,Precio_CLP,Subtotal_CLP',
      'Plancha Terciado Estructural 18mm,Unid,6,28990,173940',
      'Pino Cepillado 2x4 3.2m,Tira,14,4890,68460',
      'Tornillo Volcanita 1-5/8 Caja 500,Caja,2,6490,12980',
      'Cola Fria Carpintero 1 Kg,Envase,1,7990,7990',
      'Lija Madera Grano 120,Pliego,10,590,5900'
    ].join('\n');
    const file = new File([csv], 'cubicacion-taller-ejemplo.csv', { type: 'text/csv' });
    addFilesToConvertQueue([file]);
  }

  async function loadDemoOcr() {
    setMode('ocr');
    const c = document.createElement('canvas');
    c.width = 1000; c.height = 460;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, 1000, 460);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 34px Arial, sans-serif';
    ctx.fillText('NOTA DE OBRA - PA L MAESTRO CHILE', 60, 85);
    ctx.font = '26px Arial, sans-serif';
    ctx.fillText('1. Medir dos veces antes de cortar la plancha de 1,22 x 2,44 m.', 60, 165);
    ctx.fillText('2. Revisar plomo y nivel en todos los pilares de madera.', 60, 225);
    ctx.fillText('3. Dejar 80 grados para el mate antes de seguir trabajando.', 60, 285);
    ctx.fillText('Presupuesto estimado: $ 269.270 CLP.', 60, 355);
    const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
    setOcrFile(new File([blob], 'nota-obra-escaneada.png', { type: 'image/png' }));
  }

  /* ---------- EVENTOS ---------- */
  function bindEvents() {
    // Modos principales
    document.querySelectorAll('.yn-mode-card').forEach((btn) => {
      btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    // Demos
    $('btnDemoImage').addEventListener('click', loadDemoImage);
    $('btnDemoCsv').addEventListener('click', loadDemoCsv);
    $('btnDemoOcr').addEventListener('click', loadDemoOcr);

    // Dropzone & file input
    const dz = $('dropzone');
    const inp = $('fileInput');
    dz.addEventListener('click', () => inp.click());
    dz.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        inp.click();
      }
    });
    inp.addEventListener('change', (e) => {
      handleIncomingFiles(e.target.files);
      inp.value = '';
    });

    ['dragenter', 'dragover'].forEach((ev) => {
      dz.addEventListener(ev, (e) => {
        e.preventDefault();
        dz.classList.add('is-dragover');
      });
    });
    ['dragleave', 'drop'].forEach((ev) => {
      dz.addEventListener(ev, (e) => {
        e.preventDefault();
        dz.classList.remove('is-dragover');
      });
    });
    dz.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files) {
        handleIncomingFiles(e.dataTransfer.files);
      }
    });

    // Pegar imagen con Ctrl+V
    window.addEventListener('paste', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      const items = e.clipboardData && e.clipboardData.items ? Array.from(e.clipboardData.items) : [];
      const files = items.map((it) => it.getAsFile()).filter(Boolean);
      if (files.length) {
        handleIncomingFiles(files);
        showToast('Captura pegada desde el portapapeles.');
      }
    });

    // Toolbar Conversor
    $('selBatchFormat').addEventListener('change', (e) => {
      const fmt = e.target.value;
      if (!fmt) return;
      state.queue.forEach((item) => {
        if (item.targets.includes(fmt)) {
          item.target = fmt;
          if (item.status === 'done') { item.status = 'ready'; item.result = null; }
        }
      });
      renderConvertQueue();
      showToast(`Todos los archivos pasaron a destino ${fmt.toUpperCase()}.`);
    });

    $('btnToggleOptions').addEventListener('click', () => {
      const box = $('advancedOptions');
      const open = box.classList.toggle('is-hidden') === false;
      $('btnToggleOptions').setAttribute('aria-expanded', open ? 'true' : 'false');
      notifyIframeHeight();
    });

    $('rngQuality').addEventListener('input', (e) => {
      $('lblQuality').textContent = e.target.value + '%';
    });

    $('btnClearQueue').addEventListener('click', () => {
      state.queue.forEach((i) => { if (i.thumbUrl) URL.revokeObjectURL(i.thumbUrl); });
      state.queue = [];
      renderConvertQueue();
    });

    $('btnConvertAll').addEventListener('click', convertAllQueue);
    $('btnDownloadAllZip').addEventListener('click', downloadAllConvertedZip);

    // Delegación en lista de cola
    $('queueList').addEventListener('change', (e) => {
      const sel = e.target.closest('.yn-item-select');
      if (!sel) return;
      const item = state.queue.find((i) => i.id === sel.dataset.id);
      if (item) {
        item.target = sel.value;
        item.status = 'ready';
        item.result = null;
        renderConvertQueue();
      }
    });

    $('queueList').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const item = state.queue.find((i) => i.id === btn.dataset.id);
      if (!item) return;
      if (btn.dataset.action === 'remove') {
        if (item.thumbUrl) URL.revokeObjectURL(item.thumbUrl);
        state.queue = state.queue.filter((i) => i.id !== item.id);
        renderConvertQueue();
      } else if (btn.dataset.action === 'convert-one') {
        convertSingleQueueItem(item, true);
      } else if (btn.dataset.action === 'download' && item.result) {
        triggerDownload(item.result.blob, item.result.filename);
      }
    });

    // Taller PDF
    document.querySelectorAll('[data-pdf-op]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextOp = btn.dataset.pdfOp;
        if ((nextOp === 'img2pdf') !== (state.pdfOp === 'img2pdf')) state.pdfFiles = [];
        setPdfOp(nextOp);
      });
    });

    $('pdfFileList').addEventListener('click', (e) => {
      const move = e.target.closest('[data-pdf-move]');
      if (move) {
        const idx = Number(move.dataset.idx);
        const dir = move.dataset.pdfMove === 'up' ? -1 : 1;
        const swap = idx + dir;
        if (swap >= 0 && swap < state.pdfFiles.length) {
          [state.pdfFiles[idx], state.pdfFiles[swap]] = [state.pdfFiles[swap], state.pdfFiles[idx]];
          renderPdfList();
        }
        return;
      }
      const rem = e.target.closest('[data-pdf-remove]');
      if (rem) {
        state.pdfFiles.splice(Number(rem.dataset.pdfRemove), 1);
        renderPdfList();
      }
    });

    $('btnPdfClear').addEventListener('click', () => { state.pdfFiles = []; renderPdfList(); });
    $('btnPdfRun').addEventListener('click', runPdfWorkshop);

    // Panel OCR
    $('btnOcrClear').addEventListener('click', () => {
      state.ocrFile = null;
      state.ocrPages = null;
      $('btnOcrRun').disabled = true;
      $('ocrFileBar').innerHTML = '<span class="yn-empty-mini">Suelta una foto (JPG/PNG/WebP/HEIC) o un PDF escaneado en la zona superior, o prueba con el botón «Demo OCR».</span>';
      $('ocrResultBox').classList.add('is-hidden');
      notifyIframeHeight();
    });
    $('btnOcrRun').addEventListener('click', runOcrPanel);

    $('btnOcrCopy').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText($('txtOcrOutput').value);
        showToast('Texto copiado al portapapeles.');
      } catch (_) {
        $('txtOcrOutput').select();
        document.execCommand('copy');
        showToast('Texto copiado.');
      }
    });

    $('btnOcrDlTxt').addEventListener('click', () => {
      const base = state.ocrFile ? E.getBaseName(state.ocrFile.name) : 'ocr-ya-nomah';
      triggerDownload(new Blob([$('txtOcrOutput').value], { type: 'text/plain;charset=utf-8' }), `${base}-ocr.txt`);
    });

    $('btnOcrDlMd').addEventListener('click', () => {
      const base = state.ocrFile ? E.getBaseName(state.ocrFile.name) : 'ocr-ya-nomah';
      triggerDownload(new Blob([`# ${base}\n\n${$('txtOcrOutput').value}\n`], { type: 'text/markdown;charset=utf-8' }), `${base}-ocr.md`);
    });

    $('btnOcrDlDocx').addEventListener('click', async () => {
      const base = state.ocrFile ? E.getBaseName(state.ocrFile.name) : 'ocr-ya-nomah';
      loaderShow('Armando documento Word (.docx)...', 40);
      try {
        const res = await E.createDocxFromText($('txtOcrOutput').value, base, `${base}-ocr.docx`);
        loaderFinish(600);
        triggerDownload(res.blob, res.filename);
      } catch (err) {
        loaderHide();
        showToast('Error al crear DOCX: ' + err.message, 4000);
      }
    });

    $('btnOcrDlPdf').addEventListener('click', async () => {
      if (!state.ocrPages || !state.ocrPages.length) return;
      const base = state.ocrFile ? E.getBaseName(state.ocrFile.name) : 'ocr-ya-nomah';
      loaderShow('Generando PDF buscable...', 45);
      try {
        const res = await E.buildSearchablePdfFromPages(state.ocrPages, `${base}-buscable.pdf`, (p, m) => loaderProgress(p, m));
        loaderFinish(700);
        triggerDownload(res.blob, res.filename);
      } catch (err) {
        loaderHide();
        showToast('Error al crear PDF buscable: ' + err.message, 4000);
      }
    });

    // Caja ZIP
    document.querySelectorAll('[data-zip-op]').forEach((btn) => {
      btn.addEventListener('click', () => setZipOp(btn.dataset.zipOp));
    });

    $('zipFileList').addEventListener('click', async (e) => {
      const rem = e.target.closest('[data-zip-remove]');
      if (rem) {
        state.zipFiles.splice(Number(rem.dataset.zipRemove), 1);
        renderZipPanel();
        return;
      }
      const extBtn = e.target.closest('[data-zip-extract]');
      if (extBtn) {
        const item = state.zipEntries[Number(extBtn.dataset.zipExtract)];
        if (item) {
          const blob = await item.entry.async('blob');
          triggerDownload(blob, item.name);
        }
        return;
      }
      const sendBtn = e.target.closest('[data-zip-send]');
      if (sendBtn) {
        const item = state.zipEntries[Number(sendBtn.dataset.zipSend)];
        if (item) {
          const blob = await item.entry.async('blob');
          const file = new File([blob], item.name, { type: blob.type });
          setMode('convert');
          addFilesToConvertQueue([file]);
        }
      }
    });

    $('btnZipClear').addEventListener('click', () => {
      state.zipFiles = [];
      state.zipEntries = [];
      renderZipPanel();
    });

    $('btnZipCreate').addEventListener('click', async () => {
      if (!state.zipFiles.length) return;
      loaderShow('Comprimiendo archivos en ZIP...', 15);
      try {
        const res = await E.packZip(state.zipFiles, $('inpZipName').value, (p, m) => loaderProgress(p, m));
        loaderFinish(700);
        triggerDownload(res.blob, res.filename);
        showToast(`¡ZIP creado! ${res.filename}`);
      } catch (err) {
        loaderHide();
        showToast('Error al crear ZIP: ' + err.message, 4000);
      }
    });

    // ResizeObserver para incrustación limpia en Blogger
    if (window.ResizeObserver) {
      new ResizeObserver(() => notifyIframeHeight()).observe($('ynApp'));
    }
  }

  function init() {
    bindEvents();
    setMode('convert');
    setPdfOp('merge');
    notifyIframeHeight();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
