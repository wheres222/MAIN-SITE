"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import styles from "./discord-showcase.module.css";

// WidgetBot server/channel (reviews channel pre-selected).
const WIDGET_HTML = `<widgetbot server="1489830797849399449" channel="1489840460208931009" width="100%" height="100%"></widgetbot>`;

/**
 * Fast Discord community panel. The heavy WidgetBot iframe + script are NOT
 * loaded on initial paint — they only mount once the panel scrolls near the
 * viewport (IntersectionObserver). Until then a lightweight placeholder shows,
 * so the homepage stays fast.
 */
export function DiscordShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    if (load) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" } // start loading a bit before it's visible
    );
    io.observe(el);
    return () => io.disconnect();
  }, [load]);

  return (
    <div className="panel" ref={ref}>
      <header className="panel-header">Join the Community</header>
      <div className={styles.widgetWrap}>
        {load ? (
          <>
            <div className={styles.widget} dangerouslySetInnerHTML={{ __html: WIDGET_HTML }} />
            <Script src="https://cdn.jsdelivr.net/npm/@widgetbot/html-embed" strategy="lazyOnload" />
          </>
        ) : (
          <div className={styles.placeholder} aria-hidden="true">
            <svg viewBox="0 0 127.14 96.36" width="44" height="44" fill="currentColor">
              <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0 105.89 105.89 0 0 0 19.39 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5 12.69-11.43 12.69Z" />
            </svg>
            <span>Loading live chat…</span>
          </div>
        )}
      </div>
    </div>
  );
}
