# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
