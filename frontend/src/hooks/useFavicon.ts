import { useEffect } from 'react';

let defaultFaviconHref: string | null = null;
let defaultFaviconType: string | null = null;
let currentFaviconHref: string | null = null;

const ensureFaviconLink = (): HTMLLinkElement | null => {
  if (typeof document === 'undefined') return null;

  const existing = document.querySelector<HTMLLinkElement>("link[rel='icon']")
    || document.querySelector<HTMLLinkElement>("link[rel='shortcut icon']");

  if (existing) {
    return existing;
  }

  const link = document.createElement('link');
  link.rel = 'icon';
  document.head.appendChild(link);
  return link;
};

const restoreDefaultFavicon = (link: HTMLLinkElement) => {
  if (defaultFaviconHref !== null) {
    link.href = defaultFaviconHref;
  } else {
    link.removeAttribute('href');
  }

  if (defaultFaviconType !== null) {
    link.type = defaultFaviconType;
  } else {
    link.removeAttribute('type');
  }
};

interface FaviconOptions {
  fallbackHref?: string | null;
  persist?: boolean;
}

const useDynamicFavicon = (href?: string | null, options?: FaviconOptions) => {
  const fallbackHref = options?.fallbackHref ?? null;
  const persist = options?.persist ?? false;

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const link = ensureFaviconLink();
    if (!link) return;

    if (defaultFaviconHref === null) {
      defaultFaviconHref = link.getAttribute('href');
      defaultFaviconType = link.getAttribute('type');
    }

    const targetHref = href || fallbackHref || defaultFaviconHref || undefined;

    if (!targetHref) {
      restoreDefaultFavicon(link);
      currentFaviconHref = defaultFaviconHref;
      return;
    }

    if (currentFaviconHref !== targetHref) {
      link.href = targetHref;
      link.removeAttribute('type');
      currentFaviconHref = targetHref;
    }

    if (persist) {
      return;
    }

    return () => {
      if (currentFaviconHref === targetHref) {
        restoreDefaultFavicon(link);
        currentFaviconHref = defaultFaviconHref;
      }
    };
  }, [href, fallbackHref, persist]);
};

export default useDynamicFavicon;

