# @picsart/n8n-nodes-picsart-creative-apis

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

**Output:** Binary image + JSON with URL and credits

