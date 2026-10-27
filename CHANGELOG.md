# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Complete worker-backed protected-image operations in Node and browsers:
  exact retained preparation, fixed Argon2id/HKDF keys, fresh salt/nonce,
  authenticated framing, bounded repair and keyed matrix placement.
- Both apps show original/stored/maximum bytes and actual compression use,
  with distinct no-frame, empty-only and oversized-message refusals.
- Shared bounded PNG admission for CLI, browser message operations and comparison
  inputs; raw RGB and opaque RGBA samples are checked without canvas conversion.
- Cancellable image workers, stale-result suppression, explicit discard confirmation,
  keyboard password reveal and public PNG errors beside the browser inputs.
- Successful PNG exports explain which rendering metadata is kept and which
  personal metadata is removed, without claiming anonymity.
- Shared native-sample PNG comparison reports changed pixels and mean RGB
  differences, reusing an input raster for its bounded overlay without a pixel list.
- PNG acceptance checks cover assembled workflows, metadata boundaries and
  navigation guards; the clause evidence index separates app proof from release approval.
- **Vercel Web Analytics**: anonymous page-view counting in the web app via
  `@vercel/analytics`, mounted at the React root (`app/src/main.jsx`)
- **Privacy notice**: always-visible summary above the tool explaining that all encryption
  happens in the browser and that only anonymous page views are collected
- **Privacy Policy and Terms & Conditions**: reachable at `#privacy` and `#terms` through a
  dependency-free hash router (`app/src/lib/useHashRoute.js`), with Markdown copies in
  `docs/PRIVACY.md` and `docs/TERMS.md`
- Footer links to the privacy policy and terms
- Per-page document titles for the privacy policy and terms
- Focus moves into the main region on route change, so keyboard and screen
  reader users are not dropped back to the top of the tab order

### Fixed
- PNG serialization checks rendering values and consistency before output.
- Refused browser downloads release their temporary URLs and links, report the
  failure and keep the complete result available for another download attempt.
- Diff allows either input to be replaced during comparison. Reset and task
  navigation confirm discard, stop obsolete work and remove stale preview URLs.
- Failed or obsolete preparations clear prior capacity. Password-only edits
  retain valid preparation; cancellation releases it without partial output.
- The ASCII header stays within its own scroll area at enlarged text sizes,
  without pushing the forms outside the page.
- Hash routes are resolved with an own-property check, so inherited keys such as
  `#constructor` or `#__proto__` can no longer be rendered as a component and blank
  the page
- `[hidden]` is declared explicitly in `styles.css`; the Tailwind v3 directives in
  that file emit no preflight under Tailwind v4, leaving it to the UA stylesheet

### Changed
- **Breaking format change:** the CLI and PWA now create and recover only the
  new protected-image format. Legacy envelopes, password-seeded placement,
  filler controls and compatibility paths have been removed.
- Guided CLI and browser workflows consume complete authenticated operations
  while retaining explicit delivery, PNG export/Diff, cancellation and discard controls.
- CLI prompts require a terminal; scripted calls fail rather than wait for credentials.
  Cancellation and failed operations preserve existing files.
- PNG input is limited to 16 MiB and 1024×1024, with strict framing, metadata,
  color-profile and bounded-inflation checks.
- Service worker no longer caches `/_vercel/` requests or non-GET requests, so analytics
  beacons always reach the network
- Service worker cache bumped to `obscr-v1.1.2` so existing installs pick up the new assets

## [1.1.1] - 2026-01-21

### Changed
- Updated version references across all files to 1.1.1

## [1.1.0] - 2026-01-21

### Added
- **Progressive Web Application (PWA)**: Complete browser-based application with modern React interface
  - Works offline with service worker caching
  - Installable on desktop and mobile devices
  - Tab-based navigation for Encrypt, Decrypt, and Image Comparison features
  - Visual image upload with file input support
  - Real-time password strength indicator using zxcvbn
  - Real-time capacity estimation showing available vs. required bits
  - Interactive encryption results with image comparison view
  - Image difference visualization tool with side-by-side comparison
  - Automatic blob downloads for encoded images
- **React UI Components**: Full component library built with React 18
  - Custom UI components (buttons, cards, inputs, labels, tabs, textarea)
  - Specialized components (EncryptForm, DecryptForm, ImageDiffForm, etc.)
  - Tailwind CSS styling with modern design system
  - Browser-only implementation (no Electron dependencies)
- **Browser Steganography**: Complete browser-compatible implementation in `lib/steg.js`
  - Canvas API for PNG manipulation
  - Inlined crypto functions for browser compatibility
  - File API for image upload and blob downloads
  - Support for all encryption features (compression, obfuscation)
- **PWA Features**:
  - Service worker (`sw.js`) for offline caching
  - Web app manifest with theme colors and icons
  - 192x192 and 512x512 PWA icons
  - Installable app experience
- **Build System**:
  - Vite build configuration optimized for PWA
  - Node.js polyfills for browser crypto (Buffer, crypto, zlib)
  - Vercel deployment configuration

### Changed
- **Architecture**: Migrated from Electron desktop app to Progressive Web App
  - Removed all Electron dependencies and code
  - Simplified all React components to browser-only implementations
  - Renamed `browserSteg.js` to `steg.js` as primary implementation
- **Codebase Restructure**: Moved core utilities from `bin/utils/` to `lib/` directory
  - `lib/crypto.js` - Node.js CLI encryption (CommonJS)
  - `lib/steg.js` - Browser-compatible steganography with inlined crypto (ESM)
  - `lib/utils.js` - Shared utility functions
  - `lib/mersenne-twister.js` - Maintained PRNG implementation
- **Build Scripts**: Simplified to PWA-only
  - `npm run dev` - Vite dev server
  - `npm run build` - Vite production build
  - `npm run preview` - Preview production build
- **Package Configuration**:
  - Removed Electron Builder configuration
  - Updated `.npmignore` to exclude web app files
  - CLI package remains available via npm
- **UI Components**: All components now browser-only
  - Removed `isElectron` checks throughout codebase
  - Direct File API usage instead of Electron IPC
  - Blob downloads instead of file system writes

### Removed
- **Electron Desktop Application**: Complete removal of Electron implementation
  - Removed `electron/` directory
  - Removed `electron`, `electron-builder`, `concurrently` dependencies
  - Removed Electron IPC bridge and preload script
  - Removed 150 Electron-specific tests

### Technical Notes
- Application now available as both CLI tool (npm package) and PWA (web app)
- PWA deployed at https://obscr.vercel.app/
- Browser crypto powered by Node.js polyfills (vite-plugin-node-polyfills)
- Service worker provides offline-first experience
- Tailwind CSS v4 with PostCSS for styling
- Test count: 103 tests (CLI only)

## [0.2.1] - 2026-01-20

### Added
- `.npmignore` file to exclude tests and development files from npm package
- 23 new CLI integration tests for command-line interface validation
- 3 additional steg unit tests for edge case validation

### Changed
- Interactive mode now runs by default when no command is provided
- Improved spacing throughout CLI output for better readability
- Package size reduced (only production files included in npm package)

### Fixed
- Fixed boxen borderColor compatibility issue (changed from "violet" to "magenta")

### Testing
- Total test count: 103 tests (up from 80)
- Overall coverage: 90.45%
- All tests passing

## [0.2.0] - 2026-01-20

### Added
- **Compression Support**: Optional gzip compression using `--compress` flag to reduce message size by 50-90%
- **Custom Output Filename**: `-o/--output` flag for encrypt command to specify output filename (default: "encoded.png")
- **Image Capacity Validation**: Automatic validation that message fits in image with helpful error messages
- **Capacity Information**: Shows capacity utilization after successful encryption
- **Comprehensive Test Suite**: 80 tests with 90%+ code coverage
  - Unit tests for crypto (100% coverage), utils (100% coverage), and steg (97% coverage)
  - Integration tests for full workflows
  - Automated test fixtures and isolated test outputs
- **JSDoc Documentation**: All exported functions now have detailed JSDoc comments
- **Enhanced README**: Comprehensive documentation with examples, security notes, and technical details

### UX Enhancements
- **Interactive Mode**: New `obscr interactive` command with guided menu-driven workflow
- **Progress Indicators**: Real-time spinners showing encryption/decryption progress with ora
- **Visual Feedback**: Color-coded messages with icons (✔, ✖, ℹ, ⚠) and beautiful boxed outputs
- **Verbose Mode**: `-v/--verbose` flag for detailed technical information and debugging
- **Quiet Mode**: `-q/--quiet` flag for minimal output, perfect for scripting and automation
- **Confirmation Prompts**: Asks before overwriting existing files
- **Examples Command**: New `obscr examples` command showing usage examples
- **Better Help Text**: Improved help messages with clearer descriptions
- **Welcome Banner**: Stylish welcome banner with version information (can be suppressed with --quiet)
- **Password Masking**: Visual asterisks when entering passwords
- **Smart Validation**: Real-time input validation with helpful error messages

### Changed
- **Async/Await Pattern**: Replaced synchronous crypto operations with async Promise-based approach for better performance
- **Modern JavaScript**: Converted `var` to `const`/`let`, using template literals throughout
- **Better Variable Names**: Improved naming for clarity (e.g., `c` → `currentByte`, `tmp` → `powerOfTwo`)
- **Error Handling**: Consistent error handling with structured return types `{success, data, error}`
- **Return Types**: Changed from tuple returns `[boolean, data]` to objects for better clarity
- **Array Optimizations**: Pre-allocated arrays instead of dynamic growth

### Fixed
- **Debug Output Removed**: Removed debug `console.log` statement in encrypt command
- **Error Object Handling**: Now throws proper Error objects instead of strings
- **Fixed Output Filename**: Encrypt command now supports custom output instead of hardcoded "encoded.png"

### Security
- **Backward Compatibility Maintained**:
  - SECRET_KEY preserved for compatibility with older encrypted images
  - Can decrypt images created with previous versions
  - Automatically detects compressed vs uncompressed messages
- All encryption parameters unchanged (AES-256-GCM, PBKDF2 with 65,535 iterations)

### Technical Notes
- Compression format adds optional 5th field: `salt:nonce:ciphertext:tag[:1]`
- Async operations provide foundation for future streaming implementations
- Test outputs isolated in `test/output/` directory and properly gitignored

## [0.1.2] - 2022-09-11

### Changed
- Updated dependencies
- Cleaned up codebase

## [0.1.1] - 2022-07-08

### Added
- Initial release with AES-256-GCM encryption
- LSB steganography for PNG images
- Password-based key derivation with PBKDF2
- CLI interface with encrypt/decrypt commands
