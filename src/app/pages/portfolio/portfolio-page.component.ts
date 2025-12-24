import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Portfolio, PortfolioService } from '../../services/portfolio.service';

@Component({
  selector: 'app-portfolio-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './portfolio-page.component.html',
})
export class PortfolioPageComponent {
  readonly portfolios$: Observable<Portfolio[]>;

  constructor(private readonly portfolioService: PortfolioService) {
    this.portfolios$ = this.portfolioService.getPortfolios();
  }

  trackByPortfolioId(index: number, portfolio: Portfolio): string {
    return portfolio.id;
  }
}
