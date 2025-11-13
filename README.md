# @picsart/n8n-nodes-picsart-apis

[![npm version](https://img.shields.io/npm/v/@picsart/n8n-nodes-picsart-apis.svg)](https://www.npmjs.com/package/@picsart/n8n-nodes-picsart-apis)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

n8n community nodes for AI-powered image processing using Picsart API.

**Features:**
- 🎨 **Enhance**: Upscale images up to 16x with AI
- 🖼️ **Remove Background**: AI background removal with advanced styling

## 📦 Installation

**For n8n Cloud:**
1. Settings > Community Nodes > Install
2. Enter: `@picsart/n8n-nodes-picsart-apis`

**For Self-hosted:**
```bash
npm install @picsart/n8n-nodes-picsart-apis
```
Then restart n8n.

**Setup Credentials:**
1. Get API key from [Picsart Console](https://console.picsart.io/dashboard)
2. In n8n: Settings → Credentials → Add "Picsart API"
3. Paste your API key

## 🚀 Quick Start

1. Add a new node and search "Picsart"
2. Select **Picsart Enhance** or **Picsart Remove Background**
3. Connect your Picsart API credentials
4. Configure parameters and execute

## 📚 Nodes

### Picsart Enhance
Upscale and enhance images with AI.

**Key Parameters:**
- Image URL (required, supports JPG/PNG/WEBP)
- Upscale Factor: 2x, 4x, 6x, 8x, 16x
- Format: JPG | PNG | WEBP

**Output:** Binary image + JSON with URL and credits

### Picsart Remove Background
Remove backgrounds with advanced effects.

**Key Parameters:**
- Image URL (required)
- Output Type: cutout | mask
- Background: color, image URL, or transparent
- Effects: blur, stroke, shadow
- Format: JPG | PNG | WEBP

**Output:** Binary image + JSON with URL and credits

## 💻 Development

### Setup
```bash
git clone <repository-url>
cd n8n-nodes-picsart-apis
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

## 🤝 Contributing

1. Fork and create a feature branch
2. Make changes with conventional commits (`feat:`, `fix:`, `docs:`)
3. Push and open a Merge Request

## 📖 Resources

- [Picsart API Documentation](https://docs.picsart.io/)
- [n8n Documentation](https://docs.n8n.io/)
- [Creating n8n Nodes](https://docs.n8n.io/integrations/creating-nodes/)

## 📝 License

MIT © [Picsart](https://picsart.io)
