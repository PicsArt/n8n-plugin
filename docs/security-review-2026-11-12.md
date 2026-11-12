# Security review, 2026-11-12

The GitHub default-branch baseline had 115 open Dependabot alerts (4 critical, 52 high, 53 medium, 6 low), all referencing pnpm-lock.yaml. GitHub classified 80 as runtime and 35 as development. These counts are not interchangeable with registry audit advisory counts.

This change removes 17,207 tracked pnpm store files and the obsolete 5.1.2 package archive from the branch, without rewriting history. Ignore rules prevent recurrence. Gulp/rimraf build work is replaced with Node filesystem operations; unused n8n-node-dev and release-it dependencies are removed. CI uses an immutable official checkout action with credential persistence disabled and pins pnpm 9.15.9. The build-only n8n-workflow dependency is pinned to 2.16.0 while the existing host peer contract remains unchanged. Compatible transitive versions are refreshed, with same-major form-data/lodash patched overrides.

Video polling now waits between attempts, remains bounded at 300 attempts, preserves the task ID on exhaustion, and never resubmits from polling. Its five regression checks exercise the default branch's existing API-key credential contract; OAuth changes are a separate pending rollout.

## Validation

- TypeScript build, ordinary lint and prepublish lint pass.
- Five polling regression checks pass.
- npm pack dry-run contains 263 files; no cache, archive, or node_modules tree is included.
- Registry audit after changes: 0 critical, 1 high, 3 moderate findings. Audit remains nonzero; no advisory is suppressed.

## Unresolved advisories

- Zod 3.25.67 via n8n-workflow 2.16.0: high, GHSA-mrhx-c7xc-m3w5. Patched line starts at 4.6.6; forcing a new major into the host workflow library is not treated as safe.
- uuid 10 via n8n-workflow: moderate, GHSA-w5hq-g745-h8pq. Patched line starts at 11.1.1; upstream/compatibility work remains.
- minimatch 9 via TypeScript ESLint tooling: moderate, GHSA-g3hv-75wg-m249, reported through two dependency paths. Patched line starts at 11.0.1; tooling migration remains.

The package's runtime n8n-workflow is provided by the host. Build-dependency overrides do not patch an installed n8n host. This PR does not establish a clean release or close default-branch alerts until reviewed, merged, and rescanned.

Repository settings were independently checked: secret scanning and push protection initially reported disabled and main unprotected. Both secret protections were enabled and read back. Main now requires one approving review, stale-review dismissal, conversation resolution, and admin enforcement; force pushes and branch deletion are disabled. Required CI status is added after the new check is observed. Enabling scanning is not proof that a historical scan has completed or that secrets never existed.
