# Distribution and release preparation

`make package` builds `dist/extension` and `dist/wpp-mask-<version>.zip`. Chrome requires the compiled directory; source TypeScript and SCSS are not directly loadable extension resources.

`make deploy` runs the same preparation as `make release`: Biome, TypeScript, Jest, then packaging. It does not upload, publish, deploy a server, or create a GitHub release.

## Store readiness

1. Complete [manual validation](testing.md) in WhatsApp Web.
2. Align `manifest.json` and `package.json` versions when releasing a new version.
3. Prepare descriptions, screenshots, support details, and data/permission declarations.
4. Add publisher identity and support contact to [DATA_POLICY.md](../DATA_POLICY.md), then host it at an accessible URL.
5. Generate a validated ZIP and submit it through the publisher dashboard when publication is explicitly requested.

Public GitHub source does not imply Chrome Web Store approval. Follow the [official publishing guide](https://developer.chrome.com/docs/webstore/publish).
