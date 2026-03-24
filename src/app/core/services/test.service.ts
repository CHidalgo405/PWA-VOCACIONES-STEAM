import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

@Injectable({
  providedIn: 'root'
})
export class VocationTestService {
  private http = inject(HttpClient);

  getQuestions(): Observable<Question[]> {
    return this.http.get<Question[]>(`${environment.apiUrl}/tests/questions`);
  }

  submitTest(answers: Record<string, string>, locationInput: string = ''): Observable<TestSubmissionResponse> {
    const payload = {
      answers,
      locationInput
    };
    return this.http.post<TestSubmissionResponse>(`${environment.apiUrl}/tests/submit`, payload);
  }
}
