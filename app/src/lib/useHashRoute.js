import { useEffect, useState } from "react";

/**
 * Reads the current location hash as a simple route name.
 *
 * @returns {string} the hash without its leading "#", or "" when there is none
 */
const readHash = () => window.location.hash.replace(/^#/, "");

/**
 * Minimal hash-based router for the handful of static pages (privacy, terms)
 * that sit alongside the main tool. Keeps those pages deep-linkable without
 * pulling in a routing library.
 *
 * @returns {string} the active route name, "" for the main app view
 */
export const useHashRoute = () => {
  const [route, setRoute] = useState(readHash);

  useEffect(() => {
    const onHashChange = () => setRoute(readHash());

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return route;
};
