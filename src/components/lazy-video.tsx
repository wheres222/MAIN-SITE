"use client";

import { useEffect, useRef, useState } from "react";

type LazyVideoProps = {
  src: string;
  poster: string;
  className?: string;
  /** Defaults true — looping muted backgrounds want autoplay-on-visible. */
  autoPlayOnVisible?: boolean;
  /** rootMargin for IntersectionObserver. Default "200px" — start fetching just before scroll. */
  rootMargin?: string;
  ariaLabel?: string;
};

/**
 * Renders a poster image immediately and mounts the underlying <video> only
 * when the element scrolls into view. The video downloads zero bytes until
 * IntersectionObserver fires.
 */
export function LazyVideo({
  src,
  poster,
  className,
  autoPlayOnVisible = true,
  rootMargin = "200px",
  ariaLabel,
}: LazyVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible || !containerRef.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            return;
          }
        }
      },
      { rootMargin }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={containerRef} className={className} aria-label={ariaLabel}>
      {visible ? (
        <video
          ref={videoRef}
          autoPlay={autoPlayOnVisible}
          muted
          loop
          playsInline
          preload="auto"
          poster={poster}
          onEnded={(e) => {
            // Fallback for browsers that stall instead of honoring `loop`
            // (common when only metadata is buffered): rewind and replay.
            const v = e.currentTarget;
            v.currentTime = 0;
            void v.play().catch(() => {});
          }}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : (
        <img
          src={poster}
          alt={ariaLabel ?? ""}
          loading="lazy"
          decoding="async"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      )}
    </div>
  );
}
