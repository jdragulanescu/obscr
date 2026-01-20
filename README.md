<p align="center">

 </p>
 <p align="center">
   <img  src="https://img.shields.io/badge/license-MIT-green">
 <img  src="https://img.shields.io/badge/build-passing-brightgreen">
   <img  src="https://img.shields.io/badge/version-0.1.2-orange">
   <img  src="https://img.shields.io/badge/npm-v8.3.1-blue">
  <img  src="https://img.shields.io/badge/node-v16.14.0-yellow">
 </p>
 <br>
<p align="center">Encrypt and hide your secure data using AES-256-GCM encryption combined with steganography</p>
<br>

---

## Features

### Security
- **Strong Encryption**: Uses AES-256-GCM for message encryption
- **Steganography**: Hides encrypted messages in PNG images using LSB (Least Significant Bit) technique
- **Compression**: Optional gzip compression to fit larger messages in smaller images (50-90% reduction)
- **Password-Based Key Derivation**: PBKDF2 with SHA-512 for secure key generation (65,535 iterations)
- **Data Obfuscation**: Password-seeded scrambling of data bits within the image
- **Backward Compatible**: Can decrypt messages from older versions

### User Experience
- **Interactive Mode**: Guided workflow with menu-driven interface for beginners
- **Progress Indicators**: Real-time spinners showing encryption/decryption progress
- **Visual Feedback**: Color-coded messages, icons, and beautiful boxed outputs
- **Verbose Mode**: Detailed technical information for debugging and learning
- **Quiet Mode**: Minimal output perfect for scripting and automation
- **Confirmation Prompts**: Prevents accidental file overwrites
- **Smart Validation**: Input validation with helpful error messages
- **Usage Examples**: Built-in examples command for quick reference

## NPM package

```bash
npm install -g obscr
```

## Usage

### Interactive Mode (Recommended for Beginners)

```bash
obscr interactive
```

Launches a guided workflow with menu-driven interface. Perfect for first-time users!

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

# Quiet mode for scripts
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
- `-q, --quiet`: Output only the decrypted message (useful for piping)

**Examples:**
```bash
# Display message with nice formatting
obscr decrypt -f encoded.png

# Save to file
obscr decrypt -f encoded.png -o message.txt

# Quiet mode for piping to other commands
obscr decrypt -f secret.png --quiet | grep "password"
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

## Image Capacity

The tool automatically checks if your message fits in the chosen image:

- **Capacity**: 3 bits per pixel (RGB channels only)
- **Example**: A 1920x1080 image can hold ~777 KB of encrypted data
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

This version maintains full backward compatibility:
- Can decrypt images created with older versions
- Automatically detects and handles compressed vs. uncompressed messages

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
- `pngjs`: For PNG image manipulation
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
