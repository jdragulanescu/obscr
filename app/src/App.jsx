import React, { useEffect, useRef, useState } from "react";
import { EncryptForm } from "./components/EncryptForm";
import { DecryptForm } from "./components/DecryptForm";
import { ImageDiffForm } from "./components/ImageDiffForm";
import { TerminalAscii } from "./components/TerminalAscii";
import { PrivacyNote } from "./components/PrivacyNote";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { TermsAndConditions } from "./components/TermsAndConditions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { Card } from "./components/ui/card";
import { useHashRoute } from "./lib/useHashRoute";

const BASE_TITLE = "Obscr - Secure Steganography";

/** Static pages reachable by hash, keyed by route name. */
const LEGAL_PAGES = {
  privacy: { Component: PrivacyPolicy, title: `Privacy Policy · ${BASE_TITLE}` },
  terms: {
    Component: TermsAndConditions,
    title: `Terms & Conditions · ${BASE_TITLE}`,
  },
};

/**
 * Resolves a hash route to its page. Guards the lookup with hasOwn so that
 * inherited keys such as "#constructor" or "#__proto__" cannot be rendered as
 * a component, which would throw and blank the page.
 *
 * @param {string} route - the current hash route
 * @returns {{Component: Function, title: string} | null} the page, or null for
 *   the main tool view
 */
const resolveLegalPage = (route) =>
  Object.hasOwn(LEGAL_PAGES, route) ? LEGAL_PAGES[route] : null;

const Tool = () => {
  const [activeTab, setActiveTab] = useState("encrypt");

  return (
    <>
      <PrivacyNote />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 terminal-tabs">
          <TabsTrigger value="encrypt" className="terminal-tab">
            <span className="text-primary mr-2">$</span> Encrypt &amp; Hide
          </TabsTrigger>
          <TabsTrigger value="decrypt" className="terminal-tab">
            <span className="text-primary mr-2">$</span> Decrypt &amp; Reveal
          </TabsTrigger>
          <TabsTrigger value="diff" className="terminal-tab">
            <span className="text-primary mr-2">$</span> Image Diff
          </TabsTrigger>
        </TabsList>

        <TabsContent value="encrypt" className="tab-panel">
          <EncryptForm />
        </TabsContent>

        <TabsContent value="decrypt" className="tab-panel">
          <DecryptForm />
        </TabsContent>

        <TabsContent value="diff" className="tab-panel">
          <ImageDiffForm />
        </TabsContent>
      </Tabs>
    </>
  );
};

export const App = () => {
  const route = useHashRoute();
  const page = resolveLegalPage(route);
  const mainRef = useRef(null);
  const previousRoute = useRef(route);

  useEffect(() => {
    document.title = page ? page.title : BASE_TITLE;
  }, [page]);

  // Moving between the tool and a legal page is a page change, not an in-page
  // anchor jump: start at the top and move focus into the new view, since the
  // link that was just activated is hidden along with the view it belonged to.
  // Comparing against the previous route (rather than a first-render flag)
  // keeps a plain page load — including a deep link to a legal page — from
  // stealing focus, and stays correct under StrictMode's double mount.
  useEffect(() => {
    if (previousRoute.current === route) {
      return;
    }

    previousRoute.current = route;
    window.scrollTo(0, 0);
    mainRef.current?.focus();
  }, [route]);

  return (
    <div className="app-root">
      <TerminalAscii />

      <main className="app-main" ref={mainRef} tabIndex={-1}>
        <Card className="terminal-card">
          {/* The tool stays mounted behind the legal pages so that visiting
              them does not discard an in-progress message or upload. */}
          <div hidden={Boolean(page)}>
            <Tool />
          </div>
          {page && <page.Component />}
        </Card>
      </main>

      <footer className="terminal-footer">
        © Obscr • Secure Data Hiding • <a href="#privacy">Privacy</a> •{" "}
        <a href="#terms">Terms</a>
      </footer>
    </div>
  );
};
