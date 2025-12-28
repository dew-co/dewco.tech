import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  NgZone,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { Portfolio, PortfolioService } from '../../services/portfolio.service';
import { SeoService } from '../../services/seo.service';
import { Story, StoryService } from '../../services/story.service';
import { Testimonial, TestimonialService } from '../../services/testimonial.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home-page.component.html',
})
export class HomePageComponent implements OnInit, AfterViewInit {
  @ViewChild('calendarButtonTarget', { static: true }) calendarButtonTarget?: ElementRef<HTMLElement>;

  readonly featuredPortfolios$: Observable<Portfolio[]>;
  readonly featuredStories$: Observable<Story[]>;
  readonly testimonials$: Observable<Testimonial[]>;
  readonly defaultStoryThumb = 'assets/img/post_thumb_1.webp';
  private schedulingButtonInitialized = false;

  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly storyService: StoryService,
    private readonly testimonialService: TestimonialService,
    private readonly seo: SeoService,
    private readonly ngZone: NgZone,
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {
    this.featuredPortfolios$ = this.portfolioService.getFeatured(4);
    this.featuredStories$ = this.storyService.getFeatured(8);
    this.testimonials$ = this.testimonialService.getTestimonials();
  }

  ngOnInit(): void {
    const description =
      'Dew & Company (DewCo) is the personal innovation studio of Dipankar Chowdhury, building AI-driven products, automation systems, and full-stack web experiences for startups and founders.';
    this.seo.setPageMeta({
      title: 'DewCo | Product, Design & Automation Studio',
      description,
      url: '/',
      keywords: [
        'innovation studio',
        'product strategy',
        'automation architecture',
        'full-stack engineering',
        'UX/UI design',
        'AI products',
      ],
    });

    const url = this.seo.buildUrl('/');
    const organization = this.seo.getOrganizationSchema();
    const website = this.seo.getWebsiteSchema();
    const page = {
      '@type': 'HomePage',
      '@id': `${url}#webpage`,
      url,
      name: this.seo.getSiteName(),
      description,
      isPartOf: { '@id': website['@id'] },
      about: { '@id': organization['@id'] },
      inLanguage: 'en',
    };

    this.seo.setJsonLd({
      '@context': 'https://schema.org',
      '@graph': [organization, website, page],
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.loadSchedulingButton();
    this.ensureStoriesSliderInit();
    this.ensureTestimonialsSliderInit();
  }

  trackByPortfolioId(index: number, portfolio: Portfolio): string {
    return portfolio.id;
  }

  trackByStoryId(index: number, story: Story): string {
    return story.id;
  }

  trackByTestimonialName(index: number, testimonial: Testimonial): string {
    return testimonial.name;
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

  private async loadSchedulingButton(): Promise<void> {
    if (this.schedulingButtonInitialized || !this.calendarButtonTarget) {
      return;
    }

    this.ensureSchedulingStyles();
    await this.ensureSchedulingScript();

    const calendar = (window as any).calendar;
    if (calendar?.schedulingButton) {
      this.calendarButtonTarget.nativeElement.innerHTML = '';
      calendar.schedulingButton.load({
        url: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3RlbXfRmMYThuoLVy1T7jiQ9M0j32SbLE8lycPtOGNjhuabdz_dBaFjqvnxeMI25JmYXpB8IHh?gv=true',
        color: '#ffffff',
        label: 'Book A Meeting',
        target: this.calendarButtonTarget.nativeElement,
      });
      this.applySchedulingButtonStyles();
      this.schedulingButtonInitialized = true;
    }
  }

  private ensureSchedulingStyles(): void {
    const head = this.document.head;
    const existing = head.querySelector<HTMLLinkElement>('#google-calendar-scheduling-css');
    if (existing) {
      return;
    }
    const link = this.document.createElement('link');
    link.id = 'google-calendar-scheduling-css';
    link.rel = 'stylesheet';
    link.href = 'https://calendar.google.com/calendar/scheduling-button-script.css';
    head.appendChild(link);
  }

  private ensureSchedulingScript(): Promise<void> {
    const existing = this.document.querySelector<HTMLScriptElement>('#google-calendar-scheduling-js');
    if (existing) {
      if ((window as any).calendar?.schedulingButton) {
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Failed to load Google scheduling script')), { once: true });
      });
    }

    return new Promise((resolve, reject) => {
      const script = this.document.createElement('script');
      script.id = 'google-calendar-scheduling-js';
      script.src = 'https://calendar.google.com/calendar/scheduling-button-script.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google scheduling script'));
      this.document.body.appendChild(script);
    });
  }

  private applySchedulingButtonStyles(): void {
    if (!this.calendarButtonTarget) {
      return;
    }

    const button = this.calendarButtonTarget.nativeElement.nextElementSibling;
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    button.classList.remove('qxCTlb');
    button.classList.add('cs_btn', 'cs_style_1', 'cs_color_1', 'cs_schedule_btn');
    button.type = 'button';

    if (button.childElementCount === 0) {
      const label = button.textContent?.trim();
      if (label) {
        const span = this.document.createElement('span');
        span.textContent = label;
        button.textContent = '';
        button.appendChild(span);
      }
    }
  }

  private ensureStoriesSliderInit(): void {
    this.featuredStories$.pipe(take(1)).subscribe((stories) => {
      if (!stories.length || !isPlatformBrowser(this.platformId)) {
        return;
      }
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => {
          const slider = this.document.querySelector('.cs_slider_3');
          if (!slider || slider.classList.contains('swiper-initialized')) {
            return;
          }
          const dewcoInit = (window as any).dewcoInit as
            | ((options?: { runPreloader?: boolean }) => void)
            | undefined;
          dewcoInit?.({ runPreloader: false });
        }, 0);
      });
    });
  }

  private ensureTestimonialsSliderInit(): void {
    this.testimonials$.pipe(take(1)).subscribe((testimonials) => {
      if (!testimonials.length || !isPlatformBrowser(this.platformId)) {
        return;
      }
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => {
          const slider = this.document.querySelector('.cs_slider_2');
          if (!slider || slider.classList.contains('swiper-initialized')) {
            return;
          }
          const dewcoInit = (window as any).dewcoInit as
            | ((options?: { runPreloader?: boolean }) => void)
            | undefined;
          dewcoInit?.({ runPreloader: false });
        }, 0);
      });
    });
  }
}
