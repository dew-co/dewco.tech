import { Injectable } from '@angular/core';
import {
  DocumentData,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';
import { Observable, defer, from } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { firestoreDb } from '../firebase/firebase';

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
  projectId: string;
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
  id?: string;
  slug?: string;
  project_id?: string;
  projectId?: string;
  doc_id?: string;
  name: string;
  headline: string;
  short_headline: string;
  tagline: string;
  category: string;
  'image-1': PortfolioImage;
  'image-2': PortfolioImage;
  link?: string;
  sort_order?: number;
}

export interface PortfolioDetail {
  id: string;
  project_name: string;
  headline: string;
  short_headline: string;
  taglines?: string[];
  project_type?: string;
  tech_stack?: string[];
  'cover-image'?: PortfolioImage;
  body_images?: PortfolioImage[];
  body_media?: { src: string; alt?: string };
  content?: {
    paragraphs?: string[];
    bullets?: string[];
  };
  links?: Record<string, string | null>;
  meta?: Record<string, any>;
}

@Injectable({
  providedIn: 'root',
})
export class PortfolioService {
  private readonly portfolios$: Observable<Portfolio[]>;

  constructor() {
    this.portfolios$ = this.loadPortfolios();
  }

  getPortfolios(): Observable<Portfolio[]> {
    return this.portfolios$;
  }

  getFeatured(limit: number): Observable<Portfolio[]> {
    return this.portfolios$.pipe(map((items) => items.slice(0, limit)));
  }

  private mapPortfolio(raw: PortfolioRaw): Portfolio {
    const slug = this.resolveSlug(raw);
    const projectId = this.resolveProjectId(raw, slug);
    const link = raw.link || this.buildPortfolioLink(slug);

    return {
      id: slug,
      projectId,
      name: raw.name,
      headline: raw.headline,
      shortHeadline: raw.short_headline,
      tagline: raw.tagline,
      category: raw.category,
      image1: raw['image-1'],
      image2: raw['image-2'],
      link,
    };
  }

  getPortfolioDetail(id: string): Observable<PortfolioDetail> {
    return defer(() => from(this.fetchPortfolioDetail(id)));
  }

  private loadPortfolios(): Observable<Portfolio[]> {
    return defer(() =>
      from(getDocs(collection(firestoreDb, 'portfolios')))
    ).pipe(
      map((snapshot) =>
        snapshot.docs.map((docSnap) => this.mapPortfolioRaw(docSnap))
      ),
      map((items) =>
        this.sortPortfolioRaw(items).map((item) => this.mapPortfolio(item))
      ),
      shareReplay(1)
    );
  }

  private mapPortfolioRaw(
    docSnap: QueryDocumentSnapshot<DocumentData>
  ): PortfolioRaw {
    const data = docSnap.data() as PortfolioRaw;
    return { ...data, doc_id: docSnap.id };
  }

  private sortPortfolioRaw(items: PortfolioRaw[]): PortfolioRaw[] {
    return [...items].sort((a, b) => {
      const orderA =
        typeof a.sort_order === 'number' ? a.sort_order : Number.POSITIVE_INFINITY;
      const orderB =
        typeof b.sort_order === 'number' ? b.sort_order : Number.POSITIVE_INFINITY;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return a.name.localeCompare(b.name);
    });
  }

  private resolveSlug(raw: PortfolioRaw): string {
    const candidate =
      raw.slug ||
      this.deriveSlugFromLink(raw.link) ||
      raw.id ||
      raw.project_id ||
      raw.projectId ||
      raw.doc_id ||
      '';

    return this.normalizeSlug(candidate);
  }

  private resolveProjectId(raw: PortfolioRaw, slug: string): string {
    const explicit = raw.project_id || raw.projectId;
    if (explicit) {
      return explicit;
    }

    const slugUnderscore = slug.replace(/-/g, '_');
    if (raw.id && (raw.id === slug || raw.id === slugUnderscore)) {
      return raw.id;
    }
    if (raw.doc_id && (raw.doc_id === slug || raw.doc_id === slugUnderscore)) {
      return raw.doc_id;
    }

    return slugUnderscore;
  }

  private deriveSlugFromLink(link?: string): string | undefined {
    if (!link) {
      return undefined;
    }

    const segments = link.split('/').filter(Boolean);
    return segments[segments.length - 1];
  }

  private normalizeSlug(value: string): string {
    return value.trim().toLowerCase().replace(/_/g, '-');
  }

  private buildPortfolioLink(slug: string): string {
    return `/portfolio/${slug}`;
  }

  private async fetchPortfolioDetail(id: string): Promise<PortfolioDetail> {
    const candidates = this.buildDetailCandidates(id);
    const collections = ['projects'];
    let lastError: unknown;

    if (!candidates.length) {
      throw new Error('not-found');
    }

    for (const collectionName of collections) {
      for (const candidate of candidates) {
        try {
          const snapshot = await getDoc(
            doc(firestoreDb, collectionName, candidate)
          );
          if (snapshot.exists()) {
            return this.mapPortfolioDetail(snapshot);
          }
        } catch (error) {
          lastError = error;
        }
      }
    }

    for (const collectionName of collections) {
      for (const candidate of candidates) {
        try {
          const querySnapshot = await getDocs(
            query(
              collection(firestoreDb, collectionName),
              where('id', '==', candidate),
              limit(1)
            )
          );

          if (!querySnapshot.empty) {
            return this.mapPortfolioDetail(querySnapshot.docs[0]);
          }
        } catch (error) {
          lastError = error;
        }
      }
    }

    for (const collectionName of collections) {
      try {
        const fallback = await this.findPortfolioDetailByFuzzyMatch(
          collectionName,
          candidates
        );
        if (fallback) {
          return fallback;
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) {
      throw lastError;
    }

    throw new Error('not-found');
  }

  private mapPortfolioDetail(
    docSnap: DocumentSnapshot<DocumentData>
  ): PortfolioDetail {
    const data = docSnap.data() as PortfolioDetail;
    return { ...data, id: data.id || docSnap.id };
  }

  private buildDetailCandidates(id: string): string[] {
    const normalized = id.trim();
    if (!normalized) {
      return [];
    }

    const lower = normalized.toLowerCase();
    const candidates = new Set<string>([
      normalized,
      lower,
      lower.replace(/-/g, '_'),
      lower.replace(/_/g, '-'),
    ]);

    return Array.from(candidates).filter(Boolean);
  }

  private async findPortfolioDetailByFuzzyMatch(
    collectionName: string,
    candidates: string[]
  ): Promise<PortfolioDetail | null> {
    if (!candidates.length) {
      return null;
    }

    const normalizedCandidates = candidates
      .map((candidate) => this.normalizeForMatch(candidate))
      .filter(Boolean);

    if (!normalizedCandidates.length) {
      return null;
    }

    const snapshot = await getDocs(collection(firestoreDb, collectionName));
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as PortfolioDetail;
      const haystack = [
        docSnap.id,
        data.id,
        data.project_name,
        data.headline,
        data.short_headline,
      ]
        .filter(Boolean)
        .map((value) => this.normalizeForMatch(String(value)))
        .join(' ');

      if (!haystack) {
        continue;
      }

      const match = normalizedCandidates.find((candidate) =>
        haystack.includes(candidate)
      );
      if (match) {
        return this.mapPortfolioDetail(docSnap);
      }
    }

    return null;
  }

  private normalizeForMatch(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
  }
}
