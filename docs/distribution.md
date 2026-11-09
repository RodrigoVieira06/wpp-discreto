# Distribution and release preparation

`make package` builds `dist/extension` and `dist/wpp-discreto-<version>.zip`. Load the compiled directory in Chrome; submit the ZIP to the store.

`make deploy` and `make release` run Biome, TypeScript, Jest, and packaging. These targets prepare files for manual submission. They do not upload, publish, deploy a server, or create a GitHub release. For an optional isolated test session, use [`make deploy-local`](local-deployment.md).

## Before store submission

1. Review manual validation. The user confirmed it on 2026-11-08; repeat relevant checks after integration changes. Automated tests use synthetic markup.
2. Match versions in `manifest.json` and `package.json`.
3. Prepare descriptions, screenshots, support details, and data/permission declarations.
4. Add publisher identity and support contact to [DATA_POLICY.md](../DATA_POLICY.md) and host it at a public URL.
5. Generate a validated ZIP and submit it through the publisher dashboard after explicit publication authorization.

Store approval follows Google's review process. See the [official publishing guide](https://developer.chrome.com/docs/webstore/publish).

## Listing assets

See [store assets](../store/README.md) for the Portuguese listing, upload dimensions, provenance, and reproduction command. `make store-assets` creates `dist/wpp-discreto-store-assets.zip`, which is an asset bundle, not an installable extension package. Upload each image to its matching listing field.

## Automated publishing prerequisites

Chrome Web Store API v2 can upload an existing item's package and submit it for review. Before adding a publishing Make target, configure:

- A publisher account with two-step verification, completed listing, and data declarations.
- The Chrome Web Store API in a Google Cloud project.
- OAuth client credentials and a refresh token with the `chromewebstore` scope, or a service account.
- Publisher ID and extension ID.

Keep credentials outside Git and fixtures. Separate upload/submission from local development and require explicit action. Review can delay or reject public availability; the current Makefile makes no store request. See [API setup](https://developer.chrome.com/docs/webstore/using-api).
