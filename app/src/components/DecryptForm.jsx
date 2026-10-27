import React, { useLayoutEffect, useId, useState } from "react";
import { ImageUpload } from "./ImageUpload";
import { PasswordInput } from "./PasswordInput";
import { MessageDisplay } from "./MessageDisplay";
import { OperationStatus } from "./OperationStatus";
import { Button } from "./ui/button";
import { admitImage, readImageBytes, downloadBlob } from "../lib/steg";
import { decode } from "../lib/protected";
import { useFormOperation } from "../lib/useFormOperation";

function submissionReason(locked, admitted, password) {
  if (locked) return "Wait for decryption or select Cancel.";
  if (!admitted) return "Choose a supported PNG and wait for admission.";
  if (!password) return "Enter a password.";
  return "";
}

export const DecryptForm = ({ onStateChange, requestClear }) => {
  const [file, setFile] = useState(null);
  const [admitted, setAdmitted] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [imageError, setImageError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("Choose a supported PNG to start.");
  const [decoding, setDecoding] = useState(false);
  const operation = useFormOperation();
  const id = useId();
  const locked = decoding;
  const dirty = Boolean(file || password || message !== null);
  useLayoutEffect(() => { onStateChange?.({ dirty, busy: operation.busy, locked }); }, [dirty, locked, operation.busy, onStateChange]);
  const pick = async (selected) => {
    operation.cancel(); setFile(selected); setAdmitted(false); setMessage(null); setImageError(""); setError(""); setNotice("");
    const result = await operation.run("Checking PNG…", (options) => admitImage(selected, options));
    if (!result) return;
    if (result.ok) { setAdmitted(true); setNotice("PNG accepted. Enter the password."); }
    else { setImageError(result.error); setPassword(""); }
  };
  const cancel = () => { operation.cancel(); setDecoding(false); setPassword(""); setMessage(null); setNotice("Cancelled. Your image is kept. Enter the password to try again, or choose the image again if admission was cancelled."); };
  const clear = () => { cancel(); setFile(null); setAdmitted(false); setImageError(""); setError(""); setNotice("Cleared. Choose a supported PNG to start again."); };
  const reason = submissionReason(locked, admitted, password);
  const submit = async (event) => {
    event.preventDefault(); if (reason || operation.busy) return;
    setMessage(null); setError(""); setNotice(""); setDecoding(true);
    const result = await operation.run("Checking inputs…", async (options) => {
      const pngBytes = await readImageBytes(file);
      return decode({ pngBytes, password }, options);
    });
    if (!result) return;
    setDecoding(false); setPassword("");
    if (result.ok) { setMessage(result.message); setNotice("Authenticated message recovered."); }
    else setError(result.error);
  };
  const download = () => {
    setError("");
    try { downloadBlob(new Blob([message], { type: "text/plain" }), "message.txt"); }
    catch { setError("Could not start the download. Your message is kept. Try Download message again."); }
  };
  return <form className="panel" onSubmit={submit}>
    <ImageUpload label="Encoded image (PNG)" filePath={file} onPick={pick} disabled={locked} error={imageError} />
    <PasswordInput label="Password" value={password} disabled={locked || !admitted} showStrength={false} onChange={(value) => { setPassword(value); setMessage(null); setError(""); setNotice(""); }} />
    {error && <p className="input-error" role="alert">{error}</p>}
    <p id={`${id}-reason`} className="field-help">{reason}</p>
    <div className="actions-row">
      <Button type="submit" variant="primary" disabled={Boolean(reason) || operation.busy} aria-describedby={`${id}-reason`}>Decrypt &amp; Extract</Button>
      <Button type="button" variant="outline" disabled={locked} onClick={() => requestClear(clear)}>Clear</Button>
    </div>
    <OperationStatus stage={operation.stage} notice={notice} onCancel={cancel} />
    {message !== null && <section aria-labelledby={`${id}-result`}>
      <h3 id={`${id}-result`}>Decrypted message</h3>
      <MessageDisplay message={message} />
      <Button type="button" onClick={download}>Download message</Button>
    </section>}
  </form>;
};
