import React, { useState } from "react";
import { EncryptForm } from "./components/EncryptForm";
import { DecryptForm } from "./components/DecryptForm";
import { ImageDiffForm } from "./components/ImageDiffForm";
import { TerminalAscii } from "./components/TerminalAscii";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { Card } from "./components/ui/card";

export const App = () => {
  const [activeTab, setActiveTab] = useState("encrypt");

  return (
    <div className="app-root">
      <TerminalAscii />

      <main className="app-main">
        <Card className="terminal-card">
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
        </Card>
      </main>

      <footer className="terminal-footer">
        © Obscr • Secure Data Hiding
      </footer>
    </div>
  );
};

