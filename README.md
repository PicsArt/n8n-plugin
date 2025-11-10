# @picsart/n8n-nodes-picsart-apis

[![npm version](https://img.shields.io/npm/v/@picsart/n8n-nodes-picsart-apis.svg)](https://www.npmjs.com/package/@picsart/n8n-nodes-picsart-apis)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Pipeline status](https://gitlab.com/picsart/api-bu/plugins/n8n-nodes-picsart-apis/badges/main/pipeline.svg)](https://gitlab.com/picsart/api-bu/plugins/n8n-nodes-picsart-apis/-/commits/main)

Custom n8n nodes that integrate Picsart image APIs with AI-powered image processing capabilities:

- **Picsart Enhance**: Upscale images up to 16x with AI enhancement
- **Picsart Remove Background**: Remove backgrounds with advanced styling options

> 🎨 Powered by [Picsart API](https://picsart.io) - Professional AI image editing tools

## 📦 Installation

### For n8n Users

Install directly in your n8n instance:

```bash
npm install @picsart/n8n-nodes-picsart-apis
```

Then restart your n8n instance. The Picsart nodes will appear in your node palette.

### For n8n Cloud Users

1. Go to **Settings** > **Community Nodes**
2. Click **Install**
3. Enter: `@picsart/n8n-nodes-picsart-apis`
4. Click **Install**

### Get Your Picsart API Key

1. Sign up at [Picsart.io](https://picsart.io)
2. Navigate to your dashboard and get your API key
3. In n8n: **Settings** > **Credentials** > Add **Picsart API**
4. Paste your API key

## 🚀 Quick Start

1. **Add Credentials**: Settings → Credentials → Picsart API → paste your API key
2. **Create Workflow**: Add a node and search for "Picsart"
3. **Choose Node**:
   - Picsart Enhance (for upscaling)
   - Picsart Remove Background (for background removal)
4. **Configure & Execute**: Set your parameters and run!

## 🛠️ Development Prerequisites

If you want to contribute or develop locally:

* [git](https://git-scm.com/downloads)
* Node.js 20+ ([install with nvm](https://github.com/nvm-sh/nvm))
* pnpm: `npm install -g pnpm`
* n8n: `npm install n8n -g`
* Recommended: [n8n development environment setup](https://docs.n8n.io/integrations/creating-nodes/build/node-development-environment/)

## 🐳 Docker Quick Start (Development)

Perfect for testing and development:

```bash
# Build the image
docker build -t picsart-n8n-nodes .

# Run n8n with Picsart nodes
docker run -it --rm -p 5678:5678 picsart-n8n-nodes
```

Or use the quick rebuild script:
```bash
./rebuild.sh
```

Then:
1. Open http://localhost:5678
2. Add your Picsart API credentials
3. Start creating workflows!

## 📚 Node Documentation

### 🎨 Picsart Enhance

Upscale and enhance images using AI technology.

**Parameters:**
- **Image URL** (required): Valid image URL (1-2083 chars)
  - Supports: JPG, PNG, WEBP
- **Upscale Factor**: 2x, 4x, 6x, 8x, 16x
  - ⚠️ Note: Output limited to 16MP. For 4x upscaling, input should be ≤2000x2000px
- **Format**: JPG | PNG | WEBP (default: JPG)

**Output:**
- Binary image data at `binary.data`
- JSON metadata with result URL and credit information

**Example Use Cases:**
- Enhance low-resolution product photos
- Upscale images for print
- Improve image quality for presentations

### 🖼️ Picsart Remove Background

AI-powered background removal with advanced styling options.

**Parameters:**
- **Image URL** (required): Source image URL
- **Output Type**: cutout | mask
- **Background Options** (choose one):
  - Background Image URL
  - Background Color (CSS color or hex)
- **Effects:**
  - Blur: 0-100
  - Stroke: size, color, opacity
  - Shadow: custom or directional
- **Dimensions:** Width, Height, Scale (fit/fill)
- **Format**: JPG | PNG | WEBP

**Output:**
- Binary image data at `binary.data`
- JSON metadata with result and credits

**Example Use Cases:**
- E-commerce product photos
- Profile picture editing
- Marketing materials
- Social media content

## 💻 Local Development

### Setup
```bash
# Clone repository
git clone https://gitlab.com/picsart/api-bu/plugins/n8n-nodes-picsart-apis/n8n-nodes-picsart-apis.git
cd n8n-nodes-picsart-apis

# Install dependencies
pnpm install

# Build
pnpm run build

# Run with Docker
./rebuild.sh
```

### Development Workflow
```bash
# Watch mode (auto-rebuild on changes)
pnpm run dev

# Format code
pnpm run format

# Lint
pnpm run lint

# Fix linting issues
pnpm run lintfix
```

## 🚀 Releasing

### Using the Release Script (Recommended)
```bash
# For bug fixes (0.1.1 → 0.1.2)
./release.sh patch

# For new features (0.1.0 → 0.2.0)
./release.sh minor

# For breaking changes (0.1.0 → 1.0.0)
./release.sh major
```

The script will:
1. ✅ Bump version in package.json
2. ✅ Run build and tests
3. ✅ Create git commit and tag
4. ℹ️ Show commands to push

Then push to trigger CI/CD:
```bash
git push && git push --tags
```

GitLab CI/CD will automatically publish to NPM! 🎉

### Manual Release
```bash
# Update version
npm version patch  # or minor, major

# Build and test
pnpm run build
pnpm run lint

# Commit and tag
git commit -am "chore: bump version"
git tag v0.1.2

# Push
git push && git push --tags
```

## 🔄 CI/CD Pipeline

This project uses GitLab CI/CD for automated testing and publishing:

- **On Push**: Lint, build, and test
- **On Tag**: Automatically publish to NPM
- **On Merge Request**: Run all checks

### Setup CI/CD

1. **NPM Token**: Generate at [npmjs.com](https://www.npmjs.com/settings/~/tokens)
2. **Add to GitLab**: Settings → CI/CD → Variables
   - Key: `NPM_TOKEN`
   - Value: Your token
   - ✅ Mask variable
   - ✅ Protect variable

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Merge Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: bug fix
docs: documentation changes
chore: maintenance tasks
refactor: code refactoring
test: add tests
```

## 📖 Resources

- [n8n Documentation](https://docs.n8n.io/)
- [Picsart API Docs](https://docs.picsart.io/)
- [Creating n8n Nodes](https://docs.n8n.io/integrations/creating-nodes/)
- [Community Forum](https://community.n8n.io/)

## 📝 License

[MIT](LICENSE.md)

---

Made with ❤️ by [Picsart](https://picsart.io)
