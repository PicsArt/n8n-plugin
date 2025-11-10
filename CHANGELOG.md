# Changelog

All notable changes to @picsart/n8n-nodes-picsart-apis will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- CI/CD pipeline for automated publishing to NPM
- Improved error handling for Picsart API responses
- Better error messages for image resolution limits

### Changed
- Package name changed to scoped package: `@picsart/n8n-nodes-picsart-apis`
- Updated repository URL to GitLab

## [0.1.1] - 2024-11-10

### Added
- Picsart Enhance node for image upscaling (2x-16x)
- Picsart Remove Background node with advanced styling options
- Docker support for local development
- TypeScript support
- ESLint configuration

### Features

#### Picsart Enhance
- Image upscaling with factors from 2x to 16x
- Support for JPG, PNG, and WEBP formats
- URL-based image input
- Binary output support

#### Picsart Remove Background
- Background removal with cutout or mask output
- Background replacement (image or color)
- Background blur effect
- Image scaling and centering
- Stroke and shadow effects
- Multiple output formats

### Documentation
- Comprehensive README with usage examples
- Docker quick start guide
- Node parameter documentation

## [0.1.0] - Initial Development

### Added
- Initial project structure
- Basic n8n node implementation
- Picsart API integration
- Credential management

---

## Version History

- **0.1.1** - Enhanced error handling and CI/CD setup
- **0.1.0** - Initial development version

## How to Update This File

When releasing a new version:

1. Move items from `[Unreleased]` to a new version section
2. Add the version number and date
3. Categorize changes under:
   - `Added` - New features
   - `Changed` - Changes in existing functionality
   - `Deprecated` - Soon-to-be removed features
   - `Removed` - Removed features
   - `Fixed` - Bug fixes
   - `Security` - Security fixes

Example:
```markdown
## [0.2.0] - 2024-11-15

### Added
- New feature description

### Fixed
- Bug fix description
```

