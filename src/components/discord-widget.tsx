"use client";

import Script from "next/script";
import styles from "./discord-widget.module.css";

// WidgetBot scans the DOM for <widgetbot> custom elements and replaces each
// with an iframe pointing at the configured Discord server. We mount the
// element via dangerouslySetInnerHTML to avoid TypeScript complaints about
// an unknown JSX element, then load the widget's helper script lazily so it
// doesn't block first paint.
// `channel` pre-selects the reviews channel so visitors land directly in
// customer testimonials instead of having to navigate the channel list.
const WIDGET_HTML = `<widgetbot server="1489830797849399449" channel="1489840460208931009" width="100%" height="100%"></widgetbot>`;

export function DiscordWidget() {
  return (
    <section className={styles.section} aria-label="Join our Discord community">
      <header className={styles.heading}>
        <h2>Join the Community</h2>
        <p>Live chat with staff and members — configs, support, and patch updates in real time.</p>
      </header>

      <div className={styles.widgetWrap}>
        <div
          className={styles.widget}
          dangerouslySetInnerHTML={{ __html: WIDGET_HTML }}
        />
      </div>

      <Script
        src="https://cdn.jsdelivr.net/npm/@widgetbot/html-embed"
        strategy="afterInteractive"
      />
    </section>
  );
}
