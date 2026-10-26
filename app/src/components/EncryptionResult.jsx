import React, { useEffect, useLayoutEffect, useState } from "react";
import { Button } from "./ui/button";
import { ImageComparison } from "./ImageComparison";
import { OperationStatus } from "./OperationStatus";
import { generateImageDiff, downloadBlob } from "../lib/steg";
import { disposeComparison, useFormOperation } from "../lib/useFormOperation";

export const EncryptionResult = ({ result, onBusyChange }) => {
  const [images, setImages] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const operation = useFormOperation();
  useLayoutEffect(() => { onBusyChange?.(operation.busy); }, [operation.busy, onBusyChange]);
  useEffect(() => () => disposeComparison(images), [images]);
  const download = () => {
    setError("");
    try { downloadBlob(result.encodedBlob, "encoded.png"); }
    catch { setError("Could not start the download. Your encoded image is kept. Try Download encoded image again."); }
  };
  const compare = async () => {
    setImages(null); setError(""); setNotice("");
    const compared = await operation.run("Comparing images…", (options) => generateImageDiff(result.originalFile, result.encodedBlob, options));
    if (!compared) return;
    if (compared.ok) { setImages(compared); setNotice("Visual comparison complete. This is not a security test."); }
    else setError(compared.error);
  };
  return <section className="encryption-result" aria-label="Encryption result">
    <div className="result-header"><h3>Encryption complete</h3></div>
    <p>The encoded image is ready. Download it to keep a copy.</p>
    <p>Supported rendering information was retained. Personal and non-rendering metadata was removed.</p>
    <p>This does not make the image anonymous. Removed metadata and PNG encoding can still be detected. Inputs with unsupported color profiles are rejected.</p>
    <div className="result-actions">
      <Button type="button" variant="primary" disabled={operation.busy} onClick={download}>Download encoded image</Button>
      <Button type="button" variant="outline" disabled={operation.busy} onClick={compare}>Generate visual comparison</Button>
    </div>
    {operation.busy && <p className="field-help">Download and comparison controls are unavailable until comparison ends. You can cancel below.</p>}
    <OperationStatus stage={operation.stage} notice={notice} onCancel={() => { operation.cancel(); setImages(null); setNotice("Comparison cancelled. Your encoded image is kept."); }} />
    {error && <p className="input-error" role="alert">{error}</p>}
    {images && <ImageComparison images={images} />}
  </section>;
};
