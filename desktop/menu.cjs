function applicationMenu(platform) {
  const mac = platform === 'darwin';
  const nativeItems = [
    { role: 'about' },
    { type: 'separator' },
    { role: 'hide' },
    { role: 'hideOthers' },
    { role: 'unhide' },
    { type: 'separator' },
  ];
  return {
    label: mac ? 'ProCode' : 'File',
    submenu: [...(mac ? nativeItems : []), { role: 'quit' }],
  };
}
function desktopMenu(platform) {
  const view = ['reload', 'resetZoom', 'zoomIn', 'zoomOut', 'togglefullscreen'];
  const submenu = view.map((role) => ({ role }));
  submenu.splice(1, 0, { type: 'separator' });
  return [
    applicationMenu(platform),
    { role: 'editMenu' },
    { label: 'View', submenu },
    { role: 'windowMenu' },
    ...(platform === 'darwin' ? [] : [{ label: 'Help', submenu: [{ role: 'about' }] }]),
  ];
}
module.exports = { desktopMenu };
