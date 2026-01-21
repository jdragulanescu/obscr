import React, { useRef } from "react";
import { Button } from "./ui/button";

export const ImageUpload = ({ label, filePath, onPick }) => {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onPick(file);
    }
  };

  const displayName = filePath?.name || "No file selected";

  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <div className="image-upload">
        <Button type="button" variant="outline" onClick={handleClick}>
          Choose PNG image…
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <span className="image-path">{displayName}</span>
      </div>
    </div>
  );
};

