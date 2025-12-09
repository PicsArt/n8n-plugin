#!/bin/bash
set -e

# Release script for @picsart/n8n-nodes-picsart-creative-apis
# Usage: ./release.sh [patch|minor|major]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Picsart n8n Nodes Release Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if version type is provided
if [ -z "$1" ]; then
  echo -e "${RED}❌ Error: Version type not specified${NC}"
  echo ""
  echo -e "${YELLOW}Usage:${NC}"
  echo "  ./release.sh patch    # Bug fixes (0.1.1 → 0.1.2)"
  echo "  ./release.sh minor    # New features (0.1.0 → 0.2.0)"
  echo "  ./release.sh major    # Breaking changes (0.1.0 → 1.0.0)"
  echo ""
  exit 1
fi

TYPE=$1

# Validate version type
if [[ ! "$TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo -e "${RED}❌ Error: Invalid version type '$TYPE'${NC}"
  echo -e "${YELLOW}Must be one of: patch, minor, major${NC}"
  exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${BLUE}📦 Current version:${NC} $CURRENT_VERSION"

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes${NC}"
  echo ""
  git status --short
  echo ""
  read -p "Do you want to continue? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Release cancelled${NC}"
    exit 1
  fi
fi

# Check if we're on main/master branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
  echo -e "${YELLOW}⚠️  Warning: You're not on main/master branch (current: $CURRENT_BRANCH)${NC}"
  read -p "Do you want to continue? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Release cancelled${NC}"
    exit 1
  fi
fi

# Bump version
echo -e "${GREEN}⬆️  Bumping version ($TYPE)...${NC}"
npm version $TYPE --no-git-tag-version

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}✨ New version:${NC} $NEW_VERSION"
echo ""

# Install dependencies
echo -e "${BLUE}📥 Installing dependencies...${NC}"
pnpm install

# Build project
echo -e "${BLUE}🔨 Building project...${NC}"
pnpm run build

# Run linter
echo -e "${BLUE}🧪 Running linter...${NC}"
pnpm run lint

echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""

# Show what will be committed
echo -e "${BLUE}📝 Changes to be committed:${NC}"
git diff package.json

echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Release Summary${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "Version: ${GREEN}$CURRENT_VERSION${NC} → ${GREEN}$NEW_VERSION${NC}"
echo -e "Type: ${BLUE}$TYPE${NC}"
echo -e "Branch: ${BLUE}$CURRENT_BRANCH${NC}"
echo -e "Tag: ${GREEN}v$NEW_VERSION${NC}"
echo ""

# Confirm release
read -p "Do you want to commit and tag this release? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}❌ Release cancelled${NC}"
  echo -e "${YELLOW}💡 To revert changes, run: git checkout package.json package-lock.json${NC}"
  exit 1
fi

# Commit changes
echo -e "${GREEN}📝 Committing changes...${NC}"
git add package.json pnpm-lock.yaml
git commit -m "chore: bump version to $NEW_VERSION"

# Create tag
echo -e "${GREEN}🏷️  Creating tag v$NEW_VERSION...${NC}"
git tag "v$NEW_VERSION"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Release Ready!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Push commits:"
echo -e "   ${BLUE}git push origin $CURRENT_BRANCH${NC}"
echo ""
echo "2. Push tag to trigger CI/CD:"
echo -e "   ${BLUE}git push origin v$NEW_VERSION${NC}"
echo ""
echo "3. Or push everything at once:"
echo -e "   ${BLUE}git push && git push --tags${NC}"
echo ""
echo -e "${GREEN}🚀 GitLab CI/CD will automatically publish to NPM!${NC}"
echo ""

