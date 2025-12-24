import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface PortfolioImage {
  src: string;
  alt: string;
}

export interface PortfolioClient {
  brand_name_current?: string;
  brand_name_future?: string;
  full_form?: string;
  industry?: string;
  location?: string;
  audience?: string[];
  [key: string]: any;
}

export interface PortfolioSnapshot {
  role?: string[];
  platform?: string[];
  project_type?: string;
  status?: string;
  project_start_date?: string;
  initial_launch_date?: string;
  completed_date_v1?: string;
  planned_rebrand_target?: string;
  engagement_model?: string;
  [key: string]: any;
}

export interface PortfolioBudget {
  currency?: string;
  internal_build_equivalent?: number;
  internal_build_range?: [number, number];
  initial_build_estimated?: number;
  initial_build_range?: [number, number];
  retainer_monthly_range?: [number, number];
  notes?: string;
  [key: string]: any;
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

export interface PortfolioDetail {
  id: string;
  project_name: string;
  headline: string;
  short_headline: string;
  taglines?: string[];
  client?: PortfolioClient;
  studio?: Record<string, any>;
  snapshot?: PortfolioSnapshot;
  'cover-image'?: PortfolioImage;
  'body-image-1'?: PortfolioImage;
  'body-image-2'?: PortfolioImage;
  'body-media'?: { src: string; alt?: string };
  about?: { short?: string; long?: string };
  roles_and_responsibilities?: string[];
  objectives?: string[];
  features?: Record<string, string[]>;
  tech_stack?: Record<string, string[]>;
  timeline?: Record<string, Record<string, string | null>>;
  budget?: PortfolioBudget;
  challenges?: string[];
  solutions?: string[];
  outcomes?: { qualitative?: string[]; example_metrics_note?: string };
  portfolio_copy?: { grid_card?: string; one_liner?: string };
  links?: Record<string, string | null>;
  meta?: Record<string, any>;
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
      link: raw.link || `/portfolio/${raw.id.replace(/_/g, '-')}`,
    };
  }

  getPortfolioDetail(id: string): Observable<PortfolioDetail> {
    return this.http.get<PortfolioDetail>(`assets/json/${id}.json`);
  }
}
