import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Story, StoryDetail, StoryService } from '../../services/story.service';

@Component({
  selector: 'app-stories-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './stories-page.component.html',
})
export class StoriesPageComponent {
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly stories$: Observable<Story[]>;
  readonly filteredStories$: Observable<Story[]>;
  readonly defaultThumb = 'assets/img/post_thumb_1.jpeg';

  constructor(private readonly storyService: StoryService) {
    this.stories$ = this.storyService.getStories();
    this.filteredStories$ = combineLatest([
      this.storyService.getStories(),
      this.storyService.getStoryDetailsList(),
      this.searchControl.valueChanges.pipe(startWith('')),
    ]).pipe(
      map(([stories, details, term]) =>
        this.filterStories(stories, details, term || '')
      )
    );
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
