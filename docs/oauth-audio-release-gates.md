# OAuth, audio and video parity release gates

This branch is stacked on security PR #8. It adds optional core-managed OAuth to existing nodes, preserves saved API-key workflows, adds the OAuth-only Audio node, and aligns captured model choices and descriptions. Video fixes cover bounded polling and task recovery, optional fields, segment validation, compression and trim export mapping, Effects request mapping, output file metadata and Fit bounds.

## Verified November 18, 2026

- Build, lint and all 176 package regressions pass locally at cb1d59c1. Tests cover authentication, model schemas, audio response identity, dependency compatibility and video behavior; mocks are not live proof.
- Isolated n8n 2.45.6 native OAuth sign-in and authorized image/video operations succeeded. Evidence includes color extraction, image crop, mute, trim, fit, highlights, compression and Effects. This does not prove token refresh or every operation/model.
- Native compression reduced an existing 1,685,282-byte video to 836 kB (rounded native UI size), under a 1 MB target, with decoded 480×854 output.
- Corrected trim MOV output was independently identified by HTTP video/quicktime and ftyp major brand qt. Effects MOV output also has a verified QuickTime header; visual effect fidelity remains unverified.
- Latest Fit boundary validation is local/mock tested; native installation and boundary checks remain pending.

Detailed receipts are maintained in the owner's automation-platform-upgrades/evidence directory, including n8n-followup-2026-11-18.md, n8n-compress-large-validation-2026-11-18.json, n8n-trim-mov-validated-2026-11-18.json and n8n-effects-live-validation-2026-11-18.json. These private workspace receipts are not bundled with the package.

## Blocking or incomplete

- Dependency audit currently fails on high-severity GHSA-fc5q-39xc-vjpf (picomatch <=4.0.7); the current advisory lists no patched release. Do not suppress this finding. The prior zero-audit result is historical, not current.
- Independent review/merge of security PR #8 and this draft, and default-branch rescan.
- Native OAuth refresh, complete service authorization and catalog-wide live image/video/audio output.
- Current catalog reconciliation beyond captured evidence.
- Template onboarding, approval/recovery behavior and all business destinations, followed by public template coverage.
- Package release and installed published-package verification. Source version 5.4.8 does not mean these changes are in the published 5.4.8 artifact.

CI retains the unsuppressed audit gate and runs lint/build/tests after a successful dependency install even if the audit fails. A failed quality job still prevents publishing. Workflows remain inactive. OAuth failures never fall back to API keys. No live parity or publication claim follows from local test counts.
