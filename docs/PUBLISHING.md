# Publishing Guide

This guide explains how to publish the DSP Filter Library to npm.

## Prerequisites

1. **npm account**: Create an account at [npmjs.com](https://www.npmjs.com)
2. **npm CLI**: Install npm CLI and login
3. **Git repository**: Initialize git and push to GitHub

## Setup Steps

### 1. Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit: DSP Filter Library"
git branch -M main
git remote add origin https://github.com/yourusername/dsp-filter-library.git
git push -u origin main
```

### 2. Update Package Information

Edit `package.json` and update:
- `author.name` and `author.email`
- `repository.url`
- `bugs.url`
- `homepage`

### 3. Login to npm

```bash
npm login
```

### 4. Build the Package

```bash
npm run build
```

### 5. Test the Package

```bash
npm test
```

### 6. Publish to npm

```bash
npm publish
```

## Version Management

### Patch Version (Bug fixes)
```bash
npm version patch
npm publish
```

### Minor Version (New features)
```bash
npm version minor
npm publish
```

### Major Version (Breaking changes)
```bash
npm version major
npm publish
```

## Pre-publish Checklist

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md` (if exists)
- [ ] Run `npm run build`
- [ ] Run `npm test`
- [ ] Run `npm run lint`
- [ ] Test installation: `npm pack`
- [ ] Commit and tag: `git add . && git commit -m "v1.0.0" && git tag v1.0.0`

## Post-publish

1. Push tags to GitHub:
   ```bash
   git push --tags
   ```

2. Create GitHub release with changelog

3. Update documentation if needed

## Troubleshooting

### Package Already Exists
If you get "package already exists" error:
- Check if package name is available: `npm view dsp-filter-library`
- Use a different name in `package.json`

### Authentication Issues
```bash
npm whoami
npm logout
npm login
```

### Build Issues
```bash
npm run clean
npm install
npm run build
```
