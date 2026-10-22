# ProCode for Windows

## Install

Download `ProCode-0.2.3-windows-x64-setup.exe` from the private [v0.2.3 release](https://github.com/jacob-stieneker/ProCode/releases/tag/v0.2.3), then run it. The self-contained installer installs ProCode for the current Windows user, with desktop and Start menu shortcuts. It does not require Node.js, Python, a terminal, administrator access, an account, or an internet connection for practice. Reference links open in the default browser.

The Windows app packages the same Angular production build, Electron version, desktop security boundaries, exercise catalogs, graders, Python interpreter, Angular compiler and local workflow simulators as the Mac app. Console and Test results remain manually selected. Native window chrome, menus, font rendering and keyboard shortcuts follow Windows conventions.

The target is 64-bit Windows (x64). The automated release checks run on GitHub's Windows Server 2025 runner. Intel/AMD Windows 10/11 machines require their own compatibility coverage before claiming every device is supported. A native ARM64 or 32-bit installer is not included.

This initial installer has no publisher code-signing certificate. Windows may display an unknown-publisher or SmartScreen warning. Checksums establish file integrity, not publisher trust. Signing requires an owner-controlled Windows code-signing identity; this project does not buy certificates or disable Windows protections. See [Electron's signing guidance](https://www.electronjs.org/docs/latest/tutorial/code-signing) and [Windows signing options](https://www.electron.build/v26/docs/win/).

## Saved work

Desktop drafts, appearance preferences and progress live under `%APPDATA%\ProCode` on the stable `procode://app` origin. Reinstalling, upgrading or uninstalling the app preserves this folder. Removing it deletes saved work. Windows, macOS and web-browser profiles are separate. There is no automatic device sync or backup import; JSON export remains available.

## Build and verify

Use Windows x64, Node.js 24.15 or later in the Node 24 line, and npm:

```sh
npm ci
node node_modules/electron/install.js
npm run package:windows
npm run test:desktop
```

The build creates:

- `release/windows/ProCode-0.2.3-windows-x64-setup.exe`
- `release/windows/ProCode-0.2.3-windows-x64-setup.exe.sha256`
- `release/windows/win-unpacked/ProCode.exe` (requires its surrounding files)

The version comes from `package.json`. `package:windows` builds production assets, checks desktop asset handling, stages only runtime files and required third-party notices, and builds a compressed NSIS installer using pinned electron-builder tooling. Development dependencies are not bundled. It writes a SHA-256 checksum beside the installer.

The **Desktop installers** GitHub Actions workflow builds Windows and macOS from a clean checkout on their respective operating systems. On Windows it verifies the installer checksum, installs into a directory containing spaces, runs the shared desktop scenarios against that installed copy, checks reinstall/uninstall and data preservation, then runs the full browser regression suite. Installer artifacts are uploaded only after successful checks. Tests use disposable CI data and separate temporary app profiles. Installer lifecycle checks intentionally refuse to run outside the disposable Windows CI machine.

Download **ProCode-Windows-x64** from a successful Actions run. It contains the installer and checksum. Artifact retention is 14 days; a durable GitHub Release can retain selected verified installers. The workflow never automatically publishes a release, uploads credentials or changes signing accounts.

Manual workflow runs can use `browser_grep` to recheck selected browser scenarios and select platforms with `verify_macos` and `verify_windows`. The job summary identifies a focused recheck. A focused success establishes that selected coverage, not a replacement for the complete regression sweep. Test reports and screenshots are retained with workflow artifacts.

The macOS workflow retains the existing Apple Silicon packaging and local ad-hoc signing. See [DESKTOP.md](DESKTOP.md) for Mac-specific installation and trust details. Windows installer behavior follows [NSIS options](https://www.electron.build/v26/docs/nsis/) and its [silent installation parameters](https://nsis.sourceforge.io/Which_command_line_parameters_can_be_used_to_configure_installers).
