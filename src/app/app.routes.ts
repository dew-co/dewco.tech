import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home/home-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent, pathMatch: 'full' },
  {
    path: 'about',
    loadComponent: () =>
      import('./pages/about/about-page.component').then((m) => m.AboutPageComponent),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/contact/contact-page.component').then((m) => m.ContactPageComponent),
  },
  {
    path: 'portfolio',
    loadComponent: () =>
      import('./pages/portfolio/portfolio-page.component').then((m) => m.PortfolioPageComponent),
  },
  {
    path: 'portfolio/:id',
    loadComponent: () =>
      import('./pages/portfolio-details/portfolio-details-page.component').then(
        (m) => m.PortfolioDetailsPageComponent,
      ),
  },
  {
    path: 'portfolio-details',
    loadComponent: () =>
      import('./pages/portfolio-details/portfolio-details-page.component').then(
        (m) => m.PortfolioDetailsPageComponent,
      ),
  },
  {
    path: 'stories',
    loadComponent: () =>
      import('./pages/stories/stories-page.component').then((m) => m.StoriesPageComponent),
  },
  {
    path: 'stories/:id',
    loadComponent: () =>
      import('./pages/story-details/story-details-page.component').then(
        (m) => m.StoryDetailsPageComponent,
      ),
  },
  { path: 'story/:id', redirectTo: 'stories/:id', pathMatch: 'full' },
  { path: 'story-details/:id', redirectTo: 'stories/:id', pathMatch: 'full' },
  { path: 'story-details', redirectTo: 'stories', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
