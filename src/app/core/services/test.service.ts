import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Option {
  id: string;
  text: string;
  letter: string;
  steamTrait: string;
}

export interface Question {
  id: string;
  text: string;
  order: number;
  options: Option[];
}

export interface UniversityRecommendation {
  id?: number;
  name: string;
  location: string;
  suggestedMajor: string;
  matchReason: string;
  keyDates: string;
  studyPlan: string[];
  websiteUrl: string;
}

export interface TestSubmissionResponse {
  testId: string;
  scores: Record<string, number>;
  dominantTraits: string;
  aiProfileDescription: string;
  recommendations: UniversityRecommendation[];
}

export interface TestHistorySummary {
  id: string;
  testName: string;
  completedAt: string;
  dominantTraits: string;
  profileScores: Record<string, number>;
}

export interface TestDetail extends TestSubmissionResponse {
  testName: string;
  completedAt: string;
  answers: Record<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class VocationTestService {
  private http = inject(HttpClient);

  getQuestions(): Observable<Question[]> {
    return this.http.get<Question[]>(`${environment.apiUrl}/tests/questions`);
  }

  submitTest(answers: Record<string, string>, locationInput: string = ''): Observable<TestSubmissionResponse> {
    const payload: any = { answers };
    if (locationInput && locationInput.trim() !== '') {
      payload.locationInput = locationInput.trim();
    }
    return this.http.post<TestSubmissionResponse>(`${environment.apiUrl}/tests/submit`, payload);
  }

  getTestHistory(): Observable<TestHistorySummary[]> {
    return this.http.get<TestHistorySummary[]>(`${environment.apiUrl}/tests/history`);
  }

  getTestDetails(id: string): Observable<TestDetail> {
    return this.http.get<TestDetail>(`${environment.apiUrl}/tests/history/${id}`);
  }

  getLatestTest(): Observable<TestDetail | null> {
    return this.http.get<TestDetail>(`${environment.apiUrl}/tests/latest`).pipe(
      catchError((error) => {
        // If 404, it means no tests exist for this user, return null silently
        if (error.status === 404) {
          return of(null);
        }
        throw error;
      })
    );
  }

  updateTestName(id: string, testName: string): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/tests/history/${id}`, { testName });
  }

  deleteTest(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/tests/history/${id}`);
  }

  calculateWeightedScores(apiScores: Record<string, number>, userId: string): Record<string, number> {
    // Deprecated client-side calculation. Now the backend returns pre-calibrated weighted scores.
    return apiScores || {};
  }
}
