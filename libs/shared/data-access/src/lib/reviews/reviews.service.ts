import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Review } from '@cleaners/models';
import { API_BASE_URL } from '@cleaners/util';
import { Observable, map } from 'rxjs';
import { CreateReviewRequest, ReviewDto, toReviewModel } from './review.dto';

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getByProfessional(professionalId: string): Observable<Review[]> {
    return this.http
      .get<ReviewDto[]>(`${this.apiBaseUrl}/reviews`, {
        params: { professionalId },
      })
      .pipe(map((dtos) => dtos.map(toReviewModel)));
  }

  // O backend valida se o bookingId pertence ao usuário logado e está concluído — o Angular não decide isso sozinho.
  create(request: CreateReviewRequest): Observable<Review> {
    return this.http
      .post<ReviewDto>(`${this.apiBaseUrl}/reviews`, request)
      .pipe(map(toReviewModel));
  }
}
