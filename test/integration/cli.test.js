import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareImage, encodeImage, decodeImage } from "../../lib/steg.js";
import { cover } from "../fixtures/protected.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const cli = path.join(root, "bin/index.js");
let fixture;
const stripAnsi = (text) => text.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "");
let directory;
const children = new Set();

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "obscr-cli-"));
  fixture = path.join(directory, "cover.png");
  fs.writeFileSync(fixture, cover());
});
afterEach(() => {
  for (const child of children) child.kill("SIGKILL");
  children.clear();
  fs.rmSync(directory, { recursive: true, force: true });
});

function launch(command, args, extra = {}) {
  const environment = { ...process.env, ...extra.env, NO_COLOR: "1" };
  delete environment.FORCE_COLOR;
  const child = spawn(command, args, {
    cwd: directory,
    env: environment,
    stdio: ["pipe", "pipe", "pipe"],
  });
  children.add(child);
  let stdout = "";
  let stderr = "";
  let output = "";
  let closed = false;
  const listeners = new Set();
  const record = (stream, chunk) => {
    const text = chunk.toString();
    if (stream === "stdout") stdout += text;
    else stderr += text;
    output += text;
    for (const listener of listeners) listener();
  };
  child.stdout.on("data", (chunk) => record("stdout", chunk));
  child.stderr.on("data", (chunk) => record("stderr", chunk));
  const done = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`CLI did not exit promptly:\n${stripAnsi(output)}`));
    }, 10000);
    child.once("error", (failure) => { clearTimeout(timeout); reject(failure); });
    child.once("close", (code, signal) => {
      closed = true;
      clearTimeout(timeout);
      children.delete(child);
      for (const listener of listeners) listener();
      resolve({ code, signal, stdout, stderr, output: stripAnsi(output), raw: output });
    });
  });
  // A prompt wait may reject before a process timeout; do not leave an unhandled promise.
  done.catch(() => {});
  return {
    child,
    done,
    async respond(fragment, input) {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          listeners.delete(check);
          reject(new Error(`Prompt not reached: ${fragment}\n${stripAnsi(output)}`));
        }, 7000);
        const check = () => {
          if (stripAnsi(output).includes(fragment)) {
            clearTimeout(timeout);
            listeners.delete(check);
            resolve();
          } else if (closed) {
            clearTimeout(timeout);
            listeners.delete(check);
            reject(new Error(`CLI exited before ${fragment}:\n${stripAnsi(output)}`));
          }
        };
        listeners.add(check);
        check();
      });
      child.stdin.write(input);
    },
  };
}

function terminal(args, { columns = 80, rows = 24, env = {}, stdoutPath } = {}) {
  const command = ["/bin/sh", "-c",
    `stty cols "$1" rows "$2"; shift 2; exec "$@"${stdoutPath ? ' > "$OBSCR_TEST_STDOUT"' : ""}`,
    "obscr-test-terminal", String(columns), String(rows), process.execPath, cli, ...args];
  const bridge = "import os, pty, sys; sys.exit(os.waitstatus_to_exitcode(pty.spawn(sys.argv[1:])))";
  return launch("python3", ["-c", bridge, ...command], {
    env: { ...env, ...(stdoutPath ? { OBSCR_TEST_STDOUT: stdoutPath } : {}) },
  });
}

function editorFor(message) {
  const editor = path.join(directory, "public-editor.cjs");
  fs.writeFileSync(editor, `require("node:fs").writeFileSync(process.argv[2], ${JSON.stringify(message)});\n`);
  return { EDITOR: `${process.execPath} ${editor}`, VISUAL: `${process.execPath} ${editor}` };
}

async function encodeFixture(imagePath, message, password, outputPath) {
  const prepared = await prepareImage({ imagePath, message });
  if (!prepared.ok) return prepared;
  return encodeImage({ preparation: prepared.preparation, password, outputPath });
}

describe("CLI scripted entry points", () => {
  it.each([[[]], [["interactive"]], [["encrypt"]], [["decrypt"]]])("refuses %j without waiting for piped input", async (args) => {
    const session = launch(process.execPath, [cli, ...args, ...(["encrypt", "decrypt"].includes(args[0]) ? ["-f", fixture] : [])]);
    // Keep stdin open: refusal must not depend on EOF or a timeout.
    const result = await session.done;
    expect(result.code).toBe(1);
    expect(result.signal).toBeNull();
    expect(result.stdout).toBe("");
    expect(result.stderr).toMatch(/terminal/i);
    expect(fs.readdirSync(directory)).toEqual(["cover.png"]);
  });

  it.each(["encrypt", "decrypt"])("preserves existing output on scripted %s refusal", async (action) => {
    const output = path.join(directory, "existing");
    fs.writeFileSync(output, "keep this result");
    const result = await launch(process.execPath, [cli, action, "-f", fixture, "-o", output, "--quiet"]).done;
    expect(result.code).toBe(1);
    expect(result.stdout).toBe("");
    expect(fs.readFileSync(output, "utf8")).toBe("keep this result");
  });

  it.each([[[]], [["encrypt"]], [["decrypt"]]])("shows available help flags without prompting for %j", async (args) => {
    const result = await launch(process.execPath, [cli, ...args, "--help"]).done;
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("--help");
    expect(result.stdout).toContain("Ctrl+C");
    expect(result.stdout).toContain("--quiet");
    if (args.length) expect(result.stdout).toContain("--filename");
    expect(result.stdout).toMatch(/Earlier\s+protected\s+images\s+are\s+not\s+supported/);
    expect(result.raw).not.toContain("\u001b");
  });

  it("shows usable examples through a plain pipe", async () => {
    const examples = await launch(process.execPath, [cli, "examples"]).done;
    expect(examples.code).toBe(0);
    expect(examples.stdout).toContain("obscr encrypt -f");
    expect(examples.stdout).toContain("obscr decrypt -f");
    expect(examples.raw).not.toContain("\u001b");
  });

  it.each(["encrypt", "decrypt"])("fails a missing required file argument for %s", async (action) => {
    const result = await launch(process.execPath, [cli, action]).done;
    expect(result.code).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toMatch(/filename|\bf\b/);
  });

  it("does not print terminal control characters from invalid user arguments", async () => {
    const result = await launch(process.execPath, [cli, "unknown-\u001b[31m\r-command"]).done;
    expect(result.code).toBe(1);
    expect(result.raw).not.toMatch(/[\u001b\r]/);
  });
});

describe("CLI actual terminal workflows", () => {
  it.each([[80, 24], [120, 40]])("shows help and keys at %ix%i", async (columns, rows) => {
    const result = await terminal(["--help"], { columns, rows }).done;
    expect(result.code).toBe(0);
    expect(result.output).toContain("encrypt");
    expect(result.output).toContain("decrypt");
    expect(result.output).toContain("Ctrl+C");
    expect(result.raw).not.toMatch(/\u001b\[[\d;]*m/);
  });

  it("encrypts with editor/password prompts and decrypts the resulting file", async () => {
    const output = path.join(directory, "encoded.png");
    const message = "Public CLI round-trip text";
    const session = terminal(["encrypt", "-f", fixture, "-o", output, "--compress"], { env: editorFor(message) });
    await session.respond("Enter the message in your editor:", "\r");
    await session.respond("Enter password:", "public-password\r");
    await session.respond("Confirm password:", "public-password\r");
    const result = await session.done;
    expect(result.code).toBe(0);
    expect(result.output).toContain("Task: Encrypt");
    expect(result.output).toContain(output);
    expect(result.output).toMatch(/Original: \d+ bytes; stored: \d+ bytes; maximum: \d+ bytes/);
    expect(result.output).toContain("Compression used: no");
    expect(result.output).not.toContain("public-password");
    expect(await decodeImage({ imagePath: output, password: "public-password" })).toMatchObject({ ok: true, message });
  }, 15000);

  it.each(["   \n", "Public compressed text ".repeat(80)])("accepts nonempty public editor text and reports actual compression", async message => {
    const output = path.join(directory, "encoded.png");
    const session = terminal(["encrypt", "-f", fixture, "-o", output, "--compress"], { env: editorFor(message) });
    await session.respond("Enter the message in your editor:", "\r");
    await session.respond("Enter password:", " public-password \r");
    await session.respond("Confirm password:", " public-password \r");
    const result = await session.done;
    expect(result.code).toBe(0);
    expect(result.output).toContain(`Compression used: ${message.length > 512 ? "yes" : "no"}`);
    expect(await decodeImage({ imagePath: output, password: " public-password " })).toMatchObject({ ok: true, message });
  }, 15000);

  it.each([
    [64, 64, "Public text", "no protected-message frame capacity"],
    [256, 168, "Public text", "only an empty message"],
    [512, 512, "x".repeat(513), "does not fit"],
  ])("refuses preparation at %ix%i before asking for a password", async (width, height, message, reason) => {
    fs.writeFileSync(fixture, cover(width, height));
    const output = path.join(directory, "encoded.png");
    const session = terminal(["encrypt", "-f", fixture, "-o", output], { env: editorFor(message) });
    await session.respond("Enter the message in your editor:", "\r");
    const result = await session.done;
    expect(result.code).toBe(1);
    expect(result.output).toContain(reason);
    expect(result.output).not.toMatch(/Enter password:|Deriving keys|Saved PNG:/);
    expect(fs.existsSync(output)).toBe(false);
  }, 15000);

  it("announces authenticated empty text while leaving piped result bytes empty", async () => {
    const encoded = path.join(directory, "empty.png");
    const captured = path.join(directory, "stdout.txt");
    expect(await encodeFixture(fixture, "", "public-password", encoded)).toMatchObject({ ok: true });
    const session = terminal(["decrypt", "-f", encoded, "--quiet"], { stdoutPath: captured });
    await session.respond("Enter password:", "public-password\r");
    const result = await session.done;
    expect(result.code).toBe(0);
    expect(result.output).toContain("Authenticated message recovered: empty text.");
    expect(fs.readFileSync(captured, "utf8")).toBe("");
  }, 15000);

  it("recovers text through a stdout pipe without mixing prompts or progress into it", async () => {
    const encoded = path.join(directory, "input.png");
    const captured = path.join(directory, "stdout.txt");
    expect(await encodeFixture(fixture, "Public text\nsecond line", "public-password", encoded)).toMatchObject({ ok: true });
    const session = terminal(["decrypt", "-f", encoded, "--verbose"], { stdoutPath: captured });
    await session.respond("Enter password:", "public-password\r");
    expect((await session.done).code).toBe(0);
    expect(fs.readFileSync(captured, "utf8")).toBe("Public text\nsecond line");
  }, 15000);

  it("escapes recovered terminal controls without changing text saved to a file", async () => {
    const encoded = path.join(directory, "input.png");
    const captured = path.join(directory, "stdout.txt");
    const message = "Public \u001b[31mred\rtext\u009b0m\u202e";
    expect(await encodeFixture(fixture, message, "public-password", encoded)).toMatchObject({ ok: true });
    const session = terminal(["decrypt", "-f", encoded, "--quiet"], { stdoutPath: captured });
    await session.respond("Enter password:", "public-password\r");
    expect((await session.done).code).toBe(0);
    const printed = fs.readFileSync(captured, "utf8");
    expect(printed).not.toMatch(/[\u001b\r\u009b\u202e]/);
    expect(printed).toContain("\\u001b[31m");
    const saved = path.join(directory, "message.txt");
    expect(await decodeImage({ imagePath: encoded, password: "public-password", outputPath: saved })).toMatchObject({ ok: true });
    expect(fs.readFileSync(saved, "utf8")).toBe(message);
  }, 15000);

  it("runs the guided decrypt action and saves its actual result", async () => {
    const encoded = path.join(directory, "input.png");
    const saved = path.join(directory, "message.txt");
    expect(await encodeFixture(fixture, "Public menu text", "public-password", encoded)).toMatchObject({ ok: true });
    const session = terminal(["interactive"]);
    await session.respond("Choose an action:", "\u001b[B\r");
    await session.respond("Path to the PNG image:", `${encoded}\r`);
    await session.respond("Output text path", `${saved}\r`);
    await session.respond("Enter password:", "public-password\r");
    const result = await session.done;
    expect(result.code).toBe(0);
    expect(result.output).toContain("Task: Decrypt");
    expect(fs.readFileSync(saved, "utf8")).toBe("Public menu text");
  }, 15000);

  it("runs the guided encrypt action without bypassing PNG admission", async () => {
    const saved = path.join(directory, "guided.png");
    const session = terminal(["interactive"], { env: editorFor("Public guided text") });
    await session.respond("Choose an action:", "\r");
    await session.respond("Path to the PNG image:", `${fixture}\r`);
    await session.respond("Output PNG path:", `${saved}\r`);
    await session.respond("Compress the message?", "n\r");
    await session.respond("Enter the message in your editor:", "\r");
    await session.respond("Enter password:", "public-password\r");
    await session.respond("Confirm password:", "public-password\r");
    expect((await session.done).code).toBe(0);
    expect(await decodeImage({ imagePath: saved, password: "public-password" })).toMatchObject({ ok: true, message: "Public guided text" });
  }, 15000);

  it.each([
    ["\u001b[B\u001b[B\r", true],
    ["\u001b[B\u001b[B\u001b[B\r", false],
  ])("leaves the guided menu without starting an image operation", async (keys, examples) => {
    const session = terminal([]);
    await session.respond("Choose an action:", keys);
    const result = await session.done;
    expect(result.code).toBe(0);
    if (examples) expect(result.output).toContain("obscr encrypt -f");
    expect(fs.readdirSync(directory)).toEqual(["cover.png"]);
  }, 15000);

  it("keeps an existing file when a terminal user declines replacement", async () => {
    const encoded = path.join(directory, "input.png");
    const saved = path.join(directory, "existing.txt");
    expect(await encodeFixture(fixture, "Public text", "public-password", encoded)).toMatchObject({ ok: true });
    fs.writeFileSync(saved, "previous result");
    const session = terminal(["decrypt", "-f", encoded, "-o", saved]);
    await session.respond("Enter password:", "public-password\r");
    await session.respond("only after success?", "n\r");
    const result = await session.done;
    expect(result.output).not.toContain("Saved message:");
    expect(fs.readFileSync(saved, "utf8")).toBe("previous result");
  }, 15000);

  it("reports a public PNG failure after prompts without recognition details or partial output", async () => {
    const invalid = path.join(directory, "invalid.png");
    const saved = path.join(directory, "existing.txt");
    fs.writeFileSync(invalid, "not a PNG");
    fs.writeFileSync(saved, "previous result");
    const session = terminal(["decrypt", "-f", invalid, "-o", saved, "--verbose"]);
    await session.respond("Enter password:", "public-password\r");
    await session.respond("only after success?", "y\r");
    const result = await session.done;
    expect(result.output).toMatch(/PNG/);
    expect(result.output).not.toMatch(/authenticated message|Saved message:/);
    expect(result.output).not.toContain("public-password");
    expect(fs.readFileSync(saved, "utf8")).toBe("previous result");
  }, 15000);

  it("escapes a long output path while preserving the real filename", async () => {
    const encoded = path.join(directory, "input.png");
    const saved = path.join(directory, `${"long-name-".repeat(12)}\u001b[31m\r.txt`);
    const captured = path.join(directory, "stdout.txt");
    expect(await encodeFixture(fixture, "Public text", "public-password", encoded)).toMatchObject({ ok: true });
    const session = terminal(["decrypt", "-f", encoded, "-o", saved], { stdoutPath: captured });
    await session.respond("Enter password:", "public-password\r");
    expect((await session.done).code).toBe(0);
    expect(fs.readFileSync(saved, "utf8")).toBe("Public text");
    const printed = fs.readFileSync(captured, "utf8");
    expect(printed).not.toMatch(/[\u001b\r]/);
    expect(printed).toContain("\\u001b[31m\\u000d.txt");
  }, 15000);

  it("does not claim success or replace output for a wrong password", async () => {
    const encoded = path.join(directory, "input.png");
    const saved = path.join(directory, "existing.txt");
    expect(await encodeFixture(fixture, "Public text", "public-password", encoded)).toMatchObject({ ok: true });
    fs.writeFileSync(saved, "previous result");
    const session = terminal(["decrypt", "-f", encoded, "-o", saved, "--verbose"]);
    await session.respond("Enter password:", "different-password\r");
    await session.respond("only after success?", "y\r");
    const result = await session.done;
    expect(result.output).toMatch(/Could not recover an authenticated message/);
    expect(result.output).not.toMatch(/Saved message:|salt|ciphertext|authentication tag|different-password/);
    expect(fs.readFileSync(saved, "utf8")).toBe("previous result");
  }, 15000);

  it("refuses empty editor text before asking for a password", async () => {
    const saved = path.join(directory, "result.png");
    const session = terminal(["encrypt", "-f", fixture, "-o", saved], { env: editorFor("") });
    await session.respond("Enter the message in your editor:", "\r");
    const result = await session.done;
    expect(result.output).not.toContain("Saved PNG:");
    expect(fs.existsSync(saved)).toBe(false);
  }, 15000);

  it("keeps the prepared image when correcting only password confirmation", async () => {
    const saved = path.join(directory, "result.png");
    const session = terminal(["encrypt", "-f", fixture, "-o", saved], { env: editorFor("Public text") });
    await session.respond("Enter the message in your editor:", "\r");
    await session.respond("Enter password:", "public-password\r");
    await session.respond("Confirm password:", "wrong-password\r");
    await session.respond("Passwords do not match.", "public-password\r");
    const result = await session.done;
    expect(result.code).toBe(0);
    expect(result.output.match(/Original: /g)).toHaveLength(1);
    expect(await decodeImage({ imagePath: saved, password: "public-password" })).toMatchObject({ ok: true, message: "Public text" });
  }, 15000);

  it("refuses a password above the UTF-8 limit then accepts an exact boundary password", async () => {
    const saved = path.join(directory, "result.png");
    const session = terminal(["encrypt", "-f", fixture, "-o", saved], { env: editorFor("Public text") });
    await session.respond("Enter the message in your editor:", "\r");
    await session.respond("Enter password:", `${"é".repeat(513)}\r`);
    await session.respond("Password must be at most 1,024 UTF-8 bytes.", `${"é".repeat(512)}\r`);
    await session.respond("Confirm password:", `${"é".repeat(512)}\r`);
    expect((await session.done).code).toBe(0);
    expect(await decodeImage({ imagePath: saved, password: "é".repeat(512) })).toMatchObject({ ok: true, message: "Public text" });
  }, 15000);

  it("cancels a prompt with Ctrl-C without writing result bytes", async () => {
    const captured = path.join(directory, "stdout.txt");
    const session = terminal(["decrypt", "-f", fixture], { stdoutPath: captured });
    await session.respond("Enter password:", "\u0003");
    const result = await session.done;
    expect(result.output).toMatch(/cancelled/i);
    expect(fs.readFileSync(captured, "utf8")).toBe("");
  }, 15000);

  it("cancels worker processing with Ctrl-C and leaves an existing output unchanged", async () => {
    const input = path.join(directory, "maximum.png");
    const saved = path.join(directory, "existing.png");
    fs.writeFileSync(input, cover(1024, 1024));
    fs.writeFileSync(saved, "previous result");
    const session = terminal(["encrypt", "-f", input, "-o", saved, "--verbose"], { env: editorFor("Public cancellation text") });
    await session.respond("Enter the message in your editor:", "\r");
    await session.respond("Enter password:", "public-password\r");
    await session.respond("Confirm password:", "public-password\r");
    await session.respond("only after success?", "y\r");
    await session.respond("Deriving keys", "\u0003");
    const result = await session.done;
    expect(result.output).toMatch(/cancelled/i);
    expect(result.output).not.toContain("Saved PNG:");
    expect(fs.readFileSync(saved, "utf8")).toBe("previous result");
    expect(fs.readdirSync(directory).some((name) => name.startsWith(".obscr-"))).toBe(false);
  }, 15000);
});
