import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-portfolio-details-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './portfolio-details-page.component.html',
})
export class PortfolioDetailsPageComponent {}
