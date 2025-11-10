# CI/CD Setup Guide

Complete guide to set up automated publishing for @picsart/n8n-nodes-picsart-apis

## 📋 Prerequisites Checklist

Before you start, ensure you have:

- [ ] GitLab account with access to the repository
- [ ] NPM account (create at [npmjs.com](https://www.npmjs.com))
- [ ] Access to @picsart organization on NPM (ask Picsart admin)
- [ ] Git installed locally
- [ ] Node.js 20+ and pnpm installed

---

## 🏢 Step 1: NPM Organization Setup

### Option A: If @picsart organization already exists

1. **Contact Picsart NPM Admin** and request access:
   ```
   "Please add my NPM username to the @picsart organization 
   with Developer role so I can publish packages."
   ```

2. **Provide your NPM username**:
   ```bash
   npm whoami  # Get your username
   ```

3. **Wait for invitation email** and accept it

4. **Verify membership**:
   - Visit: https://www.npmjs.com/settings/[your-username]/packages
   - You should see @picsart in your organizations

### Option B: If @picsart organization doesn't exist

The Picsart admin must:

1. Go to https://www.npmjs.com/org/create
2. Create organization named "picsart"
3. Choose plan (Free for public packages)
4. Add you as a member with Developer role

---

## 🔑 Step 2: Generate NPM Token

### For CI/CD (Required)

1. **Login to NPM**:
   - Go to https://www.npmjs.com
   - Click your avatar → Access Tokens

2. **Generate Token**:
   - Click "Generate New Token"
   - Choose **"Automation"** (for CI/CD)
   - Copy the token immediately (you'll only see it once!)

3. **Save it securely** - you'll need it for GitLab

### For Local Publishing (Optional)

If you also want to publish manually from your computer:

```bash
npm login
# Enter your NPM credentials
```

---

## 🦊 Step 3: Configure GitLab CI/CD

### Add NPM Token to GitLab

1. **Go to your GitLab project**:
   - https://gitlab.com/picsart/api-bu/plugins

2. **Navigate to CI/CD Settings**:
   - Settings → CI/CD → Variables

3. **Add Variable**:
   - Click "Add Variable"
   - Key: `NPM_TOKEN`
   - Value: [paste your NPM token]
   - Type: Variable
   - Environment: All
   - ✅ **Protected variable** (recommended)
   - ✅ **Masked variable** (hides in logs)
   - ❌ Do NOT expand variable reference

4. **Save changes**

### Verify .gitlab-ci.yml

The `.gitlab-ci.yml` file is already configured with:
- ✅ Install dependencies
- ✅ Lint code
- ✅ Build project
- ✅ Publish to NPM (on tags)
- ✅ Create GitLab releases

No changes needed!

---

## 🧪 Step 4: Test the Pipeline

### Test Build (Without Publishing)

1. **Make a small change** (e.g., update README):
   ```bash
   echo "# Test" >> README.md
   git add README.md
   git commit -m "test: CI/CD pipeline"
   git push origin main
   ```

2. **Watch the pipeline**:
   - Go to: CI/CD → Pipelines
   - You should see stages running:
     - ✅ install
     - ✅ lint
     - ✅ build
   - ⚠️ publish stage should be **skipped** (no tag)

3. **Check logs** for any errors

---

## 🚀 Step 5: First Release (Publish to NPM)

### Using Release Script (Recommended)

```bash
# Make sure you're on main branch
git checkout main
git pull origin main

# Run release script
./release.sh patch

# Follow prompts, then push:
git push origin main
git push origin --tags
```

### Manual Release

```bash
# Update version
npm version patch --no-git-tag-version

# Commit changes
git add package.json
git commit -m "chore: bump version to 0.1.2"

# Create tag
git tag v0.1.2

# Push
git push origin main
git push origin v0.1.2
```

### Watch the Magic Happen 🎉

1. **Go to CI/CD → Pipelines**
2. **You should see**:
   - ✅ install
   - ✅ lint
   - ✅ build
   - ✅ **publish** (runs this time!)
   - ✅ **release** (creates GitLab release)

3. **Verify on NPM**:
   - Visit: https://www.npmjs.com/package/@picsart/n8n-nodes-picsart-apis
   - Your package should appear! 🎊

---

## 🔄 Daily Workflow

### Making Changes

```bash
# 1. Create feature branch
git checkout -b feature/amazing-feature

# 2. Make changes
# ... edit files ...

# 3. Build and test locally
pnpm run build
pnpm run lint

# 4. Commit with conventional format
git add .
git commit -m "feat: add amazing feature"

# 5. Push
git push origin feature/amazing-feature

# 6. Create Merge Request in GitLab
# Pipeline runs automatically on MR
```

### Releasing New Version

```bash
# After merging to main
git checkout main
git pull origin main

# Release (choose one):
./release.sh patch  # Bug fixes
./release.sh minor  # New features
./release.sh major  # Breaking changes

# Push (triggers automatic NPM publish)
git push && git push --tags
```

---

## 📊 Pipeline Details

### Stages Explained

1. **Install** (runs always):
   - Installs dependencies
   - Caches node_modules for speed

2. **Lint** (runs always):
   - Checks code quality with ESLint
   - Verifies formatting

3. **Build** (runs always):
   - Compiles TypeScript to JavaScript
   - Builds to `dist/` folder
   - Saves artifacts

4. **Publish** (runs only on tags):
   - Authenticates with NPM using token
   - Publishes to NPM with public access
   - Package appears at: `@picsart/n8n-nodes-picsart-apis`

5. **Release** (runs only on tags):
   - Creates GitLab release page
   - Links to NPM package
   - Shows changelog

### When Jobs Run

| Trigger | Install | Lint | Build | Publish | Release |
|---------|---------|------|-------|---------|---------|
| Push to branch | ✅ | ✅ | ✅ | ❌ | ❌ |
| Merge Request | ✅ | ✅ | ✅ | ❌ | ❌ |
| Push tag (v*) | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🐛 Troubleshooting

### Pipeline fails at publish stage

**Error**: `403 Forbidden - You do not have permission to publish`

**Solutions**:
1. Verify you're a member of @picsart organization
2. Check NPM_TOKEN is correct in GitLab variables
3. Ensure token type is "Automation"
4. Verify package name is correct: `@picsart/n8n-nodes-picsart-apis`

### Package already published with this version

**Error**: `You cannot publish over the previously published versions`

**Solution**:
```bash
# Delete the tag locally and remotely
git tag -d v0.1.2
git push origin :refs/tags/v0.1.2

# Bump version again
./release.sh patch

# Push new version
git push && git push --tags
```

### Build fails

**Error**: TypeScript compilation errors

**Solution**:
```bash
# Test locally first
pnpm run build
pnpm run lint

# Fix errors before pushing
```

### Token is masked but shows in logs

**Solution**:
- Ensure "Masked variable" is checked in GitLab
- If token appears, regenerate a new one on NPM

### Pipeline stuck or doesn't start

**Solution**:
1. Check GitLab Runners are available
2. Go to: Settings → CI/CD → Runners
3. Ensure shared runners are enabled

---

## 🔒 Security Best Practices

### Do:
- ✅ Use "Automation" tokens for CI/CD
- ✅ Mask NPM_TOKEN in GitLab
- ✅ Protect variables to main branch only
- ✅ Rotate tokens periodically (every 6 months)
- ✅ Use `.npmrc` only locally, never commit it

### Don't:
- ❌ Never commit .npmrc with tokens to git
- ❌ Never share tokens in chat/email
- ❌ Never use "Publish" tokens in CI/CD
- ❌ Never expose tokens in logs

---

## 📈 Version Strategy

Follow [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH
  |     |     |
  |     |     └─ Bug fixes (backward compatible)
  |     └─────── New features (backward compatible)
  └───────────── Breaking changes
```

**Examples**:
- `0.1.1 → 0.1.2`: Fixed image resolution error message (patch)
- `0.1.2 → 0.2.0`: Added new Picsart Effects node (minor)
- `0.2.0 → 1.0.0`: Changed API, breaking existing workflows (major)

---

## 📝 Quick Reference

### Essential Commands

```bash
# Test locally
pnpm install
pnpm run build
pnpm run lint

# Release
./release.sh patch|minor|major
git push && git push --tags

# Manual publish (local)
npm login
npm publish --access public

# View versions
npm view @picsart/n8n-nodes-picsart-apis versions

# Check pipeline status
# Visit: https://gitlab.com/picsart/api-bu/plugins/n8n-nodes-picsart-apis/-/pipelines
```

### Important URLs

- **NPM Package**: https://www.npmjs.com/package/@picsart/n8n-nodes-picsart-apis
- **GitLab Project**: https://gitlab.com/picsart/api-bu/plugins
- **Pipelines**: https://gitlab.com/picsart/api-bu/plugins/n8n-nodes-picsart-apis/-/pipelines
- **NPM Tokens**: https://www.npmjs.com/settings/~/tokens
- **GitLab CI/CD Settings**: https://gitlab.com/picsart/api-bu/plugins/n8n-nodes-picsart-apis/-/settings/ci_cd

---

## ✅ Setup Verification Checklist

After setup, verify:

- [ ] NPM organization @picsart exists
- [ ] You're a member of @picsart with Developer role
- [ ] NPM_TOKEN is added to GitLab CI/CD variables
- [ ] Token is masked and protected
- [ ] .gitlab-ci.yml exists in repository
- [ ] Test push triggers pipeline (install, lint, build)
- [ ] package.json has correct name: `@picsart/n8n-nodes-picsart-apis`
- [ ] First tag triggers publish to NPM successfully
- [ ] Package appears on npmjs.com

---

## 🎉 Success!

If you've completed all steps, your CI/CD is ready!

**Now every time you**:
1. Push code → Pipeline tests it
2. Push tag → Pipeline publishes to NPM
3. Users can install with: `npm install @picsart/n8n-nodes-picsart-apis`

**Questions?**
- Check GitLab pipeline logs
- Review NPM package page
- Contact team for help

---

*Last updated: 2024-11-10*

