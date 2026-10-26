import React, { useEffect, useLayoutEffect, useId, useRef, useState } from "react";
import { ImageUpload } from "./ImageUpload";
import { PasswordInput } from "./PasswordInput";
import { EncryptionResult } from "./EncryptionResult";
import { OperationStatus } from "./OperationStatus";
import { Button } from "./ui/button";
import { admitImage, embedMessage, estimateCapacity } from "../lib/steg";
import { useFormOperation } from "../lib/useFormOperation";

export const EncryptForm = ({ onStateChange, requestClear }) => {
  const [selection, setSelection] = useState(null);
  const [admitted, setAdmitted] = useState(null);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [compress, setCompress] = useState(false);
  const [obfuscate, setObfuscate] = useState(true);
  const [capacity, setCapacity] = useState(null);
  const [result, setResult] = useState(null);
  const [imageError, setImageError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("Choose a supported PNG to start.");
  const [comparing, setComparing] = useState(false);
  const operation = useFormOperation();
  const id = useId();
  const estimateTimer = useRef(null);
  const locked = operation.stage === "Encrypting message…" || comparing;
  const dirty = Boolean(selection || message || password || result);
  useLayoutEffect(() => { onStateChange?.({ dirty, busy: operation.busy || comparing, locked }); }, [dirty, locked, operation.busy, comparing, onStateChange]);

  const invalidate = () => { clearTimeout(estimateTimer.current); operation.cancel(); setCapacity(null); setResult(null); setError(""); setNotice(""); };
  const pick = async (file) => {
    invalidate(); setImageError(""); setAdmitted(null);
    const revision = { file }; setSelection(revision);
    const checked = await operation.run("Checking PNG…", (options) => admitImage(file, options));
    if (!checked) return;
    if (checked.ok) { setAdmitted(revision); setNotice("PNG accepted. Enter your message and password."); }
    else { setImageError(checked.error); setPassword(""); }
  };
  useEffect(() => {
    if (!admitted || !message) return;
    const timer = estimateTimer.current = setTimeout(async () => {
      const estimated = await operation.run("Checking capacity…", (options) => estimateCapacity(admitted.file, message, compress, options));
      if (!estimated) return;
      if (estimated.ok) setCapacity(estimated);
      else { setError(estimated.error); setPassword(""); }
    }, 300);
    return () => clearTimeout(timer);
  }, [admitted, message, compress, operation.run, operation.cancel]);

  const cancel = () => { clearTimeout(estimateTimer.current); operation.cancel(); setPassword(""); setCapacity(null); setNotice("Cancelled. Your image and message are kept. Edit the message to check capacity again, or choose the image again."); };
  const clear = () => { invalidate(); setSelection(null); setAdmitted(null); setMessage(""); setPassword(""); setCompress(false); setObfuscate(true); setImageError(""); setNotice("Cleared. Choose a supported PNG to start again."); };
  const reason = locked ? "Wait for the operation or select Cancel." : !admitted ? "Choose a supported PNG and wait for admission." : !message ? "Enter a message." : !capacity ? "Edit the message and wait for its capacity check." : capacity.estimatedBits > capacity.totalBits ? "The message is too large. Shorten it or choose a larger image." : !password ? "Enter a password." : "";
  const submit = async (event) => {
    event.preventDefault(); if (reason || operation.busy) return;
    setError(""); setResult(null); setNotice("");
    const encoded = await operation.run("Encrypting message…", (options) => embedMessage(selection.file, message, password, { ...options, compress, obfuscate }));
    if (!encoded) return;
    setPassword("");
    if (encoded.ok) { setResult({ ...encoded, originalFile: selection.file, encodedBlob: encoded.blob, outputPath: "encoded.png" }); setNotice("Encryption complete. Download the encoded image below."); }
    else setError(encoded.error);
  };
  return <form className="panel" onSubmit={submit}>
    <ImageUpload label="Source image (PNG)" filePath={selection?.file} onPick={pick} disabled={locked} error={imageError} />
    <div className="field">
      <label className="field-label" htmlFor={`${id}-message`}>Secret message</label>
      <textarea id={`${id}-message`} rows={6} value={message} disabled={locked || !admitted} onChange={(e) => { invalidate(); setMessage(e.target.value); }} />
      {!admitted && <p className="field-help">Message and password controls become available after PNG admission.</p>}
      {error && <p className="input-error" role="alert">{error}</p>}
    </div>
    <PasswordInput label="Password" value={password} disabled={locked || !admitted} onChange={(value) => { setResult(null); setError(""); setPassword(value); }} />
    <label className="checkbox"><input type="checkbox" checked={compress} disabled={locked || !admitted} onChange={(e) => { invalidate(); setCompress(e.target.checked); }} /><span>Enable compression</span></label>
    <label className="checkbox"><input type="checkbox" checked={obfuscate} disabled={locked || !admitted} onChange={(e) => { setResult(null); setObfuscate(e.target.checked); }} /><span>Fill unused carrier bits with random data</span></label>
    {capacity && <div className="capacity-box">Capacity used: {capacity.utilization}. Required: {capacity.estimatedBits.toLocaleString()} bits. Available: {capacity.totalBits.toLocaleString()} bits.</div>}
    <p id={`${id}-reason`} className="field-help">{reason}</p>
    <div className="actions-row">
      <Button type="submit" variant="primary" disabled={Boolean(reason) || operation.busy} aria-describedby={`${id}-reason`}>Encrypt &amp; Hide</Button>
      <Button type="button" variant="outline" disabled={locked} onClick={() => requestClear(clear)}>Clear</Button>
    </div>
    <OperationStatus stage={operation.stage} notice={notice} onCancel={cancel} />
    {result && <EncryptionResult result={result} onBusyChange={setComparing} />}
  </form>;
};
