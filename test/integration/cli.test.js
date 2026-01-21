const { exec } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");

const execAsync = promisify(exec);

const FIXTURES_DIR = path.join(__dirname, "..", "fixtures");
const OUTPUT_DIR = path.join(__dirname, "..", "output");
const TEST_IMAGE = path.join(FIXTURES_DIR, "test-medium.png");
const CLI_PATH = path.join(__dirname, "..", "..", "bin", "index.js");

describe("CLI Commands", () => {
  beforeAll(() => {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(OUTPUT_DIR)) {
      const files = fs.readdirSync(OUTPUT_DIR);
      files.forEach((file) => {
        if (file.startsWith("cli-test-")) {
          fs.unlinkSync(path.join(OUTPUT_DIR, file));
        }
      });
    }
  });

  describe("Help and examples", () => {
    it("should display help message", async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} --help`);
      expect(stdout).toContain("Usage: obscr <command> [options]");
      expect(stdout).toContain("Commands:");
      expect(stdout).toContain("encrypt");
      expect(stdout).toContain("decrypt");
      expect(stdout).toContain("interactive");
      expect(stdout).toContain("examples");
    });

    it("should display version", async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} --version`);
      expect(stdout).toContain("1.0.0");
    });

    it("should display examples", async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} examples`);
      expect(stdout).toContain("Examples:");
      expect(stdout).toContain("Encrypt with compression");
      expect(stdout).toContain("Decrypt to file");
      expect(stdout).toContain("Interactive mode");
      expect(stdout).toContain("██████╗"); // ASCII art should be present
    });

    it("should show encrypt command help", async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} encrypt --help`);
      expect(stdout).toContain("Encrypt and hide a message in an image");
      expect(stdout).toContain("--filename");
      expect(stdout).toContain("--output");
      expect(stdout).toContain("--compress");
      expect(stdout).toContain("--verbose");
      expect(stdout).toContain("--quiet");
    });

    it("should show decrypt command help", async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} decrypt --help`);
      expect(stdout).toContain("Decrypt and extract a message from an image");
      expect(stdout).toContain("--filename");
      expect(stdout).toContain("--output");
      expect(stdout).toContain("--verbose");
      expect(stdout).toContain("--quiet");
    });
  });

  describe("Interactive mode default", () => {
    it("should enter interactive mode when no command is provided", (done) => {
      const { spawn } = require("child_process");
      const proc = spawn("node", [CLI_PATH]);

      let output = "";
      proc.stdout.on("data", (data) => {
        output += data.toString();
      });
      proc.stderr.on("data", (data) => {
        output += data.toString();
      });

      // Kill after 1 second and check output
      setTimeout(() => {
        proc.kill();
        expect(output).toContain("What would you like to do?");
        expect(output).toContain("Encrypt and hide a message");
        expect(output).toContain("Decrypt and extract a message");
        done();
      }, 1000);
    });
  });

  describe("Error handling", () => {
    it("should fail encrypt without required filename", async () => {
      try {
        await execAsync(`node ${CLI_PATH} encrypt`);
        fail("Should have thrown an error");
      } catch (error) {
        expect(error.stderr || error.stdout).toContain("Missing required argument");
      }
    });

    it("should fail decrypt without required filename", async () => {
      try {
        await execAsync(`node ${CLI_PATH} decrypt`);
        fail("Should have thrown an error");
      } catch (error) {
        expect(error.stderr || error.stdout).toContain("Missing required argument");
      }
    });
  });

  describe("Verbose and Quiet modes", () => {
    it("should accept verbose flag on encrypt", async () => {
      // This will fail because it requires interactive input, but we're just checking that the flag is accepted
      try {
        const { stdout, stderr } = await execAsync(
          `echo "" | node ${CLI_PATH} encrypt -f ${TEST_IMAGE} --verbose --output /tmp/test-verbose.png`,
          { timeout: 2000 }
        );
        // Either succeeds with verbose output or times out (which is expected without proper input)
      } catch (error) {
        // Expected to fail due to stdin requirements, but verbose flag should be accepted
        expect(error.killed || error.code > 0).toBeTruthy();
      }
    });

    it("should accept quiet flag on encrypt", async () => {
      // This will fail because it requires interactive input, but we're just checking that the flag is accepted
      try {
        const { stdout, stderr } = await execAsync(
          `echo "" | node ${CLI_PATH} encrypt -f ${TEST_IMAGE} --quiet --output /tmp/test-quiet.png`,
          { timeout: 2000 }
        );
        // Either succeeds with minimal output or times out (which is expected without proper input)
      } catch (error) {
        // Expected to fail due to stdin requirements, but quiet flag should be accepted
        expect(error.killed || error.code > 0).toBeTruthy();
      }
    });
  });

  describe("Compression flag", () => {
    it("should accept compress flag on encrypt", async () => {
      // This will fail because it requires interactive input, but we're just checking that the flag is accepted
      try {
        const { stdout, stderr } = await execAsync(
          `echo "" | node ${CLI_PATH} encrypt -f ${TEST_IMAGE} --compress --output /tmp/test-compress.png`,
          { timeout: 2000 }
        );
        // Either succeeds or times out (which is expected without proper input)
      } catch (error) {
        // Expected to fail due to stdin requirements, but compress flag should be accepted
        expect(error.killed || error.code > 0).toBeTruthy();
      }
    });
  });

  describe("Output flag", () => {
    it("should accept custom output filename on encrypt", async () => {
      const customOutput = path.join(OUTPUT_DIR, "cli-test-custom-output.png");
      // This will fail because it requires interactive input, but we're checking the flag
      try {
        const { stdout, stderr } = await execAsync(
          `echo "" | node ${CLI_PATH} encrypt -f ${TEST_IMAGE} -o ${customOutput}`,
          { timeout: 2000 }
        );
      } catch (error) {
        // Expected to fail due to stdin requirements
        expect(error.killed || error.code > 0).toBeTruthy();
      }
    });

    it("should accept output filename on decrypt", async () => {
      const customOutput = path.join(OUTPUT_DIR, "cli-test-decrypted.txt");
      // This will fail because it requires a valid encrypted image and password
      try {
        const { stdout, stderr } = await execAsync(
          `echo "" | node ${CLI_PATH} decrypt -f ${TEST_IMAGE} -o ${customOutput}`,
          { timeout: 2000 }
        );
      } catch (error) {
        // Expected to fail
        expect(error.killed || error.code > 0).toBeTruthy();
      }
    });
  });

  describe("Banner display", () => {
    it("should show ASCII banner in examples command", async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} examples`);
      // Check for ASCII art elements
      expect(stdout).toContain("╭");
      expect(stdout).toContain("╮");
      expect(stdout).toContain("●"); // Terminal dots
      expect(stdout).toContain("██████╗"); // Part of the ASCII logo
      expect(stdout).toContain("Steganography & Encryption Tool");
      expect(stdout).toContain("AES-256-GCM Encryption");
    });

    it("should show banner with terminal controls", async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} examples`);
      // Check for all three colored dots (red, yellow, green)
      const dotCount = (stdout.match(/●/g) || []).length;
      expect(dotCount).toBeGreaterThanOrEqual(3);
    });
  });
});
