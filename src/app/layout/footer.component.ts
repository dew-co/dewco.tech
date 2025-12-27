import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PrivacyPolicyComponent } from '../pages/legal/privacy-policy/privacy-policy.component';
import { TermsOfServiceComponent } from '../pages/legal/terms-of-service/terms-of-service.component';

type LegalModalView = 'terms' | 'privacy' | null;

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TermsOfServiceComponent, PrivacyPolicyComponent],
  templateUrl: './footer.component.html',
})
export class FooterComponent implements AfterViewInit {
  @ViewChild('footerCalendarButtonTarget', { static: true }) footerCalendarButtonTarget?: ElementRef<HTMLElement>;
  private schedulingButtonInitialized = false;
  legalModalOpen = false;
  activeLegal: LegalModalView = null;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  get legalModalTitle(): string {
    if (this.activeLegal === 'terms') {
      return 'Terms of Service';
    }
    if (this.activeLegal === 'privacy') {
      return 'Privacy Policy';
    }
    return '';
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.loadSchedulingButton();
  }

  openLegalModal(view: Exclude<LegalModalView, null>, event?: Event): void {
    event?.preventDefault();
    this.activeLegal = view;
    this.setLegalModalOpen(true);
  }

  closeLegalModal(event?: Event): void {
    event?.preventDefault();
    this.setLegalModalOpen(false);
    this.activeLegal = null;
  }

  private async loadSchedulingButton(): Promise<void> {
    if (this.schedulingButtonInitialized || !this.footerCalendarButtonTarget) {
      return;
    }

    this.ensureSchedulingStyles();
    await this.ensureSchedulingScript();

    const calendar = (window as any).calendar;
    if (calendar?.schedulingButton) {
      this.footerCalendarButtonTarget.nativeElement.innerHTML = '';
      calendar.schedulingButton.load({
        url: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3RlbXfRmMYThuoLVy1T7jiQ9M0j32SbLE8lycPtOGNjhuabdz_dBaFjqvnxeMI25JmYXpB8IHh?gv=true',
        color: '#ffffff',
        label: 'Book A Meeting',
        target: this.footerCalendarButtonTarget.nativeElement,
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
    if (!this.footerCalendarButtonTarget) {
      return;
    }

    const button = this.footerCalendarButtonTarget.nativeElement.nextElementSibling;
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

  private setLegalModalOpen(open: boolean): void {
    this.legalModalOpen = open;
    if (open) {
      this.document.body.classList.add('cs_modal_open');
      return;
    }
    this.document.body.classList.remove('cs_modal_open');
  }
}
