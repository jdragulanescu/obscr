import React, { useState } from "react";
import { ImageUpload } from "./ImageUpload";
import { PasswordInput } from "./PasswordInput";
import { ProgressIndicator } from "./ProgressIndicator";
import { MessageDisplay } from "./MessageDisplay";
import { Button } from "./ui/button";

export const DecryptForm = () => {
  const [imagePath, setImagePath] = useState("");
  const [password, setPassword] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");

  const handlePickOutput = async () => {
    if (!window.obscr?.saveOutput) return;
    const file = await window.obscr.saveOutput({
      defaultPath: "message.txt",
      filters: [{ name: "Text files", extensions: ["txt"] }],
    });
    if (file) {
      setOutputPath(file);
    }
  };

  const handleDecrypt = async (e) => {
    e.preventDefault();
    if (!window.obscr?.decrypt) return;
    if (!imagePath || !password) {
      setStatus("Image and password are required.");
      return;
    }

    setBusy(true);
    setStatus("Decrypting and extracting message…");
    setMessage("");

    const result = await window.obscr.decrypt({
      imagePath,
      password,
      outputPath: outputPath || null,
    });

    setBusy(false);

    if (!result?.ok) {
      setStatus(result?.error || "Decryption failed");
      return;
    }

    if (result.message) {
      setMessage(result.message);
      setStatus("Message decrypted successfully.");
    } else if (result.savedTo) {
      setStatus(`Message saved to ${result.savedTo}`);
    } else {
      setStatus("Decryption completed.");
    }
  };

  return (
    <form className="panel" onSubmit={handleDecrypt}>
      <ImageUpload
        label="Encoded image (PNG)"
        filePath={imagePath}
        onPick={setImagePath}
      />

      <PasswordInput
        label="Password"
        value={password}
        onChange={setPassword}
        showStrength={false}
      />

      <div className="field">
        <label className="field-label">Optional: save to file</label>
        <div className="image-upload">
          <Button
            type="button"
            variant="default"
            onClick={handlePickOutput}
          >
            Choose output…
          </Button>
          <span className="image-path">
            {outputPath || "Leave empty to show message here"}
          </span>
        </div>
      </div>

      <div className="actions-row">
        <Button type="submit" variant="primary" disabled={busy}>
          Decrypt &amp; Reveal
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

      <MessageDisplay message={message} />
    </form>
  );
};

