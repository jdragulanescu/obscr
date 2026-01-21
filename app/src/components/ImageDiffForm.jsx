import React, { useState } from "react";
import { ImageUpload } from "./ImageUpload";
import { ImageComparison } from "./ImageComparison";
import { Button } from "./ui/button";
import { generateImageDiff } from "../lib/steg";

export const ImageDiffForm = () => {
  const [originalFile, setOriginalFile] = useState(null);
  const [encodedFile, setEncodedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const handleGenerateDiff = async (e) => {
    e.preventDefault();
    if (!originalFile || !encodedFile) {
      setStatus("Both images are required.");
      return;
    }

    setBusy(true);
    setStatus("Generating image diff...");

    const diffResult = await generateImageDiff(originalFile, encodedFile);

    setBusy(false);

    if (!diffResult?.ok) {
      setStatus(diffResult?.error || "Failed to generate diff");
      setResult(null);
      return;
    }

    setResult(diffResult);
    setStatus("");
  };

  const handleReset = () => {
    setOriginalFile(null);
    setEncodedFile(null);
    setResult(null);
    setStatus("");
  };

  return (
    <form className="panel" onSubmit={handleGenerateDiff}>
      <ImageUpload
        label="Original image (PNG)"
        filePath={originalFile}
        onPick={setOriginalFile}
      />

      <ImageUpload
        label="Encoded image (PNG)"
        filePath={encodedFile}
        onPick={setEncodedFile}
      />

      <div className="actions-row">
        <Button type="submit" variant="primary" disabled={busy}>
          Generate Diff
        </Button>
        {result && (
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
        )}
        <div className="status-inline">
          {busy && (
            <div className="progress-indicator-inline">
              <span className="spinner" />
              <span>{status}</span>
            </div>
          )}
          {!busy && status && <span className="status-message">{status}</span>}
        </div>
      </div>

      {result && <ImageComparison images={result} />}
    </form>
  );
};
