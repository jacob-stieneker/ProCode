# ProCode for macOS

## Install and use

The DMG is a self-contained build for the owner's Apple Silicon Mac. Open `release/ProCode-0.2.3-arm64.dmg`, drag `ProCode.app` onto the Applications shortcut, eject the disk image, then open ProCode from Applications. Practice requires no server command, Node.js or Python installation, account, or network connection. Reference links open in the default browser and require a connection.

The bundle declares macOS 13 or later, following the included Electron runtime. Verification is performed on macOS 27.0.1 with Apple Silicon. Intel Macs and earlier macOS versions have not been tested or packaged.

This build is locally ad-hoc signed, including nested frameworks and helper executables. It is not Developer ID signed or notarized. No signing identity was available on the build Mac. It is intended for this owner's Mac, not public distribution. If macOS rejects a quarantined copy, stop and inspect that specific warning; this workflow does not disable Gatekeeper or remove quarantine attributes.

## Saved work

Desktop data is under `~/Library/Application Support/ProCode`, on the stable `procode://app` origin. Replacing the application preserves this data. Deleting the application-support folder removes desktop drafts, preferences and progress.

Browser work at `http://127.0.0.1:4200` or other origins remains in the browser. The desktop app starts with a separate workspace and does not read or migrate browser profiles. Export existing browser work before changing how you practice. Exports are JSON backups; import is not implemented, so individual solutions can be copied manually when needed.

## Rebuild

Use an Apple Silicon Mac, Node.js 24.15 or later in the Node 24 line, npm, and the macOS command-line tools (`codesign`, `hdiutil`, and `plutil`).

```sh
npm ci
npm run package:mac
```

Dependencies are locked in `package-lock.json`. Electron 44.7.0 and Electron Packager 20.3.0 are development-only dependencies. The first build needs internet access to obtain the Electron archive. If your npm install-script policy skips Electron's runtime download, run `node node_modules/electron/install.js` before packaging.

The packaging command builds Angular, tests local asset handling, packages and signs the app, runs the packaged-app smoke tests, then creates and verifies the DMG. A failed step stops the command. It produces:

- `release/ProCode-darwin-arm64/ProCode.app`
- `release/ProCode-0.2.3-arm64.dmg`
- `release/ProCode-0.2.3-arm64.dmg.sha256`

The artifact version follows `package.json`. Generated staging, release and desktop-test directories are ignored. To regenerate the checked-in icon from `public/favicon.svg`, install the Playwright Chromium browser and run `npm run desktop:icon`. The existing vector logo is reused.

Individual commands are `npm run desktop:bundle`, `npm run test:desktop-assets`, `npm run test:desktop`, and `node scripts/create-dmg.mjs`. `desktop:bundle` uses the existing production build, so rebuild Angular first after web-source changes. The DMG script verifies the app signature before copying it, writes a compressed image with an Applications shortcut, verifies the image, and writes its SHA-256 checksum.

Desktop tests launch the packaged executable with temporary profiles and remove those profiles afterward. `PROCODE_DESKTOP_EXECUTABLE` can point to another copy of the packaged executable, such as an app copied from the mounted DMG. Tests do not use or change the owner's saved workspace.

The Mac and [Windows installer](WINDOWS.md) share `scripts/desktop-stage.mjs`, the desktop entry point and the production web assets. The **Desktop installers** GitHub workflow builds and verifies each package on its native operating system. Mac app identity, profile location, protocol and signing are unchanged.

## Desktop architecture

`desktop/main.cjs` creates a sandboxed Electron window with context isolation and no Node integration, preload bridge, or renderer IPC. The custom `procode://app` protocol serves only files from the bundled web directory. Paths are bounded, methods are read-only, MIME types support WASM and JavaScript, and CORS permits the existing opaque-origin exercise frames. The app does not open a listening network port.

HTTP, HTTPS, WebSocket, FTP and file requests from the app session are blocked. Permission requests are denied, new app windows are denied, and approved HTTPS reference links open externally. Existing exercise iframe sandboxes, CSPs, worker timeouts and per-section storage schemas are retained. This is still a personal practice tool, with inspectable grades and no hard memory quota for learner code.

Chromium background timer throttling is disabled so short grading timers in offscreen cross-origin frames keep their intended timing. Runner timeouts remain active. This also lets a run finish consistently when another application takes focus; close the window or quit ProCode when not practicing to stop its active previews.

Electron and Chromium notices and the Angular build's third-party license output are included in the app archive's `licenses` directory. Source files, development dependencies, tests and reference solutions are excluded from the app staging directory.

Public distribution would be a separate step: use an owner-controlled Apple Developer ID identity, review hardened-runtime entitlements, notarize and staple the result, and verify it on a clean receiving Mac. This workflow provisions no accounts or infrastructure and performs no publishing or automatic updates.

References: [Electron security](https://www.electronjs.org/docs/latest/tutorial/security), [custom protocols](https://www.electronjs.org/docs/latest/api/protocol), and [Electron Packager options](https://electron.github.io/packager/main/interfaces/Options.html).
