import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Portfolio, PortfolioService } from '../../services/portfolio.service';
import { Story, StoryService } from '../../services/story.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home-page.component.html',
})
export class HomePageComponent {
  readonly featuredPortfolios$: Observable<Portfolio[]>;
  readonly featuredStories$: Observable<Story[]>;
  readonly defaultStoryThumb = 'assets/img/post_thumb_1.jpeg';

  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly storyService: StoryService
  ) {
    this.featuredPortfolios$ = this.portfolioService.getFeatured(4);
    this.featuredStories$ = this.storyService.getFeatured(8);
  }

  trackByPortfolioId(index: number, portfolio: Portfolio): string {
    return portfolio.id;
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
}
