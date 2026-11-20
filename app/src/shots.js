// Reproducible screenshot scenes.
//   ?shot=cover&photos=boulevard,neon&title=...&subtitle=...&layout=cover6&grade=sunset&size=square
//     renders one finished cover full-screen (the exported art itself).
//   ?shot=editor&... shows the editor with the same scene loaded.
// window.__shotReady flips true once the scene has painted twice.
export async function runShot(shot, query, api) {
  const { state, addPhotoSource, draw } = api;
  document.body.classList.add(shot === 'cover' ? 'shot-cover' : 'shot-editor');

  if (query.get('layout')) state.layoutId = query.get('layout');
  if (query.get('grade')) state.gradeId = query.get('grade');
  if (query.get('size')) state.sizeId = query.get('size');
  if (query.get('style')) state.titleStyle = query.get('style');
  state.title = query.get('title') ?? state.title;
  state.subtitle = query.get('subtitle') ?? state.subtitle;

  const names = (query.get('photos') ?? 'boulevard,neon').split(',').map((s) => s.trim()).filter(Boolean);
  for (const name of names) {
    await addPhotoSource(`samples/${name}.jpg`, `${name} sample`);
  }
  // Spread the loaded photos across the panels in order.
  state.panelPhoto = state.panelPhoto.map((_, i) => (state.photos.length ? i % state.photos.length : -1));
  draw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
