import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {
  private navigationSub?: Subscription;

  constructor(
    private router: Router,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngOnInit(): void {
    this.navigationSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.closeMobileMenu());
  }

  ngOnDestroy(): void {
    this.navigationSub?.unsubscribe();
  }

  onNavLinkClick(): void {
    this.closeMobileMenu();
  }

  private closeMobileMenu(): void {
    this.document
      .querySelectorAll('.cs_nav_list.cs_active')
      .forEach((navList) => this.renderer.removeClass(navList, 'cs_active'));

    this.document
      .querySelectorAll('.cs_menu_toggle.cs_toggle_active')
      .forEach((toggle) => this.renderer.removeClass(toggle, 'cs_toggle_active'));

    const sideHeader = this.document.querySelector('.cs_side_header.active');
    if (sideHeader) {
      this.renderer.removeClass(sideHeader, 'active');
    }
  }
}
