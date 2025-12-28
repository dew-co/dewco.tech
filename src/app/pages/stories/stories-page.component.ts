import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, startWith, take } from 'rxjs/operators';
import { Story, StoryDetail, StoryService } from '../../services/story.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-stories-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './stories-page.component.html',
})
export class StoriesPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  readonly pageSize = 9;
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly stories$: Observable<Story[]>;
  readonly filteredStories$: Observable<Story[]>;
  readonly defaultThumb = 'https://res.cloudinary.com/dewco/image/upload/assets/img/post_thumb_1.webp';
  visibleCount = this.pageSize;

  constructor(
    private readonly storyService: StoryService,
    private readonly seo: SeoService
  ) {
    this.stories$ = this.storyService.getStories();
    this.filteredStories$ = combineLatest([
      this.stories$,
      this.storyService.getStoryDetailsList(),
      this.searchControl.valueChanges.pipe(startWith('')),
    ]).pipe(
      map(([stories, details, term]) =>
        this.filterStories(stories, details, term || '')
      )
    );

    this.searchControl.valueChanges
      .pipe(startWith(''), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.resetVisible());
  }

  ngOnInit(): void {
    const description =
      'Read DewCo stories and insights on product strategy, UX/UI, automation, and building SaaS experiences.';

    this.seo.setPageMeta({
      title: 'Stories & Insights | DewCo',
      description,
      url: '/stories',
      keywords: [
        'DewCo stories',
        'product strategy',
        'UX/UI',
        'automation',
        'SaaS insights',
      ],
    });

    this.stories$.pipe(take(1)).subscribe((stories) => {
      const url = this.seo.buildUrl('/stories');
      const organization = this.seo.getOrganizationSchema();
      const website = this.seo.getWebsiteSchema();
      const itemListId = `${url}#itemlist`;
      const itemList = {
        '@type': 'ItemList',
        '@id': itemListId,
        itemListElement: stories.map((story, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: story.title,
          url: this.seo.buildUrl(story.link),
        })),
      };
      const page = {
        '@type': 'CollectionPage',
        '@id': `${url}#webpage`,
        url,
        name: 'DewCo Stories',
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

  trackByStoryId(index: number, story: Story): string {
    return story.id;
  }

  getDateParts(value?: string): { day: string; month: string; year: string } {
    if (!value) {
      return { day: '--', month: '', year: '' };
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { day: '--', month: '', year: '' };
    }

    return {
      day: date.getDate().toString().padStart(2, '0'),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      year: date.getFullYear().toString(),
    };
  }

  loadMore(): void {
    this.visibleCount += this.pageSize;
  }

  private resetVisible(): void {
    this.visibleCount = this.pageSize;
  }

  private filterStories(
    stories: Story[],
    details: StoryDetail[],
    term: string
  ): Story[] {
    const q = term.trim().toLowerCase();
    if (!q) return stories;

    const detailMap = new Map(details.map((d) => [d.id, d]));

    return stories.filter((story) => {
      const detail = detailMap.get(story.id);
      const tags = detail?.tags?.join(' ') ?? '';
      const content = detail?.content ?? '';

      const haystack = `${story.title} ${story.date} ${story.excerpt} ${tags} ${content}`.toLowerCase();
      return haystack.includes(q);
    });
  }
}
