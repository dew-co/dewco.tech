import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Portfolio, PortfolioService } from '../../services/portfolio.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home-page.component.html',
})
export class HomePageComponent {
  readonly featuredPortfolios$: Observable<Portfolio[]>;

  constructor(private readonly portfolioService: PortfolioService) {
    this.featuredPortfolios$ = this.portfolioService.getFeatured(4);
  }

  trackByPortfolioId(index: number, portfolio: Portfolio): string {
    return portfolio.id;
  }
}
