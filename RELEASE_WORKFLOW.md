# Release Workflow Guide

## Overview

This project uses **automated publishing** to npm via GitLab CI/CD. When you push a git tag, GitLab automatically publishes the package to npm.

## Understanding the Error

The error you encountered:
```
npm error 403 You cannot publish over the previously published versions: 0.1.4
```

This happens because npm **does not allow republishing the same version**. Each version number can only be published once.

## Correct Release Process

### Step 1: Bump Version Locally

Use the release script to bump the version:

```bash
# For bug fixes (0.1.4 → 0.1.5)
./release.sh patch

# For new features (0.1.4 → 0.2.0)
./release.sh minor

# For breaking changes (0.1.4 → 1.0.0)
./release.sh major
```

The script will:
- ✅ Bump version in `package.json`
- ✅ Install dependencies
- ✅ Build the project
- ✅ Run linting
- ✅ Show you a summary
- ✅ Ask for confirmation
- ✅ Commit changes
- ✅ Create a git tag (e.g., `v0.1.5`)

### Step 2: Push Changes to GitLab

After the script completes, push both the commit and the tag:

```bash
# Push the version bump commit
git push origin main

# Push the tag (this triggers CI/CD publishing)
git push origin v0.1.5
```

Or push everything at once:
```bash
git push && git push --tags
```

### Step 3: CI/CD Automatically Publishes

When GitLab detects the tag push, it will:

1. **Install** dependencies
2. **Lint** the code
3. **Build** the project
4. **Check** if version already exists on npm (new feature!)
5. **Publish** to npm (if version doesn't exist)
6. **Create** a GitLab release

You can monitor the pipeline at:
https://gitlab.com/picsart/api-bu/plugins/n8n-nodes-picsart-apis/-/pipelines

## Important Rules

### ❌ Don't Do This:
- Don't manually run `npm publish` (let CI/CD do it)
- Don't push the same tag twice
- Don't create tags without bumping the version
- Don't skip the `release.sh` script

### ✅ Do This:
- Always use `./release.sh` to bump versions
- Always push tags after commits
- Always check the CI/CD pipeline status
- Always update CHANGELOG.md before releasing

## Troubleshooting

### Problem: "Version already exists on npm"

**Solution:** You need to bump to a new version.

```bash
# Bump to next patch version
./release.sh patch

# Then push
git push && git push --tags
```

### Problem: "Pipeline failed but I didn't change anything"

**Likely cause:** You re-pushed an existing tag. Each version can only be published once.

**Solution:** Create a new version instead of re-running the old one.

### Problem: "I pushed the wrong tag"

**Solution:** Delete the tag locally and remotely:

```bash
# Delete local tag
git tag -d v0.1.5

# Delete remote tag
git push origin :refs/tags/v0.1.5
```

Then create the correct version.

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **Patch** (0.1.4 → 0.1.5): Bug fixes, no API changes
- **Minor** (0.1.4 → 0.2.0): New features, backward compatible
- **Major** (0.1.4 → 1.0.0): Breaking changes

## Quick Reference

```bash
# Complete release process
./release.sh patch              # Bump version, build, lint, commit, tag
git push origin main            # Push commit
git push origin v0.1.5          # Push tag → triggers CI/CD → publishes to npm

# Check published versions
npm view @picsart/n8n-nodes-picsart-apis versions

# View on npm
open https://www.npmjs.com/package/@picsart/n8n-nodes-picsart-apis
```

## CI/CD Pipeline Stages

1. **install**: Install dependencies (runs on all branches and tags)
2. **lint**: Check code quality (runs on all branches and MRs)
3. **build**: Compile TypeScript (runs on all branches and tags)
4. **publish**: Publish to npm (runs **only on tags**)
5. **release**: Create GitLab release (runs **only on tags**)

## Why This Workflow?

✅ **Automated**: No manual publishing, less human error
✅ **Consistent**: Same build process every time
✅ **Auditable**: Every publish has a git tag and CI/CD log
✅ **Secure**: NPM_TOKEN stored securely in GitLab
✅ **Fast**: Parallel jobs, cached dependencies

## Need Help?

- 📚 [CI/CD Setup Guide](CI_CD_SETUP.md)
- 📝 [Changelog](CHANGELOG.md)
- 🐛 [Report Issues](https://gitlab.com/picsart/api-bu/plugins/n8n-nodes-picsart-apis/-/issues)

