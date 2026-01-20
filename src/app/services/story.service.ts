import { Injectable } from '@angular/core';
import { DocumentData, QueryDocumentSnapshot, collection, getDocs } from 'firebase/firestore';
import { Observable, defer, from } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { firestoreDb } from '../firebase/firebase';

export interface Story {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  link: string;
}

interface StoryRaw {
  id?: string;
  slug?: string;
  title: string;
  excerpt?: string;
  date?: string;
  tags?: string[];
  content?: string;
}

export interface StoryDetail {
  id: string;
  slug?: string;
  title: string;
  date?: string;
  tags?: string[];
  content: string;
  excerpt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class StoryService {
  private readonly stories$: Observable<Story[]>;
  private readonly storyDetails$: Observable<StoryDetail[]>;

  constructor() {
    this.storyDetails$ = this.loadStoryDetails();
    this.stories$ = this.storyDetails$.pipe(
      map((items) => items.map((item) => this.mapStoryFromDetail(item))),
      map((items) => this.sortStories(items)),
      shareReplay(1)
    );
  }

  getStories(): Observable<Story[]> {
    return this.stories$;
  }

  getFeatured(limit: number): Observable<Story[]> {
    return this.stories$.pipe(map((items) => items.slice(0, limit)));
  }

  getStoryDetailsList(): Observable<StoryDetail[]> {
    return this.storyDetails$;
  }

  getStoryDetail(idOrSlug: string): Observable<StoryDetail | null> {
    const normalized = this.normalize(idOrSlug);

    return this.storyDetails$.pipe(
      map(
        (items) =>
          items.find((item) =>
            this.matchesStoryDetail(item, normalized)
          ) ?? null
      )
    );
  }

  defaultLink(slug: string): string {
    return `/stories/${slug}`;
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  private loadStoryDetails(): Observable<StoryDetail[]> {
    return defer(() => from(getDocs(collection(firestoreDb, 'stories')))).pipe(
      map((snapshot) => snapshot.docs.map((docSnap) => this.mapStoryDetailDoc(docSnap))),
      shareReplay(1)
    );
  }

  private mapStoryDetailDoc(
    docSnap: QueryDocumentSnapshot<DocumentData>
  ): StoryDetail {
    const data = docSnap.data() as StoryRaw;
    const id = data.id || docSnap.id;
    const slug = data.slug || data.id || docSnap.id;

    return {
      ...data,
      id,
      slug,
      title: data.title,
      tags: data.tags || [],
      content: (data.content || '').trim(),
    };
  }

  private mapStoryFromDetail(detail: StoryDetail): Story {
    const slug = detail.slug || detail.id;

    return {
      id: detail.id,
      slug,
      title: detail.title,
      excerpt: detail.excerpt || '',
      date: detail.date || '',
      link: this.defaultLink(slug),
    };
  }

  private matchesStoryDetail(detail: StoryDetail, normalized: string): boolean {
    if (this.normalize(detail.id) === normalized) {
      return true;
    }

    const slug = detail.slug ? this.normalize(detail.slug) : '';
    return slug === normalized;
  }

  private sortStories(items: Story[]): Story[] {
    return [...items].sort(
      (a, b) => this.getDateValue(b.date) - this.getDateValue(a.date)
    );
  }

  private getDateValue(value?: string): number {
    if (!value) {
      return 0;
    }

    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }
}
