import React from "react";

/**
 * Always-visible summary of what the app does and does not collect, shown
 * above the tool tabs. The full detail lives in PrivacyPolicy.
 */
export const PrivacyNote = () => (
  <div className="privacy-note">
    <span className="privacy-note-label">
      <span className="text-primary">#</span> privacy
    </span>
    <p>
      Everything runs in your browser. Your messages, images and passwords are
      encrypted locally and are never uploaded to a server. We count anonymous
      page views only — no cookies, no accounts, and no record of what you
      encrypt.
    </p>
    <p className="privacy-note-links">
      <a href="#privacy">Privacy Policy</a>
      <span aria-hidden="true"> · </span>
      <a href="#terms">Terms &amp; Conditions</a>
    </p>
  </div>
);
