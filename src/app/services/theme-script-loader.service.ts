import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeScriptLoaderService {
  private loadingPromise?: Promise<void>;
  private loaded = false;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {}

  loadWhenIdle(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.resolve();
    }
    if (this.loaded) {
      return Promise.resolve();
    }
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = new Promise((resolve, reject) => {
      const schedule = () => {
        this.loadAssets()
          .then(() => {
            this.loaded = true;
            resolve();
          })
          .catch((err) => {
            this.loadingPromise = undefined;
            reject(err);
          });
      };

      const idleCallback = (window as any).requestIdleCallback as
        | ((cb: () => void, opts?: { timeout: number }) => void)
        | undefined;

      if (idleCallback) {
        idleCallback(schedule, { timeout: 2000 });
        return;
      }

      setTimeout(schedule, 2000);
    });

    return this.loadingPromise;
  }

  ensureLoaded(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.resolve();
    }
    if (this.loaded) {
      return Promise.resolve();
    }
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this.loadAssets()
      .then(() => {
        this.loaded = true;
      })
      .catch((err) => {
        this.loadingPromise = undefined;
        throw err;
      });

    return this.loadingPromise;
  }

  private loadAssets(): Promise<void> {
    return this.loadStyles()
      .then(() => this.loadScripts());
  }

  private loadStyles(): Promise<void> {
    const styles = [
      'assets/css/plugins/fontawesome.min.css',
      'assets/css/animations.css',
    ];

    return styles.reduce(
      (chain, href) => chain.then(() => this.appendStyle(href)),
      Promise.resolve(),
    );
  }

  private loadScripts(): Promise<void> {
    const scripts = [
      'assets/js/plugins/jquery-3.6.0.min.js',
      'assets/js/plugins/gsap.min.js',
      'assets/js/plugins/swiper.min.js',
      'assets/js/plugins/wow.min.js',
      'assets/js/plugins/wait-for-images.js',
      'assets/js/main.js',
    ];

    return scripts.reduce(
      (chain, src) => chain.then(() => this.appendScript(src)),
      Promise.resolve(),
    );
  }

  private appendStyle(href: string): Promise<void> {
    const selector = `link[data-dewco-style="${href}"]`;
    const existing = this.document.querySelector<HTMLLinkElement>(selector);
    if (existing) {
      if (existing.dataset['loaded'] === 'true') {
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener(
          'error',
          () => reject(new Error(`Failed to load ${href}`)),
          { once: true },
        );
      });
    }

    return new Promise((resolve, reject) => {
      const link = this.document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-dewco-style', href);
      link.addEventListener(
        'load',
        () => {
          link.dataset['loaded'] = 'true';
          resolve();
        },
        { once: true },
      );
      link.addEventListener(
        'error',
        () => reject(new Error(`Failed to load ${href}`)),
        { once: true },
      );
      this.document.head.appendChild(link);
    });
  }

  private appendScript(src: string): Promise<void> {
    const selector = `script[data-dewco-src="${src}"]`;
    const existing = this.document.querySelector<HTMLScriptElement>(selector);
    if (existing) {
      if (existing.dataset['loaded'] === 'true') {
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener(
          'error',
          () => reject(new Error(`Failed to load ${src}`)),
          { once: true },
        );
      });
    }

    return new Promise((resolve, reject) => {
      const script = this.document.createElement('script');
      script.src = src;
      script.async = false;
      script.setAttribute('data-dewco-src', src);
      script.addEventListener(
        'load',
        () => {
          script.dataset['loaded'] = 'true';
          resolve();
        },
        { once: true },
      );
      script.addEventListener(
        'error',
        () => reject(new Error(`Failed to load ${src}`)),
        { once: true },
      );
      this.document.body.appendChild(script);
    });
  }
}
