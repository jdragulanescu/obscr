import React, { useState } from "react";
import { ImageUpload } from "./ImageUpload";
import { ImageComparison } from "./ImageComparison";
import { Button } from "./ui/button";

export const ImageDiffForm = () => {
  const [originalPath, setOriginalPath] = useState("");
  const [encodedPath, setEncodedPath] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const handleGenerateDiff = async (e) => {
    e.preventDefault();
    if (!window.obscr?.generateImageDiff) return;
    if (!originalPath || !encodedPath) {
      setStatus("Both images are required.");
      return;
    }

    setBusy(true);
    setStatus("Generating image diff...");

    const diffResult = await window.obscr.generateImageDiff({
      originalPath,
      encodedPath,
    });

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
    setOriginalPath("");
    setEncodedPath("");
    setResult(null);
    setStatus("");
  };

  return (
    <form className="panel" onSubmit={handleGenerateDiff}>
      <ImageUpload
        label="Original image (PNG)"
        filePath={originalPath}
        onPick={setOriginalPath}
      />

      <ImageUpload
        label="Encoded image (PNG)"
        filePath={encodedPath}
        onPick={setEncodedPath}
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
