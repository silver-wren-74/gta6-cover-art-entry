// Neon Coast Studio — editor wiring: photo loading, panel assignment,
// per-panel framing, live preview and one-click PNG export.
import { GRADES, LAYOUTS, POST_SIZES, TITLE_STYLES, exportFileName, renderCover } from './render.js';
import { runShot } from './shots.js';

const $ = (sel) => document.querySelector(sel);

export const state = {
  layoutId: 'cover6',
  gradeId: 'sunset',
  title: 'Neon Coast',
  subtitle: 'every sunset has a story',
  titleStyle: 'sunset-fill',
  sizeId: 'square',
  photos: [],        // HTMLImageElement list, in load order
  photoNames: [],
  frames: [],        // per-panel {x, y, zoom}
  panelPhoto: [],    // per-panel photo index
  grain: 1,
  frame: true,
  activePanel: 0,
};

const preview = $('#preview');
const exportCanvas = document.createElement('canvas');
let photosVersion = 0;

export function currentPanelCount() {
  const layout = LAYOUTS.find((l) => l.id === state.layoutId);
  const size = POST_SIZES.find((s) => s.id === state.sizeId);
  return layout.panels(size.w / size.h).length;
}

function syncPanelArrays() {
  const n = currentPanelCount();
  while (state.frames.length < n) state.frames.push({ x: 0, y: 0, zoom: 1 });
  while (state.panelPhoto.length < n) {
    const idx = state.panelPhoto.length;
    state.panelPhoto.push(state.photos.length ? idx % state.photos.length : -1);
  }
  state.frames.length = n;
  state.panelPhoto.length = n;
  if (state.activePanel >= n) state.activePanel = 0;
}

export function draw() {
  syncPanelArrays();
  renderCover(preview, state);
  buildPanelList();
  syncFrameControls();
}

function loadImageFrom(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function addPhotoSource(src, name) {
  const img = await loadImageFrom(src);
  state.photos.push(img);
  state.photoNames.push(name);
  // New photo fills the first empty panel, then cycles.
  const empty = state.panelPhoto.indexOf(-1);
  if (empty >= 0) state.panelPhoto[empty] = state.photos.length - 1;
  photosVersion++;
  draw();
  return img;
}

async function addFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const url = URL.createObjectURL(file);
    try { await addPhotoSource(url, file.name); } catch { /* skip unreadable file */ }
  }
}

function buildPanelList() {
  const list = $('#panelList');
  list.innerHTML = '';
  const n = currentPanelCount();
  for (let i = 0; i < n; i++) {
    const row = document.createElement('div');
    row.className = 'panel-row' + (i === state.activePanel ? ' active' : '');
    const label = document.createElement('button');
    label.type = 'button';
    label.textContent = `Panel ${i + 1}`;
    label.addEventListener('click', () => { state.activePanel = i; draw(); });
    const select = document.createElement('select');
    select.setAttribute('aria-label', `Photo for panel ${i + 1}`);
    const none = document.createElement('option');
    none.value = '-1'; none.textContent = '— empty —';
    select.appendChild(none);
    state.photos.forEach((_, pi) => {
      const opt = document.createElement('option');
      opt.value = String(pi);
      opt.textContent = state.photoNames[pi] ?? `Photo ${pi + 1}`;
      select.appendChild(opt);
    });
    select.value = String(state.panelPhoto[i] ?? -1);
    select.addEventListener('change', () => { state.panelPhoto[i] = Number(select.value); state.activePanel = i; draw(); });
    row.append(label, select);
    list.appendChild(row);
  }
}

function syncFrameControls() {
  const f = state.frames[state.activePanel] ?? { x: 0, y: 0, zoom: 1 };
  $('#panX').value = String(Math.round(f.x * 100));
  $('#panY').value = String(Math.round(f.y * 100));
  $('#zoom').value = String(Math.round(f.zoom * 100));
  $('#activePanelLabel').textContent = `Framing panel ${state.activePanel + 1} — drag the preview or use the sliders`;
}

function fillSelect(sel, items, value) {
  sel.innerHTML = '';
  for (const item of items) {
    const opt = document.createElement('option');
    opt.value = item.id; opt.textContent = item.name ?? item.label;
    sel.appendChild(opt);
  }
  sel.value = value;
}

function bindEditor() {
  fillSelect($('#layoutSelect'), LAYOUTS, state.layoutId);
  fillSelect($('#gradeSelect'), GRADES, state.gradeId);
  fillSelect($('#sizeSelect'), POST_SIZES, state.sizeId);
  fillSelect($('#titleStyleSelect'), TITLE_STYLES, state.titleStyle);

  $('#layoutSelect').addEventListener('change', (e) => { state.layoutId = e.target.value; state.activePanel = 0; draw(); });
  $('#gradeSelect').addEventListener('change', (e) => { state.gradeId = e.target.value; draw(); });
  $('#sizeSelect').addEventListener('change', (e) => { state.sizeId = e.target.value; draw(); });
  $('#titleStyleSelect').addEventListener('change', (e) => { state.titleStyle = e.target.value; draw(); });
  $('#titleInput').addEventListener('input', (e) => { state.title = e.target.value; draw(); });
  $('#subtitleInput').addEventListener('input', (e) => { state.subtitle = e.target.value; draw(); });
  $('#grainRange').addEventListener('input', (e) => { state.grain = Number(e.target.value) / 50; draw(); });
  $('#frameToggle').addEventListener('change', (e) => { state.frame = e.target.checked; draw(); });

  const frameInput = () => {
    const f = state.frames[state.activePanel];
    if (!f) return;
    f.x = Number($('#panX').value) / 100;
    f.y = Number($('#panY').value) / 100;
    f.zoom = Number($('#zoom').value) / 100;
    renderCover(preview, state);
  };
  ['panX', 'panY', 'zoom'].forEach((id) => $('#' + id).addEventListener('input', frameInput));
  $('#resetFrame').addEventListener('click', () => {
    state.frames[state.activePanel] = { x: 0, y: 0, zoom: 1 };
    draw();
  });
  $('#spreadPhoto').addEventListener('click', () => {
    // One photo across every panel: each panel shows its own slice of it.
    const idx = state.photos.length - 1;
    if (idx < 0) return;
    state.panelPhoto = state.panelPhoto.map(() => idx);
    draw();
  });

  const fileInput = $('#fileInput');
  $('#addPhotosBtn').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => addFiles(fileInput.files));
  $('#sampleBoulevard').addEventListener('click', () => addPhotoSource('samples/boulevard.jpg', 'Boulevard sample'));
  $('#sampleNeon').addEventListener('click', () => addPhotoSource('samples/neon.jpg', 'Neon sample'));

  const drop = $('#dropZone');
  drop.addEventListener('click', () => fileInput.click());
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); addFiles(e.dataTransfer.files); });
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => e.preventDefault());

  // Drag on the preview pans the active panel's photo.
  let drag = null;
  preview.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY };
    preview.setPointerCapture(e.pointerId);
  });
  preview.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const f = state.frames[state.activePanel];
    if (!f) return;
    const rect = preview.getBoundingClientRect();
    f.x = Math.max(-1, Math.min(1, f.x + ((e.clientX - drag.x) / rect.width) * 2));
    f.y = Math.max(-1, Math.min(1, f.y + ((e.clientY - drag.y) / rect.height) * 2));
    drag = { x: e.clientX, y: e.clientY };
    renderCover(preview, state);
    syncFrameControls();
  });
  preview.addEventListener('pointerup', () => { drag = null; draw(); });
  preview.addEventListener('wheel', (e) => {
    e.preventDefault();
    const f = state.frames[state.activePanel];
    if (!f) return;
    f.zoom = Math.max(1, Math.min(3, f.zoom * (e.deltaY < 0 ? 1.06 : 0.94)));
    renderCover(preview, state);
    syncFrameControls();
  }, { passive: false });

  $('#exportBtn').addEventListener('click', () => {
    renderCover(exportCanvas, state);
    exportCanvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = exportFileName(state);
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, 'image/png');
  });
  // One-click exports at every post size, whatever the preview shows.
  document.querySelectorAll('[data-export-size]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const keep = state.sizeId;
      state.sizeId = btn.getAttribute('data-export-size');
      renderCover(exportCanvas, state);
      exportCanvas.toBlob((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = exportFileName(state);
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }, 'image/png');
      state.sizeId = keep;
    });
  });
}

async function boot() {
  const query = new URLSearchParams(location.search);
  const shot = query.get('shot');
  if (shot) { await runShot(shot, query, { state, addPhotoSource, draw }); return; }
  bindEditor();
  $('#titleInput').value = state.title;
  $('#subtitleInput').value = state.subtitle;
  await addPhotoSource('samples/boulevard.jpg', 'Boulevard sample');
  await addPhotoSource('samples/neon.jpg', 'Neon sample');
  // Default cover grid: alternate the two samples across the six panels.
  state.panelPhoto = state.panelPhoto.map((_, i) => i % state.photos.length);
  draw();
}

boot();
