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
import { Story, StoryDetail, StoryService } from '../../services/story.service';

interface StoryDetailState {
  detail: StoryDetail | null;
  story: Story | null;
  slug: string;
  prev?: StoryNav;
  next?: StoryNav;
  error?: string;
}

interface StoryNav {
  id: string;
  title: string;
  date?: string;
  link: string;
}

@Component({
  selector: 'app-story-details-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './story-details-page.component.html',
})
export class StoryDetailsPageComponent {
  readonly state$: Observable<StoryDetailState>;
  readonly defaultThumb = 'assets/img/post_thumb_1.jpeg';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly storyService: StoryService
  ) {
    this.state$ = this.route.paramMap.pipe(
      map((params) => (params.get('id') ?? '').toLowerCase()),
      distinctUntilChanged(),
      switchMap((slug) => {
        if (!slug) {
          return of<StoryDetailState>({
            detail: null,
            story: null,
            slug,
            error: 'not-found',
          });
        }

        return this.storyService.getStories().pipe(
          map((stories) => ({ stories, slug })),
          switchMap(({ stories, slug }) => {
            const story = this.findStory(slug, stories);
            const detailId = story?.id ?? slug;
            const { prev, next } = this.buildNav(story, stories);

            return this.storyService.getStoryDetail(detailId).pipe(
              map((detail) => ({
                detail,
                story,
                slug,
                prev,
                next,
                error: detail ? undefined : 'not-found',
              })),
              catchError(() =>
                of({
                  detail: null,
                  story,
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
  }

  trackByIndex(index: number): number {
    return index;
  }

  formatDateLabel(value?: string): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private findStory(slug: string, stories: Story[]): Story | null {
    const normalizedSlug = this.normalize(slug);

    return (
      stories.find((item) => {
        const linkSlug = this.slugFromLink(item.link);
        const idSlug = this.normalize(item.id);

        return linkSlug === normalizedSlug || idSlug === normalizedSlug;
      }) ?? null
    );
  }

  private slugFromLink(link?: string): string {
    if (!link) return '';
    const segments = link.split('/').filter(Boolean);
    return segments[segments.length - 1]?.toLowerCase() ?? '';
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  private buildNav(
    current: Story | null,
    list: Story[]
  ): { prev?: StoryNav; next?: StoryNav } {
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

  private toNav(item: Story): StoryNav {
    return {
      id: item.id,
      title: item.title,
      date: item.date,
      link: item.link,
    };
  }
}
