import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface PortfolioImage {
  src: string;
  alt: string;
}

export interface Portfolio {
  id: string;
  name: string;
  headline: string;
  shortHeadline: string;
  tagline: string;
  category: string;
  image1: PortfolioImage;
  image2: PortfolioImage;
  link: string;
}

interface PortfolioRaw {
  id: string;
  name: string;
  headline: string;
  short_headline: string;
  tagline: string;
  category: string;
  'image-1': PortfolioImage;
  'image-2': PortfolioImage;
  link: string;
}

@Injectable({
  providedIn: 'root',
})
export class PortfolioService {
  private readonly portfolios$: Observable<Portfolio[]>;

  constructor(private readonly http: HttpClient) {
    this.portfolios$ = this.http
      .get<PortfolioRaw[]>('assets/json/portfolios.json')
      .pipe(
        map((items) => items.map((item) => this.mapPortfolio(item))),
        shareReplay(1)
      );
  }

  getPortfolios(): Observable<Portfolio[]> {
    return this.portfolios$;
  }

  getFeatured(limit: number): Observable<Portfolio[]> {
    return this.portfolios$.pipe(map((items) => items.slice(0, limit)));
  }

  private mapPortfolio(raw: PortfolioRaw): Portfolio {
    return {
      id: raw.id,
      name: raw.name,
      headline: raw.headline,
      shortHeadline: raw.short_headline,
      tagline: raw.tagline,
      category: raw.category,
      image1: raw['image-1'],
      image2: raw['image-2'],
      link: raw.link || '/portfolio-details',
    };
  }
}
