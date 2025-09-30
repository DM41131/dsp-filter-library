# Build Scripts

This folder contains build and development scripts for the DSP Filter Library.

## Files

- `rollup.config.js` - Rollup configuration for bundling

## Build Process

The build process creates both ES modules and CommonJS versions:

1. **ES Modules** - Modern JavaScript modules (`.js` files)
2. **CommonJS** - Node.js compatible modules (`.cjs` files)
3. **TypeScript** - Type definitions (`.d.ts` files)

## Scripts

```bash
# Build all formats
npm run build

# Build ES modules only
npm run build:esm

# Build CommonJS only
npm run build:cjs

# Build TypeScript definitions
npm run build:types

# Clean build directory
npm run clean
```

## Output Structure

```
lib/
├── index.js          # ES module entry point
├── index.cjs         # CommonJS entry point
├── index.d.ts        # TypeScript definitions
├── complex.js        # Complex number module
├── complex.cjs       # Complex number (CJS)
├── complex.d.ts      # Complex number types
└── ...               # Other modules
```

## Configuration

The Rollup configuration supports:
- Tree shaking for optimal bundle size
- Source maps for debugging
- Multiple output formats
- External dependencies handling
