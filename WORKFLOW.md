# 🔄 Complete CI/CD Workflow

Visual guide to understand how everything works together.

---

## 📊 The Big Picture

```
┌─────────────┐
│   You Code  │
│  on Laptop  │
└──────┬──────┘
       │ git push
       ▼
┌─────────────────────────────────────────────────────────┐
│                    GitLab Repository                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Main Branch (Protected)                           │ │
│  └────────────────────────────────────────────────────┘ │
└──────┬──────────────────────────────────────────────────┘
       │ Trigger
       ▼
┌─────────────────────────────────────────────────────────┐
│              GitLab CI/CD Pipeline                       │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌────────┐  ┌────────┐ │
│  │Install│→│ Lint │→│Build │→│Publish │→│Release │ │
│  └──────┘  └──────┘  └──────┘  └────────┘  └────────┘ │
│     ✓         ✓         ✓         ✓(tag)      ✓(tag)  │
└──────┬──────────────────────────────────────────────────┘
       │ (only on git tag)
       ▼
┌─────────────────────────────────────────────────────────┐
│                   NPM Registry                           │
│           @picsart/n8n-nodes-picsart-apis               │
│                    📦 Published!                         │
└──────┬──────────────────────────────────────────────────┘
       │ npm install
       ▼
┌─────────────────────────────────────────────────────────┐
│                    End Users                             │
│        Install and use in their n8n instances           │
└─────────────────────────────────────────────────────────┘
```

---

## 🎬 Development Workflow

### Scenario 1: Adding a New Feature

```
Day 1: Development
──────────────────

You:
├─ git checkout -b feature/awesome-feature
├─ [Code changes]
├─ pnpm run build  (test locally)
├─ pnpm run lint   (check quality)
├─ git commit -m "feat: add awesome feature"
└─ git push origin feature/awesome-feature

GitLab:
├─ Receives push
├─ Triggers CI/CD pipeline
│  ├─ ✓ Install dependencies
│  ├─ ✓ Run linter
│  └─ ✓ Build project
└─ Shows green checkmark ✅


Day 2: Code Review
──────────────────

Team:
├─ Reviews your code in Merge Request
├─ Suggests changes
└─ Approves

You:
├─ Make requested changes
├─ Push again
└─ GitLab runs pipeline again


Day 3: Merge & Release
───────────────────────

You:
├─ Merge to main branch
├─ git checkout main
├─ git pull origin main
├─ ./release.sh minor  (new feature = minor version)
└─ git push && git push --tags

GitLab:
├─ Detects new tag (e.g., v0.2.0)
├─ Triggers FULL pipeline
│  ├─ ✓ Install
│  ├─ ✓ Lint
│  ├─ ✓ Build
│  ├─ ✓ Publish to NPM  ← This time it runs!
│  └─ ✓ Create GitLab Release
└─ Success! 🎉

NPM:
├─ Package updated: @picsart/n8n-nodes-picsart-apis@0.2.0
└─ Users can now: npm install @picsart/n8n-nodes-picsart-apis
```

---

## 🔀 Git Branching Strategy

```
main (protected)
  │
  ├─── feature/enhance-error-handling
  │      │
  │      ├─ commit: feat: improve error messages
  │      ├─ commit: test: add error handling tests
  │      └─ commit: docs: update error docs
  │      │
  │      └─→ Merge Request → Review → Merge
  │
  ├─── feature/add-new-node
  │      │
  │      └─ ... (same process)
  │
  ├─ commit: chore: bump version to 0.2.0
  └─ tag: v0.2.0  ← Triggers NPM publish!
```

---

## 🏷️ Version Tagging Flow

```
Current: v0.1.1
   │
   ├─ Bug fix needed
   │  └─→ ./release.sh patch
   │     └─→ v0.1.2 (0.1.1 → 0.1.2)
   │
   ├─ New feature ready
   │  └─→ ./release.sh minor
   │     └─→ v0.2.0 (0.1.1 → 0.2.0)
   │
   └─ Breaking changes
      └─→ ./release.sh major
         └─→ v1.0.0 (0.1.1 → 1.0.0)

Each tag triggers:
  ├─ Full CI/CD pipeline
  ├─ NPM publish
  └─ GitLab release creation
```

---

## 🔐 Authentication Flow

```
Local Development
─────────────────

You → npm login
  │     ├─ Username
  │     ├─ Password
  │     └─ 2FA (if enabled)
  │
  └─→ ~/.npmrc created
      └─ Token stored locally
      └─ Can publish manually: npm publish


CI/CD (Automated)
─────────────────

GitLab Pipeline → Needs NPM_TOKEN
  │
  ├─ You generate token on npmjs.com
  │  └─ Type: "Automation" (important!)
  │
  ├─ Add to GitLab CI/CD Variables
  │  └─ Key: NPM_TOKEN
  │  └─ Value: [your-token]
  │
  └─ Pipeline uses token
     ├─ Creates .npmrc on the fly
     ├─ Authenticates with NPM
     └─ Publishes package automatically
```

---

## 📦 Package Publishing Process

```
Trigger: git push origin v0.2.0
   │
   ▼
┌──────────────────────────────────────┐
│   GitLab CI/CD: Publish Stage        │
│                                       │
│  1. Install dependencies              │
│     └─ pnpm install                   │
│                                       │
│  2. Setup authentication              │
│     └─ Create .npmrc with NPM_TOKEN  │
│                                       │
│  3. Build package                     │
│     └─ pnpm run build                │
│                                       │
│  4. Verify contents                   │
│     └─ npm pack --dry-run            │
│     └─ Shows what will be published  │
│                                       │
│  5. Publish to NPM                    │
│     └─ npm publish --access public   │
│                                       │
│  ✅ Success!                          │
└──────────────────────────────────────┘
   │
   ▼
NPM Registry
   │
   ├─ @picsart/n8n-nodes-picsart-apis
   ├─ Version: 0.2.0
   ├─ Visibility: Public
   └─ Downloadable by anyone!
```

---

## 🎯 Pipeline Decision Tree

```
Is it a git push?
   │
   ├─ YES → Continue
   │
   └─ NO → Stop

Is it to main/branch?
   │
   ├─ Branch/MR
   │  └─→ Run: Install, Lint, Build
   │     ├─ Pass ✅ → Green checkmark
   │     └─ Fail ❌ → Show errors
   │
   └─ Tag (v*.*.*)
      └─→ Run: Install, Lint, Build, Publish, Release
         ├─ All pass ✅ → Package on NPM!
         └─ Any fail ❌ → Stop, no publish
```

---

## 🔄 Continuous Flow

```
Monday
  ├─ feat: add feature A → push → CI ✅
  └─ branch: feature/feature-a

Tuesday
  ├─ feat: add feature B → push → CI ✅
  └─ branch: feature/feature-b

Wednesday
  ├─ Merge feature-a to main → CI ✅
  └─ Merge feature-b to main → CI ✅

Thursday (Release Day!)
  ├─ ./release.sh minor
  ├─ Creates v0.2.0 tag
  ├─ git push --tags
  └─ CI/CD publishes to NPM 🚀

Friday
  └─ Users install new version
     └─ npm install @picsart/n8n-nodes-picsart-apis
```

---

## 🎓 Key Concepts

### 1. Scoped Packages
```
Regular:  n8n-nodes-picsart-apis
Scoped:   @picsart/n8n-nodes-picsart-apis
            └─────┘
           Organization

Benefits:
  ✓ Professional branding
  ✓ No name conflicts
  ✓ Clear ownership
```

### 2. Semantic Versioning
```
v1.2.3
 │ │ │
 │ │ └─ PATCH: Bug fixes
 │ └─── MINOR: New features
 └───── MAJOR: Breaking changes

Examples:
  0.1.1 → 0.1.2  (bug fix)
  0.1.2 → 0.2.0  (new feature)
  0.2.0 → 1.0.0  (breaking change)
```

### 3. CI/CD Stages
```
Install → Lint → Build → Publish → Release
  ↓        ↓       ↓        ↓         ↓
 deps    quality compile   NPM     GitLab
```

### 4. Protected Branches
```
main (protected)
  ├─ Requires: Merge Request
  ├─ Requires: Passing CI
  └─ Requires: Approval
     └─→ Ensures quality
```

---

## 🎯 Success Metrics

After setup, you'll have:

```
✅ Automated Testing
   └─ Every push runs tests

✅ Code Quality Checks
   └─ Linting enforced

✅ Consistent Releases
   └─ Semantic versioning

✅ One-Command Publishing
   └─ ./release.sh + git push

✅ Transparent Process
   └─ All changes tracked

✅ Professional Workflow
   └─ Industry best practices
```

---

## 🚀 Quick Command Summary

```bash
# Development
git checkout -b feature/my-feature  # New branch
pnpm run dev                        # Watch mode
pnpm run lint                       # Check code
git commit -m "feat: my feature"    # Commit
git push origin feature/my-feature  # Push

# Release
git checkout main                   # Switch to main
git pull origin main                # Update
./release.sh patch                  # Bump version
git push && git push --tags         # Publish!

# Verify
# GitLab: CI/CD → Pipelines
# NPM: npmjs.com/package/@picsart/n8n-nodes-picsart-apis
```

---

**You're all set! 🎉**

This workflow ensures:
- ✅ Quality code through automated checks
- ✅ Safe releases through CI/CD
- ✅ Professional package management
- ✅ Easy collaboration with team

**Happy coding! 🚀**

