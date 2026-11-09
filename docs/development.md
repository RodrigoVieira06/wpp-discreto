# Development and terminal workflow

Use Node.js 22.18 or later, pnpm 11.23.0, Git, GNU Make, and Chrome. Node runs tooling TypeScript; esbuild and Sass produce the JavaScript and CSS that Chrome loads. Development was verified with Node.js 26.2.0 on Linux.

```sh
make install
make doctor
make help
make dev
```

`make install` uses the frozen pnpm lockfile and installs Lefthook. `pnpm-workspace.yaml` allows installation scripts for esbuild, SWC, Sass's watcher, and Lefthook. Review additional dependency build scripts before allowing them.

`make dev` performs an initial build and watches sources. Load `dist/extension` in Chrome. After rebuilding, reload the extension and refresh WhatsApp Web. It does not launch or automatically reload the browser.

For an isolated browser session, use `make deploy-local`. Close it before rerunning after source changes. The test login persists in `.local/chrome-profile`, outside build output. See [local deployment](local-deployment.md).

## Commands

| Make target | Operation |
| --- | --- |
| `install` | `pnpm install --frozen-lockfile` |
| `hooks` | `pnpm hooks:install` |
| `doctor` | Print Node, pnpm, Git, and Chrome versions |
| `dev`, `run` | `pnpm dev` |
| `icons` | `pnpm icons` regenerates committed icons from the approved artwork |
| `deploy-local` | Build, then `pnpm deploy:local` to launch Chrome and load the extension |
| `build` | `pnpm build` |
| `lint`, `lint-fix` | Biome checks or safe fixes |
| `format` | `pnpm format` |
| `typecheck` | `pnpm typecheck` |
| `check` | Biome and TypeScript |
| `test` | Build and run Jest |
| `test-watch` | Build once and watch tests with Jest |
| `package` | Build and ZIP |
| `release`, `deploy` | Checks, tests, packaging, and manual submission instructions |
| `clean` | Remove `dist` and `coverage` |
| `status` | Git working-tree status |

Biome checks supported TypeScript, JS configuration, and JSON files. Sass checks SCSS during compilation. Run TypeScript checking separately; esbuild and SWC transpile without validating types.

When editing browser scenarios with `make test-watch`, keep `make dev` running in another terminal to rebuild their compiled scripts. `make test` always builds first. Override Chrome with `make test CHROME_BIN=/path/to/chrome`.

## Git and commits

Use `main` as the initial branch. Install hooks after cloning, or restore them with `make hooks`. Lefthook's `pre-commit` runs checks and tests; `commit-msg` uses commitlint's conventional configuration.

```text
feat: add a message visibility level
fix: clear aliases from recycled chat rows
test: cover storage write failures
docs: describe local installation
chore: update development tooling
```

Do not bypass hooks to conceal failures. Pushing to GitHub does not publish to the Chrome Web Store.
