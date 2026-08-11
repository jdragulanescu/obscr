import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { App } from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    {/* Anonymous page-view counts only — see the privacy policy at #privacy */}
    <Analytics />
  </React.StrictMode>
);
