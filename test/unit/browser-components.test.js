import { jest, beforeAll, beforeEach, afterEach, afterAll, describe, test, expect } from "@jest/globals";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { downloadBlob as browserDownload } from "../../app/src/lib/steg.js";

const adapter = {
  admitImage: jest.fn(),
  estimateCapacity: jest.fn(),
  embedMessage: jest.fn(),
  extractMessage: jest.fn(),
  generateImageDiff: jest.fn(),
  downloadBlob: jest.fn(),
};
jest.unstable_mockModule("../../app/src/lib/steg.js", () => adapter);

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
  for (const [name, fn] of Object.entries(adapter)) {
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
async function pick(name, index = 0) {
  const file = new dom.window.File(["test input"], name, { type: "image/png" });
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
async function capacity(result = { ok: true, estimatedBits: 8, totalBits: 64, utilization: "12.5%" }) {
  await act(async () => jest.advanceTimersByTime(300));
  expect(calls.at(-1).name).toBe("estimateCapacity");
  await reply(calls.at(-1), result);
}
const preview = () => ({ ok: true, original: "blob:original", encoded: "blob:encoded", diff: "blob:diff", averageDifference: 0 });

describe("real browser components", () => {
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
      ? { ok: true, blob: new Blob(["complete PNG"]) }
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
    await capacity({ ok: true, estimatedBits: 65, totalBits: 64, utilization: "101%" });
    expect(container.textContent).toContain("The message is too large. Shorten it or choose a larger image.");
    await type("textarea", "Smaller message");
    await capacity();
    expect(container.textContent).toContain("Enter a password.");
    await type('input[type="password"]', "secret");
    expect(button("Encrypt & Hide").disabled).toBe(false);
    const pending = await submit();
    expect(pending.name).toBe("embedMessage");
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
    expect(pending.name).toBe("extractMessage");
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
    expect(pending.name).toBe("estimateCapacity");
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
});
