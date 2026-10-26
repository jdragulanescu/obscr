import React from "react";

export const MessageDisplay = ({ message }) => {
  if (!message) return null;
  return (
    <div className="message-display">
      <pre>{message}</pre>
    </div>
  );
};

