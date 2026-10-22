const { appId, productName } = require('./config.cjs');
const { devDependencies } = require('../package.json');

module.exports = {
  appId,
  productName,
  electronVersion: devDependencies.electron,
  directories: {
    app: '.desktop-stage',
    output: 'release/windows',
    buildResources: 'desktop/resources',
  },
  files: ['**/*'],
  asar: true,
  npmRebuild: false,
  publish: null,
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    executableName: 'ProCode',
    icon: 'desktop/resources/ProCode.ico',
    artifactName: 'ProCode-${version}-windows-${arch}-setup.${ext}',
    requestedExecutionLevel: 'asInvoker',
  },
  nsis: {
    oneClick: true,
    perMachine: false,
    allowElevation: false,
    deleteAppDataOnUninstall: false,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: productName,
    runAfterFinish: false,
    differentialPackage: false,
  },
};
