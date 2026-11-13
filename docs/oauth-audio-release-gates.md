# OAuth and audio parity release gates

This branch is stacked on security PR #8. It adds optional core-managed OAuth to existing nodes, preserves saved API-key workflows, adds the OAuth-only Audio node, and aligns captured compatible model choices and descriptions. It includes the returned-task mismatch guard and retains the bounded polling fixes.

Validated together: build, lint, 63 local mocked/schema regressions. Audio fixtures are synthetic, derived from observed response shapes, and have no account-specific identifiers or live asset URLs. The dependency graph retains the security PR patches.

Not yet release verified:
- Native OAuth registration, sign-in, refresh, and service authorization against the candidate on a supported n8n host.
- Live image, video, audio results and playback for the complete catalog.
- Current provider catalog reconciliation beyond the captured catalog date.
- Native node onboarding and all destination-specific template outputs.
- Marketplace/package publication and template coverage.

Do not infer live parity from the test count. Existing workflows keep their original credential selection; OAuth authorization failures never fall back to API keys. Audio result responses with an explicitly mismatched task ID are rejected; historical envelopes without an echoed ID remain supported.
