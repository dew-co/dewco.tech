import { Routes } from '@angular/router';
import { AboutPageComponent } from './pages/about/about-page.component';
import { ContactPageComponent } from './pages/contact/contact-page.component';
import { HomePageComponent } from './pages/home/home-page.component';
import { PortfolioDetailsPageComponent } from './pages/portfolio-details/portfolio-details-page.component';
import { PortfolioPageComponent } from './pages/portfolio/portfolio-page.component';
import { StoriesPageComponent } from './pages/stories/stories-page.component';
import { StoryDetailsPageComponent } from './pages/story-details/story-details-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent, pathMatch: 'full' },
  { path: 'about', component: AboutPageComponent },
  { path: 'contact', component: ContactPageComponent },
  { path: 'portfolio', component: PortfolioPageComponent },
  { path: 'portfolio/:id', component: PortfolioDetailsPageComponent },
  { path: 'portfolio-details', component: PortfolioDetailsPageComponent },
  { path: 'stories', component: StoriesPageComponent },
  { path: 'stories/:id', component: StoryDetailsPageComponent },
  { path: 'story/:id', redirectTo: 'stories/:id', pathMatch: 'full' },
  { path: 'story-details/:id', redirectTo: 'stories/:id', pathMatch: 'full' },
  { path: 'story-details', redirectTo: 'stories', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
