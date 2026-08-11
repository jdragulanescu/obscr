# Privacy Policy

_Last updated: 11 August 2026_

This is the canonical text of the privacy policy shown in the web app at
[obscr.vercel.app/#privacy](https://obscr.vercel.app/#privacy)
(`app/src/components/PrivacyPolicy.jsx`). Keep the two in sync when editing.

Obscr is a client-side tool. Encryption, decryption and steganography all happen inside
your browser using the Web Crypto API and the HTML canvas. There is no backend that
receives your data.

## What we never collect

- **Your messages.** Plaintext is encrypted in memory and never transmitted anywhere.
- **Your images.** Both the images you upload and the encoded images you download stay on
  your device. Nothing is uploaded.
- **Your passwords and keys.** Passwords are used to derive an encryption key in memory.
  They are never stored, logged, or sent anywhere, and we cannot recover them.
- **Accounts.** Obscr has no sign-up, no login and no user profiles.

## What we do collect

The site uses Vercel Web Analytics to count how many people visit. This is aggregate,
privacy-friendly traffic measurement, not behavioural tracking. It records:

- page views and the path visited (for example `/`)
- the referring site, if any
- coarse location (country level) and device or browser type

Vercel Web Analytics does not use cookies, does not store data in your browser for this
purpose, does not build a cross-site profile, and does not receive any content you type
into Obscr. If your browser blocks the analytics script, Obscr works exactly the same.

## Hosting

The site is hosted on Vercel, which processes standard request metadata such as IP address
and user agent in order to serve the page and protect the service. Those are Vercel's
server logs and are subject to Vercel's own privacy policy.

## Fonts

The interface loads the Fira Code typeface from Google Fonts. Your browser makes a request
to Google's servers to fetch it, which means Google receives that request's metadata. No
Obscr data is included in it.

## Data stored on your device

Obscr installs a service worker so it can run offline as a Progressive Web App. It caches
the application files — HTML, JavaScript, CSS and icons — in your browser's cache storage.
It does not cache your messages, passwords or images. Clearing your browser's site data
removes the cache entirely.

## Third parties

We do not sell, share or trade any data. The only third parties involved are Vercel
(hosting and analytics) and Google Fonts (typeface delivery), as described above.

## Your choices

Because we hold no personal data about you, there is nothing for us to export or delete on
request. You can block the analytics script with any content blocker, use the CLI version
of Obscr for a fully offline workflow, or clear site data to remove the local cache.

## Changes

If this policy changes, the "last updated" date above will change with it. The revision
history is public in this repository.

## Contact

Questions can be raised as an issue at
[github.com/jdragulanescu/obscr](https://github.com/jdragulanescu/obscr).
