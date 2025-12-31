import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, Inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { FooterComponent } from './layout/footer.component';
import { HeaderComponent } from './layout/header.component';
import { PreloaderComponent } from './layout/preloader.component';
import { ThemeScriptLoaderService } from './services/theme-script-loader.service';

declare global {
  interface Window {
    dewcoInit?: (options?: { runPreloader?: boolean }) => void;
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, PreloaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  private navigationSub?: Subscription;

  constructor(
    private router: Router,
    private ngZone: NgZone,
    @Inject(DOCUMENT) private document: Document,
    private themeScripts: ThemeScriptLoaderService,
  ) {}

  ngOnInit(): void {
    this.document.body.classList.add('cs_dark');
    void this.themeScripts.loadWhenIdle()
      .catch((err) => console.error('Failed to load theme scripts', err));
    this.navigationSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.runThemeScripts(true));
  }

  ngOnDestroy(): void {
    this.navigationSub?.unsubscribe();
    this.document.body.classList.remove('cs_dark');
  }

  private runThemeScripts(runPreloader = false): void {
    void this.themeScripts.loadWhenIdle()
      .then(() => {
        if (typeof window === 'undefined' || typeof window.dewcoInit !== 'function') {
          return;
        }
        this.ngZone.runOutsideAngular(() => {
          setTimeout(() => window.dewcoInit?.({ runPreloader }));
        });
      })
      .catch((err) => console.error('Failed to load theme scripts', err));
  }
}
