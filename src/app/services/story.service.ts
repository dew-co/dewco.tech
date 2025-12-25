import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

export interface Story {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  link: string;
}

interface StoryRaw {
  id: string;
  title: string;
  excerpt: string;
  date: string;
}

export interface StoryDetail {
  id: string;
  title: string;
  date?: string;
  tags?: string[];
  content: string;
}

@Injectable({
  providedIn: 'root',
})
export class StoryService {
  private readonly stories$: Observable<Story[]>;
  private readonly storyDetails$: Observable<StoryDetail[]>;

  constructor(private readonly http: HttpClient) {
    this.stories$ = this.http
      .get<StoryRaw[]>('assets/json/stories.json')
      .pipe(
        map((items) => items.map((item) => this.mapStory(item))),
        shareReplay(1)
      );

    this.storyDetails$ = this.http
      .get<StoryDetail[]>('assets/json/story-details.json')
      .pipe(
        map((items) =>
          items.map((detail) => ({
            ...detail,
            tags: detail.tags || [],
            content: (detail.content || '').trim(),
          }))
        ),
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
          items.find((item) => this.normalize(item.id) === normalized) ?? null
      )
    );
  }

  defaultLink(id: string): string {
    return `/stories/${id}`;
  }

  private mapStory(raw: StoryRaw): Story {
    return {
      id: raw.id,
      title: raw.title,
      excerpt: raw.excerpt,
      date: raw.date,
      link: this.defaultLink(raw.id),
    };
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }
}
