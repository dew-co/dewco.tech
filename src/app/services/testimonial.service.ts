import { Injectable } from '@angular/core';
import { DocumentData, QueryDocumentSnapshot, collection, getDocs } from 'firebase/firestore';
import { Observable, defer, from } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { firestoreDb } from '../firebase/firebase';

export interface Testimonial {
  name: string;
  role: string;
  text: string;
}

interface TestimonialRaw extends Testimonial {
  sort_order?: number;
}

@Injectable({
  providedIn: 'root',
})
export class TestimonialService {
  private readonly testimonials$: Observable<Testimonial[]>;

  constructor() {
    this.testimonials$ = defer(() =>
      from(getDocs(collection(firestoreDb, 'testimonials')))
    ).pipe(
      map((snapshot) =>
        snapshot.docs.map((docSnap) => this.mapTestimonialRaw(docSnap))
      ),
      map((items) => this.sortTestimonials(items).map((item) => this.toTestimonial(item))),
      shareReplay(1)
    );
  }

  getTestimonials(): Observable<Testimonial[]> {
    return this.testimonials$;
  }

  private mapTestimonialRaw(
    docSnap: QueryDocumentSnapshot<DocumentData>
  ): TestimonialRaw {
    return docSnap.data() as TestimonialRaw;
  }

  private toTestimonial(raw: TestimonialRaw): Testimonial {
    return {
      name: raw.name,
      role: raw.role,
      text: raw.text,
    };
  }

  private sortTestimonials(items: TestimonialRaw[]): TestimonialRaw[] {
    return [...items].sort((a, b) => {
      const orderA =
        typeof a.sort_order === 'number' ? a.sort_order : Number.POSITIVE_INFINITY;
      const orderB =
        typeof b.sort_order === 'number' ? b.sort_order : Number.POSITIVE_INFINITY;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return a.name.localeCompare(b.name);
    });
  }
}
