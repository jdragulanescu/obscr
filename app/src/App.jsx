import React, { useEffect, useState } from "react";
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

/** Static pages reachable by hash, keyed by route name. */
const LEGAL_PAGES = {
  privacy: PrivacyPolicy,
  terms: TermsAndConditions,
};

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
  const LegalPageView = LEGAL_PAGES[route];

  // Switching between the tool and a legal page is a page change, not an
  // in-page anchor jump, so start each view from the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  return (
    <div className="app-root">
      <TerminalAscii />

      <main className="app-main">
        <Card className="terminal-card">
          {/* The tool stays mounted behind the legal pages so that visiting
              them does not discard an in-progress message or upload. */}
          <div hidden={Boolean(LegalPageView)}>
            <Tool />
          </div>
          {LegalPageView && <LegalPageView />}
        </Card>
      </main>

      <footer className="terminal-footer">
        © Obscr • Secure Data Hiding • <a href="#privacy">Privacy</a> •{" "}
        <a href="#terms">Terms</a>
      </footer>
    </div>
  );
};
