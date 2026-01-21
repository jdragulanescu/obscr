import React, { useState } from "react";
import { ImageUpload } from "./ImageUpload";
import { PasswordInput } from "./PasswordInput";
import { MessageDisplay } from "./MessageDisplay";
import { Button } from "./ui/button";
import { extractMessage, downloadBlob } from "../lib/steg";

export const DecryptForm = () => {
  const [imagePath, setImagePath] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [saveToFile, setSaveToFile] = useState(false);

  const handleDecrypt = async (e) => {
    e.preventDefault();
    if (!imagePath || !password) {
      setStatus("Image and password are required.");
      return;
    }

    setBusy(true);
    setStatus("Decrypting and extracting message…");
    setMessage("");

    const result = await extractMessage(imagePath, password);

    setBusy(false);

    if (!result?.ok) {
      setStatus(result?.error || "Decryption failed");
      return;
    }

    setMessage(result.message);

    if (saveToFile) {
      const blob = new Blob([result.message], { type: "text/plain" });
      downloadBlob(blob, "message.txt");
      setStatus("Message decrypted and saved to message.txt");
    } else {
      setStatus("Message decrypted successfully.");
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
        <label className="checkbox">
          <input
            type="checkbox"
            checked={saveToFile}
            onChange={(e) => setSaveToFile(e.target.checked)}
          />
          <span>Save message to file</span>
        </label>
      </div>

      <div className="actions-row">
        <Button type="submit" variant="primary" disabled={busy}>
          Decrypt &amp; Extract
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

      {message && <MessageDisplay message={message} />}
    </form>
  );
};
