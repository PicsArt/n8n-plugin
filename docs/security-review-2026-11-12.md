# Security review, 2026-11-12

The GitHub default-branch baseline had 115 open Dependabot alerts (4 critical, 52 high, 53 medium, 6 low), all referencing pnpm-lock.yaml. GitHub classified 80 as runtime and 35 as development. These counts are not interchangeable with registry audit advisory counts.

This change removes 17,207 tracked pnpm store files and the obsolete 5.1.2 package archive from the branch, without rewriting history. Ignore rules prevent recurrence. Gulp/rimraf build work is replaced with Node filesystem operations; unused n8n-node-dev and release-it dependencies are removed. CI uses an immutable official checkout action with credential persistence disabled and pins pnpm 9.15.9. The build-only n8n-workflow dependency is pinned to 2.16.0 while the existing host peer contract remains unchanged. Compatible transitive versions are refreshed, with same-major form-data/lodash patched overrides.

Video polling now waits between attempts, remains bounded at 300 attempts, preserves the task ID on exhaustion, and never resubmits from polling. Its five regression checks exercise the default branch's existing API-key credential contract; OAuth changes are a separate pending rollout.

## Final remediation and validation

The earlier 1 high and 3 moderate registry findings are resolved in this branch. Parser tooling is updated to 8.72.2 and the n8n ESLint plugin to 2.0.0. The development graph uses patched Zod 4.6.6, uuid 11.1.1, and minimatch 11.0.1. A checked-in pnpm patch migrates three n8n-workflow record schemas to explicit string keys in both CommonJS and ESM output. This is a build/test dependency compatibility patch, not an alteration of an installed n8n server.

- Frozen forced reinstall successfully applies the patch.
- TypeScript build, ordinary lint and prepublish lint pass.
- Ten regression checks cover polling, valid/invalid record schemas, workflow inputs, UUID output-buffer bounds, and tooling glob semantics.
- Registry audit: zero vulnerabilities at all severities. CI now runs the audit with no suppressions.
- Package output remains limited to the existing published artifact contract; no cache or dependency tree is bundled.

The runtime n8n-workflow remains supplied by the host. These development overrides do not patch users' installed n8n servers. The PR must be reviewed, merged, and rescanned before default-branch Dependabot status can be considered resolved. No release tag or npm publication was performed.

## Repository protections

Secret scanning and push protection were enabled and read back. Main requires one approving review, stale-review dismissal, conversation resolution, admin enforcement, and an up-to-date passing Quality Checks (Lint & Build) status. Force pushes and branch deletion are disabled. Enabling scanning does not establish that the history scan has completed or that secrets never existed.
