import React, { useState, useEffect } from "react";
import { ImageUpload } from "./ImageUpload";
import { PasswordInput } from "./PasswordInput";
import { EncryptionResult } from "./EncryptionResult";
import { Button } from "./ui/button";
import { embedMessage, estimateCapacity, downloadBlob } from "../lib/steg";

export const EncryptForm = () => {
  const [imagePath, setImagePath] = useState("");
  const [encodedBlob, setEncodedBlob] = useState(null);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [compress, setCompress] = useState(false);
  const [obfuscate, setObfuscate] = useState(true);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [capacity, setCapacity] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [encryptionResult, setEncryptionResult] = useState(null);

  // Auto-estimate capacity whenever image, message, or compress changes
  useEffect(() => {
    let cancelled = false;

    const doEstimateCapacity = async () => {
      if (!imagePath || !message) {
        if (!cancelled) {
          setCapacity(null);
          setIsEstimating(false);
        }
        return;
      }

      if (!cancelled) setIsEstimating(true);

      const result = await estimateCapacity(imagePath, message, compress);

      if (!cancelled) {
        setIsEstimating(false);
        if (result?.ok) {
          setCapacity(result);
        }
      }
    };

    // Debounce the estimation
    const timeoutId = setTimeout(doEstimateCapacity, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [imagePath, message, compress]);

  const handleEncrypt = async (e) => {
    e.preventDefault();
    if (!imagePath || !message || !password) {
      setStatus("Image, message, and password are required.");
      return;
    }

    setBusy(true);
    setStatus("Encrypting and embedding message…");

    const result = await embedMessage(imagePath, message, password, {
      compress,
      obfuscate,
    });

    // Trigger download and store blob for diff generation
    if (result?.ok) {
      downloadBlob(result.blob, "encoded.png");
      result.outputPath = "encoded.png";
      setEncodedBlob(result.blob);
    }

    setBusy(false);

    if (!result?.ok) {
      setStatus(result?.error || "Encryption failed");
      return;
    }

    // Show success result with original image and blob
    setEncryptionResult({
      ...result,
      originalPath: imagePath?.name,
      originalFile: imagePath,
      encodedBlob: result.blob,
    });
    setStatus("");
  };

  const handleReset = () => {
    setEncryptionResult(null);
    setImagePath("");
    setMessage("");
    setPassword("");
    setCompress(false);
    setObfuscate(true);
    setStatus("");
    setCapacity(null);
    setEncodedBlob(null);
  };

  // Show results if encryption was successful
  if (encryptionResult) {
    return <EncryptionResult result={encryptionResult} onReset={handleReset} />;
  }

  return (
    <form className="panel" onSubmit={handleEncrypt}>
      <ImageUpload
        label="Source image (PNG)"
        filePath={imagePath}
        onPick={setImagePath}
      />


      <div className="field">
        <label className="field-label">Secret message</label>
        <textarea
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type or paste the message you want to hide…"
        />
      </div>

      <PasswordInput
        label="Password"
        value={password}
        onChange={setPassword}
        showStrength
      />

      <div className="field">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={compress}
            onChange={(e) => setCompress(e.target.checked)}
          />
          <span>Enable compression (recommended for large messages)</span>
        </label>
      </div>

      <div className="field">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={obfuscate}
            onChange={(e) => setObfuscate(e.target.checked)}
          />
          <span>Enable obfuscation (fills unused bits with random data for security)</span>
        </label>
      </div>

      <div className="capacity-box">
        {!imagePath || !message ? (
          <div className="capacity-estimating">Select an image and enter a message to see capacity...</div>
        ) : isEstimating && !capacity ? (
          <div className="capacity-estimating">Calculating capacity...</div>
        ) : capacity ? (
          <>
            <div className="capacity-header">
              <span className="label">Capacity used:</span>{" "}
              <strong className={capacity.estimatedBits > capacity.totalBits ? "over-capacity" : ""}>
                {capacity.utilization}
              </strong>
              {isEstimating && <span className="updating"> (updating...)</span>}
            </div>
            <div className="capacity-grid">
              <span>Available: {capacity.totalBits.toLocaleString()} bits</span>
              <span>Required: {capacity.estimatedBits.toLocaleString()} bits</span>
            </div>
            {capacity.estimatedBits > capacity.totalBits && (
              <div className="capacity-warning">
                ⚠️ Message is too large for this image. Choose a larger image or enable compression.
              </div>
            )}
          </>
        ) : (
          <div className="capacity-estimating">Calculating capacity...</div>
        )}
      </div>

      <div className="actions-row">
        <Button type="submit" variant="primary" disabled={busy}>
          Encrypt &amp; Hide
        </Button>
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
    </form>
  );
};

