import React, { useEffect, useLayoutEffect, useId, useState } from "react";
import { ImageUpload } from "./ImageUpload";
import { ImageComparison } from "./ImageComparison";
import { OperationStatus } from "./OperationStatus";
import { Button } from "./ui/button";
import { admitImage, generateImageDiff } from "../lib/steg";
import { disposeComparison, useFormOperation } from "../lib/useFormOperation";

export const ImageDiffForm = ({ onStateChange, requestClear }) => {
  const [inputs, setInputs] = useState([null, null]);
  const [accepted, setAccepted] = useState([null, null]);
  const [errors, setErrors] = useState(["", ""]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("Choose two supported PNGs for a visual comparison.");
  const operation = useFormOperation();
  const id = useId();
  const locked = operation.stage === "Comparing images…";
  const dirty = inputs.some(Boolean);
  useLayoutEffect(() => { onStateChange?.({ dirty, busy: operation.busy, locked }); }, [dirty, locked, operation.busy, onStateChange]);
  useEffect(() => () => disposeComparison(result), [result]);
  const pick = async (index, file) => {
    operation.cancel(); setResult(null); setError(""); setNotice("");
    setInputs((values) => values.map((value, i) => i === index ? file : value));
    setAccepted((values) => values.map((value, i) => i === index ? null : value));
    setErrors((values) => values.map((value, i) => i === index ? "" : value));
    const checked = await operation.run("Checking PNG…", (options) => admitImage(file, options));
    if (!checked) return;
    if (checked.ok) setAccepted((values) => values.map((value, i) => i === index ? checked : value));
    else setErrors((values) => values.map((value, i) => i === index ? checked.error : value));
  };
  const cancel = () => { operation.cancel(); setResult(null); setNotice("Cancelled. Your images are kept. Choose an image again if its admission was cancelled."); };
  const clear = () => { cancel(); setInputs([null, null]); setAccepted([null, null]); setErrors(["", ""]); setError(""); setNotice("Cleared. Choose two supported PNGs to start again."); };
  const mismatch = accepted.every(Boolean) && (accepted[0].width !== accepted[1].width || accepted[0].height !== accepted[1].height);
  const reason = operation.busy ? "Wait for this operation or select Cancel." : !accepted.every(Boolean) ? "Choose and admit both images before comparison." : mismatch ? "The images have different dimensions. Choose images with equal dimensions." : "";
  const submit = async (event) => {
    event.preventDefault(); if (reason) return;
    setResult(null); setError(""); setNotice("");
    const compared = await operation.run("Comparing images…", (options) => generateImageDiff(inputs[0], inputs[1], options));
    if (!compared) return;
    if (compared.ok) { setResult(compared); setNotice("Visual comparison complete. This is not a security test."); }
    else setError(compared.error);
  };
  return <form className="panel" onSubmit={submit}>
    <ImageUpload label="Original image (PNG)" filePath={inputs[0]} onPick={(file) => pick(0, file)} disabled={locked} error={errors[0]} />
    <ImageUpload label="Comparison image (PNG)" filePath={inputs[1]} onPick={(file) => pick(1, file)} disabled={locked} error={errors[1]} />
    <p id={`${id}-reason`} className={mismatch ? "input-error" : "field-help"}>{reason}</p>
    {error && <p className="input-error" role="alert">{error}</p>}
    <div className="actions-row">
      <Button type="submit" variant="primary" disabled={Boolean(reason)} aria-describedby={`${id}-reason`}>Generate Diff</Button>
      <Button type="button" variant="outline" disabled={locked} onClick={() => requestClear(clear)}>Clear</Button>
    </div>
    <OperationStatus stage={operation.stage} notice={notice} onCancel={cancel} />
    {result && <ImageComparison images={result} />}
  </form>;
};
