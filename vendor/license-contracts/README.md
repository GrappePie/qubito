# @pixelgrimoire/license-contracts

Shared contract package for Pixel Grimoire licensing and entitlement payloads.

This package is intentionally dependency-free for the first migration phase so
`landing-page`, `qubito`, and `nexora` can consume the same constants and
runtime guards without forcing a monorepo.

## Initial consumers

- `landing-page`: token issuance and platform validation.
- `qubito`: entitlement token verification and app access checks.
- `nexora`: license UI/status typing and future JWKS token verification.

## Publish path

The local repositories currently vendor this package and use `file:./vendor/license-contracts`. When the package is
published to a private registry, keep the public exports stable and replace the
`file:` dependency with a semver range.
