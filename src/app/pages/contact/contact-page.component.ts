import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './contact-page.component.html',
})
export class ContactPageComponent implements OnInit {
  constructor(private readonly seo: SeoService) {}

  ngOnInit(): void {
    const description =
      'Contact DewCo to discuss product strategy, UX/UI design, automation, and full-stack development. Email hello@dewco.tech to start a project.';

    this.seo.setPageMeta({
      title: 'Contact DewCo',
      description,
      url: '/contact',
      keywords: [
        'contact DewCo',
        'product strategy',
        'automation studio',
        'full-stack development',
        'hello@dewco.tech',
      ],
    });

    const url = this.seo.buildUrl('/contact');
    const organization = this.seo.getOrganizationSchema();
    const website = this.seo.getWebsiteSchema();
    const page = {
      '@type': 'ContactPage',
      '@id': `${url}#webpage`,
      url,
      name: 'Contact DewCo',
      description,
      isPartOf: { '@id': website['@id'] },
      about: { '@id': organization['@id'] },
      inLanguage: 'en',
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'business inquiries',
          email: 'hello@dewco.tech',
        },
      ],
    };

    this.seo.setJsonLd({
      '@context': 'https://schema.org',
      '@graph': [organization, website, page],
    });
  }
}
