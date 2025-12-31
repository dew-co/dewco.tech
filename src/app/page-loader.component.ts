import { DOCUMENT, CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ThemeScriptLoaderService } from './services/theme-script-loader.service';

@Component({
  selector: 'app-page-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-loader.component.html',
  styleUrl: './page-loader.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class PageLoaderComponent implements OnInit, OnDestroy {
  @ViewChild('pageHost', { static: true })
  pageHost!: ElementRef<HTMLDivElement>;

  pageHtml: SafeHtml | null = null;
  loading = true;
  error = false;

  private readonly pages = new Set<string>([
    'index',
    'about',
    'contact',
    'portfolio',
    'portfolio-details',
    'stories',
    'story-details',
  ]);

  private navigationSub?: Subscription;
  private linkUnlisten?: () => void;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    private renderer: Renderer2,
    private themeScripts: ThemeScriptLoaderService,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngOnInit(): void {
    this.navigationSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.loadCurrentPage());

    this.loadCurrentPage();
  }

  ngOnDestroy(): void {
    this.navigationSub?.unsubscribe();
    this.unbindLinks();
    this.renderer.removeAttribute(this.document.body, 'class');
  }

  private async loadCurrentPage(): Promise<void> {
    const slug = this.getSlug();
    this.loading = true;
    this.error = false;
    this.unbindLinks();

    try {
      const response = await fetch(`assets/pages/${slug}.html`);
      if (!response.ok) {
        throw new Error(`Page not found: ${slug}`);
      }
      const html = await response.text();
      this.applyPage(html);
    } catch (err) {
      console.error(err);
      this.error = true;
      this.pageHtml = null;
    } finally {
      this.loading = false;
    }
  }

  private getSlug(): string {
    const raw =
      this.route.snapshot.data['slug'] ||
      this.route.snapshot.paramMap.get('page') ||
      'index';
    const normalized = this.normalizeSlug(raw);
    if (this.pages.has(normalized)) {
      return normalized;
    }
    return 'index';
  }

  private normalizeSlug(raw: string): string {
    const cleaned = raw
      .replace(/^\//, '')
      .split('#')[0]
      .split('?')[0]
      .replace(/\.html?$/i, '')
      .trim();
    return cleaned || 'index';
  }

  private applyPage(html: string): void {
    this.removeExistingPreloader();
    const parser = new DOMParser();
    const parsed = parser.parseFromString(html, 'text/html');
    const body = parsed.body;
    this.setBodyClass(body.getAttribute('class') || '');
    body.querySelectorAll('script').forEach(script => script.remove());
    this.pageHtml = this.sanitizer.bypassSecurityTrustHtml(body.innerHTML);

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
      this.bindInternalLinks();
      this.runThemeScripts();
    });
  }

  private setBodyClass(value: string): void {
    const trimmed = value.trim();
    if (trimmed) {
      this.renderer.setAttribute(this.document.body, 'class', trimmed);
    } else {
      this.renderer.removeAttribute(this.document.body, 'class');
    }
  }

  private bindInternalLinks(): void {
    const host = this.pageHost?.nativeElement;
    if (!host) {
      return;
    }

    const handler = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor) {
        return;
      }
      const href = anchor.getAttribute('href');
      if (
        !href ||
        href.startsWith('http') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#') ||
        anchor.target === '_blank'
      ) {
        return;
      }
      const slug = this.normalizeSlug(href);
      if (!this.pages.has(slug)) {
        return;
      }
      event.preventDefault();
      const path = slug === 'index' ? '/' : `/${slug}`;
      this.router.navigateByUrl(path);
    };

    host.addEventListener('click', handler);
    this.linkUnlisten = () => host.removeEventListener('click', handler);
  }

  private unbindLinks(): void {
    if (this.linkUnlisten) {
      this.linkUnlisten();
      this.linkUnlisten = undefined;
    }
  }

  private runThemeScripts(): void {
    void this.themeScripts.loadWhenIdle()
      .then(() => {
        if (typeof window !== 'undefined' && typeof (window as any).dewcoInit === 'function') {
          (window as any).dewcoInit({ runPreloader: true });
        }
      })
      .catch((err) => console.error('Failed to load theme assets', err));
  }

  private removeExistingPreloader(): void {
    const root = this.document.body;
    root.querySelectorAll('.cs_preloader_wrap').forEach(el => el.remove());
  }
}
