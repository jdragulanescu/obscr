import { jest, beforeAll, beforeEach, afterEach, afterAll, describe, test, expect } from "@jest/globals";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { downloadBlob as browserDownload, admitImage as realAdmitImage, generateImageDiff as realGenerateImageDiff } from "../../app/src/lib/steg.js";
import { Worker as NodeWorker } from "node:worker_threads";
import { PNG } from "pngjs";
import { cover } from "../fixtures/protected.js";

const adapter = {
  admitImage: jest.fn(),
  readImageBytes: jest.fn(),
  generateImageDiff: jest.fn(),
  downloadBlob: jest.fn(),
};
jest.unstable_mockModule("../../app/src/lib/steg.js", () => adapter);
const protectedAdapter = {
  prepareEncode: jest.fn(), encode: jest.fn(), decode: jest.fn(), discard: jest.fn(),
};
jest.unstable_mockModule("../../app/src/lib/protected.js", () => protectedAdapter);

let dom, createRoot, EncryptForm, DecryptForm, ImageDiffForm, App;
let root, container, calls;
const savedGlobals = new Map();
const globalNames = ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "HTMLTextAreaElement", "Event", "MouseEvent", "KeyboardEvent", "HashChangeEvent", "IS_REACT_ACT_ENVIRONMENT"];
let savedRevoke;

beforeAll(async () => {
  dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://obscr.test/" });
  for (const name of globalNames) {
    savedGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    const value = name === "IS_REACT_ACT_ENVIRONMENT" ? true : dom.window[name];
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  // jsdom does not implement the native dialog API. Escape reaches React as cancel.
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  dom.window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  dom.window.scrollTo = jest.fn();
  savedRevoke = Object.getOwnPropertyDescriptor(URL, "revokeObjectURL");
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, writable: true, value: jest.fn() });
  ({ createRoot } = await import("react-dom/client"));
  ({ EncryptForm } = await import("../../app/src/components/EncryptForm.jsx"));
  ({ DecryptForm } = await import("../../app/src/components/DecryptForm.jsx"));
  ({ ImageDiffForm } = await import("../../app/src/components/ImageDiffForm.jsx"));
  ({ App } = await import("../../app/src/App.jsx"));
});

beforeEach(() => {
  jest.useFakeTimers();
  calls = [];
  adapter.readImageBytes.mockReset().mockResolvedValue(new Uint8Array([1, 2, 3]));
  protectedAdapter.discard.mockReset();
  for (const [name, fn] of Object.entries({ ...adapter, ...protectedAdapter })) {
    if (name === "readImageBytes" || name === "discard") continue;
    fn.mockReset();
    if (name === "downloadBlob") continue;
    fn.mockImplementation((...args) => {
      const { signal } = args.at(-1);
      const call = { name, args, signal, aborted: false };
      signal.addEventListener("abort", () => { call.aborted = true; }, { once: true });
      // Deliberately allow a late reply after abort to test the consumer's ownership.
      const promise = new Promise((resolve) => { call.resolve = resolve; });
      calls.push(call);
      return promise;
    });
  }
  URL.revokeObjectURL.mockClear();
  window.history.replaceState(null, "", "/");
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container.remove();
  jest.useRealTimers();
});

afterAll(() => {
  if (savedRevoke) Object.defineProperty(URL, "revokeObjectURL", savedRevoke);
  else delete URL.revokeObjectURL;
  dom.window.close();
  for (const [name, descriptor] of savedGlobals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
});

async function render(Component) {
  await act(async () => root.render(React.createElement(Component, { requestClear: (clear) => clear() })));
}
function button(text) {
  const found = [...container.querySelectorAll("button")].find((node) => node.textContent === text);
  expect(found).toBeDefined();
  return found;
}
async function click(node) {
  await act(async () => { node.focus(); node.click(); });
}
async function type(selector, value) {
  const node = container.querySelector(selector);
  const prototype = node instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, "value").set.call(node, value);
    node.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function pick(name, index = 0, file = new dom.window.File(["test input"], name, { type: "image/png" })) {
  const input = container.querySelectorAll('input[type="file"]')[index];
  await act(async () => {
    Object.defineProperty(input, "files", { configurable: true, value: [file] });
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  return calls.at(-1);
}
async function reply(call, result) {
  await act(async () => call.resolve(result));
}
async function admit(name = "source.png", index = 0, dimensions = { width: 8, height: 8 }) {
  const call = await pick(name, index);
  await reply(call, { ok: true, ...dimensions });
}
async function submit() {
  await act(async () => container.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  return calls.at(-1);
}
async function capacity(result = { ok: true, preparation: {}, originalBytes: 14, storedBytes: 14, maxStoredBytes: 512, compressionUsed: false, hasFrameCapacity: true, fits: true, metadataNotice: "Personal metadata is removed." }) {
  await act(async () => jest.advanceTimersByTime(300));
  expect(calls.at(-1).name).toBe("prepareEncode");
  await reply(calls.at(-1), result);
}
const preview = () => ({ ok: true, original: "blob:original", encoded: "blob:encoded", diff: "blob:diff", averageDifference: 0 });

describe("real browser components", () => {
  test("compression displays its actual use and empty creation does not prepare", async () => {
    await render(EncryptForm);
    await admit();
    await type(".password-input-field", "public-password");
    expect(button("Encrypt & Hide").disabled).toBe(true);
    await act(async () => jest.advanceTimersByTime(300));
    expect(protectedAdapter.prepareEncode).not.toHaveBeenCalled();
    await type("textarea", "public ".repeat(200));
    await click(container.querySelector('input[type="checkbox"]'));
    await capacity({ ok: true, preparation: {}, originalBytes: 1400, storedBytes: 40, maxStoredBytes: 512, compressionUsed: true, hasFrameCapacity: true, fits: true, metadataNotice: "Metadata notice." });
    expect(protectedAdapter.prepareEncode.mock.calls.at(-1)[0]).toEqual({
      pngBytes: new Uint8Array([1, 2, 3]), message: "public ".repeat(200), compress: true,
    });
    expect(container.textContent).toContain("Original: 1400 bytes");
    expect(container.textContent).toContain("Stored: 40 bytes");
    expect(container.textContent).toContain("Compression used: yes");
    expect(container.textContent).toContain("Metadata notice.");
    expect(button("Encrypt & Hide").disabled).toBe(false);
  });
  test("a bounded-read failure clears the password without sending a recovery request", async () => {
    await render(DecryptForm);
    await admit();
    await type(".password-input-field", "public-password");
    adapter.readImageBytes.mockRejectedValueOnce(Object.assign(new Error("Could not read the image. Select it again."), { code: "READ_FAILED" }));
    await submit();
    expect(protectedAdapter.decode).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Could not read the image. Select it again.");
    expect(container.querySelector(".password-input-field").value).toBe("");
    expect(container.querySelector(".password-input-field").disabled).toBe(false);
    expect(container.textContent).toContain("source.png");
  });

  test("safe progress keeps recovery locked, delays its spinner and ignores late stages", async () => {
    await render(App);
    await click(container.querySelector("#task-decrypt"));
    await admit();
    await type(".password-input-field", "public-password");
    const pending = await submit();
    expect(container.querySelector(".spinner")).toBeNull();
    await act(async () => pending.args[1].onProgress("deriving keys"));
    expect(container.textContent).toContain("deriving keys");
    expect(container.querySelector(".password-input-field").disabled).toBe(true);
    expect(container.querySelector("#task-encrypt").disabled).toBe(true);
    await act(async () => jest.advanceTimersByTime(1000));
    expect(container.querySelector(".spinner")).not.toBeNull();
    await click(button("Cancel"));
    await act(async () => pending.args[1].onProgress("preparing result"));
    expect(container.textContent).not.toContain("preparing result");
    expect(container.querySelector(".spinner")).toBeNull();
    await type(".password-input-field", "retry");
    expect(button("Decrypt & Extract").disabled).toBe(false);
  });
  test.each(["message", "compression", "image"])("%s edits release the retained preparation and remove current fit", async (change) => {
    await render(EncryptForm);
    await admit();
    await type("textarea", "public");
    await capacity();
    await type(".password-input-field", "keep password until terminal outcome");
    if (change === "message") await type("textarea", "new public text");
    else if (change === "compression") await click(container.querySelector('input[type="checkbox"]'));
    else await pick("replacement.png");
    expect(protectedAdapter.discard).toHaveBeenCalledTimes(1);
    expect(container.querySelector(".capacity-box")).toBeNull();
    expect(button("Encrypt & Hide").disabled).toBe(true);
  });

  test.each(["message", "image"])("%s replacement waits for discard before accepting new capacity", async (change) => {
    await render(EncryptForm);
    await admit();
    await type("textarea", "public");
    await capacity();
    await type(".password-input-field", "public-password");
    let releaseDiscard;
    protectedAdapter.discard.mockImplementationOnce(() => new Promise(resolve => { releaseDiscard = resolve; }));
    if (change === "image") await pick("replacement.png");
    else await type("textarea", "replacement text");
    await act(async () => jest.advanceTimersByTime(300));
    expect(adapter.admitImage).toHaveBeenCalledTimes(1);
    expect(protectedAdapter.prepareEncode).toHaveBeenCalledTimes(1);
    expect(container.querySelector(".capacity-box")).toBeNull();
    expect(button("Encrypt & Hide").disabled).toBe(true);
    await act(async () => releaseDiscard());
    if (change === "image") await reply(calls.at(-1), { ok: true, width: 640, height: 640 });
    await capacity();
    expect(button("Encrypt & Hide").disabled).toBe(false);
    expect(container.textContent).toContain("Maximum stored: 512 bytes");
  });

  test("cancelling while discard is pending rejects late capacity and allows retry", async () => {
    await render(EncryptForm);
    await admit();
    await type("textarea", "public");
    await capacity();
    let releaseDiscard;
    protectedAdapter.discard.mockImplementationOnce(() => new Promise(resolve => { releaseDiscard = resolve; }));
    await type("textarea", "replacement text");
    await act(async () => jest.advanceTimersByTime(300));
    await click(button("Cancel"));
    await act(async () => releaseDiscard());
    await reply(calls.at(-1), { ok: true, preparation: {}, originalBytes: 16, storedBytes: 16, maxStoredBytes: 512, hasFrameCapacity: true, fits: true, compressionUsed: false });
    expect(container.querySelector(".capacity-box")).toBeNull();
    expect(container.querySelector("textarea").value).toBe("replacement text");
    expect(button("Encrypt & Hide").disabled).toBe(true);
    expect(protectedAdapter.discard).toHaveBeenCalledTimes(2);
    await click(button("Check capacity"));
    await capacity();
    await type(".password-input-field", "public-password");
    expect(button("Encrypt & Hide").disabled).toBe(false);
  });

  test("cancelled preparation releases a late handle and unchanged inputs can restart", async () => {
    await render(EncryptForm);
    await admit();
    await type("textarea", "unchanged public text");
    await type(".password-input-field", "public-password");
    await act(async () => jest.advanceTimersByTime(300));
    const pending = calls.at(-1);
    await click(button("Cancel"));
    await reply(pending, { ok: true, preparation: {}, originalBytes: 21, storedBytes: 21, maxStoredBytes: 512, hasFrameCapacity: true, fits: true, compressionUsed: false });
    expect(protectedAdapter.discard).toHaveBeenCalledTimes(1);
    expect(container.querySelector(".capacity-box")).toBeNull();
    expect(container.querySelector(".password-input-field").value).toBe("");
    await click(button("Check capacity"));
    await capacity();
    await type(".password-input-field", "restart");
    expect(button("Encrypt & Hide").disabled).toBe(false);
  });

  test("complete output keeps its current comparison and password edits remove both", async () => {
    await render(EncryptForm);
    await admit();
    await type("textarea", "public");
    await capacity();
    await type(".password-input-field", "public-password");
    await reply(await submit(), { ok: true, pngBytes: new Uint8Array([1, 2, 3]) });
    expect(container.querySelector(".capacity-box")).toBeNull();
    await click(button("Generate visual comparison"));
    const pending = calls.at(-1);
    expect(pending.name).toBe("generateImageDiff");
    expect(pending.args[0].name).toBe("source.png");
    expect(await pending.args[1].arrayBuffer()).toEqual(new Uint8Array([1, 2, 3]).buffer);
    await reply(pending, preview());
    expect(container.querySelectorAll("img")).toHaveLength(3);
    await type(".password-input-field", "changed");
    expect(container.querySelectorAll("img")).toHaveLength(0);
    expect(container.textContent).not.toContain("Download encoded image");
    expect(URL.revokeObjectURL.mock.calls).toEqual([["blob:original"], ["blob:encoded"], ["blob:diff"]]);
  });

  test.each(["RESOURCE_FAILED", "RECOVERY_FAILED", "PNG_INVALID"])("recovery %s preserves the image but clears the password and allows restart", async (code) => {
    await render(DecryptForm);
    await admit();
    await type(".password-input-field", "first");
    await reply(await submit(), { ok: false, code, error: "Public operation failure." });
    expect(container.querySelector(".password-input-field").value).toBe("");
    expect(container.textContent).toContain("source.png");
    expect(container.textContent).toContain("Public operation failure.");
    expect(container.textContent).not.toContain("Download message");
    await type(".password-input-field", "second");
    expect(button("Decrypt & Extract").disabled).toBe(false);
  });
  test("PNG policy is disclosed before preparation and remains beside the prepared metadata notice", async () => {
    adapter.readImageBytes.mockResolvedValue(Uint8Array.from(cover()));
    await render(EncryptForm);
    const expectPolicy = () => {
      expect(container.textContent).toMatch(/only opaque, noninterlaced RGB\/RGBA8 PNGs/i);
      expect(container.textContent).toContain("Personal metadata is removed");
      expect(container.textContent).toContain("only approved rendering metadata is preserved");
      expect(container.textContent).toContain("Some otherwise valid PNGs are rejected");
      expect(container.textContent).toContain("does not prove concealment");
    };
    expectPolicy();
    expect(container.querySelector(".capacity-box")).toBeNull();
    await admit();
    await type("textarea", "Public guidance text");
    await capacity({ ok: true, preparation: {}, originalBytes: 20, storedBytes: 20, maxStoredBytes: 395, compressionUsed: false, hasFrameCapacity: true, fits: true, metadataNotice: "Prepared image metadata notice." });
    expectPolicy();
    expect(container.textContent).toContain("Prepared image metadata notice.");
    expect(protectedAdapter.encode).not.toHaveBeenCalled();
    await type("textarea", "Changed public text");
    await capacity({ ok: false, code: "RESOURCE_FAILED", error: "Protected processing is unavailable." });
    expectPolicy();
    expect(container.textContent).toContain("Protected processing is unavailable.");
  });

  test.each([
    ["RECOVERY_FAILED", "Could not recover an authenticated message. The password may be wrong, or the image may be damaged or changed."],
    ["PNG_INVALID", "The PNG data is truncated or malformed."],
    ["RESOURCE_FAILED", "Protected processing is unavailable."],
  ])("recovery guidance precedes submission and does not diagnose a %s input", async (code, error) => {
    adapter.readImageBytes.mockResolvedValue(Uint8Array.from(cover()));
    await render(DecryptForm);
    const expectGuidance = () => {
      const warning = container.querySelector('[aria-labelledby$="-format"]');
      expect(warning).not.toBeNull();
      expect(warning.textContent).toContain("The new format cannot read old images.");
      expect(container.textContent).toContain("Old images and plain images can produce the same recovery failure.");
    };
    expectGuidance();
    expect(protectedAdapter.decode).not.toHaveBeenCalled();
    await admit();
    await type(".password-input-field", "public-password");
    expectGuidance();
    await reply(await submit(), { ok: false, code, error });
    expectGuidance();
    expect(container.querySelector('[role="alert"]').textContent).toBe(error);
    expect(container.textContent).not.toContain("Download message");
    if (code !== "RECOVERY_FAILED") expect(container.querySelector('[role="alert"]').textContent).not.toContain("Could not recover an authenticated message");
  });

  test("preparation reports exact bytes and survives password-only edits", async () => {
    await render(EncryptForm);
    expect(container.querySelector(".capacity-box")).toBeNull();
    await admit();
    expect(container.querySelector('input[type="checkbox"]').checked).toBe(false);
    await type("textarea", " ");
    await capacity();
    expect(container.textContent).toContain("Original: 14 bytes");
    expect(container.textContent).toContain("Stored: 14 bytes");
    expect(container.textContent).toContain("Maximum stored: 512 bytes");
    await type(".password-input-field", "  exact password  ");
    expect(protectedAdapter.discard).not.toHaveBeenCalled();
    const pending = await submit();
    expect(pending.args[0]).toEqual({ preparation: {}, password: "  exact password  " });
    await reply(pending, { ok: false, code: "WORKER_FAILED", error: "Protected processing stopped." });
    expect(container.querySelector(".password-input-field").value).toBe("");
    expect(container.querySelector("textarea").value).toBe(" ");
    await capacity();
    await type(".password-input-field", "retry");
    expect(button("Encrypt & Hide").disabled).toBe(false);
  });

  test.each([
    [{ hasFrameCapacity: false, maxStoredBytes: 0, fits: false }, "This image has no protected-frame capacity."],
    [{ hasFrameCapacity: true, maxStoredBytes: 0, fits: false }, "This image can hold only an empty message."],
  ])("capacity refusal is distinct and an estimate failure clears prior fit", async (fields, reason) => {
    await render(EncryptForm);
    await admit();
    await type("textarea", "public");
    await capacity({ ok: true, preparation: {}, originalBytes: 6, storedBytes: 6, compressionUsed: false, ...fields });
    expect(container.textContent).toContain(reason);
    expect(button("Encrypt & Hide").disabled).toBe(true);
    await type("textarea", "replacement");
    expect(container.querySelector(".capacity-box")).toBeNull();
    expect(protectedAdapter.discard).toHaveBeenCalled();
    await capacity({ ok: false, code: "INPUT_INVALID", error: "Invalid text." });
    expect(container.querySelector(".capacity-box")).toBeNull();
    expect(button("Encrypt & Hide").disabled).toBe(true);
  });

  test.each(["", "<script>alert('public')</script>"])("authenticated text remains visible and is rendered safely: %s", async (text) => {
    await render(DecryptForm);
    await admit();
    await type(".password-input-field", " exact ");
    const pending = await submit();
    expect(pending.args[0].password).toBe(" exact ");
    await reply(pending, { ok: true, message: text });
    expect(container.textContent).toContain("Authenticated message recovered");
    expect(container.querySelector("script")).toBeNull();
    expect(button("Download message").disabled).toBe(false);
  });
  test.each(["Encrypt", "Decrypt"])("%s masks a revealed password after clear or operation lock", async (task) => {
    await render(task === "Encrypt" ? EncryptForm : DecryptForm);
    await admit();
    if (task === "Encrypt") {
      await type("textarea", "Public message");
      await capacity();
    }
    await type('input[type="password"]', "public-password");
    const password = container.querySelector('input[type="password"]');
    await click(container.querySelector('button[aria-label="Reveal password"]'));
    const toggle = container.querySelector('button[aria-label="Hide password"]');
    expect(password.type).toBe("text");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");

    await click(toggle);
    expect(password.type).toBe("password");
    expect(toggle.getAttribute("aria-label")).toBe("Reveal password");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    await click(toggle);
    await type(".password-input-field", "");
    expect(password.type).toBe("password");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    await type(".password-input-field", "replacement-password");
    expect(password.type).toBe("password");

    await click(toggle);
    const pending = await submit();
    expect(password.disabled).toBe(true);
    expect(password.type).toBe("password");
    expect(toggle.disabled).toBe(true);
    expect(toggle.getAttribute("aria-label")).toBe("Reveal password");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    await reply(pending, { ok: false, code: "CANCELLED", error: "Operation cancelled." });
    expect(password.disabled).toBe(false);
    expect(toggle.disabled).toBe(false);
    await type(".password-input-field", "next-password");
    expect(password.type).toBe("password");
  });

  test.each(["image", "message"])("keeps the completed %s available after a refused download", async (kind) => {
    await render(kind === "image" ? EncryptForm : DecryptForm);
    await admit();
    if (kind === "image") {
      await type("textarea", "Public export text");
      await capacity();
    }
    await type('input[type="password"]', "public-password");
    const pending = await submit();
    await reply(pending, kind === "image"
      ? { ok: true, pngBytes: new TextEncoder().encode("complete PNG") }
      : { ok: true, message: "Public export text" });
    adapter.downloadBlob.mockImplementation(browserDownload);
    URL.revokeObjectURL.mockImplementation(savedRevoke.value);
    let downloaded;
    const browserClick = jest.spyOn(dom.window.HTMLAnchorElement.prototype, "click")
      .mockImplementation(function () { downloaded = fetch(this.href).then(response => response.text()); })
      .mockImplementationOnce(() => { throw new Error("private browser detail"); });
    try {
      const download = button(kind === "image" ? "Download encoded image" : "Download message");
      await click(download);
      expect(container.querySelector('[role="alert"]').textContent).toMatch(/download/i);
      expect(container.textContent).not.toContain("private browser detail");
      expect(download.disabled).toBe(false);
      await click(download);
      expect(await downloaded).toBe(kind === "image" ? "complete PNG" : "Public export text");
      expect(container.querySelector('[role="alert"]')).toBeNull();
      expect(container.querySelector('input[type="password"]').value).toBe("");
    } finally {
      browserClick.mockRestore();
      URL.revokeObjectURL.mockReset();
    }
  });

  test("replacement admission aborts the old operation and ignores its late error", async () => {
    await render(DecryptForm);
    const old = await pick("old.png");
    expect(container.textContent).toContain("Checking PNG…");
    const current = await pick("current.png");
    expect(old.aborted).toBe(true);
    expect(current.signal.aborted).toBe(false);
    await reply(old, { ok: false, error: "Stale admission error" });
    expect(container.textContent).not.toContain("Stale admission error");
    expect(container.textContent).toContain("Checking PNG…");
    expect(container.querySelector('input[type="password"]').disabled).toBe(true);
    await reply(current, { ok: true });
    expect(container.textContent).toContain("current.png");
    expect(container.textContent).not.toContain("old.png");
    expect(container.querySelector('input[type="password"]').disabled).toBe(false);
    expect(container.textContent).toContain("Enter a password.");
  });

  test("encrypt validation keeps its precedence and cancellation keeps inputs but clears the password", async () => {
    await render(EncryptForm);
    expect(container.textContent).toContain("Choose a supported PNG and wait for admission.");
    await admit();
    expect(container.textContent).toContain("Enter a message.");
    await type("textarea", "Keep this message");
    expect(container.textContent).toContain("Edit the message and wait for its capacity check.");
    await capacity({ ok: true, preparation: {}, originalBytes: 513, storedBytes: 513, maxStoredBytes: 512, compressionUsed: false, hasFrameCapacity: true, fits: false });
    expect(container.textContent).toContain("The message is too large. Shorten it or choose a larger image.");
    await type("textarea", "Smaller message");
    await capacity();
    expect(container.textContent).toContain("Enter a password.");
    await type('input[type="password"]', "secret");
    expect(button("Encrypt & Hide").disabled).toBe(false);
    const pending = await submit();
    expect(pending.name).toBe("encode");
    expect(container.querySelector("textarea").disabled).toBe(true);
    expect(container.textContent).toContain("Wait for the operation or select Cancel.");
    await click(button("Cancel"));
    expect(pending.aborted).toBe(true);
    expect(container.querySelector('input[type="password"]').value).toBe("");
    expect(container.querySelector("textarea").value).toBe("Smaller message");
    expect(container.querySelector("textarea").disabled).toBe(false);
    expect(container.textContent).toContain("source.png");
    await reply(pending, { ok: true, blob: new Blob(["late"]) });
    expect(container.textContent).toContain("Cancelled. Your image and message are kept.");
    expect(container.textContent).not.toContain("Encryption complete.");
    expect(container.querySelector('a[download]')).toBeNull();
  });

  test("decrypt cancellation clears the password and rejects a late decrypted message", async () => {
    await render(DecryptForm);
    await admit("encoded.png");
    await type('input[type="password"]', "secret");
    const pending = await submit();
    expect(pending.name).toBe("decode");
    expect(container.textContent).toContain("Wait for decryption or select Cancel.");
    await click(button("Cancel"));
    expect(pending.aborted).toBe(true);
    expect(container.querySelector('input[type="password"]').value).toBe("");
    expect(container.textContent).toContain("encoded.png");
    await reply(pending, { ok: true, message: "Late secret must not appear" });
    expect(container.textContent).not.toContain("Late secret must not appear");
    expect(container.textContent).not.toContain("Decrypted message");
    expect(container.textContent).toContain("Cancelled. Your image is kept.");
    expect(button("Decrypt & Extract").disabled).toBe(true);
  });

  test.each([0, 1])("overlapping Diff selections starting in slot %i admit serially and compare the current pair", async (index) => {
    await render(ImageDiffForm);
    const names = ["original.png", "comparison.png"];
    const first = await pick(names[index], index);
    await pick(names[1 - index], 1 - index);
    expect(first.signal.aborted).toBe(false);
    expect(calls).toHaveLength(1);
    expect(button("Generate Diff").disabled).toBe(true);
    await reply(first, { ok: true, width: 8, height: 8 });
    const second = calls.at(-1);
    expect(second.args[0].name).toBe(names[1 - index]);
    await reply(second, { ok: true, width: 8, height: 8 });
    expect(button("Generate Diff").disabled).toBe(false);
    const comparison = await submit();
    expect(comparison.args.slice(0, 2).map(file => file.name)).toEqual(["original.png", "comparison.png"]);
    await reply(comparison, preview());
    expect(container.querySelectorAll("img")).toHaveLength(3);
  });

  test("replacing an admitted slot leaves the other pending admission usable", async () => {
    await render(ImageDiffForm);
    const first = await pick("original.png", 0);
    await pick("comparison.png", 1);
    await reply(first, { ok: true, width: 8, height: 8 });
    const second = calls.at(-1);
    await pick("replacement.png", 0);
    expect(second.signal.aborted).toBe(false);
    await reply(second, { ok: true, width: 8, height: 8 });
    const replacement = calls.at(-1);
    expect(replacement.args[0].name).toBe("replacement.png");
    await reply(replacement, { ok: true, width: 8, height: 8 });
    expect(button("Generate Diff").disabled).toBe(false);
    expect((await submit()).args.slice(0, 2).map(file => file.name)).toEqual(["replacement.png", "comparison.png"]);
  });

  test.each([0, 1])("rapid replacements in slot %i preserve the other current admission", async (index) => {
    await render(ImageDiffForm);
    const first = await pick("original.png", 0);
    await pick("comparison.png", 1);
    const obsolete = [];
    for (let n = 0; n < 12; n++) {
      const previous = calls.at(-1);
      await pick(`replacement-${n}.png`, index);
      if (previous.signal.aborted) obsolete.push(previous);
    }
    expect(first.signal.aborted).toBe(index === 0);
    expect(calls.filter(call => !call.signal.aborted)).toHaveLength(1);
    const active = calls.at(-1);
    for (const old of obsolete) await reply(old, { ok: true, width: 99, height: 99 });
    expect(button("Generate Diff").disabled).toBe(true);
    await reply(active, { ok: true, width: 8, height: 8 });
    const remaining = calls.at(-1);
    expect(remaining.args[0].name).toBe(index === 0 ? "comparison.png" : "replacement-11.png");
    await reply(remaining, { ok: true, width: 8, height: 8 });
    expect(button("Generate Diff").disabled).toBe(false);
    const compared = await submit();
    expect(compared.args.slice(0, 2).map(file => file.name)).toEqual(
      index === 0 ? ["replacement-11.png", "comparison.png"] : ["original.png", "replacement-11.png"],
    );
    await reply(compared, preview());
    expect(container.querySelectorAll("img")).toHaveLength(3);
  });

  test.each(["cancel", "reset", "leave", "unmount"])("%s stops both overlapping admissions and permits a fresh pair", async (ending) => {
    await render(App);
    await click(container.querySelector("#task-diff"));
    const first = await pick("old-original.png", 0);
    await pick("old-comparison.png", 1);
    if (ending === "cancel") await click(button("Cancel"));
    else if (ending === "unmount") {
      await act(async () => root.unmount());
      root = null;
    } else {
      const trigger = ending === "reset" ? button("Reset") : container.querySelector("#task-decrypt");
      await click(trigger);
      await click(button("Stay"));
      expect(first.signal.aborted).toBe(false);
      expect(document.activeElement).toBe(trigger);
      await click(trigger);
      await click(button("Switch and clear"));
    }
    expect(first.signal.aborted).toBe(true);
    await reply(first, { ok: true, width: 99, height: 99 });
    expect(calls).toHaveLength(1);
    expect(container.querySelector("img")).toBeNull();
    if (ending === "unmount") {
      root = createRoot(container);
      await render(ImageDiffForm);
    } else if (ending === "leave") await click(container.querySelector("#task-diff"));
    expect(button("Generate Diff").disabled).toBe(true);
    const next = await pick("new-original.png", 0);
    await pick("new-comparison.png", 1);
    await reply(next, { ok: true, width: 8, height: 8 });
    await reply(calls.at(-1), { ok: true, width: 8, height: 8 });
    expect(button("Generate Diff").disabled).toBe(false);
    expect((await submit()).args.slice(0, 2).map(file => file.name)).toEqual(["new-original.png", "new-comparison.png"]);
  });

  test.each([
    [0, "PNG_INVALID", "Malformed PNG."],
    [1, "PNG_UNSUPPORTED", "Transparent PNG is not supported."],
    [1, "PNG_LIMIT", "PNG dimensions exceed the limit."],
    [1, "WORKER_FAILED", "Image processing stopped. Select the image again and retry."],
  ])("overlapping slot %i failure %s retains the other image for correction", async (index, code, error) => {
    await render(ImageDiffForm);
    const first = await pick("original.png", 0);
    await pick("comparison.png", 1);
    const good = { ok: true, width: 1024, height: 1024 };
    const bad = { ok: false, code, error };
    await reply(first, index === 0 ? bad : good);
    await reply(calls.at(-1), index === 1 ? bad : good);
    const fields = container.querySelectorAll(".field");
    expect(fields[index].textContent).toContain(error);
    expect(fields[1 - index].querySelector('[role="alert"]')).toBeNull();
    expect(button("Generate Diff").disabled).toBe(true);
    const corrected = await pick("corrected.png", index);
    await reply(corrected, good);
    expect(button("Generate Diff").disabled).toBe(false);
    const comparison = await submit();
    await reply(comparison, { ok: false, code: "PREVIEW_FAILED", error: "Could not show the visual comparison. Try again." });
    expect(container.querySelector("img")).toBeNull();
    expect(button("Generate Diff").disabled).toBe(false);
    await reply(await submit(), preview());
    expect(container.querySelectorAll("img")).toHaveLength(3);
  });

  test("overlapping form requests pass the real PNG gate at maximum dimensions and recover from rejected inputs", async () => {
    jest.useRealTimers();
    const savedWorker = globalThis.Worker;
    const terminations = [];
    globalThis.Worker = class {
      constructor(url) {
        this.worker = new NodeWorker(`
          const { parentPort } = require("node:worker_threads");
          globalThis.self = { postMessage: data => parentPort.postMessage(data) };
          import(${JSON.stringify(url.href)}).then(() => {
            parentPort.on("message", data => self.onmessage({ data }));
            parentPort.postMessage({ ready: true });
          });
        `, { eval: true });
        this.worker.on("message", data => {
          if (data.ready) { this.ready = true; this.worker.postMessage(this.request); }
          else this.onmessage({ data });
        });
        this.worker.on("error", () => this.onerror({ preventDefault() {} }));
      }
      postMessage(request) {
        this.request = request;
        if (this.ready) this.worker.postMessage(request);
      }
      terminate() { terminations.push(this.worker.terminate()); }
    };
    for (const [name, real] of [["admitImage", realAdmitImage], ["generateImageDiff", realGenerateImageDiff]]) {
      adapter[name].mockImplementation((...args) => {
        const promise = real(...args);
        calls.push({ name, args, promise });
        return promise;
      });
    }
    const image = (name, width = 1024, alpha = 255) => {
      const png = new PNG({ width, height: 1024 });
      png.data.fill(255);
      png.data[3] = alpha;
      return new File([PNG.sync.write(png, { filterType: 0, deflateLevel: 1 })], name, { type: "image/png" });
    };
    const settle = async () => {
      let result;
      await act(async () => { result = await calls.at(-1).promise; });
      return result;
    };
    try {
      await render(ImageDiffForm);
      await pick("maximum-a.png", 0, image("maximum-a.png"));
      await pick("maximum-b.png", 1, image("maximum-b.png"));
      expect(calls).toHaveLength(1);
      expect(await settle()).toMatchObject({ ok: true, width: 1024, height: 1024 });
      expect(await settle()).toMatchObject({ ok: true, width: 1024, height: 1024 });
      expect(button("Generate Diff").disabled).toBe(false);
      await submit();
      expect(await settle()).toMatchObject({ ok: true, changedPixels: 0, totalPixels: 1048576 });
      expect(container.querySelectorAll("img")).toHaveLength(3);
      for (const [file, code] of [
        [new File(["not PNG"], "malformed.png"), "PNG_INVALID"],
        [image("transparent.png", 1024, 254), "PNG_UNSUPPORTED"],
        [image("too-wide.png", 1025), "PNG_LIMIT"],
      ]) {
        await pick(file.name, 0, file);
        await pick("retained.png", 1, image("retained.png"));
        const failed = await settle();
        expect(failed).toMatchObject({ ok: false, code });
        expect(await settle()).toMatchObject({ ok: true });
        expect(container.querySelectorAll(".field")[0].textContent).toContain(failed.error);
        expect(container.querySelector("img")).toBeNull();
        expect(button("Generate Diff").disabled).toBe(true);
      }
      await pick("unequal.png", 0, image("unequal.png", 1023));
      expect(await settle()).toMatchObject({ ok: true });
      expect(button("Generate Diff").disabled).toBe(true);
      expect(container.textContent).toContain("different dimensions");
      await pick("corrected.png", 0, image("corrected.png"));
      expect(await settle()).toMatchObject({ ok: true });
      expect(button("Generate Diff").disabled).toBe(false);
      await submit();
      expect(await settle()).toMatchObject({ ok: true, changedPixels: 0, totalPixels: 1048576 });
      expect(container.querySelectorAll("img")).toHaveLength(3);
    } finally {
      await act(async () => root.unmount());
      root = null;
      await Promise.all(terminations);
      globalThis.Worker = savedWorker;
      for (const [url] of URL.revokeObjectURL.mock.calls) savedRevoke.value(url);
    }
  }, 30000);

  test.each(["cancel", "unmount"])("%s aborts pending comparison and disposes all late preview URLs", async (ending) => {
    await render(ImageDiffForm);
    await admit("original.png", 0);
    await admit("encoded.png", 1);
    expect(button("Generate Diff").disabled).toBe(false);
    const pending = await submit();
    expect(pending.name).toBe("generateImageDiff");
    expect(container.textContent).toContain("Comparing images…");
    if (ending === "cancel") await click(button("Cancel"));
    else {
      await act(async () => root.unmount());
      root = null;
    }
    expect(pending.aborted).toBe(true);
    await reply(pending, preview());
    expect(URL.revokeObjectURL.mock.calls).toEqual([["blob:original"], ["blob:encoded"], ["blob:diff"]]);
    expect(container.querySelector("img")).toBeNull();
    if (ending === "cancel") {
      expect(container.textContent).toContain("original.png");
      expect(container.textContent).toContain("encoded.png");
      expect(container.textContent).toContain("Cancelled. Your images are kept.");
      expect(button("Generate Diff").disabled).toBe(false);
    } else expect(container.textContent).toBe("");
  });

  test.each([0, 1])("replacing comparison input %i during work cancels it and rejects late previews", async (index) => {
    await render(ImageDiffForm);
    await admit("original.png", 0);
    await admit("comparison.png", 1);
    const pending = await submit();
    expect(container.querySelectorAll('input[type="file"]')[index].disabled).toBe(false);
    const replacement = await pick("replacement.png", index);
    expect(pending.aborted).toBe(true);
    await reply(pending, preview());
    expect(container.querySelector("img")).toBeNull();
    expect(URL.revokeObjectURL.mock.calls).toEqual([["blob:original"], ["blob:encoded"], ["blob:diff"]]);
    expect(button("Generate Diff").disabled).toBe(true);
    await reply(replacement, { ok: true, width: 8, height: 8 });
    expect(button("Generate Diff").disabled).toBe(false);
  });

  test.each(["first", "second", "reset", "restart", "leave"])("%s invalidates a completed comparison and releases its previews", async (change) => {
    await render(App);
    await click(container.querySelector("#task-diff"));
    await admit("original.png", 0);
    await admit("comparison.png", 1);
    await reply(await submit(), preview());
    expect(container.querySelectorAll("img")).toHaveLength(3);
    if (change === "first" || change === "second") await pick("replacement.png", change === "first" ? 0 : 1);
    if (change === "restart") await submit();
    if (change === "reset" || change === "leave") {
      await click(change === "reset" ? button("Reset") : container.querySelector("#task-decrypt"));
      await click(button("Stay"));
      expect(container.querySelectorAll("img")).toHaveLength(3);
      await click(change === "reset" ? button("Reset") : container.querySelector("#task-decrypt"));
      await click(button("Switch and clear"));
      if (change === "leave") await click(container.querySelector("#task-diff"));
      expect(container.querySelectorAll('input[type="file"]')).toHaveLength(2);
      expect(button("Generate Diff").disabled).toBe(true);
      expect(container.textContent).not.toContain("original.png");
      expect(container.textContent).not.toContain("comparison.png");
    }
    expect(container.querySelector("img")).toBeNull();
    expect(URL.revokeObjectURL.mock.calls).toEqual([["blob:original"], ["blob:encoded"], ["blob:diff"]]);
  });

  test.each(["reset", "leave"])("%s confirms discard and aborts an active comparison", async (change) => {
    await render(App);
    await click(container.querySelector("#task-diff"));
    await admit("original.png", 0);
    await admit("comparison.png", 1);
    const pending = await submit();
    const trigger = change === "reset" ? button("Reset") : container.querySelector("#task-decrypt");
    expect(trigger.disabled).toBe(false);
    await click(trigger);
    await click(button("Stay"));
    expect(pending.aborted).toBe(false);
    expect(document.activeElement).toBe(trigger);
    await click(trigger);
    await click(button("Switch and clear"));
    expect(pending.aborted).toBe(true);
    await reply(pending, preview());
    expect(container.querySelector("img")).toBeNull();
    expect(URL.revokeObjectURL.mock.calls).toEqual([["blob:original"], ["blob:encoded"], ["blob:diff"]]);
  });

  test("comparison requires both admissions and equal dimensions", async () => {
    await render(ImageDiffForm);
    expect(container.textContent).toContain("Choose and admit both images before comparison.");
    await admit("original.png", 0);
    const pending = await pick("different.png", 1);
    expect(container.textContent).toContain("Wait for this operation or select Cancel.");
    await reply(pending, { ok: true, width: 9, height: 8 });
    expect(container.textContent).toContain("The images have different dimensions. Choose images with equal dimensions.");
    expect(button("Generate Diff").disabled).toBe(true);
  });

  test("Stay and Escape preserve the task; Switch and clear aborts pending work and resets it", async () => {
    await render(App);
    await admit();
    await type("textarea", "Preserve this draft");
    await type('input[type="password"]', "secret");
    await act(async () => jest.advanceTimersByTime(300));
    const pending = calls.at(-1);
    expect(pending.name).toBe("prepareEncode");
    const decryptTab = container.querySelector('#task-decrypt');
    await click(decryptTab);
    const dialog = container.querySelector("dialog");
    expect(dialog.open).toBe(true);
    await click(button("Stay"));
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(decryptTab);
    expect(container.querySelector("textarea").value).toBe("Preserve this draft");
    expect(container.querySelector('input[type="password"]').value).toBe("secret");
    expect(pending.aborted).toBe(false);
    await click(decryptTab);
    const escape = new Event("cancel", { cancelable: true });
    await act(async () => dialog.dispatchEvent(escape));
    expect(escape.defaultPrevented).toBe(true);
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(decryptTab);
    expect(container.querySelector("textarea").value).toBe("Preserve this draft");
    expect(pending.aborted).toBe(false);
    await click(decryptTab);
    await click(button("Switch and clear"));
    expect(dialog.open).toBe(false);
    expect(pending.aborted).toBe(true);
    expect(decryptTab.getAttribute("aria-selected")).toBe("true");
    expect(container.querySelector("textarea")).toBeNull();
    expect(container.textContent).toContain("No file selected");
    expect(container.querySelector('input[type="password"]').value).toBe("");
    await reply(pending, { ok: false, error: "Late capacity error" });
    expect(container.textContent).not.toContain("Late capacity error");
    await click(container.querySelector('#task-encrypt'));
    expect(dialog.open).toBe(false);
    expect(container.querySelector("textarea").value).toBe("");
    expect(container.textContent).toContain("No file selected");
  });

  test("tab keys move focus without changing the active task", async () => {
    await render(App);
    const tabs = [...container.querySelectorAll('[role="tab"]')];
    tabs[0].focus();
    for (const [key, expected] of [["ArrowLeft", 2], ["ArrowRight", 0], ["End", 2], ["Home", 0]]) {
      await act(async () => document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })));
      expect(document.activeElement).toBe(tabs[expected]);
      expect(tabs[0].getAttribute("aria-selected")).toBe("true");
      expect(container.querySelector("textarea")).not.toBeNull();
    }
  });

  test.each(["hash", "link"])("%s navigation keeps a draft on Stay and discards it only on confirmation", async entry => {
    await render(App);
    await admit();
    await type("textarea", "Keep this draft");
    await act(async () => jest.advanceTimersByTime(300));
    const pending = calls.at(-1);
    const navigate = async () => {
      if (entry === "link") await click(container.querySelector('footer a[href="#privacy"]'));
      else await act(async () => {
        window.history.replaceState(null, "", "#privacy");
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });
    };
    await navigate();
    expect(window.location.hash).toBe("");
    expect(container.querySelector("dialog").open).toBe(true);
    await click(button("Stay"));
    expect(container.querySelector("textarea").value).toBe("Keep this draft");
    expect(pending.aborted).toBe(false);
    await navigate();
    await click(button("Switch and clear"));
    await act(async () => window.dispatchEvent(new HashChangeEvent("hashchange")));
    expect(window.location.hash).toBe("#privacy");
    expect(container.querySelector("textarea")).toBeNull();
    expect(document.title).toContain("Privacy Policy");
    expect(pending.aborted).toBe(true);
    await reply(pending, { ok: false, error: "Late private result" });
    await act(async () => {
      window.history.replaceState(null, "", "/");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(container.querySelector("textarea").value).toBe("");
    expect(container.textContent).not.toContain("Late private result");
  });

  test.each(["hash", "link"])("%s navigation cannot leave a locked operation", async entry => {
    await render(App);
    await admit();
    await type("textarea", "Keep while working");
    await capacity();
    await type('input[type="password"]', "public-password");
    const pending = await submit();
    if (entry === "link") await click(container.querySelector('footer a[href="#terms"]'));
    else await act(async () => {
      window.history.replaceState(null, "", "#terms");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(window.location.hash).toBe("");
    expect(container.querySelector("dialog").open).toBe(false);
    expect(container.querySelector("textarea").value).toBe("Keep while working");
    expect(pending.aborted).toBe(false);
    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);
    await click(button("Cancel"));
    expect(pending.aborted).toBe(true);
  });

  test("unload warns for a draft but not for an empty or confirmed-cleared form", async () => {
    await render(App);
    const prevented = () => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(prevented()).toBe(false);
    await admit();
    await type("textarea", "Unsaved draft");
    expect(prevented()).toBe(true);
    await click(button("Clear"));
    await click(button("Switch and clear"));
    expect(prevented()).toBe(false);
  });
});
