import { useEffect, useState } from "react";

// SSR-safe hook that tracks whether the page is in dark mode by
// observing the presence of the `.dark` class on <html>.
export default function useDarkMode(): boolean {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (typeof document === "undefined") return;

    const el = document.documentElement;

    const check = () => setIsDark(el.classList.contains("dark"));

    // watch for class changes on the root element so theme toggles are reactive
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "class") {
          check();
          break;
        }
      }
    });

    mo.observe(el, { attributes: true, attributeFilter: ["class"] });

    // initial check
    check();

    return () => mo.disconnect();
  }, []);

  return isDark;
}
