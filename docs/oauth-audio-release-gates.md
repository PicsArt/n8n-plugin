# OAuth, audio and video parity release gates

## Current release decision — November 23, 2026

Keep this PR in draft. Functional head `407a80d010f41acf240b73bf39d6f35113ec73ee` passed [CI 45140822638](https://github.com/PicsArt/n8n-plugin/actions/runs/45140822638). Publication and published-package scanning were skipped. This table supersedes historical test counts and resolved scanner failures below; it does not certify untested operations.

| Gate | Current evidence | Remaining action |
| --- | --- | --- |
| Candidate build, lint and regressions | Exact functional-head CI passes quality checks; the pipeline includes audit, build, lint, package checks and the official local scanner | Recheck subsequent implementation changes |
| Official local security scan | Pinned scanner 0.44.0 passes without suppressed rules; CI gates publication on it | Verify published provenance and attested source on the actual released version |
| Published package | Last captured registry artifact is 5.4.8; it is not this source candidate | Authorized versioned release, fresh registry/artifact inspection and installed-package tests |
| Native video operations | Selected image/video operations and Combine Videos have native/live evidence; concat output fully decoded; strict Trim/Fit input and completed-result URL guards are included | Remaining operations/models and full recipes; no catalog-wide claim |
| Recovery delivery | Current standalone recovery has inactive native import/export evidence. Ten disposable native n8n executions verify real PostgreSQL reservation/expression/credential handling and upload composition against a local HTTP fixture; concurrent attempts retain one ID and one upload | Persistent deployment database, live Google OAuth/delivery, media playback/privacy and complete Picsart-task recovery remain unverified |
| Destination access | Existing isolated Picsart OAuth works; test-only PostgreSQL credentials were created only in disposable containers and removed | Complete the pending isolated Drive setup and configure a persistent dedicated workflow database; destination-specific accounts only when needed |
| Audio recovery | n8n, Make and Zapier preserve provider detail, saved task ID and no-resubmission guidance; saved audio result still returns HTTP 402 | Resolve provider rejection and verify actual audio output without duplicate submission |
| OAuth and model catalog | Native sign-in and selected service calls succeeded. Documented catalog route returns 401 with the same native OAuth connection that returns 200 from balance. Shared REST reader/selection retention passes eight local contract tests, not deployed | Prove native token refresh; confirm catalog route/auth compatibility before wiring dynamic selectors; verify remaining services |
| Independent security review | PR #8 OPEN, REVIEW_REQUIRED, no submitted reviews; PR #11 OPEN, DRAFT, REVIEW_REQUIRED, rechecked November 23 | Independent review/merge of #8 before stacked PR #11; preserve branch protection |
| Default-branch security | Historical push reported default-branch alerts; candidate checks do not clear them | Merge reviewed fixes and obtain a fresh default-branch rescan; do not treat the historical count as current |
| Separate GitLab project | Last native inspection: MR !2 head `675eb25d`, pipeline 3101577570 passed; three unsuppressed uri-js findings remain Needs Triage (one High, two Medium) despite scoped patches; SAST and secret detection show zero | Independent applicability/remediation review; do not infer scanner clearance from passing CI or GitHub changes |
| Platform/template release | Make and Zapier changes remain developer drafts; fresh Zapier validation shows zero errors/publishing tasks and three recovery-ID dropdown warnings. Thirty-six portfolio entries are not fully validated/published | Complete native runs and destinations, resolve Make installer mapping loss, submit only completed templates, verify public listings |

Evidence is retained in the owner's upgrade workspace, not bundled with this package: `drive-delivery-native-concurrent-2026-11-23.json`, `drive-reservation-native-workflow-2026-11-23.json`, `recovery-durable-wiring-native-2026-11-23.json`, `model-catalog-oauth-contract-2026-11-23.md`, `gitlab-security-current-head-2026-11-23.json`, and `session-restored-release-check-2026-11-23.json`. The recovery transport tests use synthetic media and a credential-free local Drive fixture, not Google's service. No additional Picsart generation or spending was involved.

No new generation is needed to inspect an already accepted task. Preserve accepted IDs and do not resubmit after an ambiguous result.

This branch is stacked on security PR #8. It adds optional core-managed OAuth to existing nodes, preserves saved API-key workflows, adds the OAuth-only Audio node, and aligns captured model choices and descriptions. Video fixes cover bounded polling and task recovery, optional fields, segment validation, compression and trim export mapping, Effects request mapping, output file metadata and Fit bounds.

## November 23 — OAuth endpoint and accepted-audio recheck

The public discovery document still advertises the configured token endpoint, refresh_token and S256. A credential-free token POST now returns401 rather than the previously observed HTML404. The existing isolated n8n GET-only workflow successfully reads its saved video task through the preserved OAuth connection. This restores native result access evidence; forced token expiry/refresh remains unproven. Current Backstage refresh documentation confirms form encoding, required grant_type/refresh_token, public-client client_id and confidential-client HTTP Basic. No client, credential or endpoint configuration changed.

The previously accepted narration task was read once through that same connection and still returns402 (Not enough available credits). No replacement job was submitted. Backend rejection remains unresolved; this response alone does not establish the account balance. Evidence is in the owner workspace: oauth-refresh-recheck-2026-11-23.md and n8n-audio-existing-task-recheck-2026-11-23.json.

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


## PNG conversion quality parity — November 23

PNG-to-JPG and PNG-to-WebP now expose and submit integer quality 10–100, default 90, for URL and binary inputs. Missing quality in saved workflows uses the documented backend default. Invalid values fail before upload/processing/download. Existing authentication selection and output mapping remain intact. Build, lint and all 360 regressions pass, including 12 new tests covering both formats, both input modes, both authentication methods, defaults/bounds, malformed values and output mapping. These are local/mock results; installed native fields and paid/live outputs are not yet verified.

Backend documentation was consulted through Backstage: image-processing and editor-tools-adapter API entities did not establish the legacy tools/1.0/edit quality contract. The authoritative fallback is https://docs.picsart.io/reference/image-edit (quality integer 10–100, default90), checked November23. Historical captured Make and Zapier requests already send quality; fresh cross-platform UI/boundary parity remains to verify.
