import React from "react";

export const TerminalAscii = () => {
  const asciiArt = `
   ██████╗ ██████╗ ███████╗ ██████╗██████╗
  ██╔═══██╗██╔══██╗██╔════╝██╔════╝██╔══██╗
  ██║   ██║██████╔╝███████╗██║     ██████╔╝
  ██║   ██║██╔══██╗╚════██║██║     ██╔══██╗
  ╚██████╔╝██████╔╝███████║╚██████╗██║  ██║
   ╚═════╝ ╚═════╝ ╚══════╝ ╚═════╝╚═╝  ╚═╝
  `;

  return (
    <div className="terminal-header">
      <div className="terminal-controls">
        <div className="terminal-dot red"></div>
        <div className="terminal-dot yellow"></div>
        <div className="terminal-dot green"></div>
      </div>
      <pre className="ascii-art">{asciiArt}</pre>
      <div className="terminal-subtitle">
        <span className="text-primary">$</span> Steganography & Encryption Tool
      </div>
      <div className="terminal-info">
        <span className="text-muted-foreground">
          AES-256-GCM Encryption | LSB Steganography | Secure Data Hiding
        </span>
      </div>
    </div>
  );
};
