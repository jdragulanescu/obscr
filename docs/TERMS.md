# Terms & Conditions

_Last updated: 11 August 2026_

This is the canonical text of the terms shown in the web app at
[obscr.vercel.app/#terms](https://obscr.vercel.app/#terms)
(`app/src/components/TermsAndConditions.jsx`). Keep the two in sync when editing.

By using Obscr you agree to the terms below. If you do not agree with them, do not use the
tool.

## 1. What Obscr is

Obscr is a free, open-source tool that encrypts data with AES-256-GCM and hides the result
inside a PNG image using least-significant-bit steganography. It is released under the MIT
licence and runs entirely in your browser. A command-line version is available as an npm
package.

## 2. Provided as is

Obscr is provided "as is", without warranty of any kind, express or implied, including but
not limited to the warranties of merchantability, fitness for a particular purpose and
non-infringement. Availability is not guaranteed; the service may change or go offline at
any time without notice.

## 3. No password recovery

Your password is the only way to decrypt your data. It is never transmitted or stored,
which means it cannot be reset, recovered or bypassed by anyone, including us. If you lose
your password, the data is permanently unrecoverable. Keep your own backups of both the
password and the encoded image.

## 4. Limits of the protection offered

Steganography is obfuscation, not security on its own. You should understand the following
before relying on Obscr:

- the confidentiality of your data rests on the strength of your password and on
  AES-256-GCM;
- an encoded image is not resistant to targeted steganalysis by an expert;
- anyone who knows an image contains hidden data can extract the encrypted payload, though
  they still need your password to decrypt it;
- re-saving, resizing, compressing or converting an encoded image (including by many
  messaging and social platforms) destroys the hidden data.

Obscr has not been independently security audited. Do not use it as the sole protection for
data whose disclosure would cause serious harm.

## 5. Your responsibilities

You are responsible for how you use the tool and for the content you process with it. You
agree not to use Obscr for any purpose that is unlawful in your jurisdiction. You are
responsible for complying with any export, encryption or data-protection laws that apply to
you, and for making your own backups.

## 6. Limitation of liability

To the fullest extent permitted by law, the authors and contributors are not liable for any
claim, damages or other liability — including data loss, data exposure, lost profits or
business interruption — arising from or in connection with the use of Obscr, whether in an
action of contract, tort or otherwise.

## 7. Privacy

How data is handled is described in the [Privacy Policy](./PRIVACY.md), which forms part of
these terms.

## 8. Changes to these terms

These terms may be updated. The "last updated" date above reflects the current revision,
and the full history is public in this repository. Continued use after a change means you
accept the revised terms.

## 9. Contact

Questions can be raised as an issue at
[github.com/jdragulanescu/obscr](https://github.com/jdragulanescu/obscr).
