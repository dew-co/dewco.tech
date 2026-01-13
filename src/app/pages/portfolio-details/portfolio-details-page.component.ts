import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  map,
  shareReplay,
  switchMap,
} from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Portfolio,
  PortfolioDetail,
  PortfolioService,
} from '../../services/portfolio.service';
import { SeoService } from '../../services/seo.service';

interface PortfolioDetailState {
  detail: PortfolioDetail | null;
  portfolio: Portfolio | null;
  slug: string;
  prev?: PortfolioNav;
  next?: PortfolioNav;
  error?: string;
}

interface PortfolioNav {
  id: string;
  name: string;
  headline: string;
  link: string;
}

@Component({
  selector: 'app-portfolio-details-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './portfolio-details-page.component.html',
})
export class PortfolioDetailsPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  readonly state$: Observable<PortfolioDetailState>;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly portfolioService: PortfolioService,
    private readonly seo: SeoService
  ) {
    this.state$ = this.route.paramMap.pipe(
      map((params) => (params.get('id') ?? '').toLowerCase()),
      distinctUntilChanged(),
      switchMap((slug) => {
        if (!slug) {
          return of<PortfolioDetailState>({
            detail: null,
            portfolio: null,
            slug,
            error: 'not-found',
          });
        }

        return this.portfolioService.getPortfolios().pipe(
          map((portfolios) => ({ slug, portfolios })),
          switchMap(({ slug, portfolios }) => {
            const matched = this.findPortfolio(slug, portfolios);
            const detailId = matched?.id ?? slug.replace(/-/g, '_');
            const { prev, next } = this.buildNav(matched, portfolios);

            return this.portfolioService.getPortfolioDetail(detailId).pipe(
              map((detail) => ({
                detail,
                portfolio: matched ?? null,
                slug,
                prev,
                next,
              })),
              catchError(() =>
                of({
                  detail: null,
                  portfolio: matched ?? null,
                  slug,
                  prev,
                  next,
                  error: 'not-found',
                })
              )
            );
          })
        );
      }),
      shareReplay(1)
    );

    this.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => this.updateSeo(state));
  }

  trackByIndex(index: number): number {
    return index;
  }

  formatLabel(key: string): string {
    return key
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  isHttpUrl(value: string | null | undefined): boolean {
    return typeof value === 'string' && /^https?:\/\//i.test(value);
  }

  private findPortfolio(slug: string, portfolios: Portfolio[]): Portfolio | null {
    const normalizedSlug = this.normalizeSlug(slug);

    return (
      portfolios.find((item) => {
        const linkSlug = this.slugFromLink(item.link);
        const idSlug = this.normalizeSlug(item.id.replace(/_/g, '-'));
        const rawIdSlug = this.normalizeSlug(item.id);

        return (
          linkSlug === normalizedSlug ||
          idSlug === normalizedSlug ||
          rawIdSlug === normalizedSlug
        );
      }) ?? null
    );
  }

  private slugFromLink(link?: string): string {
    if (!link) return '';
    const segments = link.split('/').filter(Boolean);
    return segments[segments.length - 1]?.toLowerCase() ?? '';
  }

  private normalizeSlug(value: string): string {
    return value.trim().toLowerCase();
  }

  private buildNav(
    current: Portfolio | null,
    list: Portfolio[]
  ): { prev?: PortfolioNav; next?: PortfolioNav } {
    if (!current) return {};
    const index = list.findIndex((item) => item.id === current.id);
    if (index === -1) return {};

    const prevItem = index > 0 ? list[index - 1] : undefined;
    const nextItem = index < list.length - 1 ? list[index + 1] : undefined;

    return {
      prev: prevItem ? this.toNav(prevItem) : undefined,
      next: nextItem ? this.toNav(nextItem) : undefined,
    };
  }

  private toNav(item: Portfolio): PortfolioNav {
    return {
      id: item.id,
      name: item.name,
      headline: item.headline,
      link: this.defaultLink(item),
    };
  }

  private defaultLink(item: Portfolio): string {
    return item.link || `/portfolio/${item.id.replace(/_/g, '-')}`;
  }

  private updateSeo(state: PortfolioDetailState): void {
    const fallbackDescription =
      'Explore DewCo portfolio case studies in product strategy, UX/UI design, automation, and full-stack engineering.';
    const slugPath = state.slug ? `/portfolio/${state.slug}` : '/portfolio';

    if (!state.detail) {
      this.seo.setPageMeta({
        title: 'Portfolio | DewCo',
        description: fallbackDescription,
        url: slugPath,
      });

      const url = this.seo.buildUrl(slugPath);
      const organization = this.seo.getOrganizationSchema();
      const person = this.seo.getPersonSchema();
      const website = this.seo.getWebsiteSchema();
      const breadcrumbs = this.seo.buildBreadcrumbList([
        { name: 'Home', url: '/' },
        { name: 'Portfolio', url: '/portfolio' },
        { name: 'Portfolio Case Study', url: slugPath },
      ]);
      const page = {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: 'DewCo Portfolio',
        description: fallbackDescription,
        isPartOf: { '@id': website['@id'] },
        about: { '@id': organization['@id'] },
        inLanguage: 'en',
      };

      const graph: Array<Record<string, any>> = [organization, person, website, page];
      if (breadcrumbs) {
        graph.push(breadcrumbs);
      }

      this.seo.setJsonLd({
        '@context': 'https://schema.org',
        '@graph': graph,
      });
      return;
    }

    const detail = state.detail;
    const portfolio = state.portfolio;
    const titleBase = detail.project_name || portfolio?.name || 'Portfolio Case Study';
    const metaKeywords = Array.isArray(detail.meta?.['seo_keywords'])
      ? (detail.meta?.['seo_keywords'] as string[])
      : detail.meta?.['seo_keywords']
      ? String(detail.meta['seo_keywords'])
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      : [];
    const seoTitle = detail.meta?.['seo_title'] || `${titleBase} | DewCo Portfolio`;
    const descriptionSource =
      detail.meta?.['seo_description'] ||
      detail.content?.paragraphs?.[0] ||
      detail.taglines?.[0] ||
      detail.short_headline ||
      detail.headline ||
      portfolio?.tagline ||
      fallbackDescription;
    const description = this.seo.truncate(descriptionSource);
    const image =
      detail['cover-image']?.src ||
      detail.body_media?.src ||
      detail.body_images?.[0]?.src ||
      portfolio?.image1?.src ||
      this.seo.getDefaultImage();
    const urlPath = portfolio?.link || slugPath;
    const modifiedTime = detail.meta?.['last_updated_for_portfolio'];
    const tags = [
      detail.project_type,
      ...(detail.tech_stack || []),
      ...(detail.taglines || []),
      ...metaKeywords,
      portfolio?.category,
    ].filter(Boolean) as string[];
    const aboutTopics = [detail.project_type, portfolio?.category]
      .map((value) => this.seo.normalizeText(value))
      .filter(Boolean);
    const mentions = this.collectMentions(detail);

    const keywords = [
      titleBase,
      detail.short_headline,
      detail.headline,
      detail.project_type,
      portfolio?.category,
      'DewCo portfolio',
      'case study',
      ...metaKeywords,
    ]
      .filter(Boolean)
      .map((value) => (value ?? '').toString());

    this.seo.setPageMeta({
      title: seoTitle,
      description,
      url: urlPath,
      image,
      type: 'article',
      section: 'Portfolio',
      modifiedTime,
      tags,
      keywords: keywords.length ? keywords : undefined,
    });

    const url = this.seo.buildUrl(urlPath);
    const organization = this.seo.getOrganizationSchema();
    const person = this.seo.getPersonSchema();
    const website = this.seo.getWebsiteSchema();
    const breadcrumbs = this.seo.buildBreadcrumbList([
      { name: 'Home', url: '/' },
      { name: 'Portfolio', url: '/portfolio' },
      { name: titleBase, url: urlPath },
    ]);
    const creativeWorkId = `${url}#creativework`;
    const creativeWork = {
      '@type': 'CreativeWork',
      '@id': creativeWorkId,
      name: seoTitle,
      headline: detail.meta?.['seo_title'] || detail.headline || detail.short_headline || titleBase,
      description: detail.meta?.['seo_description'] || description,
      image: this.seo.buildUrl(image),
      genre: portfolio?.category || detail.project_type,
      keywords: tags.length ? tags.join(', ') : undefined,
      url,
      author: { '@id': organization['@id'] },
      publisher: { '@id': organization['@id'] },
      about: aboutTopics.length ? aboutTopics : undefined,
      mentions: this.toThingList(mentions),
      dateModified: modifiedTime,
    };
    const page = {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: `${titleBase} | DewCo Portfolio`,
      description,
      isPartOf: { '@id': website['@id'] },
      about: { '@id': organization['@id'] },
      mainEntity: { '@id': creativeWorkId },
      inLanguage: 'en',
    };

    const graph: Array<Record<string, any>> = [organization, person, website, page, creativeWork];
    if (breadcrumbs) {
      graph.push(breadcrumbs);
    }

    this.seo.setJsonLd({
      '@context': 'https://schema.org',
      '@graph': graph,
    });
  }

  private collectMentions(detail: PortfolioDetail): string[] {
    const mentions = new Set<string>();
    const add = (value?: string) => {
      const normalized = this.seo.normalizeText(value);
      if (normalized) {
        mentions.add(normalized);
      }
    };
    const addAll = (values?: string[]) => {
      values?.forEach((value) => add(value));
    };

    add(detail.project_type);
    addAll(detail.taglines);
    addAll(detail.tech_stack);
    addAll(detail.content?.bullets);

    return Array.from(mentions);
  }

  private toThingList(values: string[]): Array<Record<string, any>> | undefined {
    if (!values.length) {
      return undefined;
    }

    return values.map((name) => ({
      '@type': 'Thing',
      name,
    }));
  }
}
