/* ==========================================================================
   YA NOMÁH · MOTORES DE CONVERSIÓN 100% CLIENT-SIDE (WASM + JS)
   Carga bajo demanda desde jsDelivr CDN · Sin servidor · Compatible con iframe
   ========================================================================== */
(function (global) {
  'use strict';

  const CDN = {
    pdflib: 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
    pdfjs: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
    pdfjsWorker: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js',
    jspdf: 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js',
    jszip: 'https://cdn.jsdelivr.net/npm/jszip@3.10.2/dist/jszip.min.js',
    xlsx: 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
    mammoth: 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js',
    docx: 'https://cdn.jsdelivr.net/npm/docx@9.5.1/dist/index.iife.js',
    heic2any: 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js',
    marked: 'https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js',
    jsyaml: 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js',
    tesseract: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',
    ffmpegUmd: 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.min.js',
    ffmpegWorker: 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/umd/814.ffmpeg.js',
    ffmpegCoreJs: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js',
    ffmpegCoreWasm: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm'
  };

  const loadedScripts = new Map();
  let ffmpegInstance = null;
  let ffmpegLoadingPromise = null;

  function markEngineLoaded(key) {
    const el = document.querySelector(`.yn-epill[data-engine="${key}"]`);
    if (el) el.classList.add('is-loaded');
  }

  function loadScript(url, checkGlobal) {
    if (checkGlobal && checkGlobal()) return Promise.resolve();
    if (loadedScripts.has(url)) return loadedScripts.get(url);
    const p = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.onload = () => resolve();
      s.onerror = () => {
        loadedScripts.delete(url);
        reject(new Error('No se pudo cargar el motor desde CDN: ' + url));
      };
      document.head.appendChild(s);
    });
    loadedScripts.set(url, p);
    return p;
  }

  async function toBlobURL(url, mimeType) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al descargar recurso WASM (' + res.status + ')');
    const buf = await res.arrayBuffer();
    return URL.createObjectURL(new Blob([buf], { type: mimeType }));
  }

  /* ---------- CARGADORES DE MOTORES BAJO DEMANDA ---------- */
  async function ensurePdfLib() {
    await loadScript(CDN.pdflib, () => !!global.PDFLib);
    markEngineLoaded('pdflib');
    return global.PDFLib;
  }

  async function ensurePdfJs() {
    await loadScript(CDN.pdfjs, () => !!global.pdfjsLib);
    if (!global.pdfjsLib._ynWorkerReady) {
      try {
        global.pdfjsLib.GlobalWorkerOptions.workerSrc = await toBlobURL(CDN.pdfjsWorker, 'text/javascript');
      } catch (_) {
        global.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN.pdfjsWorker;
      }
      global.pdfjsLib._ynWorkerReady = true;
    }
    markEngineLoaded('pdflib');
    return global.pdfjsLib;
  }

  async function ensureJsPdf() {
    await loadScript(CDN.jspdf, () => !!(global.jspdf && global.jspdf.jsPDF));
    markEngineLoaded('pdflib');
    return global.jspdf.jsPDF;
  }

  async function ensureJsZip() {
    await loadScript(CDN.jszip, () => !!global.JSZip);
    return global.JSZip;
  }

  async function ensureXlsx() {
    await loadScript(CDN.xlsx, () => !!global.XLSX);
    markEngineLoaded('xlsx');
    return global.XLSX;
  }

  async function ensureMammoth() {
    await loadScript(CDN.mammoth, () => !!global.mammoth);
    return global.mammoth;
  }

  async function ensureDocx() {
    await loadScript(CDN.docx, () => !!global.docx);
    return global.docx;
  }

  async function ensureHeic2Any() {
    await loadScript(CDN.heic2any, () => !!global.heic2any);
    return global.heic2any;
  }

  async function ensureMarked() {
    await loadScript(CDN.marked, () => !!global.marked);
    return global.marked;
  }

  async function ensureYaml() {
    await loadScript(CDN.jsyaml, () => !!global.jsyaml);
    return global.jsyaml;
  }

  async function ensureTesseract() {
    await loadScript(CDN.tesseract, () => !!global.Tesseract);
    markEngineLoaded('tesseract');
    return global.Tesseract;
  }

  async function ensureFFmpeg(onProgress) {
    if (ffmpegInstance) return ffmpegInstance;
    if (ffmpegLoadingPromise) return ffmpegLoadingPromise;

    ffmpegLoadingPromise = (async () => {
      if (onProgress) onProgress(12, 'Descargando motor FFmpeg WASM (~31 MB, solo la 1ra vez)...');
      await loadScript(CDN.ffmpegUmd, () => !!(global.FFmpegWASM && global.FFmpegWASM.FFmpeg));
      const { FFmpeg } = global.FFmpegWASM;
      const ff = new FFmpeg();

      if (onProgress) onProgress(35, 'Preparando núcleo FFmpeg local...');
      const [classWorkerURL, coreURL, wasmURL] = await Promise.all([
        toBlobURL(CDN.ffmpegWorker, 'text/javascript'),
        toBlobURL(CDN.ffmpegCoreJs, 'text/javascript'),
        toBlobURL(CDN.ffmpegCoreWasm, 'application/wasm')
      ]);

      if (onProgress) onProgress(65, 'Iniciando FFmpeg en tu navegador...');
      await ff.load({ classWorkerURL, coreURL, wasmURL });
      ffmpegInstance = ff;
      markEngineLoaded('ffmpeg');
      return ff;
    })().catch((err) => {
      ffmpegLoadingPromise = null;
      throw err;
    });

    return ffmpegLoadingPromise;
  }

  /* ---------- UTILIDADES DE FORMATO Y ARCHIVOS ---------- */
  const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'bmp', 'ico', 'svg', 'heic', 'heif', 'jfif'];
  const PDF_EXTS = ['pdf'];
  const SHEET_EXTS = ['xlsx', 'xls', 'ods', 'csv', 'tsv'];
  const DATA_EXTS = ['json', 'yaml', 'yml', 'xml'];
  const DOC_EXTS = ['docx', 'md', 'markdown', 'html', 'htm', 'txt', 'rtf'];
  const VIDEO_EXTS = ['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v', 'ogv'];
  const AUDIO_EXTS = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus'];
  const ARCHIVE_EXTS = ['zip'];

  const TARGET_LABELS = {
    png: 'PNG (imagen sin pérdida)',
    jpg: 'JPG (imagen liviana)',
    webp: 'WebP (web ultra liviana)',
    avif: 'AVIF (compresión moderna)',
    bmp: 'BMP (mapa de bits)',
    ico: 'ICO (ícono Windows/Web)',
    pdf: 'PDF (documento)',
    'searchable-pdf': 'PDF Buscable (con OCR)',
    txt: 'TXT (texto plano)',
    md: 'Markdown (.md)',
    html: 'HTML (página web)',
    docx: 'DOCX (Word editable)',
    xlsx: 'XLSX (Excel)',
    csv: 'CSV (planilla texto)',
    tsv: 'TSV (separado por tab)',
    json: 'JSON (datos)',
    yaml: 'YAML (configuración)',
    base64: 'Base64 (Data URL .txt)',
    mp4: 'MP4 (video universal)',
    webm: 'WebM (video web)',
    gif: 'GIF animado',
    mp3: 'MP3 (audio universal)',
    wav: 'WAV (audio sin pérdida)',
    ogg: 'OGG (audio liviano)',
    m4a: 'M4A / AAC (audio Apple)',
    flac: 'FLAC (audio HD)'
  };

  function getExt(name) {
    const clean = (name || '').toLowerCase().trim();
    const idx = clean.lastIndexOf('.');
    return idx >= 0 ? clean.slice(idx + 1) : '';
  }

  function getBaseName(name) {
    const idx = (name || 'archivo').lastIndexOf('.');
    return idx > 0 ? name.slice(0, idx) : (name || 'archivo');
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }

  function detectCategory(file) {
    const ext = getExt(file.name);
    if (IMAGE_EXTS.includes(ext) || (file.type && file.type.startsWith('image/'))) return 'image';
    if (PDF_EXTS.includes(ext) || file.type === 'application/pdf') return 'pdf';
    if (SHEET_EXTS.includes(ext)) return 'sheet';
    if (DATA_EXTS.includes(ext)) return 'data';
    if (DOC_EXTS.includes(ext) || (file.type && file.type.startsWith('text/'))) return 'doc';
    if (VIDEO_EXTS.includes(ext) || (file.type && file.type.startsWith('video/'))) return 'video';
    if (AUDIO_EXTS.includes(ext) || (file.type && file.type.startsWith('audio/'))) return 'audio';
    if (ARCHIVE_EXTS.includes(ext)) return 'archive';
    return 'unknown';
  }

  function getTargetsForFile(file) {
    const ext = getExt(file.name);
    const cat = detectCategory(file);
    let list = [];
    if (cat === 'image') {
      list = ['webp', 'png', 'jpg', 'pdf', 'ico', 'bmp', 'avif', 'txt', 'docx', 'searchable-pdf', 'base64'];
      if (ext === 'gif') list = ['mp4', 'webm', 'png', 'webp', 'jpg', 'pdf'];
    } else if (cat === 'pdf') {
      list = ['png', 'jpg', 'webp', 'txt', 'docx', 'md', 'html', 'searchable-pdf'];
    } else if (cat === 'sheet') {
      list = ['xlsx', 'csv', 'json', 'yaml', 'html', 'md', 'pdf', 'tsv', 'txt'];
    } else if (cat === 'data') {
      list = ['json', 'yaml', 'csv', 'xlsx', 'html', 'txt', 'pdf'];
    } else if (cat === 'doc') {
      list = ['pdf', 'docx', 'html', 'md', 'txt'];
    } else if (cat === 'video') {
      list = ['mp4', 'webm', 'gif', 'mp3', 'wav', 'ogg', 'm4a'];
    } else if (cat === 'audio') {
      list = ['mp3', 'wav', 'ogg', 'm4a', 'flac'];
    } else if (cat === 'archive') {
      list = ['txt'];
    }
    const normExt = ext === 'jpeg' ? 'jpg' : (ext === 'yml' ? 'yaml' : (ext === 'markdown' ? 'md' : (ext === 'htm' ? 'html' : ext)));
    return list.filter((t) => t !== normExt);
  }

  function getDefaultTarget(file) {
    const ext = getExt(file.name);
    const targets = getTargetsForFile(file);
    if (!targets.length) return '';
    if (ext === 'heic' || ext === 'heif') return 'jpg';
    if (ext === 'png') return 'webp';
    if (ext === 'jpg' || ext === 'jpeg') return 'webp';
    if (ext === 'webp' || ext === 'avif') return 'png';
    if (ext === 'svg') return 'png';
    if (ext === 'pdf') return 'png';
    if (ext === 'csv' || ext === 'tsv') return 'xlsx';
    if (ext === 'xlsx' || ext === 'xls' || ext === 'ods') return 'csv';
    if (ext === 'json') return 'xlsx';
    if (ext === 'yaml' || ext === 'yml') return 'json';
    if (ext === 'docx' || ext === 'md' || ext === 'html' || ext === 'txt') return 'pdf';
    if (ext === 'mov' || ext === 'mkv' || ext === 'avi' || ext === 'webm') return 'mp4';
    if (ext === 'mp4') return 'mp3';
    if (ext === 'wav' || ext === 'ogg' || ext === 'flac' || ext === 'm4a') return 'mp3';
    if (ext === 'mp3') return 'wav';
    return targets[0];
  }

  /* ---------- ENCODERS BINARIOS NATIVOS (BMP E ICO) ---------- */
  function encodeBMP(imageData) {
    const { width, height, data } = imageData;
    const rowSize = Math.floor((24 * width + 31) / 32) * 4;
    const pixelArraySize = rowSize * height;
    const fileSize = 54 + pixelArraySize;
    const buf = new ArrayBuffer(fileSize);
    const dv = new DataView(buf);

    // Header BMP
    dv.setUint8(0, 0x42); dv.setUint8(1, 0x4D); // BM
    dv.setUint32(2, fileSize, true);
    dv.setUint32(10, 54, true);
    // DIB Header (BITMAPINFOHEADER)
    dv.setUint32(14, 40, true);
    dv.setInt32(18, width, true);
    dv.setInt32(22, height, true);
    dv.setUint16(26, 1, true);
    dv.setUint16(28, 24, true);
    dv.setUint32(34, pixelArraySize, true);

    const bytes = new Uint8Array(buf);
    for (let y = 0; y < height; y++) {
      const srcY = height - 1 - y;
      const rowOffset = 54 + y * rowSize;
      for (let x = 0; x < width; x++) {
        const si = (srcY * width + x) * 4;
        const a = data[si + 3] / 255;
        const r = Math.round(data[si] * a + 255 * (1 - a));
        const g = Math.round(data[si + 1] * a + 255 * (1 - a));
        const b = Math.round(data[si + 2] * a + 255 * (1 - a));
        const di = rowOffset + x * 3;
        bytes[di] = b;
        bytes[di + 1] = g;
        bytes[di + 2] = r;
      }
    }
    return new Blob([buf], { type: 'image/bmp' });
  }

  async function encodeICO(canvas) {
    const size = Math.min(256, Math.max(canvas.width, canvas.height));
    const icoCanvas = document.createElement('canvas');
    icoCanvas.width = size;
    icoCanvas.height = size;
    const ctx = icoCanvas.getContext('2d');
    const scale = Math.min(size / canvas.width, size / canvas.height);
    const dw = Math.round(canvas.width * scale);
    const dh = Math.round(canvas.height * scale);
    ctx.drawImage(canvas, Math.round((size - dw) / 2), Math.round((size - dh) / 2), dw, dh);

    const pngBlob = await new Promise((res) => icoCanvas.toBlob(res, 'image/png'));
    const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
    const buf = new ArrayBuffer(6 + 16 + pngBytes.length);
    const dv = new DataView(buf);
    dv.setUint16(0, 0, true);
    dv.setUint16(2, 1, true); // 1 = ICO
    dv.setUint16(4, 1, true); // 1 image
    dv.setUint8(6, size >= 256 ? 0 : size);
    dv.setUint8(7, size >= 256 ? 0 : size);
    dv.setUint8(8, 0);
    dv.setUint8(9, 0);
    dv.setUint16(10, 1, true);
    dv.setUint16(12, 32, true);
    dv.setUint32(14, pngBytes.length, true);
    dv.setUint32(18, 22, true);
    new Uint8Array(buf, 22).set(pngBytes);
    return new Blob([buf], { type: 'image/x-icon' });
  }

  /* ---------- DECODIFICADOR UNIVERSAL DE IMÁGENES ---------- */
  async function decodeImageToCanvas(file, options = {}) {
    markEngineLoaded('canvas');
    let sourceBlob = file;
    const ext = getExt(file.name);

    if (ext === 'heic' || ext === 'heif') {
      const heic2any = await ensureHeic2Any();
      const out = await heic2any({ blob: file, toType: 'image/png', quality: 0.95 });
      sourceBlob = Array.isArray(out) ? out[0] : out;
    }

    let imgUrl;
    if (ext === 'svg') {
      let svgText = await sourceBlob.text();
      if (!/width=/i.test(svgText) && /viewBox=["']([^"']+)["']/i.test(svgText)) {
        const vb = svgText.match(/viewBox=["']([^"']+)["']/i)[1].trim().split(/[\s,]+/).map(Number);
        if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) {
          svgText = svgText.replace('<svg', `<svg width="${Math.round(vb[2])}" height="${Math.round(vb[3])}"`);
        }
      }
      sourceBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    }

    imgUrl = URL.createObjectURL(sourceBlob);
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('No se pudo leer la imagen. Verifica que no esté dañada.'));
        el.src = imgUrl;
      });

      let w = img.naturalWidth || img.width || 1024;
      let h = img.naturalHeight || img.height || 1024;
      const maxDim = Number(options.maxSize) || 0;
      if (maxDim > 0 && Math.max(w, h) > maxDim) {
        const ratio = maxDim / Math.max(w, h);
        w = Math.max(1, Math.round(w * ratio));
        h = Math.max(1, Math.round(h * ratio));
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (options.fillWhite) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
      }
      if (options.grayscale) {
        ctx.filter = 'grayscale(100%)';
      }
      ctx.drawImage(img, 0, 0, w, h);
      return canvas;
    } finally {
      URL.revokeObjectURL(imgUrl);
    }
  }

  function canvasToBlobSafe(canvas, mime, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Tu navegador no soporta codificar a ' + mime));
        resolve(blob);
      }, mime, quality);
    });
  }

  async function convertImageFile(file, target, options = {}, onProgress) {
    const ext = getExt(file.name);
    if (ext === 'gif' && (target === 'mp4' || target === 'webm')) {
      return convertMediaFile(file, target, options, onProgress);
    }

    if (target === 'txt' || target === 'docx' || target === 'searchable-pdf') {
      return runOcrSingleFile(file, {
        lang: options.ocrLang || 'spa',
        mode: 'force',
        outputFormat: target
      }, onProgress);
    }

    if (onProgress) onProgress(30, 'Decodificando imagen...');
    const fillWhite = target === 'jpg' || target === 'bmp' || target === 'pdf';
    const canvas = await decodeImageToCanvas(file, {
      maxSize: options.maxSize || 0,
      grayscale: !!options.grayscale,
      fillWhite
    });

    const quality = Math.min(1, Math.max(0.2, (Number(options.quality) || 88) / 100));
    const base = getBaseName(file.name);

    if (onProgress) onProgress(72, 'Generando archivo ' + target.toUpperCase() + '...');

    if (target === 'png') {
      return { blob: await canvasToBlobSafe(canvas, 'image/png'), filename: `${base}.png` };
    }
    if (target === 'jpg') {
      return { blob: await canvasToBlobSafe(canvas, 'image/jpeg', quality), filename: `${base}.jpg` };
    }
    if (target === 'webp') {
      return { blob: await canvasToBlobSafe(canvas, 'image/webp', quality), filename: `${base}.webp` };
    }
    if (target === 'avif') {
      const blob = await canvasToBlobSafe(canvas, 'image/avif', quality);
      if (blob.type !== 'image/avif') {
        const webpBlob = await canvasToBlobSafe(canvas, 'image/webp', quality);
        return {
          blob: webpBlob,
          filename: `${base}.webp`,
          note: 'Este navegador no codifica AVIF nativo; se guardó en WebP.'
        };
      }
      return { blob, filename: `${base}.avif` };
    }
    if (target === 'bmp') {
      const ctx = canvas.getContext('2d');
      const bmpBlob = encodeBMP(ctx.getImageData(0, 0, canvas.width, canvas.height));
      return { blob: bmpBlob, filename: `${base}.bmp` };
    }
    if (target === 'ico') {
      return { blob: await encodeICO(canvas), filename: `${base}.ico` };
    }
    if (target === 'base64') {
      const dataUrl = canvas.toDataURL('image/png');
      return {
        blob: new Blob([dataUrl], { type: 'text/plain;charset=utf-8' }),
        filename: `${base}-base64.txt`
      };
    }
    if (target === 'pdf') {
      const jsPDF = await ensureJsPdf();
      const orient = canvas.width > canvas.height ? 'l' : 'p';
      const pdf = new jsPDF({ orientation: orient, unit: 'px', format: [canvas.width, canvas.height], compress: true });
      const jpegData = canvas.toDataURL('image/jpeg', quality);
      pdf.addImage(jpegData, 'JPEG', 0, 0, canvas.width, canvas.height);
      return { blob: pdf.output('blob'), filename: `${base}.pdf` };
    }

    throw new Error('Formato de imagen no soportado: ' + target);
  }

  async function imagesToSinglePdf(files, pageMode = 'a4', options = {}, onProgress) {
    const jsPDF = await ensureJsPdf();
    let pdf = null;
    const quality = Math.min(1, Math.max(0.3, (Number(options.quality) || 88) / 100));

    for (let i = 0; i < files.length; i++) {
      if (onProgress) onProgress(Math.round(((i + 0.5) / files.length) * 90), `Agregando imagen ${i + 1} de ${files.length}...`);
      const canvas = await decodeImageToCanvas(files[i], { maxSize: options.maxSize || 0, fillWhite: true });
      const imgData = canvas.toDataURL('image/jpeg', quality);

      if (pageMode === 'fit') {
        const orient = canvas.width > canvas.height ? 'l' : 'p';
        if (!pdf) {
          pdf = new jsPDF({ orientation: orient, unit: 'px', format: [canvas.width, canvas.height], compress: true });
        } else {
          pdf.addPage([canvas.width, canvas.height], orient);
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      } else {
        const fmt = pageMode === 'letter' ? 'letter' : 'a4';
        const orient = canvas.width > canvas.height ? 'l' : 'p';
        if (!pdf) {
          pdf = new jsPDF({ orientation: orient, unit: 'mm', format: fmt, compress: true });
        } else {
          pdf.addPage(fmt, orient);
        }
        const pw = pdf.internal.pageSize.getWidth();
        const ph = pdf.internal.pageSize.getHeight();
        const margin = 8;
        const maxW = pw - margin * 2;
        const maxH = ph - margin * 2;
        const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
        const dw = canvas.width * ratio;
        const dh = canvas.height * ratio;
        pdf.addImage(imgData, 'JPEG', (pw - dw) / 2, (ph - dh) / 2, dw, dh);
      }
    }

    if (!pdf) throw new Error('No hay imágenes para convertir a PDF.');
    return { blob: pdf.output('blob'), filename: `fotos-unidas-ya-nomah.pdf` };
  }

  /* ---------- MOTOR PDF + TALLER PDF ---------- */
  function parsePageRanges(rangeStr, totalPages) {
    const clean = (rangeStr || '').trim();
    if (!clean) return Array.from({ length: totalPages }, (_, i) => i);
    const indices = new Set();
    for (const part of clean.split(',')) {
      const p = part.trim();
      if (!p) continue;
      if (p.includes('-')) {
        const [aRaw, bRaw] = p.split('-').map((x) => parseInt(x.trim(), 10));
        if (!Number.isFinite(aRaw) || !Number.isFinite(bRaw)) continue;
        const start = Math.max(1, Math.min(aRaw, bRaw));
        const end = Math.min(totalPages, Math.max(aRaw, bRaw));
        for (let n = start; n <= end; n++) indices.add(n - 1);
      } else {
        const n = parseInt(p, 10);
        if (Number.isFinite(n) && n >= 1 && n <= totalPages) indices.add(n - 1);
      }
    }
    return Array.from(indices).sort((a, b) => a - b);
  }

  async function renderPdfPages(file, scale = 2, onProgress) {
    const pdfjsLib = await ensurePdfJs();
    const data = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfjsLib.getDocument({ data }).promise;
    const pages = [];

    for (let p = 1; p <= doc.numPages; p++) {
      if (onProgress) onProgress(Math.round((p / doc.numPages) * 85), `Renderizando página ${p} de ${doc.numPages}...`);
      const page = await doc.getPage(p);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      pages.push({ pageNum: p, canvas, width: viewport.width, height: viewport.height });
    }
    return pages;
  }

  async function extractPdfTextHybrid(file, options = {}, onProgress) {
    const pdfjsLib = await ensurePdfJs();
    const data = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfjsLib.getDocument({ data }).promise;
    const total = doc.numPages;
    const mode = options.mode || 'hybrid';
    const lang = options.lang || 'spa';
    let ocrWorker = null;
    const pageResults = [];

    try {
      for (let p = 1; p <= total; p++) {
        const basePct = ((p - 1) / total) * 85;
        if (onProgress) onProgress(Math.round(basePct + 4), `Analizando página ${p} de ${total}...`);
        const page = await doc.getPage(p);
        let nativeText = '';

        if (mode === 'hybrid') {
          const tc = await page.getTextContent();
          let lastY = null;
          const lines = [];
          let cur = '';
          for (const item of tc.items) {
            const y = Math.round(item.transform[5]);
            if (lastY !== null && Math.abs(y - lastY) > 6) {
              lines.push(cur.trim());
              cur = item.str;
            } else {
              cur += (cur && !cur.endsWith(' ') && !item.str.startsWith(' ') ? ' ' : '') + item.str;
            }
            lastY = y;
          }
          if (cur.trim()) lines.push(cur.trim());
          nativeText = lines.join('\n').trim();
        }

        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const needsOcr = mode === 'force' || nativeText.replace(/\s+/g, '').length < 25;
        let finalText = nativeText;
        let usedOcr = false;

        if (needsOcr || options.needCanvas) {
          await page.render({ canvasContext: ctx, viewport }).promise;
        }

        if (needsOcr) {
          usedOcr = true;
          if (!ocrWorker) {
            if (onProgress) onProgress(Math.round(basePct + 6), `Cargando motor OCR (${lang})...`);
            const Tesseract = await ensureTesseract();
            ocrWorker = await Tesseract.createWorker(lang, 1, {
              logger: (m) => {
                if (m.status === 'recognizing text' && onProgress) {
                  const pPct = basePct + (m.progress || 0) * (85 / total);
                  onProgress(Math.min(92, Math.round(pPct)), `Leyendo escaneo pág. ${p}/${total} (${Math.round((m.progress || 0) * 100)}%)...`);
                }
              }
            });
          }
          const res = await ocrWorker.recognize(canvas);
          finalText = (res.data && res.data.text ? res.data.text : '').trim();
        }

        pageResults.push({
          pageNum: p,
          text: finalText,
          usedOcr,
          canvas: options.needCanvas ? canvas : null
        });
      }
    } finally {
      if (ocrWorker) await ocrWorker.terminate();
    }

    return pageResults;
  }

  function sanitizeWinAnsi(str) {
    return (str || '')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u2026/g, '...')
      .replace(/\u00A0/g, ' ')
      .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, ' ');
  }

  async function buildSearchablePdfFromPages(pageItems, filename, onProgress) {
    const { PDFDocument, StandardFonts, rgb } = await ensurePdfLib();
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (let i = 0; i < pageItems.length; i++) {
      if (onProgress) onProgress(Math.round(88 + ((i + 1) / pageItems.length) * 10), `Armando PDF buscable (${i + 1}/${pageItems.length})...`);
      const item = pageItems[i];
      const canvas = item.canvas;
      const jpegBlob = await canvasToBlobSafe(canvas, 'image/jpeg', 0.85);
      const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
      const embedded = await pdfDoc.embedJpg(jpegBytes);

      const pageW = 595.28;
      const pageH = (canvas.height / canvas.width) * pageW;
      const page = pdfDoc.addPage([pageW, pageH]);

      // Capa de texto invisible seleccionable debajo de la imagen (o encima con opacity 0)
      page.drawImage(embedded, { x: 0, y: 0, width: pageW, height: pageH });
      const lines = sanitizeWinAnsi(item.text).split('\n').filter((l) => l.trim());
      if (lines.length) {
        const lineHeight = Math.max(9, Math.min(14, (pageH - 40) / Math.max(lines.length, 1)));
        lines.forEach((line, idx) => {
          const y = Math.max(12, pageH - 24 - idx * lineHeight);
          try {
            page.drawText(line.slice(0, 140), {
              x: 20,
              y,
              size: Math.min(11, lineHeight * 0.8),
              font,
              color: rgb(0, 0, 0),
              opacity: 0.01
            });
          } catch (_) {
            // Ignora caracteres fuera de WinAnsi
          }
        });
      }
    }

    const bytes = await pdfDoc.save();
    return { blob: new Blob([bytes], { type: 'application/pdf' }), filename };
  }

  async function createDocxFromText(text, title, filename) {
    const docx = await ensureDocx();
    const paragraphs = [];
    if (title) {
      paragraphs.push(new docx.Paragraph({
        heading: docx.HeadingLevel.HEADING_1,
        children: [new docx.TextRun({ text: title, bold: true })]
      }));
    }
    const blocks = (text || '').split(/\n{2,}/);
    for (const blk of blocks) {
      const lines = blk.split('\n');
      const children = [];
      lines.forEach((ln, idx) => {
        if (idx > 0) children.push(new docx.TextRun({ break: 1 }));
        children.push(new docx.TextRun(ln));
      });
      paragraphs.push(new docx.Paragraph({ children, spacing: { after: 140 } }));
    }
    const doc = new docx.Document({ sections: [{ children: paragraphs }] });
    const blob = await docx.Packer.toBlob(doc);
    return { blob, filename };
  }

  async function createPdfFromText(text, title, filename) {
    const jsPDF = await ensureJsPdf();
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
    const margin = 16;
    const maxW = pdf.internal.pageSize.getWidth() - margin * 2;
    let y = 20;

    if (title) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(15);
      const tLines = pdf.splitTextToSize(title, maxW);
      pdf.text(tLines, margin, y);
      y += tLines.length * 7 + 4;
    }

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10.5);
    const lines = pdf.splitTextToSize(text || '', maxW);
    for (const ln of lines) {
      if (y > 280) {
        pdf.addPage();
        y = 18;
      }
      pdf.text(ln, margin, y);
      y += 5.3;
    }
    return { blob: pdf.output('blob'), filename };
  }

  async function runOcrSingleFile(file, options = {}, onProgress) {
    const cat = detectCategory(file);
    const base = getBaseName(file.name);
    const lang = options.lang || 'spa';
    const outputFormat = options.outputFormat || 'txt';
    const needCanvas = outputFormat === 'searchable-pdf' || options.keepPages;

    let pages = [];
    if (cat === 'pdf') {
      pages = await extractPdfTextHybrid(file, {
        lang,
        mode: options.mode || 'hybrid',
        needCanvas
      }, onProgress);
    } else {
      if (onProgress) onProgress(12, 'Preparando imagen para OCR...');
      const canvas = await decodeImageToCanvas(file, { fillWhite: true });
      if (onProgress) onProgress(22, `Cargando motor OCR (${lang})...`);
      const Tesseract = await ensureTesseract();
      const worker = await Tesseract.createWorker(lang, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text' && onProgress) {
            onProgress(Math.min(92, Math.round(25 + (m.progress || 0) * 65)), `Reconociendo texto (${Math.round((m.progress || 0) * 100)}%)...`);
          }
        }
      });
      try {
        const res = await worker.recognize(canvas);
        pages = [{ pageNum: 1, text: (res.data && res.data.text ? res.data.text : '').trim(), usedOcr: true, canvas }];
      } finally {
        await worker.terminate();
      }
    }

    const fullText = pages.map((p) => (pages.length > 1 ? `--- Página ${p.pageNum} ---\n${p.text}` : p.text)).join('\n\n').trim();

    if (outputFormat === 'raw') {
      return { text: fullText, pages };
    }
    if (outputFormat === 'searchable-pdf') {
      return buildSearchablePdfFromPages(pages, `${base}-buscable.pdf`, onProgress);
    }
    if (outputFormat === 'docx') {
      return createDocxFromText(fullText, base, `${base}.docx`);
    }
    if (outputFormat === 'md') {
      return { blob: new Blob([`# ${base}\n\n${fullText}\n`], { type: 'text/markdown;charset=utf-8' }), filename: `${base}.md` };
    }
    return { blob: new Blob([fullText], { type: 'text/plain;charset=utf-8' }), filename: `${base}.txt` };
  }

  async function convertPdfFile(file, target, options = {}, onProgress) {
    const base = getBaseName(file.name);
    const quality = Math.min(1, Math.max(0.3, (Number(options.quality) || 88) / 100));

    if (target === 'png' || target === 'jpg' || target === 'webp') {
      const scale = Number(options.pdfScale) || 2;
      const pages = await renderPdfPages(file, scale, onProgress);
      const mime = target === 'jpg' ? 'image/jpeg' : (target === 'webp' ? 'image/webp' : 'image/png');

      if (pages.length === 1) {
        const blob = await canvasToBlobSafe(pages[0].canvas, mime, quality);
        return { blob, filename: `${base}.${target}` };
      }

      const JSZip = await ensureJsZip();
      const zip = new JSZip();
      for (let i = 0; i < pages.length; i++) {
        if (onProgress) onProgress(Math.round(85 + ((i + 1) / pages.length) * 13), `Empaquetando página ${i + 1}/${pages.length}...`);
        const blob = await canvasToBlobSafe(pages[i].canvas, mime, quality);
        const pad = String(i + 1).padStart(2, '0');
        zip.file(`${base}-pag-${pad}.${target}`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      return { blob: zipBlob, filename: `${base}-paginas-${target}.zip`, note: `${pages.length} páginas empaquetadas en ZIP.` };
    }

    if (target === 'searchable-pdf') {
      return runOcrSingleFile(file, { lang: options.ocrLang || 'spa', mode: 'hybrid', outputFormat: 'searchable-pdf' }, onProgress);
    }

    const ocrOut = await runOcrSingleFile(file, { lang: options.ocrLang || 'spa', mode: 'hybrid', outputFormat: 'raw' }, onProgress);
    const text = ocrOut.text;

    if (target === 'txt') {
      return { blob: new Blob([text], { type: 'text/plain;charset=utf-8' }), filename: `${base}.txt` };
    }
    if (target === 'md') {
      return { blob: new Blob([`# ${base}\n\n${text}\n`], { type: 'text/markdown;charset=utf-8' }), filename: `${base}.md` };
    }
    if (target === 'docx') {
      return createDocxFromText(text, base, `${base}.docx`);
    }
    if (target === 'html') {
      const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br />\n');
      const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${base}</title><style>body{font-family:system-ui,sans-serif;max-width:820px;margin:32px auto;padding:0 16px;line-height:1.6;color:#1F2536;}</style></head><body><h1>${base}</h1><div>${escaped}</div></body></html>`;
      return { blob: new Blob([html], { type: 'text/html;charset=utf-8' }), filename: `${base}.html` };
    }

    throw new Error('Conversión PDF no soportada: ' + target);
  }

  /* ---------- OPERACIONES DEL TALLER PDF ---------- */
  async function mergePdfs(files, onProgress) {
    const { PDFDocument } = await ensurePdfLib();
    const merged = await PDFDocument.create();
    for (let i = 0; i < files.length; i++) {
      if (onProgress) onProgress(Math.round(((i + 0.5) / files.length) * 90), `Uniendo PDF ${i + 1} de ${files.length}...`);
      const bytes = await files[i].arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const copied = await merged.copyPages(src, src.getPageIndices());
      copied.forEach((p) => merged.addPage(p));
    }
    const out = await merged.save();
    return { blob: new Blob([out], { type: 'application/pdf' }), filename: 'unido-ya-nomah.pdf' };
  }

  async function splitPdf(file, rangeStr, onProgress) {
    const { PDFDocument } = await ensurePdfLib();
    const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
    const total = src.getPageCount();
    const base = getBaseName(file.name);

    if ((rangeStr || '').trim()) {
      const indices = parsePageRanges(rangeStr, total);
      if (!indices.length) throw new Error('Rango de páginas inválido. Este PDF tiene ' + total + ' páginas.');
      const outDoc = await PDFDocument.create();
      const copied = await outDoc.copyPages(src, indices);
      copied.forEach((p) => outDoc.addPage(p));
      const out = await outDoc.save();
      return { blob: new Blob([out], { type: 'application/pdf' }), filename: `${base}-extraido.pdf`, note: `${indices.length} página(s) extraídas.` };
    }

    const JSZip = await ensureJsZip();
    const zip = new JSZip();
    for (let i = 0; i < total; i++) {
      if (onProgress) onProgress(Math.round(((i + 1) / total) * 90), `Separando página ${i + 1} de ${total}...`);
      const single = await PDFDocument.create();
      const [page] = await single.copyPages(src, [i]);
      single.addPage(page);
      const bytes = await single.save();
      zip.file(`${base}-pag-${String(i + 1).padStart(2, '0')}.pdf`, bytes);
    }
    return { blob: await zip.generateAsync({ type: 'blob' }), filename: `${base}-separado.zip`, note: `${total} PDFs individuales en ZIP.` };
  }

  async function rotatePdf(file, angleDeg, rangeStr, onProgress) {
    const { PDFDocument, degrees } = await ensurePdfLib();
    if (onProgress) onProgress(40, 'Girando páginas...');
    const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
    const pages = doc.getPages();
    const indices = parsePageRanges(rangeStr, pages.length);
    for (const idx of indices) {
      const cur = pages[idx].getRotation().angle || 0;
      pages[idx].setRotation(degrees((cur + Number(angleDeg)) % 360));
    }
    const bytes = await doc.save();
    return { blob: new Blob([bytes], { type: 'application/pdf' }), filename: `${getBaseName(file.name)}-rotado.pdf` };
  }

  async function compressPdf(file, level = 'medium', onProgress) {
    const presets = {
      light: { scale: 1.8, quality: 0.82 },
      medium: { scale: 1.4, quality: 0.68 },
      strong: { scale: 1.1, quality: 0.52 }
    };
    const cfg = presets[level] || presets.medium;
    const pages = await renderPdfPages(file, cfg.scale, onProgress);
    const { PDFDocument } = await ensurePdfLib();
    const outDoc = await PDFDocument.create();

    for (let i = 0; i < pages.length; i++) {
      if (onProgress) onProgress(Math.round(85 + ((i + 1) / pages.length) * 13), `Optimizando página ${i + 1}/${pages.length}...`);
      const jpegBlob = await canvasToBlobSafe(pages[i].canvas, 'image/jpeg', cfg.quality);
      const jpg = await outDoc.embedJpg(new Uint8Array(await jpegBlob.arrayBuffer()));
      const pw = pages[i].width / cfg.scale;
      const ph = pages[i].height / cfg.scale;
      const page = outDoc.addPage([pw, ph]);
      page.drawImage(jpg, { x: 0, y: 0, width: pw, height: ph });
    }
    const bytes = await outDoc.save();
    const outBlob = new Blob([bytes], { type: 'application/pdf' });
    const pct = Math.round((1 - outBlob.size / Math.max(1, file.size)) * 100);
    const note = pct > 0
      ? `Reducido ${pct}% (${formatBytes(file.size)} → ${formatBytes(outBlob.size)})`
      : `Peso final: ${formatBytes(outBlob.size)}`;
    return { blob: outBlob, filename: `${getBaseName(file.name)}-comprimido.pdf`, note };
  }

  /* ---------- PLANILLAS Y DATOS (XLSX, CSV, JSON, YAML, HTML, MD, PDF) ---------- */
  async function parseStructuredRows(file) {
    const ext = getExt(file.name);
    if (SHEET_EXTS.includes(ext)) {
      const XLSX = await ensureXlsx();
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const firstName = wb.SheetNames[0];
      const ws = wb.Sheets[firstName];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      return { rows, aoa, sheetName: firstName || 'Datos', rawObj: rows };
    }

    const text = await file.text();
    if (ext === 'json') {
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const flat = arr.map((item) => (item && typeof item === 'object' ? item : { valor: item }));
      const headers = Array.from(new Set(flat.flatMap((o) => Object.keys(o))));
      const aoa = [headers, ...flat.map((o) => headers.map((h) => (typeof o[h] === 'object' && o[h] !== null ? JSON.stringify(o[h]) : (o[h] ?? ''))))];
      return { rows: flat, aoa, sheetName: 'JSON', rawObj: parsed };
    }
    if (ext === 'yaml' || ext === 'yml') {
      const jsyaml = await ensureYaml();
      const parsed = jsyaml.load(text);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const flat = arr.map((item) => (item && typeof item === 'object' ? item : { valor: item }));
      const headers = Array.from(new Set(flat.flatMap((o) => Object.keys(o))));
      const aoa = [headers, ...flat.map((o) => headers.map((h) => (typeof o[h] === 'object' && o[h] !== null ? JSON.stringify(o[h]) : (o[h] ?? ''))))];
      return { rows: flat, aoa, sheetName: 'YAML', rawObj: parsed };
    }
    if (ext === 'xml') {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'application/xml');
      const items = Array.from(xmlDoc.documentElement ? xmlDoc.documentElement.children : []);
      const rows = items.map((el) => {
        const obj = {};
        if (el.children.length) {
          Array.from(el.children).forEach((c) => { obj[c.tagName] = c.textContent.trim(); });
        } else {
          obj[el.tagName] = el.textContent.trim();
        }
        return obj;
      });
      const headers = Array.from(new Set(rows.flatMap((o) => Object.keys(o))));
      const aoa = [headers, ...rows.map((o) => headers.map((h) => o[h] ?? ''))];
      return { rows, aoa, sheetName: 'XML', rawObj: rows };
    }
    throw new Error('No se pudo interpretar este archivo de datos.');
  }

  function aoaToHtmlTable(aoa, title) {
    const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const head = aoa[0] ? `<thead><tr>${aoa[0].map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>` : '';
    const body = aoa.slice(1).map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('\n');
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${esc(title)}</title><style>body{font-family:system-ui,sans-serif;padding:24px;color:#1F2536;background:#FFF8EE}table{border-collapse:collapse;width:100%;background:#fff}th,td{border:1.5px solid #1F2536;padding:8px 10px;text-align:left;font-size:13px}th{background:#FFD000}</style></head><body><h1>${esc(title)}</h1><table>${head}<tbody>${body}</tbody></table></body></html>`;
  }

  function aoaToMarkdown(aoa) {
    if (!aoa.length) return '';
    const clean = (v) => String(v ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
    const cols = aoa[0].length;
    const head = '| ' + aoa[0].map(clean).join(' | ') + ' |';
    const sep = '| ' + Array(cols).fill('---').join(' | ') + ' |';
    const rows = aoa.slice(1).map((r) => '| ' + Array.from({ length: cols }, (_, i) => clean(r[i])).join(' | ') + ' |');
    return [head, sep, ...rows].join('\n');
  }

  async function convertStructuredFile(file, target, onProgress) {
    if (onProgress) onProgress(25, 'Leyendo filas y columnas...');
    const { rows, aoa, sheetName, rawObj } = await parseStructuredRows(file);
    const base = getBaseName(file.name);
    if (onProgress) onProgress(68, 'Generando ' + target.toUpperCase() + '...');

    if (target === 'xlsx') {
      const XLSX = await ensureXlsx();
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, (sheetName || 'Datos').slice(0, 31));
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      return { blob: new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename: `${base}.xlsx` };
    }
    if (target === 'csv' || target === 'tsv') {
      const XLSX = await ensureXlsx();
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const text = XLSX.utils.sheet_to_csv(ws, { FS: target === 'tsv' ? '\t' : ',' });
      return { blob: new Blob(['\uFEFF' + text], { type: 'text/csv;charset=utf-8' }), filename: `${base}.${target}` };
    }
    if (target === 'json') {
      return { blob: new Blob([JSON.stringify(rawObj, null, 2)], { type: 'application/json;charset=utf-8' }), filename: `${base}.json` };
    }
    if (target === 'yaml') {
      const jsyaml = await ensureYaml();
      return { blob: new Blob([jsyaml.dump(rawObj)], { type: 'text/yaml;charset=utf-8' }), filename: `${base}.yaml` };
    }
    if (target === 'html') {
      return { blob: new Blob([aoaToHtmlTable(aoa, base)], { type: 'text/html;charset=utf-8' }), filename: `${base}.html` };
    }
    if (target === 'md') {
      return { blob: new Blob([aoaToMarkdown(aoa)], { type: 'text/markdown;charset=utf-8' }), filename: `${base}.md` };
    }
    if (target === 'txt') {
      const txt = aoa.map((r) => r.join('\t')).join('\n');
      return { blob: new Blob([txt], { type: 'text/plain;charset=utf-8' }), filename: `${base}.txt` };
    }
    if (target === 'pdf') {
      const txt = aoa.map((r, idx) => (idx === 0 ? r.join('  |  ') + '\n' + '-'.repeat(64) : r.join('  |  '))).join('\n');
      return createPdfFromText(txt, base, `${base}.pdf`);
    }

    throw new Error('Formato de salida no soportado para planillas/datos: ' + target);
  }

  /* ---------- DOCUMENTOS (DOCX, MD, HTML, TXT, RTF) ---------- */
  function stripHtmlToText(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.innerText || tmp.textContent || '').trim();
  }

  function htmlToSimpleMarkdown(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const out = [];
    function walk(node) {
      if (node.nodeType === 3) {
        out.push(node.nodeValue);
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tag)) {
        out.push('\n' + '#'.repeat(Number(tag[1])) + ' ');
        Array.from(node.childNodes).forEach(walk);
        out.push('\n\n');
      } else if (tag === 'p' || tag === 'div') {
        Array.from(node.childNodes).forEach(walk);
        out.push('\n\n');
      } else if (tag === 'br') {
        out.push('\n');
      } else if (tag === 'strong' || tag === 'b') {
        out.push('**'); Array.from(node.childNodes).forEach(walk); out.push('**');
      } else if (tag === 'em' || tag === 'i') {
        out.push('*'); Array.from(node.childNodes).forEach(walk); out.push('*');
      } else if (tag === 'li') {
        out.push('- '); Array.from(node.childNodes).forEach(walk); out.push('\n');
      } else {
        Array.from(node.childNodes).forEach(walk);
      }
    }
    Array.from(tmp.childNodes).forEach(walk);
    return out.join('').replace(/\n{3,}/g, '\n\n').trim();
  }

  function stripRtf(rtf) {
    return (rtf || '')
      .replace(/\\par[d]?/g, '\n')
      .replace(/\{\*?\\[^{}]+}|[{}]|\\\n?[A-Za-z]+\n?(?:-?\d+)?[ ]?/g, '')
      .trim();
  }

  async function convertDocFile(file, target, onProgress) {
    const ext = getExt(file.name);
    const base = getBaseName(file.name);
    if (onProgress) onProgress(25, 'Leyendo documento...');

    let plainText = '';
    let htmlContent = '';

    if (ext === 'docx') {
      const mammoth = await ensureMammoth();
      const buf = await file.arrayBuffer();
      const resHtml = await mammoth.convertToHtml({ arrayBuffer: buf });
      htmlContent = resHtml.value || '';
      plainText = stripHtmlToText(htmlContent);
    } else if (ext === 'md' || ext === 'markdown') {
      plainText = await file.text();
      const marked = await ensureMarked();
      htmlContent = marked.parse(plainText);
    } else if (ext === 'html' || ext === 'htm') {
      htmlContent = await file.text();
      plainText = stripHtmlToText(htmlContent);
    } else if (ext === 'rtf') {
      plainText = stripRtf(await file.text());
      htmlContent = `<p>${plainText.replace(/\n/g, '<br />')}</p>`;
    } else {
      plainText = await file.text();
      htmlContent = `<pre style="white-space:pre-wrap;font-family:inherit">${plainText.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>`;
    }

    if (onProgress) onProgress(70, 'Escribiendo archivo ' + target.toUpperCase() + '...');

    if (target === 'txt') {
      return { blob: new Blob([plainText], { type: 'text/plain;charset=utf-8' }), filename: `${base}.txt` };
    }
    if (target === 'html') {
      const fullHtml = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${base}</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:32px auto;padding:0 18px;line-height:1.6;color:#1F2536}img{max-width:100%}</style></head><body>${htmlContent}</body></html>`;
      return { blob: new Blob([fullHtml], { type: 'text/html;charset=utf-8' }), filename: `${base}.html` };
    }
    if (target === 'md') {
      const md = htmlContent ? htmlToSimpleMarkdown(htmlContent) : plainText;
      return { blob: new Blob([md], { type: 'text/markdown;charset=utf-8' }), filename: `${base}.md` };
    }
    if (target === 'docx') {
      return createDocxFromText(plainText, base, `${base}.docx`);
    }
    if (target === 'pdf') {
      return createPdfFromText(plainText, base, `${base}.pdf`);
    }

    throw new Error('Formato de documento no soportado: ' + target);
  }

  /* ---------- AUDIO Y VIDEO (FFMPEG WASM SINGLE-THREAD) ---------- */
  async function convertMediaFile(file, target, options = {}, onProgress) {
    const ff = await ensureFFmpeg(onProgress);
    const inExt = getExt(file.name) || 'bin';
    const base = getBaseName(file.name);
    const inName = `input.${inExt}`;
    const outName = `output.${target}`;
    const preset = options.videoPreset || 'balanced';

    const progressHandler = ({ progress }) => {
      if (onProgress && Number.isFinite(progress)) {
        const pct = Math.min(95, Math.max(20, Math.round(20 + progress * 75)));
        onProgress(pct, `Procesando multimedia (${Math.round(progress * 100)}%)...`);
      }
    };
    ff.on('progress', progressHandler);

    try {
      if (onProgress) onProgress(22, 'Cargando archivo en FFmpeg...');
      const bytes = new Uint8Array(await file.arrayBuffer());
      await ff.writeFile(inName, bytes);

      let args = ['-i', inName];
      if (target === 'mp4') {
        const crf = preset === 'small' ? '30' : (preset === 'high' ? '20' : '25');
        args.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', crf, '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outName);
      } else if (target === 'webm') {
        const crf = preset === 'small' ? '38' : (preset === 'high' ? '26' : '32');
        args.push('-c:v', 'libvpx', '-crf', crf, '-b:v', '1M', '-c:a', 'libvorbis', outName);
      } else if (target === 'gif') {
        const width = preset === 'small' ? 360 : (preset === 'high' ? 640 : 480);
        const fps = preset === 'small' ? 10 : 12;
        args.push('-vf', `fps=${fps},scale=${width}:-1:flags=lanczos`, '-loop', '0', outName);
      } else if (target === 'mp3') {
        const br = preset === 'small' ? '128k' : (preset === 'high' ? '320k' : '192k');
        args.push('-vn', '-c:a', 'libmp3lame', '-b:a', br, outName);
      } else if (target === 'wav') {
        args.push('-vn', '-c:a', 'pcm_s16le', outName);
      } else if (target === 'ogg') {
        args.push('-vn', '-c:a', 'libvorbis', '-q:a', '4', outName);
      } else if (target === 'm4a') {
        args.push('-vn', '-c:a', 'aac', '-b:a', '192k', outName);
      } else if (target === 'flac') {
        args.push('-vn', '-c:a', 'flac', outName);
      } else {
        args.push(outName);
      }

      if (onProgress) onProgress(30, 'Convirtiendo con FFmpeg local...');
      await ff.exec(args);

      const outData = await ff.readFile(outName);
      const mimeMap = {
        mp4: 'video/mp4',
        webm: 'video/webm',
        gif: 'image/gif',
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        m4a: 'audio/mp4',
        flac: 'audio/flac'
      };
      return { blob: new Blob([outData.buffer], { type: mimeMap[target] || 'application/octet-stream' }), filename: `${base}.${target}` };
    } finally {
      ff.off('progress', progressHandler);
      try { await ff.deleteFile(inName); } catch (_) {}
      try { await ff.deleteFile(outName); } catch (_) {}
    }
  }

  /* ---------- CAJA ZIP ---------- */
  async function packZip(files, zipName, onProgress) {
    const JSZip = await ensureJsZip();
    const zip = new JSZip();
    for (let i = 0; i < files.length; i++) {
      if (onProgress) onProgress(Math.round(((i + 0.5) / files.length) * 50), `Agregando ${files[i].name}...`);
      zip.file(files[i].name, files[i]);
    }
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }, (meta) => {
      if (onProgress) onProgress(Math.round(50 + meta.percent * 0.48), `Comprimiendo ZIP (${Math.round(meta.percent)}%)...`);
    });
    const cleanName = (zipName || 'paquete-ya-nomah.zip').replace(/\.zip$/i, '') + '.zip';
    return { blob, filename: cleanName };
  }

  async function inspectZip(file) {
    const JSZip = await ensureJsZip();
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const entries = [];
    zip.forEach((relPath, entry) => {
      if (!entry.dir) {
        entries.push({
          path: relPath,
          name: relPath.split('/').pop() || relPath,
          uncompressedSize: entry._data ? entry._data.uncompressedSize : 0,
          entry
        });
      }
    });
    return entries;
  }

  /* ---------- ENRUTADOR PRINCIPAL ---------- */
  async function convertAny(file, target, options = {}, onProgress) {
    const cat = detectCategory(file);
    if (cat === 'image') return convertImageFile(file, target, options, onProgress);
    if (cat === 'pdf') return convertPdfFile(file, target, options, onProgress);
    if (cat === 'sheet' || cat === 'data') return convertStructuredFile(file, target, onProgress);
    if (cat === 'doc') return convertDocFile(file, target, onProgress);
    if (cat === 'video' || cat === 'audio') return convertMediaFile(file, target, options, onProgress);
    if (cat === 'archive' && target === 'txt') {
      const list = await inspectZip(file);
      const txt = list.map((e) => `${e.path} (${formatBytes(e.uncompressedSize)})`).join('\n');
      return { blob: new Blob([txt], { type: 'text/plain;charset=utf-8' }), filename: `${getBaseName(file.name)}-contenido.txt` };
    }
    throw new Error('Tipo de archivo aún no soportado para conversión directa.');
  }

  global.YaNomahEngines = {
    TARGET_LABELS,
    getExt,
    getBaseName,
    formatBytes,
    detectCategory,
    getTargetsForFile,
    getDefaultTarget,
    convertAny,
    imagesToSinglePdf,
    mergePdfs,
    splitPdf,
    rotatePdf,
    compressPdf,
    runOcrSingleFile,
    buildSearchablePdfFromPages,
    createDocxFromText,
    packZip,
    inspectZip,
    ensureJsZip
  };
})(window);
