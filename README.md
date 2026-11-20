# @picsart/n8n-nodes-picsart-creative-apis

## Model catalog snapshot

Image/sticker generation and speech/sound model options include the operation-specific
shared catalog captured on 28 October 2026. Existing IDs and defaults are preserved,
including legacy image choices absent from that snapshot; absence does not establish
retirement. Regenerate with `python3 scripts/sync-model-catalog.py /path/to/catalog.json`.
The generated provider is bundled into the package and does not fetch models at runtime.
Tests exercise each captured ID through the relevant request builder with mocked services.
Catalog membership is advertised compatibility, not proof of account access or live output.

Video and image-edit model lists are unchanged pending explicit alias verification:
their existing mode-qualified IDs differ from every captured request enum ID. No suffix
stripping, provider-name conversion or unified-gateway ID substitution is performed.

## Authentication

API Key remains the default for all nodes. Existing workflows without an Authentication
parameter keep using their saved Picsart API credential. No credential migration is required.

OAuth2 (Beta) is an optional implementation for testing on compatible n8n instances.
Select it on the node, create a Picsart OAuth2 API credential and use Connect my account.
n8n core performs dynamic client registration, PKCE and token refresh; no client secret
or manual client ID is requested. Dynamic registration requires n8n 1.119 or newer;
current n8n 2.x is recommended for discovery compatibility.

Scope behavior is discovery-controlled: inspected n8n 2.36.9 core overwrites the
credential scope with protected-resource metadata scopes, or otherwise the issuer's
entire advertised scope list. The empty fallback does not mean no scopes and does not
restrict consent. Current issuer scopes are drive, profile, credits.balance, openid,
storage and workflows.execute. Review consent before connecting. A narrower default
in this credential cannot override that core behavior; least-privilege resource
metadata/service scope agreement is a release requirement.

Live OAuth interoperability has not yet been verified across the image, generation and
video services. The authorization server must accept stock n8n registration metadata,
and tokens must authorize each selected service. The historical `client_uri` registration
rejection and service-specific scopes remain release checks. No Docker hook is installed
by this package, and OAuth is not the default. API Key remains available if OAuth setup fails.

Run `pnpm run build`, `pnpm test` and `pnpm run lint` before release. The tests exercise
credential routing and submit/poll/download boundaries using mocked services; they do
not replace live login, refresh, revocation and service-entitlement validation.

[![npm version](https://img.shields.io/npm/v/@picsart/n8n-nodes-picsart-creative-apis.svg)](https://www.npmjs.com/package/@picsart/n8n-nodes-picsart-creative-apis)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

n8n community nodes for image processing and generation using Picsart APIs.
## 💻 Development

### Setup
```bash
git clone <repository-url>
cd n8n-nodes-picsart-creative-apis
pnpm install
pnpm run build
```

### Available Scripts
```bash
pnpm run dev        # Watch mode
pnpm run build      # Build
pnpm run lint       # Lint code
pnpm run lintfix    # Fix linting issues
```

### Docker Development
```bash
./rebuild.sh
# Open http://localhost:5678
```

## 🚀 Release

Use the automated release script:

```bash
./release.sh patch    # Bug fixes (0.1.0 → 0.1.1)
./release.sh minor    # New features (0.1.0 → 0.2.0)
./release.sh major    # Breaking changes (0.1.0 → 1.0.0)
```

Then push:
```bash
git push && git push --tags
```

CI/CD will automatically publish to npm.

## 📖 Resources

- [Picsart API Documentation](https://docs.picsart.io/)
- [n8n Documentation](https://docs.n8n.io/)
- [Creating n8n Nodes](https://docs.n8n.io/integrations/creating-nodes/)
  
## Installation

**For n8n Cloud:**
1. Settings > Community Nodes > Install
2. Enter: `@picsart/n8n-nodes-picsart-creative-apis`

**For Self-hosted:**

npm install @picsart/n8n-nodes-picsart-creative-apis

Then restart n8n.

**Setup Credentials:**
1. Get API key from [Picsart Console](https://console.picsart.io/dashboard)
2. In n8n: Settings → Credentials → Add "Picsart API"
3. Paste your API key


## 📚 Nodes

### Picsart Text2Image
Generate images from text prompts using Picsart GenAI API.

**Key Parameters:**
- Prompt (required): Text description of the image to generate
- Width: Image width in pixels (default: 1024, max: 1024)
- Height: Image height in pixels (default: 1024, max: 1024)

**Output:** Binary image + JSON with prompt, dimensions, transaction ID, and image URL

**Documentation:** [Picsart Text2Image API](https://docs.picsart.io/reference/genai-text2image-1)

### Picsart Enhance
Upscale and enhance images with AI.

**Key Parameters:**
- Image URL (required, supports JPG/PNG/WEBP)
- Upscale Factor: 2x, 4x, 6x, 8x, 16x
- Format: JPG | PNG | WEBP

**Output:** Binary image + JSON with URL and credits

### Picsart Remove Background

**Key Parameters:**
- Image URL (required)
- Output Type: cutout | mask
- Background: color, image URL, or transparent
- Effects: blur, stroke, shadow
- Format: JPG | PNG | WEBP

**Output:** Binary image + JSON with URL and credit

