import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoConfig {
  title: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  url?: string;
  type?: 'website' | 'article';
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private readonly siteName = 'DewCo';
  private readonly defaultTitle = 'DewCo | Product, Design & Automation Studio';
  private readonly defaultDescription =
    'Dew & Company (DewCo) is the personal innovation studio of Dipankar Chowdhury, building AI-driven products, automation systems, and full-stack web experiences for startups and founders.';
  private readonly defaultImage = '/assets/img/dewco-footer.webp';
  private readonly defaultKeywords = [
    'DewCo',
    'Dew & Company',
    'Dipankar Chowdhury',
    'product strategy',
    'UX UI design',
    'full-stack development',
    'automation',
    'AI products',
    'SaaS',
    'startup studio',
    'branding',
    'web development',
    'DewCo website',
    'dewco.tech',
  ];
  private readonly defaultAuthor = 'Dipankar Chowdhury';

  constructor(
    private readonly title: Title,
    private readonly meta: Meta,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  setPageMeta(config: SeoConfig): void {
    const title = this.formatTitle(config.title);
    const description = this.truncate(
      this.normalizeText(config.description || this.defaultDescription),
      200
    );
    const url = this.resolveUrl(config.url ?? this.document.location.pathname);
    const canonical = this.buildCanonicalUrl(config.url ?? this.document.location.pathname);
    const image = this.resolveUrl(config.image || this.defaultImage);
    const imageAlt = this.normalizeText(config.imageAlt || config.title || this.defaultTitle);
    const keywords = this.uniqueKeywords([
      ...this.defaultKeywords,
      ...(config.keywords || []),
      ...(config.tags || []),
    ]);
    const robots = config.noIndex
      ? 'noindex, nofollow'
      : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
    const type = config.type || 'website';

    this.title.setTitle(title);
    this.setMetaTag('name', 'description', description);
    this.setMetaTag('name', 'keywords', keywords.join(', '));
    this.setMetaTag('name', 'author', config.author || this.defaultAuthor);
    this.setMetaTag('name', 'publisher', this.siteName);
    this.setMetaTag('name', 'application-name', this.siteName);
    this.setMetaTag('name', 'robots', robots);
    this.setMetaTag('name', 'googlebot', robots);

    this.setMetaTag('property', 'og:title', title);
    this.setMetaTag('property', 'og:description', description);
    this.setMetaTag('property', 'og:type', type);
    this.setMetaTag('property', 'og:url', url);
    this.setMetaTag('property', 'og:image', image);
    this.setMetaTag('property', 'og:image:alt', imageAlt);
    this.setMetaTag('property', 'og:site_name', this.siteName);
    this.setMetaTag('property', 'og:locale', 'en_US');

    this.setMetaTag('name', 'twitter:card', 'summary_large_image');
    this.setMetaTag('name', 'twitter:title', title);
    this.setMetaTag('name', 'twitter:description', description);
    this.setMetaTag('name', 'twitter:image', image);
    this.setMetaTag('name', 'twitter:image:alt', imageAlt);
    this.setMetaTag('name', 'twitter:url', url);

    this.setCanonicalUrl(canonical);
    this.setArticleMeta(type === 'article', {
      author: config.author || this.defaultAuthor,
      section: config.section,
      publishedTime: config.publishedTime,
      modifiedTime: config.modifiedTime,
      tags: config.tags,
    });
  }

  setJsonLd(data: Record<string, any> | Array<Record<string, any>> | null): void {
    const head = this.document?.head;
    if (!head) return;

    const existing = head.querySelector<HTMLScriptElement>('script[data-seo-jsonld]');
    if (!data) {
      existing?.remove();
      return;
    }

    const script = existing || this.document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo-jsonld', 'true');
    script.text = JSON.stringify(data);

    if (!existing) {
      head.appendChild(script);
    }
  }

  getOrganizationSchema(): Record<string, any> {
    const origin = this.getOrigin();
    const orgId = origin ? `${origin}/#organization` : '#organization';

    return {
      '@type': 'CreativeAgency',
      '@id': orgId,
      name: 'Dew & Company (DewCo)',
      url: origin || undefined,
      logo: this.resolveUrl(this.defaultImage),
      description: this.defaultDescription,
      email: 'hello@dewco.tech',
      founder: {
        '@type': 'Person',
        name: this.defaultAuthor,
      },
      sameAs: [
        'https://www.linkedin.com/in/dewco/',
        'https://dewco.bio.link/',
        'https://www.instagram.com/dewcotech/',
      ],
      knowsAbout: [
        'Product strategy',
        'UX/UI design',
        'Full-stack development',
        'Automation',
        'AI products',
        'SaaS engineering',
        'Branding',
      ],
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'business inquiries',
          email: 'hello@dewco.tech',
        },
      ],
    };
  }

  getWebsiteSchema(): Record<string, any> {
    const origin = this.getOrigin();
    const websiteId = origin ? `${origin}/#website` : '#website';

    return {
      '@type': 'WebSite',
      '@id': websiteId,
      name: this.siteName,
      url: origin || undefined,
      description: this.defaultDescription,
      publisher: {
        '@id': origin ? `${origin}/#organization` : '#organization',
      },
      inLanguage: 'en',
    };
  }

  buildUrl(path?: string): string {
    return this.resolveUrl(path || this.document.location.pathname);
  }

  normalizeText(value?: string): string {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  truncate(value: string, maxLength = 180): string {
    const trimmed = this.normalizeText(value);
    if (trimmed.length <= maxLength) return trimmed;
    return `${trimmed.slice(0, maxLength - 3).trim()}...`;
  }

  getDefaultImage(): string {
    return this.defaultImage;
  }

  getDefaultDescription(): string {
    return this.defaultDescription;
  }

  getSiteName(): string {
    return this.siteName;
  }

  private setArticleMeta(enabled: boolean, data: {
    author?: string;
    section?: string;
    publishedTime?: string;
    modifiedTime?: string;
    tags?: string[];
  }): void {
    if (!enabled) {
      this.removeMetaTags('property', 'article:author');
      this.removeMetaTags('property', 'article:section');
      this.removeMetaTags('property', 'article:published_time');
      this.removeMetaTags('property', 'article:modified_time');
      this.removeMetaTags('property', 'article:tag');
      return;
    }

    if (data.author) {
      this.setMetaTag('property', 'article:author', data.author);
    }
    if (data.section) {
      this.setMetaTag('property', 'article:section', data.section);
    }
    if (data.publishedTime) {
      this.setMetaTag('property', 'article:published_time', data.publishedTime);
    }
    if (data.modifiedTime) {
      this.setMetaTag('property', 'article:modified_time', data.modifiedTime);
    }
    if (data.tags?.length) {
      this.setMultiPropertyTag('article:tag', data.tags);
    } else {
      this.removeMetaTags('property', 'article:tag');
    }
  }

  private setMetaTag(
    attr: 'name' | 'property',
    key: string,
    content: string
  ): void {
    if (!content) {
      this.removeMetaTags(attr, key);
      return;
    }
    this.meta.updateTag({ [attr]: key, content });
  }

  private setMultiPropertyTag(property: string, values: string[]): void {
    this.removeMetaTags('property', property);
    values
      .map((value) => this.normalizeText(value))
      .filter(Boolean)
      .forEach((content) => this.meta.addTag({ property, content }));
  }

  private removeMetaTags(attr: 'name' | 'property', key: string): void {
    this.document
      .querySelectorAll(`meta[${attr}="${key}"]`)
      .forEach((tag) => tag.remove());
  }

  private setCanonicalUrl(url: string): void {
    const head = this.document?.head;
    if (!head || !url) return;

    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      head.appendChild(link);
    }
    link.href = url;
  }

  private formatTitle(value: string): string {
    const trimmed = this.normalizeText(value);
    if (!trimmed) return this.defaultTitle;
    if (trimmed.toLowerCase().includes(this.siteName.toLowerCase())) {
      return trimmed;
    }
    return `${trimmed} | ${this.siteName}`;
  }

  private uniqueKeywords(values: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    values.forEach((value) => {
      const normalized = this.normalizeText(value);
      if (!normalized) return;
      const key = normalized.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      result.push(normalized);
    });

    return result;
  }

  private resolveUrl(value?: string): string {
    const origin = this.getOrigin();
    if (!value) return origin;
    if (/^https?:\/\//i.test(value)) {
      return value;
    }
    if (!origin) return value;
    const path = value.startsWith('/') ? value : `/${value}`;
    return `${origin}${path}`;
  }

  private buildCanonicalUrl(value?: string): string {
    const origin = this.getOrigin();
    if (!origin) return value || '';

    try {
      const url = new URL(value || this.document.location.pathname, origin);
      url.hash = '';
      url.search = '';
      return url.toString();
    } catch {
      return value || origin;
    }
  }

  private getOrigin(): string {
    return this.document?.location?.origin || '';
  }
}
