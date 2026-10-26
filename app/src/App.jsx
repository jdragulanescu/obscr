import React, { useCallback, useEffect, useRef, useState } from "react";
import { EncryptForm } from "./components/EncryptForm";
import { DecryptForm } from "./components/DecryptForm";
import { ImageDiffForm } from "./components/ImageDiffForm";
import { TerminalAscii } from "./components/TerminalAscii";
import { PrivacyNote } from "./components/PrivacyNote";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { TermsAndConditions } from "./components/TermsAndConditions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { useHashRoute } from "./lib/useHashRoute";

const BASE_TITLE = "Obscr - Secure Steganography";
const LEGAL_PAGES = {
  privacy: { Component: PrivacyPolicy, title: `Privacy Policy · ${BASE_TITLE}` },
  terms: { Component: TermsAndConditions, title: `Terms & Conditions · ${BASE_TITLE}` },
};
const resolveLegalPage = (route) => Object.hasOwn(LEGAL_PAGES, route) ? LEGAL_PAGES[route] : null;

export const App = () => {
  const requestedRoute = useHashRoute();
  const [route, setRoute] = useState(requestedRoute);
  const [activeTab, setActiveTab] = useState("encrypt");
  const [revision, setRevision] = useState(0);
  const [formState, setFormState] = useState({ dirty: false, busy: false });
  const [pending, setPending] = useState(null);
  const [navigationNotice, setNavigationNotice] = useState("");
  const dialog = useRef(null);
  const trigger = useRef(null);
  const mainRef = useRef(null);
  const previousRoute = useRef(route);
  const stateRef = useRef(formState);
  stateRef.current = formState;
  const page = resolveLegalPage(route);
  const reportState = useCallback((state) => setFormState(state), []);
  const requestClear = useCallback((action) => {
    if (stateRef.current.locked) return;
    if (!stateRef.current.dirty) { action(); return; }
    trigger.current = document.activeElement;
    setPending({ action });
  }, []);
  const resetForm = () => { setRevision((value) => value + 1); setFormState({ dirty: false, busy: false }); };
  const changeTab = (tab) => {
    if (tab === activeTab) return;
    requestClear(() => { resetForm(); setActiveTab(tab); });
  };
  useEffect(() => {
    if (!pending) return;
    dialog.current?.showModal();
  }, [pending]);
  const closeDialog = (discard) => {
    const action = pending?.action;
    dialog.current?.close();
    setPending(null);
    trigger.current?.focus();
    if (discard) action?.();
  };
  useEffect(() => {
    if (requestedRoute === route) return;
    const change = () => { resetForm(); setRoute(requestedRoute); window.history.replaceState(null, "", `#${requestedRoute}`); window.dispatchEvent(new HashChangeEvent("hashchange")); };
    if (stateRef.current.busy || stateRef.current.dirty) {
      window.history.replaceState(null, "", `#${route}`);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      if (stateRef.current.locked) setNavigationNotice("Finish the active operation or select Cancel before leaving this task.");
      else requestClear(change);
    } else change();
  }, [requestedRoute, requestClear]);
  useEffect(() => { document.title = page ? page.title : BASE_TITLE; }, [page]);
  useEffect(() => {
    if (previousRoute.current === route) return;
    previousRoute.current = route;
    window.scrollTo(0, 0); mainRef.current?.focus();
  }, [route]);
  useEffect(() => {
    if (!formState.locked) setNavigationNotice("");
  }, [formState.locked]);
  useEffect(() => {
    const warn = (event) => {
      if (stateRef.current.dirty || stateRef.current.busy) { event.preventDefault(); event.returnValue = ""; }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  const guardLink = (event) => {
    const link = event.target.closest?.("a[href^='#']");
    if (!link || page) return;
    if (formState.locked) { event.preventDefault(); setNavigationNotice("Finish the active operation or select Cancel before leaving this task."); return; }
    if (formState.dirty) {
      event.preventDefault();
      const target = link.getAttribute("href");
      requestClear(() => { resetForm(); window.location.hash = target; });
    }
  };
  return <div className="app-root" onClickCapture={guardLink}>
    <TerminalAscii />
    <main className="app-main" ref={mainRef} tabIndex={-1}>
      <Card className="terminal-card">
        {!page && <>
          <PrivacyNote />
          <Tabs value={activeTab} onValueChange={changeTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 terminal-tabs" aria-label="Tasks">
              <TabsTrigger value="encrypt" disabled={formState.locked} className="terminal-tab">Encrypt &amp; Hide</TabsTrigger>
              <TabsTrigger value="decrypt" disabled={formState.locked} className="terminal-tab">Decrypt &amp; Reveal</TabsTrigger>
              <TabsTrigger value="diff" disabled={formState.locked} className="terminal-tab">Image Diff</TabsTrigger>
            </TabsList>
            {formState.locked && <p className="field-help">Task switching and Clear are unavailable during this operation. Select Cancel to stop it.</p>}
            <TabsContent value="encrypt" className="tab-panel"><EncryptForm key={revision} onStateChange={reportState} requestClear={requestClear} /></TabsContent>
            <TabsContent value="decrypt" className="tab-panel"><DecryptForm key={revision} onStateChange={reportState} requestClear={requestClear} /></TabsContent>
            <TabsContent value="diff" className="tab-panel"><ImageDiffForm key={revision} onStateChange={reportState} requestClear={requestClear} /></TabsContent>
          </Tabs>
        </>}
        {page && <page.Component />}
        <p role="status">{navigationNotice}</p>
      </Card>
    </main>
    <footer className="terminal-footer">© Obscr • Secure Data Hiding • <a href="#privacy" aria-disabled={formState.locked}>Privacy</a> • <a href="#terms" aria-disabled={formState.locked}>Terms</a></footer>
    <dialog ref={dialog} className="discard-dialog" aria-labelledby="discard-title" aria-describedby="discard-description" onCancel={(event) => { event.preventDefault(); closeDialog(false); }}>
      <h2 id="discard-title">Clear this task?</h2>
      <p id="discard-description">This removes the selected images, message, password and results from this task. Download any result you want to keep before you leave.</p>
      <div className="actions-row">
        <Button type="button" autoFocus variant="outline" onClick={() => closeDialog(false)}>Stay</Button>
        <Button type="button" variant="primary" onClick={() => closeDialog(true)}>Switch and clear</Button>
      </div>
    </dialog>
  </div>;
};
