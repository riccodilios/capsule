"use client";

import { useEffect } from "react";

const EXACT = new Set([
  "Development mode",
  "Development Mode",
  "وضع التطوير",
]);

function isDevModeLabel(text: string): boolean {
  const t = text.trim();
  if (t.length === 0 || t.length > 72) return false;
  if (EXACT.has(t)) return true;
  if (/^development\s*mode\.?$/i.test(t)) return true;
  if (/development\s*mode/i.test(t) && t.length <= 56) return true;
  return false;
}

/** Traverse light DOM and open shadow roots (Clerk embeds UI in shadow DOM). */
function forEachHTMLElement(
  root: ParentNode,
  fn: (el: HTMLElement) => void,
): void {
  root.querySelectorAll("*").forEach((node) => {
    if (node instanceof HTMLElement) fn(node);
    if (node instanceof Element && node.shadowRoot) {
      forEachHTMLElement(node.shadowRoot, fn);
    }
  });
}

function hideDevModeLabels() {
  forEachHTMLElement(document.body, (el) => {
    const t = el.textContent?.trim() ?? "";
    if (!isDevModeLabel(t)) return;
    el.style.setProperty("display", "none", "important");
    el.setAttribute("aria-hidden", "true");
  });
}

/**
 * Clerk dev-instance “Development mode” can render in UserButton / UserProfile (including shadow DOM).
 * `appearance.layout.unsafe_disableDevelopmentModeWarnings` helps but is not always enough across versions.
 */
export function ClerkDevModeCleanup() {
  useEffect(() => {
    hideDevModeLabels();
    const interval = window.setInterval(hideDevModeLabels, 500);
    const mo = new MutationObserver(hideDevModeLabels);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.clearInterval(interval);
      mo.disconnect();
    };
  }, []);

  return null;
}
