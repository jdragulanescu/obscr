import React from "react";
import { LegalPage } from "./LegalPage";

/**
 * Terms of use for the Obscr web app: what the tool guarantees (very little),
 * what the user is responsible for, and the limits of steganography.
 */
export const TermsAndConditions = () => (
  <LegalPage title="terms-and-conditions" updated="11 August 2026">
    <p>
      By using Obscr you agree to the terms below. If you do not agree with
      them, do not use the tool.
    </p>

    <h2>1. What Obscr is</h2>
    <p>
      Obscr is a free, open-source tool that encrypts data with AES-256-GCM and
      hides the result inside a PNG image using least-significant-bit
      steganography. It is released under the MIT licence and runs entirely in
      your browser. A command-line version is available as an npm package.
    </p>

    <h2>2. Provided as is</h2>
    <p>
      Obscr is provided "as is", without warranty of any kind, express or
      implied, including but not limited to the warranties of merchantability,
      fitness for a particular purpose and non-infringement. Availability is
      not guaranteed; the service may change or go offline at any time without
      notice.
    </p>

    <h2>3. No password recovery</h2>
    <p>
      Your password is the only way to decrypt your data. It is never
      transmitted or stored, which means it cannot be reset, recovered or
      bypassed by anyone, including us. If you lose your password, the data is
      permanently unrecoverable. Keep your own backups of both the password and
      the encoded image.
    </p>

    <h2>4. Limits of the protection offered</h2>
    <p>
      Steganography is obfuscation, not security on its own. You should
      understand the following before relying on Obscr:
    </p>
    <ul>
      <li>
        the confidentiality of your data rests on the strength of your password
        and on AES-256-GCM;
      </li>
      <li>
        an encoded image is not resistant to targeted steganalysis by an expert;
      </li>
      <li>
        anyone who knows an image contains hidden data can extract the encrypted
        payload, though they still need your password to decrypt it;
      </li>
      <li>
        re-saving, resizing, compressing or converting an encoded image
        (including by many messaging and social platforms) destroys the hidden
        data.
      </li>
    </ul>
    <p>
      Obscr has not been independently security audited. Do not use it as the
      sole protection for data whose disclosure would cause serious harm.
    </p>

    <h2>5. Your responsibilities</h2>
    <p>
      You are responsible for how you use the tool and for the content you
      process with it. You agree not to use Obscr for any purpose that is
      unlawful in your jurisdiction. You are responsible for complying with any
      export, encryption or data-protection laws that apply to you, and for
      making your own backups.
    </p>

    <h2>6. Limitation of liability</h2>
    <p>
      To the fullest extent permitted by law, the authors and contributors are
      not liable for any claim, damages or other liability — including data
      loss, data exposure, lost profits or business interruption — arising from
      or in connection with the use of Obscr, whether in an action of contract,
      tort or otherwise.
    </p>

    <h2>7. Privacy</h2>
    <p>
      How data is handled is described in the{" "}
      <a href="#privacy">Privacy Policy</a>, which forms part of these terms.
    </p>

    <h2>8. Changes to these terms</h2>
    <p>
      These terms may be updated. The "last updated" date above reflects the
      current revision, and the full history is public in the project's Git
      repository. Continued use after a change means you accept the revised
      terms.
    </p>

    <h2>9. Contact</h2>
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
