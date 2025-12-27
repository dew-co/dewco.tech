import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

export interface Testimonial {
  name: string;
  role: string;
  text: string;
}

interface TestimonialResponse {
  testimonials: Testimonial[];
}

@Injectable({
  providedIn: 'root',
})
export class TestimonialService {
  private readonly testimonials$: Observable<Testimonial[]>;

  constructor(private readonly http: HttpClient) {
    this.testimonials$ = this.http
      .get<TestimonialResponse>('assets/json/short-testimonials.json')
      .pipe(
        map((response) => response.testimonials ?? []),
        shareReplay(1)
      );
  }

  getTestimonials(): Observable<Testimonial[]> {
    return this.testimonials$;
  }
}
