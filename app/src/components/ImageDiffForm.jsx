import React, { useEffect, useLayoutEffect, useId, useRef, useState } from "react";
import { ImageUpload } from "./ImageUpload";
import { ImageComparison } from "./ImageComparison";
import { OperationStatus } from "./OperationStatus";
import { Button } from "./ui/button";
import { admitImage, generateImageDiff } from "../lib/steg";
import { disposeComparison, useFormOperation } from "../lib/useFormOperation";

function submissionReason(busy, accepted, mismatch) {
  if (busy) return "Wait for this operation or select Cancel.";
  if (!accepted.every(Boolean)) return "Choose and admit both images before comparison.";
  if (mismatch) return "The images have different dimensions. Choose images with equal dimensions.";
  return "";
}

export const ImageDiffForm = ({ onStateChange, requestClear }) => {
  const [inputs, setInputs] = useState([null, null]);
  const [accepted, setAccepted] = useState([null, null]);
  const [errors, setErrors] = useState(["", ""]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("Choose two supported PNGs for a visual comparison.");
  const operation = useFormOperation();
  const pending = useRef([null, null]);
  const admitting = useRef(null);
  const id = useId();
  const dirty = inputs.some(Boolean);
  useLayoutEffect(() => { onStateChange?.({ dirty, busy: operation.busy, locked: false }); }, [dirty, operation.busy, onStateChange]);
  useEffect(() => () => disposeComparison(result), [result]);
  useEffect(() => () => {
    pending.current = [null, null];
    admitting.current = null;
  }, []);
  const admitNext = async () => {
    if (admitting.current) return;
    const index = pending.current.findIndex(Boolean);
    if (index === -1) return;
    const admission = { index, file: pending.current[index] };
    pending.current[index] = null;
    admitting.current = admission;
    const checked = await operation.run("Checking PNG…", (options) => admitImage(admission.file, options));
    if (admitting.current !== admission) return;
    admitting.current = null;
    if (checked?.ok) setAccepted((values) => values.map((value, i) => i === index ? checked : value));
    else if (checked) setErrors((values) => values.map((value, i) => i === index ? checked.error : value));
    void admitNext();
  };
  const pick = (index, file) => {
    // Keep the other slot's admission; only replaced work or an old comparison is obsolete.
    if (!admitting.current || admitting.current.index === index) {
      operation.cancel();
      admitting.current = null;
    }
    pending.current[index] = file;
    setResult(null); setError(""); setNotice("");
    setInputs((values) => values.map((value, i) => i === index ? file : value));
    setAccepted((values) => values.map((value, i) => i === index ? null : value));
    setErrors((values) => values.map((value, i) => i === index ? "" : value));
    void admitNext();
  };
  const cancel = () => {
    pending.current = [null, null];
    admitting.current = null;
    operation.cancel(); setResult(null);
    setNotice("Cancelled. Your images are kept. Choose an image again if its admission was cancelled.");
  };
  const clear = () => { cancel(); setInputs([null, null]); setAccepted([null, null]); setErrors(["", ""]); setError(""); setNotice("Cleared. Choose two supported PNGs to start again."); };
  const mismatch = accepted.every(Boolean) && (accepted[0].width !== accepted[1].width || accepted[0].height !== accepted[1].height);
  const reason = submissionReason(operation.busy, accepted, mismatch);
  const submit = async (event) => {
    event.preventDefault(); if (reason) return;
    setResult(null); setError(""); setNotice("");
    const compared = await operation.run("Comparing images…", (options) => generateImageDiff(inputs[0], inputs[1], options));
    if (!compared) return;
    if (compared.ok) { setResult(compared); setNotice("Visual comparison complete. This is not a security test."); }
    else setError(compared.error);
  };
  return <form className="panel" onSubmit={submit}>
    <ImageUpload label="Original image (PNG)" filePath={inputs[0]} onPick={(file) => pick(0, file)} error={errors[0]} />
    <ImageUpload label="Comparison image (PNG)" filePath={inputs[1]} onPick={(file) => pick(1, file)} error={errors[1]} />
    <p id={`${id}-reason`} className={mismatch ? "input-error" : "field-help"}>{reason}</p>
    {error && <p className="input-error" role="alert">{error}</p>}
    <div className="actions-row">
      <Button type="submit" variant="primary" disabled={Boolean(reason)} aria-describedby={`${id}-reason`}>Generate Diff</Button>
      <Button type="button" variant="outline" onClick={() => requestClear(clear)}>Reset</Button>
    </div>
    <OperationStatus stage={operation.stage} notice={notice} onCancel={cancel} />
    {result && <ImageComparison images={result} />}
  </form>;
};
