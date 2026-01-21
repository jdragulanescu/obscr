import React from "react";
import { Button } from "./ui/button";

export const ImageUpload = ({ label, filePath, onPick }) => {
  const handleClick = async () => {
    if (!window.obscr?.openImage) return;
    const picked = await window.obscr.openImage();
    if (picked) {
      onPick(picked);
    }
  };

  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <div className="image-upload">
        <Button type="button" variant="outline" onClick={handleClick}>
          Choose PNG image…
        </Button>
        <span className="image-path">
          {filePath || "No file selected"}
        </span>
      </div>
    </div>
  );
};

