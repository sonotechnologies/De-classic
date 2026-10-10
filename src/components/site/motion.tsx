"use client";

import { useEffect } from "react";

/**
 * Scroll motion from the design system:
 * - [data-sticker] price stickers pop in with a small spin as they appear (also on mobile)
 * - [data-reveal] photos and headlines rise 32px (desktop only)
 * - [data-block] colour blocks slide up 96px over the one before (desktop only)
 * - [data-lights] the bar section cuts from white to night when 30% visible (desktop only)
 * Load motion (wipe, rise, settle) is pure CSS. Reduced motion is handled in CSS.
 */
export function Motion() {
  useEffect(() => {
    const desktop = () => window.innerWidth >= 760;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = new WeakSet<Element>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          io.unobserve(el);
          if (el.classList.contains("block-pending")) {
            el.classList.add("block-in");
            el.classList.remove("block-pending");
          } else {
            el.classList.add("is-in");
          }
        }
      },
      { threshold: 0.15 },
    );

    const lightsIO = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.intersectionRatio < 0.3) continue;
          lightsIO.unobserve(e.target);
          e.target.classList.remove("lights-pending");
        }
      },
      { threshold: [0, 0.3] },
    );

    function scan() {
      document.querySelectorAll<HTMLElement>("[data-sticker],[data-reveal],[data-block],[data-lights]").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        if (el.hasAttribute("data-sticker") || el.hasAttribute("data-reveal")) {
          io.observe(el);
          return;
        }
        const belowFold = el.getBoundingClientRect().top > window.innerHeight * 0.7;
        if (reduce || !desktop() || !belowFold) return;
        if (el.hasAttribute("data-block")) {
          el.classList.add("block-pending");
          io.observe(el);
        } else if (el.hasAttribute("data-lights")) {
          el.classList.add("lights-pending");
          lightsIO.observe(el);
        }
      });
    }

    let frame = 0;
    const schedule = () => {
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          scan();
        });
    };
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true });
    scan();

    return () => {
      mo.disconnect();
      io.disconnect();
      lightsIO.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
