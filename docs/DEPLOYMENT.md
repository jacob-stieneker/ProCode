# Running and future deployment

## Current supported delivery

For a self-contained Apple Silicon macOS app, use `npm run package:mac`. The local-use DMG includes the production app, Chromium and all practice runtimes, with no localhost server or end-user development tools required. See [desktop packaging](DESKTOP.md) for installation, storage separation, testing and ad-hoc signing limits.

For Windows x64, use `npm run package:windows` on Windows. It builds an offline NSIS setup executable with the same app and runtimes. The private repository's **Desktop installers** workflow verifies native packages and uploads checked installers. See [Windows delivery](WINDOWS.md) for install/reinstall/uninstall coverage, signing status and saved-work preservation.

Run locally with `npm ci` then `npm start`. For the production bundle, use `npm run build` then `npm run preview`. The app and all runtime assets are served by the local machine; no cloud resources or credentials are required. The preview server binds to loopback and is not a production application server.

Use a consistent hostname and port to preserve access to the same localStorage data. For example, `localhost:4200`, `127.0.0.1:4200`, and `127.0.0.1:4201` are separate workspaces. Export before switching origins or clearing browser storage.

## If hosting is requested later

This is the user's own app. Firebase Hosting was recommended during architecture planning, but no deployment destination has been provisioned or approved. Confirm the account/project and any billing before configuring production services.

- Build with `npm run build`; static output is `dist/procode/browser`.
- Keep the generated `/runtime/angular/` bundle, compiler worker, and TypeScript compiler together. `npm ci`, `npm start`, and `npm run build` prepare these from pinned dependencies. Do not deploy an older runtime alongside newer exercise content.
- Keep Pyodide assets under `/runtime/pyodide/`, serve WASM as `application/wasm`, and JavaScript modules with JavaScript MIME types.
- Provide `Access-Control-Allow-Origin: *` on public runtime assets for the opaque-origin frame. Restrict sensitive future APIs separately.
- Review CSP, sandbox behavior, and security headers in the target environment. Do not remove iframe sandboxing to solve a CORS problem.
- Validate Python execution and cancellation in every supported browser after deployment.
- Public hosting of this bundle still provides local, inspectable scores. Trusted submissions require a backend grader.
- Add authentication, per-user storage policies, rate limits, execution quotas, and cost controls before multi-user hosted execution.

There are no environment variables or secrets in this phase beyond optional local preview `PORT` and browser-test `PROCODE_TEST_PORT` (default 4317); a credentials example file would be misleading and is not needed.

Firebase practice is a local command simulator. Commands entered there never configure or publish this application or any Firebase project. It requires no additional environment variables, credentials, emulator processes, or hosting changes.

Full-stack projects also run locally. Build/start bundle the trusted preview runtime with the installed Angular packages under `/runtime/fullstack/`; keep it in sync with the compiler under `/runtime/angular/`. Learner API handlers run in isolated browser workers, not a network server. No new environment variables, accounts, database services, or production infrastructure are required.

Git workflow practice also requires no infrastructure. Commands run in a local bounded state model, not the host shell. Pull-request forms are simulated; no Git executable, credentials, OAuth apps, provider accounts or environment variables are required.
