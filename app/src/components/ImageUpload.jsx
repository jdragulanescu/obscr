import React, { useId, useRef } from "react";
import { Button } from "./ui/button";

export const ImageUpload = ({ label, filePath, onPick, disabled = false, error, hint }) => {
  const fileInputRef = useRef(null);
  const id = useId();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      onPick(file);
    }
  };

  const displayName = filePath?.name || "No file selected";

  return (
    <div className="field">
      <label className="field-label" id={`${id}-label`}>{label}</label>
      <div className="image-upload">
        <Button type="button" variant="outline" disabled={disabled} onClick={handleClick} aria-labelledby={`${id}-label ${id}-choose`} aria-describedby={`${id}-hint`}>
          <span id={`${id}-choose`}>Choose PNG image…</span>
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          disabled={disabled}
          aria-labelledby={`${id}-label`}
          accept="image/png"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <span className="image-path">{displayName}</span>
      </div>
      <p id={`${id}-hint`} className={error ? "input-error" : "field-help"} role={error ? "alert" : undefined}>
        {error || hint || "Use an opaque RGB or RGBA PNG, up to 1024 × 1024 pixels and 16 MiB."}
      </p>
    </div>
  );
};

