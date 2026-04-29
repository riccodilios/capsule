"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Avoid noisy errors in dev on some setups; prod will register fine.
    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => undefined);
  }, []);

  return null;
}

