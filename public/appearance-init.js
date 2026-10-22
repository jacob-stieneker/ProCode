// Apply only validated appearance identifiers before CSS paints. No workspace data is read.
(() => {
  let mode = 'dark';
  let theme = 'procode';
  try {
    const saved = JSON.parse(localStorage.getItem('procode.appearance.v1') || 'null');
    if (
      saved &&
      ['light', 'dark', 'midnight'].includes(saved.mode) &&
      ['procode', 'github', 'visual-studio', 'codex', 'cursor', 'claude', 'pycharm'].includes(
        saved.theme,
      )
    ) {
      mode = saved.mode;
      theme = saved.theme;
    }
  } catch {
    /* Use the default appearance if storage is unavailable. */
  }
  document.documentElement.dataset.mode = mode;
  document.documentElement.dataset.theme = theme;
})();
