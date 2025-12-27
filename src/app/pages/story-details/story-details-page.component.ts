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
import { SeoService } from '../../services/seo.service';
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
  private readonly destroyRef = inject(DestroyRef);
  readonly state$: Observable<StoryDetailState>;
  readonly defaultThumb = 'assets/img/post_thumb_1.jpeg';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly storyService: StoryService,
    private readonly seo: SeoService
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

    this.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => this.updateSeo(state));
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

  private updateSeo(state: StoryDetailState): void {
    const fallbackDescription =
      'Read DewCo stories and insights on product strategy, UX/UI, automation, and building SaaS experiences.';
    const slugPath = state.slug ? `/stories/${state.slug}` : '/stories';

    if (!state.detail) {
      this.seo.setPageMeta({
        title: 'Stories & Insights | DewCo',
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
        name: 'DewCo Stories',
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
    const story = state.story;
    const titleBase = detail.title || story?.title || 'DewCo Story';
    const descriptionSource = story?.excerpt || detail.content || fallbackDescription;
    const description = this.seo.truncate(descriptionSource);
    const urlPath = story?.link || slugPath;
    const publishedTime = detail.date || story?.date;
    const tags = detail.tags || [];

    this.seo.setPageMeta({
      title: `${titleBase} | DewCo Stories`,
      description,
      url: urlPath,
      image: this.defaultThumb,
      type: 'article',
      section: 'Stories',
      publishedTime,
      modifiedTime: publishedTime,
      tags,
      keywords: [titleBase, 'DewCo stories', ...tags],
    });

    const url = this.seo.buildUrl(urlPath);
    const organization = this.seo.getOrganizationSchema();
    const website = this.seo.getWebsiteSchema();
    const blogUrl = this.seo.buildUrl('/stories');
    const blogId = `${blogUrl}#blog`;
    const blog = {
      '@type': 'Blog',
      '@id': blogId,
      name: 'DewCo Stories',
      url: blogUrl,
      publisher: { '@id': organization['@id'] },
      inLanguage: 'en',
    };
    const postId = `${url}#post`;
    const blogPosting = {
      '@type': 'BlogPosting',
      '@id': postId,
      headline: titleBase,
      description,
      url,
      image: this.seo.buildUrl(this.defaultThumb),
      datePublished: publishedTime,
      dateModified: publishedTime,
      author: {
        '@type': 'Person',
        name: 'Dipankar Chowdhury',
      },
      publisher: { '@id': organization['@id'] },
      mainEntityOfPage: { '@id': `${url}#webpage` },
      isPartOf: { '@id': blogId },
      keywords: tags.length ? tags.join(', ') : undefined,
    };
    const page = {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: `${titleBase} | DewCo Stories`,
      description,
      isPartOf: { '@id': website['@id'] },
      about: { '@id': organization['@id'] },
      mainEntity: { '@id': postId },
      inLanguage: 'en',
    };

    this.seo.setJsonLd({
      '@context': 'https://schema.org',
      '@graph': [organization, website, page, blog, blogPosting],
    });
  }
}
