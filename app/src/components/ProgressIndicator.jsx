import React from "react";

export const ProgressIndicator = ({ label, busy }) => {
  return (
    <div className="progress-indicator">
      {busy && (
        <>
          <span className="spinner" />
          <span>{label}</span>
        </>
      )}
    </div>
  );
};

