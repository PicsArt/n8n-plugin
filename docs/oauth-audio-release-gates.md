# OAuth, audio and video parity release gates

This branch is stacked on security PR #8. It adds optional core-managed OAuth to existing nodes, preserves saved API-key workflows, adds the OAuth-only Audio node, and aligns captured model choices and descriptions. Video fixes cover bounded polling and task recovery, optional fields, segment validation, compression and trim export mapping, Effects request mapping, output file metadata and Fit bounds.

## Verified November 18, 2026

- Build, lint and all 199 package regressions pass locally at 772c46dc. Tests cover authentication, model schemas, audio response identity, dependency compatibility and video behavior; mocks are not live proof.
- Isolated n8n 2.45.6 native OAuth sign-in and authorized image/video operations succeeded. Evidence includes color extraction, image crop, mute, trim, fit, highlights, compression and Effects. This does not prove token refresh or every operation/model.
- Native compression reduced an existing 1,685,282-byte video to 836 kB (rounded native UI size), under a 1 MB target, with decoded 480×854 output.
- Corrected trim MOV output was independently identified by HTTP video/quicktime and ftyp major brand qt. Effects MOV output also has a verified QuickTime header; visual effect fidelity remains unverified.
- Latest Fit validation is installed in isolated n8n. Native negative tests rejected width=15, height=15 and blur=101 before HTTP; valid minimum-boundary processing remains untested.
- Watermark URL and binary inputs succeeded natively; URL output visibly placed the logo upper-right. Multipart header injection guards pass local regressions.
- Effects now offers 48 captured choices and GIF output; seven human labels map to live API codes. Black And White/GIF succeeded natively with OAuth; independent GIF89a header and 480×854 dimensions plus grayscale rendering were verified. This does not verify all effects.
- CI run 44272761013 at 772c46dc passed lint, build and regressions. Audit failed on the advisory below; publishing was skipped.

Detailed receipts are maintained in the owner's automation-platform-upgrades/evidence directory, including n8n-followup-2026-11-18.md, n8n-compress-large-validation-2026-11-18.json, n8n-trim-mov-validated-2026-11-18.json and n8n-effects-live-validation-2026-11-18.json, n8n-effects-gif-validation-2026-11-18.json and n8n-fit-bounds-native-2026-11-18.json. These private workspace receipts are not bundled with the package.

## Blocking or incomplete

- Creative candidate dependency gate cleared November 19: GHSA-fc5q-39xc-vjpf was withdrawn November 18 at 15:38:56Z. Pinned pnpm 9.15.9 audit has zero findings without suppressions; CI run 44305654804 attempt 2 passes audit, lint, build and regressions at 4d6fe3f4. This does not clear default-branch alerts or separate GitLab findings.
- Independent review/merge of security PR #8 and this draft, and default-branch rescan.
- Native OAuth refresh, complete service authorization and catalog-wide live image/video/audio output.
- Current catalog reconciliation beyond captured evidence.
- Template onboarding, approval/recovery behavior and all business destinations, followed by public template coverage.
- Package release and installed published-package verification. Source version 5.4.8 does not mean these changes are in the published 5.4.8 artifact.

CI retains the unsuppressed audit gate and runs lint/build/tests after a successful dependency install even if the audit fails. A failed quality job still prevents publishing. Workflows remain inactive. OAuth failures never fall back to API keys. No live parity or publication claim follows from local test counts.

## November 19 verification

Local build/lint and all 233 package regressions pass. CI rerun 44305654804 attempt 2 passed at unchanged head 4d6fe3f4; publication and published-package scan were skipped. npm remains 5.4.8. PR #8 is still open and review-required; PR #11 remains draft and review-required. Native refresh remains unproven: the credential delegates to n8n core, and unit tests verify delegation and failure propagation, not a real refresh exchange.
