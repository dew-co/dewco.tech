import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  map,
  shareReplay,
  switchMap,
} from 'rxjs/operators';
import {
  Portfolio,
  PortfolioDetail,
  PortfolioService,
} from '../../services/portfolio.service';

interface PortfolioDetailState {
  detail: PortfolioDetail | null;
  portfolio: Portfolio | null;
  slug: string;
  error?: string;
}

@Component({
  selector: 'app-portfolio-details-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './portfolio-details-page.component.html',
})
export class PortfolioDetailsPageComponent {
  readonly state$: Observable<PortfolioDetailState>;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly portfolioService: PortfolioService
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

            return this.portfolioService.getPortfolioDetail(detailId).pipe(
              map((detail) => ({ detail, portfolio: matched ?? null, slug })),
              catchError(() =>
                of({
                  detail: null,
                  portfolio: matched ?? null,
                  slug,
                  error: 'not-found',
                })
              )
            );
          })
        );
      }),
      shareReplay(1)
    );
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
}
