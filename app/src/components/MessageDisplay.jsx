import React from "react";

export const MessageDisplay = ({ message }) => {
  if (!message) return null;
  return (
    <div className="message-display">
      <h3>Decrypted message</h3>
      <pre>{message}</pre>
    </div>
  );
};

