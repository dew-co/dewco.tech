import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { Portfolio, PortfolioService } from '../../services/portfolio.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-portfolio-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './portfolio-page.component.html',
})
export class PortfolioPageComponent implements OnInit {
  readonly portfolios$: Observable<Portfolio[]>;

  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly seo: SeoService
  ) {
    this.portfolios$ = this.portfolioService.getPortfolios();
  }

  ngOnInit(): void {
    const description =
      'Explore DewCo portfolio case studies in product strategy, UX/UI design, automation, and full-stack engineering.';

    this.seo.setPageMeta({
      title: 'Portfolio | DewCo',
      description,
      url: '/portfolio',
      keywords: [
        'portfolio',
        'case studies',
        'product design',
        'full-stack development',
        'automation projects',
      ],
    });

    this.portfolios$.pipe(take(1)).subscribe((portfolios) => {
      const url = this.seo.buildUrl('/portfolio');
      const organization = this.seo.getOrganizationSchema();
      const website = this.seo.getWebsiteSchema();
      const itemListId = `${url}#itemlist`;
      const itemList = {
        '@type': 'ItemList',
        '@id': itemListId,
        itemListElement: portfolios.map((portfolio, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: portfolio.name,
          url: this.seo.buildUrl(portfolio.link),
        })),
      };
      const page = {
        '@type': 'CollectionPage',
        '@id': `${url}#webpage`,
        url,
        name: 'DewCo Portfolio',
        description,
        isPartOf: { '@id': website['@id'] },
        about: { '@id': organization['@id'] },
        mainEntity: { '@id': itemListId },
        inLanguage: 'en',
      };

      this.seo.setJsonLd({
        '@context': 'https://schema.org',
        '@graph': [organization, website, page, itemList],
      });
    });
  }

  trackByPortfolioId(index: number, portfolio: Portfolio): string {
    return portfolio.id;
  }
}
