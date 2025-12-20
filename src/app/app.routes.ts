import { Routes } from '@angular/router';
import { PageLoaderComponent } from './page-loader.component';

export const routes: Routes = [
  { path: '', component: PageLoaderComponent, data: { slug: 'index' }, pathMatch: 'full' },
  { path: 'about', component: PageLoaderComponent, data: { slug: 'about' } },
  { path: 'contact', component: PageLoaderComponent, data: { slug: 'contact' } },
  { path: 'portfolio', component: PageLoaderComponent, data: { slug: 'portfolio' } },
  { path: 'portfolio-details', component: PageLoaderComponent, data: { slug: 'portfolio-details' } },
  { path: 'stories', component: PageLoaderComponent, data: { slug: 'stories' } },
  { path: 'story-details', component: PageLoaderComponent, data: { slug: 'story-details' } },
  { path: '**', redirectTo: '' },
];
