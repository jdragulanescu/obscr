import React from "react";

/**
 * Shared shell for the static legal pages: title bar, last-updated stamp and a
 * link back to the tool.
 *
 * @param {object} props
 * @param {string} props.title - page heading, rendered as a terminal command
 * @param {string} props.updated - human-readable date of the last revision
 * @param {React.ReactNode} props.children - the page body
 */
export const LegalPage = ({ title, updated, children }) => (
  <article className="legal-page">
    <header className="legal-page-header">
      <h1>
        <span className="text-primary">$</span> {title}
      </h1>
      <p className="legal-page-updated">Last updated: {updated}</p>
    </header>

    {children}

    <p className="legal-page-back">
      <a href="#">← Back to Obscr</a>
    </p>
  </article>
);
