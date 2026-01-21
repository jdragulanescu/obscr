import React, { useState, useEffect } from "react";
import { ImageUpload } from "./ImageUpload";
import { PasswordInput } from "./PasswordInput";
import { EncryptionResult } from "./EncryptionResult";
import { Button } from "./ui/button";

export const EncryptForm = () => {
  const [imagePath, setImagePath] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [compress, setCompress] = useState(false);
  const [obfuscate, setObfuscate] = useState(true);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [capacity, setCapacity] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [encryptionResult, setEncryptionResult] = useState(null);

  const handlePickOutput = async () => {
    if (!window.obscr?.saveOutput) return;
    const file = await window.obscr.saveOutput({
      defaultPath: "encoded.png",
      filters: [{ name: "PNG Images", extensions: ["png"] }],
    });
    if (file) {
      setOutputPath(file);
    }
  };

  // Auto-estimate capacity whenever image, message, or compress changes
  useEffect(() => {
    let cancelled = false;

    const estimateCapacity = async () => {
      if (!window.obscr?.estimateCapacity || !imagePath || !message) {
        if (!cancelled) {
          setCapacity(null);
          setIsEstimating(false);
        }
        return;
      }

      if (!cancelled) setIsEstimating(true);
      const result = await window.obscr.estimateCapacity({
        imagePath,
        message,
        compress,
      });

      if (!cancelled) {
        setIsEstimating(false);
        if (result?.ok) {
          setCapacity(result);
        }
      }
    };

    // Debounce the estimation
    const timeoutId = setTimeout(estimateCapacity, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [imagePath, message, compress]);

  const handleEncrypt = async (e) => {
    e.preventDefault();
    if (!window.obscr?.encrypt) return;
    if (!imagePath || !message || !password) {
      setStatus("Image, message, and password are required.");
      return;
    }

    setBusy(true);
    setStatus("Encrypting and embedding message…");

    const result = await window.obscr.encrypt({
      imagePath,
      outputPath: outputPath || "encoded.png",
      message,
      password,
      compress,
      obfuscate,
    });

    setBusy(false);

    if (!result?.ok) {
      setStatus(result?.error || "Encryption failed");
      return;
    }

    // Show success result with original image path
    setEncryptionResult({
      ...result,
      originalPath: imagePath,
    });
    setStatus("");
  };

  const handleReset = () => {
    setEncryptionResult(null);
    setImagePath("");
    setOutputPath("");
    setMessage("");
    setPassword("");
    setCompress(false);
    setObfuscate(true);
    setStatus("");
    setCapacity(null);
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
        <label className="field-label">Output image</label>
        <div className="image-upload">
          <Button
            type="button"
            variant="default"
            onClick={handlePickOutput}
          >
            Choose output…
          </Button>
          <span className="image-path">
            {outputPath || "encoded.png (default)"}
          </span>
        </div>
      </div>

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

