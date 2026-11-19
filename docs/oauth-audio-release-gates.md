# OAuth, audio and video parity release gates

## Current release decision — November 19, 2026

Keep this PR in draft. The latest implementation head is `cc1fbc9b9ef328c7a638105709b665a3c29a40c2`; quality CI [44505090031](https://github.com/PicsArt/n8n-plugin/actions/runs/44505090031) passed. Publication and published-package scanning were skipped. Historical test counts and scanner failures below describe earlier revisions, not the current candidate.

| Gate | Current evidence | Remaining action |
| --- | --- | --- |
| Candidate build, lint and regression suite | 325 tests pass at functional head 735a569d; description alignment is included in the latest implementation head; exact-head CI succeeds | Recheck after implementation changes |
| Package contents | Dry-run pack verifies 285 files and nine required entry points; CI checks before publication | Inspect the actual released artifact and provenance after authorized release |
| Video submission safety | All eleven executors reject failed/unknown submissions and discard pending URLs; preserve accepted task IDs for recovery | Native saved-transaction recovery and model/edit recovery downloads pass; remaining executor/service paths still need native/live coverage |
| Host compatibility | 181 executor regressions pass with native n8n dependencies in a network-disabled container; 173 portfolio checks select the current candidate | Generation v2 import/editor verified at 1f8b5c0c; three native numeric rejection cases pass with current executor hash. Complete successful service executions and recipes remain |
| Security review | PR #8 has passing checks but no submitted approving review; PR #11 remains review-required | Independent maintainer review of #8 first, then this stacked PR; do not bypass protection |
| Separate GitLab project | Pipeline 3078719120 passes at 42bf742e, but four dependency findings remain Needs Triage | Resolve or independently adjudicate findings; do not infer clearance from this GitHub CI |
| OAuth and service access | Existing completed video task retrieval succeeds through saved OAuth; current balance is readable | Prove a native refresh exchange; investigate accepted audio task returning 402 despite readable balance |
| Template delivery | One Zapier video was manually retrieved, filtered and saved to Drive | Durable recovery/approval storage, complete native runs, destinations and publication for all recipes |

No new generation is needed to inspect an already accepted task. Preserve accepted IDs and do not resubmit after an ambiguous result.

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

## Official scanner follow-up — November 19

Pinned @n8n/scan-community-package 0.44.0 ran in isolated Linux Node 24. The initial compiled-code check rejected direct setTimeout in both polling helpers. Replaced these with n8n-workflow sleep; build, lint and all 234 regressions pass, including timing bounds. The scanner then advanced to source checks and reported 114 errors and 9 warnings (123 total), including raw error rethrows and naming rules. This remains a release blocker; no scanner rules are suppressed. Local scans omit provenance and attested-source checks, which still require an exact-version published-package scan. CI now explicitly selects Node 24 for the scanner, whose dependency requires Node >=22.

Second scanner pass: credential icons and secret-field masking plus 11 video polling error wrappers reduce source findings to 98 errors and 9 warnings. Build, lint and all 238 regressions pass. Four new tests confirm wrapped HTTP 401/403/429/503 errors retain classification and accepted transaction recovery instructions. These are local tests; this does not establish live refresh or published-package behavior. Remaining scanner findings are unsuppressed.

Painting polling follow-up: added the shared two-second delay after the initial read, URL encoding for opaque inference IDs, native error wrapping with accepted-task recovery guidance, and explicit no-resubmission timeout instructions. Build/lint and 242 regressions pass. Scanner pass during this change reports 97 errors and 9 warnings; a subsequent terminal-error message correction was regression-tested. This is local/mock evidence only.

Scanner environment correction: official plugin 0.41.0 findPackageJson stops before checking a checkout directly under filesystem root. Moving the scanner mount from /candidate to /workspace/candidate resolves the false missing-OAuth-credential finding without changing credential names or disabling the rule. Added Audio operation subtitle and usableAsTool metadata consistent with other generation nodes. Nested scan reports 94 errors and 9 warnings; build/lint and 242 tests pass. CI 44474200812 passed dc2fc05d; CI 44473962197 passed 398a0e51. Publication remains gated.

Native error propagation follow-up: eight raw-rethrow findings fixed. Existing NodeOperationError instances retain identity through the native constructor; audio/video polling exposes HTTP classification through NodeApiError while preserving accepted-task recovery messages. Four dispatcher regressions cover validation errors and continue-on-fail input pairing. Build/lint and all 246 regressions pass. Official nested-path scanner reports 86 errors and 9 warnings; no rules disabled. Remaining errors include copy/style, generation resources and two generation rethrows. These results are local/mock, not live service verification.

Image/sticker recovery follow-up: both legacy generation paths now delay subsequent reads, URL-encode task IDs and wrap polling HTTP failures. The generation error handler normalizes native HTTP codes and retains accepted transaction IDs on polling/download failures. Multi-sticker failures retain every accepted task, including completed earlier stickers, without automatic resubmission. Eleven added mock regressions cover pending/404 delays, output mapping, HTTP 401/429/503, 600-read bounds and partial multi-sticker failure. Build/lint and 257 tests pass; official scanner now reports 84 errors and 9 warnings, with no raw-rethrow findings remaining. Live and published-package validation remain separate release gates.

Generation organization follow-up: node version 2 groups operations into Image, Audio and Video resources, using unchanged operation values/descriptions and input properties. Version 1 retains its existing operation selector. Ten tests using n8n NodeHelpers confirm legacy operation/input preservation and v2 resource filtering. Build/lint and 267 tests pass; official scanner reports 83 errors and 9 warnings, all remaining errors marked potentially autofixable copy/style findings. Native editor/import validation of v2 remains required before release; local parameter-resolution tests do not establish that.

Selector-label review: applied n8n mandatory title-case conventions to 35 displayed labels. Automated source comparison confirms only label capitalization changed; description text, operation/model values, actions and behavior are unchanged. This is a native selector style exception to the general sentence-case copy guideline. No claims, offers, assets or legal terms changed. Build/lint and 267 regressions pass. Official scanner now reports 48 punctuation errors and 9 warnings. Shared description punctuation requires coordinated parity updates; it has not been silently changed in n8n alone.

Official local scanner gate cleared: coordinated trailing-period normalization removes the remaining 48 errors. Removed the previous inline punctuation exceptions from Audio and Image nodes. Official scanner 0.44.0 exits 0 and reports all pre-publication checks passed. This does not verify provenance/attested source, native deployment, live service behavior or published-package contents. Build/lint and 267 regressions pass. Shared copy updates outside this repository cover 7 module descriptions and 30 model descriptions, with all 35 canonical model rows retaining identical platform descriptions. Make/Zapier patches are prepared; fresh native readbacks are pending. Historical readback files remain unchanged. See workspace copy-review/punctuation-parity-patch-2026-11-19.json and verify-punctuation-parity.py.

## Native saved-video recovery operation — November 19

Added Get Video Processing Result to the existing Video node. It performs one authenticated GET, preserves the saved transaction ID, returns explicit not_found for404, withholds pending URLs, and rejects mismatched IDs/unsafe or missing completed URLs. No processing submission or implicit polling occurs. Build/lint and325 regressions pass. Installed in isolated n8n2.45.6: the native operation recovered an existing completed trim transaction through the preserved OAuth credential and returned its expected MOV URL in588ms. This proves one native/live recovery path, not all service models, full destination delivery, publication or a forced refresh.

## Generation v2 native negative execution — November 19

Imported inactive PicsartV2BoundsNative19 into isolated n8n 2.45.6 and executed three parallel native generation-v2 nodes with invalid width63, height1025 and duration0. Each returned the expected NodeOperationError and pairedItem0 via continue-on-fail. Installed executor SHA256 b25d1bc805a516063d8719fd61e978eb26b59cc07901dd0a91ff378951aaac89 matches the current build. Source places these guards before HTTP; no generation is expected and no task ID returned. There is no independent network/billing trace. This closes these three native negative checks, not successful legacy generation, forced refresh, all field rendering, or publication. Native model/edit recovery templates also download existing MP4/MOV outputs; Drive delivery remains unverified. Private receipts: n8n-generation-v2-native-bounds-2026-11-19.json and n8n-native-recovery-template-2026-11-19.json.
