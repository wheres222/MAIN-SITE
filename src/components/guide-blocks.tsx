"use client";

import { useState, type ReactNode } from "react";

/**
 * Shared building blocks for guide content, used by both the setup sections
 * (@/lib/setup-guides) and the per-product guides (@/lib/product-guides).
 * Styling for these lives in the <style> block on the /guide page.
 */

export function Step({ n, title, children }: { n: number; title: string; children?: ReactNode }) {
  return (
    <div className="guide-step">
      <div className="guide-step-num">{n}</div>
      <div className="guide-step-body">
        <strong>{title}</strong>
        {children ? <div>{children}</div> : null}
      </div>
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="guide-note">
      <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden className="guide-note-icon">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

export function Warn({ children }: { children: ReactNode }) {
  return (
    <div className="guide-warn">
      <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden className="guide-warn-icon">
        <path d="M12 9v4M12 17h.01M10.3 3.6L2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

/** Error → fix pairs, which most of these guides end with. */
export function Fixes({ items }: { items: { problem: string; fix: ReactNode }[] }) {
  return (
    <dl className="guide-fixes">
      {items.map((item) => (
        <div key={item.problem}>
          <dt>{item.problem}</dt>
          <dd>{item.fix}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Flatten the children of a <Code> block back into the raw text to copy. */
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  return "";
}

export function Code({ children }: { children: ReactNode }) {
  const text = textOf(children);
  // A copy button on something like `regedit` is more clutter than convenience.
  const worthCopying = text.trim().length >= 5;
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be blocked; leave the button in its idle state.
    }
  }

  return (
    <div className="guide-code-wrap">
      <pre className="guide-code"><code>{children}</code></pre>
      {worthCopying && (
        <button
          type="button"
          className={`guide-copy ${copied ? "guide-copy-done" : ""}`}
          onClick={copy}
          aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
        >
          {copied ? (
            <svg viewBox="0 0 24 24" fill="none" width="13" height="13" aria-hidden>
              <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" width="13" height="13" aria-hidden>
              <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M5 15V5a2 2 0 0 1 2-2h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      )}
    </div>
  );
}

export function Figure({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="guide-figure">
      {/* Screenshots are fixed-size PNGs served from /public — next/image would
          add layout machinery for no benefit here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" decoding="async" />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

/** External link that opens in a new tab. */
export function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="guide-link" href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

/** Prominent download row — title, short description, and a button. */
export function Download({ title, href, children }: { title: string; href: string; children?: ReactNode }) {
  return (
    <div className="guide-download">
      <div className="guide-download-body">
        <strong>{title}</strong>
        {children ? <span>{children}</span> : null}
      </div>
      <a className="guide-download-btn" href={href} target="_blank" rel="noopener noreferrer">
        Download
      </a>
    </div>
  );
}
