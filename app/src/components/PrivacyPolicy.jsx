import React from "react";
import { LegalPage } from "./LegalPage";

/**
 * Full privacy policy for the Obscr web app. Describes the client-side-only
 * processing model and the limited, anonymous analytics that are collected.
 */
export const PrivacyPolicy = () => (
  <LegalPage title="privacy-policy" updated="11 August 2026">
    <p>
      Obscr is a client-side tool. Encryption, decryption and steganography all
      happen inside your browser using the Web Crypto API and raw PNG samples in cancellable workers.
      There is no backend that receives your data.
    </p>

    <h2>What we never collect</h2>
    <ul>
      <li>
        <strong>Your messages.</strong> Plaintext is encrypted in memory and
        never transmitted anywhere.
      </li>
      <li>
        <strong>Your images.</strong> Both the images you upload and the
        encoded images you download stay on your device. Nothing is uploaded.
      </li>
      <li>
        <strong>Your passwords and keys.</strong> Passwords are used to derive
        an encryption key in memory. They are never stored, logged, or sent
        anywhere, and we cannot recover them.
      </li>
      <li>
        <strong>Accounts.</strong> Obscr has no sign-up, no login and no user
        profiles.
      </li>
    </ul>

    <h2>What we do collect</h2>
    <p>
      The site uses Vercel Web Analytics to count how many people visit. This is
      aggregate, privacy-friendly traffic measurement, not behavioural
      tracking. It records:
    </p>
    <ul>
      <li>page views and the path visited (for example <code>/</code>)</li>
      <li>the referring site, if any</li>
      <li>coarse location (country level) and device or browser type</li>
    </ul>
    <p>
      Vercel Web Analytics does not use cookies, does not store data in your
      browser for this purpose, does not build a cross-site profile, and does
      not receive any content you type into Obscr. If your browser blocks the
      analytics script, Obscr works exactly the same.
    </p>

    <h2>Hosting</h2>
    <p>
      The site is hosted on Vercel, which processes standard request metadata
      such as IP address and user agent in order to serve the page and protect
      the service. Those are Vercel's server logs and are subject to Vercel's
      own privacy policy.
    </p>

    <h2>Fonts</h2>
    <p>
      The interface loads the Fira Code typeface from Google Fonts. Your browser
      makes a request to Google's servers to fetch it, which means Google
      receives that request's metadata. No Obscr data is included in it.
    </p>

    <h2>Data stored on your device</h2>
    <p>
      Obscr installs a service worker so it can run offline as a Progressive Web
      App. It caches the application files — HTML, JavaScript, CSS and icons —
      in your browser's cache storage. It does not cache your messages,
      passwords or images. Clearing your browser's site data removes the cache
      entirely.
    </p>

    <h2>Third parties</h2>
    <p>
      We do not sell, share or trade any data. The only third parties involved
      are Vercel (hosting and analytics) and Google Fonts (typeface delivery),
      as described above.
    </p>

    <h2>Your choices</h2>
    <p>
      Because we hold no personal data about you, there is nothing for us to
      export or delete on request. You can block the analytics script with any
      content blocker, use the CLI version of Obscr for a fully offline
      workflow, or clear site data to remove the local cache.
    </p>

    <h2>Changes</h2>
    <p>
      If this policy changes, the "last updated" date above will change with it.
      The revision history is public in the project's Git repository.
    </p>

    <h2>Contact</h2>
    <p>
      Questions can be raised as an issue at{" "}
      <a
        href="https://github.com/jdragulanescu/obscr"
        target="_blank"
        rel="noreferrer noopener"
      >
        github.com/jdragulanescu/obscr
      </a>
      .
    </p>
  </LegalPage>
);
