import { useEffect } from 'react';

type SeoHeadProps = {
  title: string;
  description: string;
  canonical: string;
  jsonLd?: string;
  noindex?: boolean;
};

function meta(attr: 'name' | 'property', key: string) {
  return document.head.querySelector(`meta[${attr}="${key}"]`);
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let element = meta(attr, key);
  const created = !element;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  const previous = element.getAttribute('content');
  element.setAttribute('content', content);
  return () => {
    if (created) element?.remove();
    else if (previous == null) element?.removeAttribute('content');
    else element?.setAttribute('content', previous);
  };
}

export default function SeoHead({ title, description, canonical, jsonLd, noindex }: SeoHeadProps) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    const restore = [
      setMeta('name', 'description', description),
      setMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow'),
      setMeta('property', 'og:type', 'article'),
      setMeta('property', 'og:site_name', 'ResumeForge'),
      setMeta('property', 'og:title', title),
      setMeta('property', 'og:description', description),
      setMeta('property', 'og:url', canonical),
      setMeta('name', 'twitter:card', 'summary'),
      setMeta('name', 'twitter:title', title),
      setMeta('name', 'twitter:description', description)
    ];
    let canonicalLink = document.head.querySelector('link[rel="canonical"]');
    const createdCanonical = !canonicalLink;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    const previousCanonical = canonicalLink.getAttribute('href');
    canonicalLink.setAttribute('href', canonical);

    const existingJson = document.head.querySelector('script[type="application/ld+json"]:not([data-seo-jsonld])');
    const previousJson = existingJson?.textContent ?? null;
    let createdJson: HTMLScriptElement | null = null;
    if (jsonLd) {
      if (existingJson) existingJson.textContent = jsonLd;
      else {
        createdJson = document.createElement('script');
        createdJson.type = 'application/ld+json';
        createdJson.dataset.seoJsonld = 'guide';
        createdJson.textContent = jsonLd;
        document.head.appendChild(createdJson);
      }
    }

    return () => {
      document.title = previousTitle;
      restore.forEach((undo) => undo());
      if (createdCanonical) canonicalLink?.remove();
      else if (previousCanonical == null) canonicalLink?.removeAttribute('href');
      else canonicalLink?.setAttribute('href', previousCanonical);
      if (existingJson && previousJson != null) existingJson.textContent = previousJson;
      createdJson?.remove();
    };
  }, [title, description, canonical, jsonLd, noindex]);

  return null;
}
