import React, { useEffect, useLayoutEffect, useId, useRef, useState } from "react";
import { ImageUpload } from "./ImageUpload";
import { PasswordInput } from "./PasswordInput";
import { EncryptionResult } from "./EncryptionResult";
import { OperationStatus } from "./OperationStatus";
import { Button } from "./ui/button";
import { admitImage, readImageBytes } from "../lib/steg";
import { prepareEncode, encode, discard } from "../lib/protected";
import { useFormOperation } from "../lib/useFormOperation";

function submissionReason(locked, admitted, message, capacity, password) {
  if (locked) return "Wait for the operation or select Cancel.";
  if (!admitted) return "Choose a supported PNG and wait for admission.";
  if (!message) return "Enter a message.";
  if (!capacity) return "Edit the message and wait for its capacity check.";
  if (!capacity.hasFrameCapacity) return "This image has no protected-frame capacity.";
  if (capacity.maxStoredBytes === 0) return "This image can hold only an empty message.";
  if (!capacity.fits) return "The message is too large. Shorten it or choose a larger image.";
  if (!password) return "Enter a password.";
  return "";
}

export const EncryptForm = ({ onStateChange, requestClear }) => {
  const [selection, setSelection] = useState(null);
  const [admitted, setAdmitted] = useState(null);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [compress, setCompress] = useState(false);
  const [encoding, setEncoding] = useState(false);
  const [retry, setRetry] = useState(0);
  const preparation = useRef(null);
  const releasePending = useRef(Promise.resolve());
  const [capacity, setCapacity] = useState(null);
  const [result, setResult] = useState(null);
  const [imageError, setImageError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("Choose a supported PNG to start.");
  const [comparing, setComparing] = useState(false);
  const operation = useFormOperation();
  const id = useId();
  const estimateTimer = useRef(null);
  const locked = encoding || comparing;
  const dirty = Boolean(selection || message || password || result);
  useLayoutEffect(() => { onStateChange?.({ dirty, busy: operation.busy || comparing, locked }); }, [dirty, locked, operation.busy, comparing, onStateChange]);

  const release = () => {
    if (preparation.current) releasePending.current = Promise.resolve(discard(preparation.current));
    preparation.current = null;
  };
  useEffect(() => () => { clearTimeout(estimateTimer.current); release(); }, []);
  const invalidate = () => { clearTimeout(estimateTimer.current); operation.cancel(); release(); setCapacity(null); setResult(null); setError(""); setNotice(""); };
  const pick = async (file) => {
    invalidate(); setImageError(""); setAdmitted(null);
    const revision = { file }; setSelection(revision);
    const checked = await operation.run("Checking PNG…", async (options) => {
      await releasePending.current;
      return admitImage(file, options);
    });
    if (!checked) return;
    if (checked.ok) { setAdmitted(revision); setNotice("PNG accepted. Enter your message and password."); }
    else { setImageError(checked.error); setPassword(""); }
  };
  useEffect(() => {
    if (!admitted || !message) return;
    const timer = estimateTimer.current = setTimeout(async () => {
      setCapacity(null);
      const estimated = await operation.run("Preparing text/capacity…", async (options) => {
        await releasePending.current;
        const pngBytes = await readImageBytes(admitted.file);
        const prepared = await prepareEncode({ pngBytes, message, compress }, options);
        if (options.signal.aborted && prepared?.preparation) discard(prepared.preparation);
        return prepared;
      });
      if (!estimated) return;
      if (estimated.ok) { preparation.current = estimated.preparation; setCapacity(estimated); }
      else { release(); setCapacity(null); setError(estimated.error); setPassword(""); }
    }, 300);
    return () => clearTimeout(timer);
  }, [admitted, message, compress, retry, operation.run, operation.cancel]);

  const cancel = () => { clearTimeout(estimateTimer.current); operation.cancel(); release(); setEncoding(false); setPassword(""); setCapacity(null); setResult(null); setNotice("Cancelled. Your image and message are kept. Select Check capacity to try again."); };
  const clear = () => { invalidate(); setEncoding(false); setSelection(null); setAdmitted(null); setMessage(""); setPassword(""); setCompress(false); setImageError(""); setNotice("Cleared. Choose a supported PNG to start again."); };
  const reason = submissionReason(locked, admitted, message, capacity, password);
  const submit = async (event) => {
    event.preventDefault(); if (reason || operation.busy) return;
    setError(""); setResult(null); setNotice(""); setEncoding(true);
    const handle = preparation.current;
    preparation.current = null;
    setCapacity(null);
    const encoded = await operation.run("Checking inputs…", (options) => encode({ preparation: handle, password }, options));
    if (!encoded) return;
    setEncoding(false); setPassword("");
    if (encoded.ok) {
      try {
        const blob = new Blob([encoded.pngBytes], { type: "image/png" });
        setResult({ originalFile: selection.file, encodedBlob: blob, outputPath: "encoded.png" });
        setNotice("Encryption complete. Download the encoded image below.");
      } catch { setError("Could not prepare the download. Your image and message are kept. Check capacity to try again."); }
    } else { setError(encoded.error); setRetry(value => value + 1); }
  };
  return <form className="panel" onSubmit={submit}>
    <ImageUpload label="Source image (PNG)" filePath={selection?.file} onPick={pick} disabled={locked} error={imageError} />
    <div className="field">
      <label className="field-label" htmlFor={`${id}-message`}>Secret message</label>
      <textarea id={`${id}-message`} rows={6} value={message} disabled={locked || !admitted} onChange={(e) => { invalidate(); setMessage(e.target.value); }} />
      {!admitted && <p className="field-help">Message and password controls become available after PNG admission.</p>}
      {error && <p className="input-error" role="alert">{error}</p>}
    </div>
    <PasswordInput label="Password" value={password} disabled={locked || !admitted} onChange={(value) => { setResult(null); setError(""); setNotice(""); setPassword(value); }} />
    <label className="checkbox"><input type="checkbox" checked={compress} disabled={locked || !admitted} onChange={(e) => { invalidate(); setCompress(e.target.checked); }} /><span>Enable compression</span></label>
    {capacity && <div className="capacity-box">
      Original: {capacity.originalBytes} bytes. Stored: {capacity.storedBytes} bytes. Maximum stored: {capacity.maxStoredBytes} bytes.
      {" "}Compression used: {capacity.compressionUsed ? "yes" : "no"}.
      {capacity.metadataNotice && <p>{capacity.metadataNotice}</p>}
    </div>}
    {admitted && message && !capacity && !operation.busy && !locked && <Button type="button" onClick={() => { setResult(null); setNotice(""); setRetry(value => value + 1); }}>Check capacity</Button>}
    <p id={`${id}-reason`} className="field-help">{reason}</p>
    <div className="actions-row">
      <Button type="submit" variant="primary" disabled={Boolean(reason) || operation.busy} aria-describedby={`${id}-reason`}>Encrypt &amp; Hide</Button>
      <Button type="button" variant="outline" disabled={locked} onClick={() => requestClear(clear)}>Clear</Button>
    </div>
    <OperationStatus stage={operation.stage} notice={notice} onCancel={cancel} />
    {result && <EncryptionResult result={result} onBusyChange={setComparing} />}
  </form>;
};
