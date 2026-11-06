# Distribution and release preparation

`make package` builds `dist/extension` and `dist/wpp-mask-<version>.zip`. Chrome requires the compiled directory; source TypeScript and SCSS are not directly loadable extension resources.

`make deploy` runs the same preparation as `make release`: Biome, TypeScript, Jest, then packaging. It does not upload, publish, deploy a server, or create a GitHub release.

For interactive testing before a release, use [`make deploy-local`](local-deployment.md).

## Store readiness

1. Complete [manual validation](testing.md) in WhatsApp Web.
2. Align `manifest.json` and `package.json` versions when releasing a new version.
3. Prepare descriptions, screenshots, support details, and data/permission declarations.
4. Add publisher identity and support contact to [DATA_POLICY.md](../DATA_POLICY.md), then host it at an accessible URL.
5. Generate a validated ZIP and submit it through the publisher dashboard when publication is explicitly requested.

Public GitHub source does not imply Chrome Web Store approval. Follow the [official publishing guide](https://developer.chrome.com/docs/webstore/publish).

## Future automated publishing

Chrome Web Store API v2 supports uploading an existing item's package and submitting it for review. An automated publishing Make target can be added after these prerequisites are configured:

- A publisher account, completed listing and data declarations, and two-step verification.
- An enabled Chrome Web Store API in a Google Cloud project.
- OAuth client credentials and a refresh token with the `chromewebstore` scope, or a configured service account.
- Publisher ID and extension ID.

Keep credentials outside Git and browser fixtures. Upload and submission must remain explicit operations, separate from local development. Submission goes through Google's review process and does not guarantee immediate public availability. No store request is performed by the current Makefile.

See the [official API setup guide](https://developer.chrome.com/docs/webstore/using-api).
