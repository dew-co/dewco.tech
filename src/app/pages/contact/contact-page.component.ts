import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './contact-page.component.html',
})
export class ContactPageComponent implements OnInit, AfterViewInit {
  @ViewChild('contactCalendarButtonTarget', { static: true })
  contactCalendarButtonTarget?: ElementRef<HTMLElement>;
  private schedulingButtonInitialized = false;

  constructor(
    private readonly seo: SeoService,
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  ngOnInit(): void {
    const description =
      'Contact DewCo to discuss product strategy, UX/UI design, automation, and full-stack development. Email hello@dewco.tech to start a project.';

    this.seo.setPageMeta({
      title: 'Contact DewCo',
      description,
      url: '/contact',
      keywords: [
        'contact DewCo',
        'product strategy',
        'automation studio',
        'full-stack development',
        'hello@dewco.tech',
      ],
    });

    const url = this.seo.buildUrl('/contact');
    const organization = this.seo.getOrganizationSchema();
    const website = this.seo.getWebsiteSchema();
    const page = {
      '@type': 'ContactPage',
      '@id': `${url}#webpage`,
      url,
      name: 'Contact DewCo',
      description,
      isPartOf: { '@id': website['@id'] },
      about: { '@id': organization['@id'] },
      inLanguage: 'en',
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'business inquiries',
          email: 'hello@dewco.tech',
        },
      ],
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
  }

  private async loadSchedulingButton(): Promise<void> {
    if (this.schedulingButtonInitialized || !this.contactCalendarButtonTarget) {
      return;
    }

    this.ensureSchedulingStyles();
    await this.ensureSchedulingScript();

    const calendar = (window as any).calendar;
    if (calendar?.schedulingButton) {
      this.contactCalendarButtonTarget.nativeElement.innerHTML = '';
      calendar.schedulingButton.load({
        url: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3RlbXfRmMYThuoLVy1T7jiQ9M0j32SbLE8lycPtOGNjhuabdz_dBaFjqvnxeMI25JmYXpB8IHh?gv=true',
        color: '#ffffff',
        label: 'Book A Meeting',
        target: this.contactCalendarButtonTarget.nativeElement,
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
    if (!this.contactCalendarButtonTarget) {
      return;
    }

    const button = this.contactCalendarButtonTarget.nativeElement.nextElementSibling;
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
}
