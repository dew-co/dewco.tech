import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about-page.component.html',
})
export class AboutPageComponent implements OnInit {
  constructor(private readonly seo: SeoService) {}

  ngOnInit(): void {
    const description =
      'Learn about DewCo, the personal innovation studio of Dipankar Chowdhury, focused on product strategy, UX/UI design, automation, and full-stack engineering.';

    this.seo.setPageMeta({
      title: 'About DewCo',
      description,
      url: '/about',
      keywords: [
        'about DewCo',
        'Dipankar Chowdhury',
        'product studio',
        'UX/UI design',
        'full-stack engineering',
      ],
    });

    const url = this.seo.buildUrl('/about');
    const organization = this.seo.getOrganizationSchema();
    const website = this.seo.getWebsiteSchema();
    const page = {
      '@type': 'AboutPage',
      '@id': `${url}#webpage`,
      url,
      name: 'About DewCo',
      description,
      isPartOf: { '@id': website['@id'] },
      about: { '@id': organization['@id'] },
      inLanguage: 'en',
    };

    this.seo.setJsonLd({
      '@context': 'https://schema.org',
      '@graph': [organization, website, page],
    });
  }
}
