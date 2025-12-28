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

  isArray(value: unknown): value is any[] {
    return Array.isArray(value);
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
      const website = this.seo.getWebsiteSchema();
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

      this.seo.setJsonLd({
        '@context': 'https://schema.org',
        '@graph': [organization, website, page],
      });
      return;
    }

    const detail = state.detail;
    const portfolio = state.portfolio;
    const titleBase = detail.project_name || portfolio?.name || 'Portfolio Case Study';
    const descriptionSource =
      detail.about?.short ||
      detail.portfolio_copy?.one_liner ||
      detail.short_headline ||
      detail.headline ||
      portfolio?.tagline ||
      fallbackDescription;
    const description = this.seo.truncate(descriptionSource);
    const image =
      detail['cover-image']?.src ||
      detail['body-media']?.src ||
      detail['body-image-1']?.src ||
      portfolio?.image1?.src ||
      this.seo.getDefaultImage();
    const urlPath = portfolio?.link || slugPath;
    const modifiedTime =
      detail.meta?.['last_updated_for_portfolio'] ||
      detail.snapshot?.completed_date_v1 ||
      detail.snapshot?.initial_launch_date ||
      detail.snapshot?.project_start_date;
    const tags = [
      ...(detail.snapshot?.platform || []),
      ...(detail.snapshot?.role || []),
      detail.client?.industry,
      portfolio?.category,
    ].filter(Boolean) as string[];

    const keywords = [
      titleBase,
      detail.short_headline,
      detail.headline,
      detail.client?.industry,
      detail.client?.location,
      detail.snapshot?.project_type,
      portfolio?.category,
      'DewCo portfolio',
      'case study',
    ].filter(Boolean) as string[];

    this.seo.setPageMeta({
      title: `${titleBase} | DewCo Portfolio`,
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
    const website = this.seo.getWebsiteSchema();
    const creativeWorkId = `${url}#creativework`;
    const creativeWork = {
      '@type': 'CreativeWork',
      '@id': creativeWorkId,
      name: titleBase,
      headline: detail.headline || detail.short_headline || titleBase,
      description,
      image: this.seo.buildUrl(image),
      genre: portfolio?.category || detail.client?.industry,
      keywords: tags.length ? tags.join(', ') : undefined,
      url,
      author: { '@id': organization['@id'] },
      publisher: { '@id': organization['@id'] },
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

    this.seo.setJsonLd({
      '@context': 'https://schema.org',
      '@graph': [organization, website, page, creativeWork],
    });
  }
}
