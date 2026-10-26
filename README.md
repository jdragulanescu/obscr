<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-green">
  <img src="https://img.shields.io/badge/build-passing-brightgreen">
  <img src="https://img.shields.io/badge/version-1.1.1-orange">
  <img src="https://img.shields.io/badge/npm-v8.3.1-blue">
  <img src="https://img.shields.io/badge/node-v16.14.0-yellow">
</p>
<br>
<p align="center">Encrypt and hide your secure data using AES-256-GCM encryption combined with steganography</p>

<p align="center">
  <a href="https://obscr.vercel.app/">🌐 Live Web App</a>
</p>

<br>

---

## Features

### Security
- **Strong Encryption**: Uses AES-256-GCM for message encryption
- **Steganography**: Hides encrypted messages in PNG images using LSB (Least Significant Bit) technique
- **Compression**: Optional gzip compression to fit larger messages in smaller images (50-90% reduction)
- **Password-Based Key Derivation**: PBKDF2 with SHA-512 for secure key generation (65,535 iterations)
- **Data Obfuscation**: Password-seeded scrambling of data bits within the image
- **Existing message format**: Unchanged; older images must also meet the supported PNG input policy below

### User Experience

**Progressive Web App:**
- **Works Offline**: Full PWA support with service worker caching
- **No Installation**: Use directly in your browser
- **Visual Interface**: PNG file picker and cancellable capacity estimation
- **Image Comparison**: See visual diff between original and encoded images
- **Cross-Platform**: Works on desktop and mobile browsers
- **Password Strength Meter**: Real-time feedback on password security

**Command-Line Tool:**
- **Interactive Mode**: Guided workflow with menu-driven interface for beginners
- **Progress Indicators**: Real-time spinners showing encryption/decryption progress
- **Visual Feedback**: Color-coded messages, icons, and beautiful boxed outputs
- **Verbose Mode**: Detailed technical information for debugging and learning
- **Quiet Mode**: Reduced terminal output; message and password prompts still require a terminal
- **Confirmation Prompts**: Prevents accidental file overwrites
- **Smart Validation**: Input validation with helpful error messages
- **Usage Examples**: Built-in examples command for quick reference

## Installation & Usage

### Progressive Web App (Recommended)

Visit [https://obscr.vercel.app/](https://obscr.vercel.app/) to use Obscr directly in your browser. The PWA can be installed on your device for offline use:

1. Open the web app in your browser
2. Click the install prompt (or browser menu → "Install App")
3. Use Obscr offline anytime!

The web app provides the same encryption security as the CLI but with a visual interface.

### NPM Package (Command-Line Tool)

```bash
npm install -g obscr
```

## Supported PNG input

Both apps check the same raw PNG samples before message processing. Inputs must
be non-interlaced, 8-bit RGB or fully opaque RGBA, at most 16 MiB, and between
1 and 1024 pixels on each side. Transparency, palettes, grayscale, animation,
unsupported color profiles, unknown chunks and malformed PNG data are refused.
Chunk counts, metadata size and raster inflation are bounded. Images are not
resized or color-converted to make them fit.

Exports keep the dimensions, RGB/RGBA color type, opaque alpha and native samples
except for the intended carrier changes. They retain supported cHRM, gAMA and
sRGB rendering declarations byte-for-byte, in that order. Absent declarations
stay absent. Personal and other non-rendering metadata is removed without
expanding embedded text. Both apps show this policy after a successful export.
This is not an anonymity guarantee: removed metadata and PNG encoding can be
detected. Inputs with unsupported color profiles are rejected, not converted.

Output is bounded before allocation and contains only complete PNG chunks.
The current stored-DEFLATE writer's largest supported output is 4,195,789 bytes,
below the 16 MiB output ceiling. CLI writes use a temporary file and an atomic
rename; failure or cancellation leaves the source and existing destination
unchanged. If the browser cannot start a download, the complete result remains
available for another attempt. The browser controls the later disk save; the app
cannot confirm that a download reached disk.

One image operation runs at a time. In the browser, Cancel stops its worker and
clears passwords while keeping the selected image and editable message.
Replacement and capacity edits discard old work. Clear or leaving a task asks
for confirmation before discarding entered data or results. Completed results
remain until an edit, Clear or navigation; use Download to save them.

These limits are policy bounds, not measured whole-process memory or device
performance guarantees. Visual comparison is not a security test.

## CLI Usage

### Interactive Mode (Recommended for Beginners)

```bash
obscr interactive
```

Launches a guided workflow with menu-driven interface. Perfect for first-time users!

Encrypt, decrypt and interactive mode require terminal input and a terminal on
stderr for their prompts. Piped input is refused promptly; `--quiet` does not
supply credentials. Output on stdout can be redirected without prompt text.
Use arrow keys and Enter in the menu, and Ctrl-C to cancel.
`--help` and `examples` work without a terminal. `NO_COLOR=1` disables color.

### Command Line Mode

#### Encrypt and Hide a Message

```bash
obscr encrypt -f <input-image.png> [-o <output-image.png>] [--compress] [--verbose] [--quiet]
```

**Options:**
- `-f, --filename`: Path to the PNG image to use as a container (required)
- `-o, --output`: Output filename for the encoded image (default: "encoded.png")
- `-c, --compress`: Enable compression to fit larger messages (50-90% reduction)
- `-v, --verbose`: Show detailed progress and technical information
- `-q, --quiet`: Minimal output (only essential messages)

**Examples:**
```bash
# Basic usage with visual feedback
obscr encrypt -f photo.png

# With compression and custom output
obscr encrypt -f photo.png -o secret.png --compress

# Verbose mode for detailed information
obscr encrypt -f photo.png --verbose

# Quiet mode in a terminal
obscr encrypt -f photo.png -o output.png --quiet
```

#### Decrypt and Extract a Message

```bash
obscr decrypt -f <encoded-image.png> [-o <output-file.txt>] [--verbose] [--quiet]
```

**Options:**
- `-f, --filename`: Path to the PNG image containing the hidden message (required)
- `-o, --output`: Save decrypted message to a file (optional)
- `-v, --verbose`: Show detailed progress information
- `-q, --quiet`: Reduce status output; prompts still require a terminal

**Examples:**
```bash
# Display message with nice formatting
obscr decrypt -f encoded.png

# Save to file
obscr decrypt -f encoded.png -o message.txt

# Quiet mode in a terminal
obscr decrypt -f secret.png --quiet
```

### Additional Commands

#### Show Usage Examples
```bash
obscr examples
```

Shows comprehensive usage examples with all features.

#### Get Help
```bash
obscr --help
obscr encrypt --help
obscr decrypt --help
```

## How It Works

### Encryption Process

1. **Password Entry**: You enter a password and the message to hide
2. **AES-256-GCM Encryption**: The message is encrypted using your password with PBKDF2 key derivation
3. **Optional Compression**: If enabled, the encrypted data is compressed with gzip
4. **Bit Scrambling**: The encrypted data bits are scrambled using a password-derived seed
5. **LSB Steganography**: The scrambled bits are hidden in the least significant bits of the image's RGB channels
6. **Output**: A new PNG image is created that looks identical to the original but contains your encrypted message

### Decryption Process

1. **Password Entry**: You enter the same password used for encryption
2. **LSB Extraction**: All LSBs are extracted from the image's RGB channels
3. **Bit Unscrambling**: The bits are unscrambled using the password-derived seed
4. **Decompression**: If the message was compressed, it's automatically decompressed
5. **AES-256-GCM Decryption**: The data is decrypted using the password
6. **Output**: Your original message is recovered

## Security Properties

### Encryption Layer (AES-256-GCM)
- **Algorithm**: AES-256 in Galois/Counter Mode
- **Key Derivation**: PBKDF2 with SHA-512, 65,535 iterations
- **Authentication**: Built-in authentication tag prevents tampering
- **Random Salt & Nonce**: Each encryption uses unique random values

### Obfuscation Layer (Steganography)
- **LSB Technique**: Modifies only the least significant bits, making changes imperceptible
- **Password-Based Scrambling**: Data bits are scattered in pseudo-random positions
- **Random Fill**: Unused bits are filled with random values for additional obfuscation
- **Format**: Standard PNG output, indistinguishable from regular images

### Important Security Notes

1. **Password strength is critical** - Use a strong, unique password
2. **Security relies on**:
   - The strength of your password
   - AES-256-GCM encryption (cryptographically secure)
   - PBKDF2 key derivation
3. **Limitations**:
   - Steganography provides obfuscation, not security by itself
   - The encrypted image is not resistant to targeted steganalysis by experts
   - If someone knows the image contains a hidden message, they can extract it (but still need your password to decrypt)

## Privacy

Obscr runs entirely on your device. Both the CLI and the web app do all encryption,
decryption and steganography locally — your messages, images and passwords are never
uploaded to a server, and there is no account system.

The hosted web app uses [Vercel Web Analytics](https://vercel.com/docs/analytics) to count
anonymous page views (path, referrer, country, device type). It sets no cookies, builds no
cross-site profile, and never sees the content you encrypt. Blocking the analytics script
does not affect any functionality; the CLI sends nothing at all.

See [docs/PRIVACY.md](docs/PRIVACY.md) and [docs/TERMS.md](docs/TERMS.md) for the full
policy and terms of use, also available in the app at
[/#privacy](https://obscr.vercel.app/#privacy) and
[/#terms](https://obscr.vercel.app/#terms).

## Image Capacity

The tool automatically checks if your message fits in the chosen image:

- **Capacity**: 3 bits per pixel (RGB channels only)
- **Maximum input example**: 1024×1024 provides 393,216 carrier bytes before message framing and encryption overhead
- **Formula**: `(width × height × 3) / 8 = bytes capacity`

If your message is too large:
1. Use a larger image
2. Enable compression with `--compress`
3. Reduce message size

The tool will show capacity utilization after successful encryption.

## Installation from Source

1. Clone the repository and navigate to it
2. Run `npm install` to install the dependencies
3. Run `npm install -g .` to install the CLI globally

> :warning: **This might cause an error** which can be resolved easily by using `sudo` with the command, **however**, using `sudo` with `npm` is **not recommended** because it might cause permission issues later. So instead put the code below in your .bashrc file and then run the above command again.

```bash
npm set prefix ~/.npm
PATH="$HOME/.npm/bin:$PATH"
PATH="./node_modules/.bin:$PATH"
```

4. Now you can use the CLI globally! Type `obscr` or `obscr --help` to get started.

## Examples

### Hiding a Secret Note
```bash
obscr encrypt -f vacation.png -o vacation.png
# Enter password and type your message
# Result: vacation.png now contains your hidden message
```

### Extracting the Secret Note
```bash
obscr decrypt -f vacation.png
# Enter the same password
# Your message is displayed
```

### Large Message with Compression
```bash
obscr encrypt -f large-photo.png -o secret.png --compress
# Compression can reduce message size by 50-90% depending on content
```

## Backward Compatibility

The hidden-message format is unchanged:
- Older images remain readable when they meet the supported PNG input policy.
- Compressed and uncompressed messages use the existing format.

## Technical Details

### File Format

Encrypted message format: `salt:nonce:ciphertext:tag[:compressed]`
- **salt**: 32 bytes (base64) - Random salt for PBKDF2
- **nonce**: 12 bytes (base64) - Random nonce for AES-GCM
- **ciphertext**: Variable length (base64) - Encrypted message
- **tag**: 16 bytes (base64) - GCM authentication tag
- **compressed**: Optional flag "1" if data was compressed

### Dependencies
- `crypto` (Node.js built-in): For AES-256-GCM encryption
- `zlib` (Node.js built-in): For optional compression
- `pako`: Bounded raw PNG inflation shared by the CLI and browser
- `crypto-js`: For SHA-512 hashing
- `yargs`: For CLI argument parsing
- `inquirer`: For interactive prompts
- `chalk`: For colored terminal output

> :warning: **Supports only PNG images**

## License

MIT © **_Obscr_**

## Author

Johannes Dragulanescu

## Contributing

Issues and pull requests are welcome at https://github.com/jdragulanescu/obscr
