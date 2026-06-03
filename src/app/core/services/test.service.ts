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
    const finalScores: Record<string, number> = {};
    const traits = ['ciencia', 'tecnologia', 'ingenieria', 'artes', 'matematicas'];
    traits.forEach(t => finalScores[t] = 0);

    const calibrationPayload: Record<string, any> = {
      gaming_habits: JSON.parse(localStorage.getItem(`calibration_gaming_habits_answers_${userId}`) || '{}'),
      physical_hobbies: JSON.parse(localStorage.getItem(`calibration_physical_hobbies_answers_${userId}`) || '{}'),
      digital_consumption: JSON.parse(localStorage.getItem(`calibration_digital_consumption_answers_${userId}`) || '{}'),
      everyday_mechanics: JSON.parse(localStorage.getItem(`calibration_everyday_mechanics_answers_${userId}`) || '{}')
    };

    const completedModules = Object.values(calibrationPayload).some((answers: any) => Object.keys(answers).length > 0);

    if (!completedModules) {
      // Fallback: Scale API scores to 100
      traits.forEach(t => {
        const apiRaw = apiScores[t] || 0;
        finalScores[t] = Math.min(Math.round((apiRaw / 20) * 100), 100);
      });
      return finalScores;
    }

    // 1. M1 (Teoría) -> 60%
    traits.forEach(t => {
      const apiRaw = apiScores[t] || 0;
      finalScores[t] += Math.min((apiRaw / 20) * 60, 60);
    });

    // 2. Módulos de Calibración -> 40% (10% cada uno)
    const categoryMap: Record<string, string> = {
      gh1: 'ingenieria', gh2: 'tecnologia', gh3: 'matematicas', gh4: 'ciencia', gh5: 'artes', gh6: 'ciencia',
      ph1: 'ciencia', ph2: 'ingenieria', ph3: 'artes', ph4: 'ciencia', ph5: 'matematicas', ph6: 'tecnologia',
      dc1: 'ciencia', dc2: 'tecnologia', dc3: 'artes', dc4: 'ingenieria', dc5: 'matematicas', dc6: 'tecnologia',
      em1: 'ingenieria', em2: 'tecnologia', em3: 'matematicas', em4: 'artes', em5: 'ciencia', em6: 'ingenieria'
    };

    const modules = ['gaming_habits', 'physical_hobbies', 'digital_consumption', 'everyday_mechanics'];
    
    modules.forEach(modId => {
      const answers = calibrationPayload[modId] || {};
      const categoryLikes: Record<string, number> = { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 };
      
      Object.entries(answers).forEach(([qId, status]) => {
        if (status === 'liked') {
          const cat = categoryMap[qId];
          if (cat) {
            categoryLikes[cat]++;
          }
        }
      });

      traits.forEach(t => {
        const likes = categoryLikes[t] || 0;
        // Each like adds 5 points, max 10 points per module per trait
        const modScore = Math.min(likes * 5, 10);
        finalScores[t] += modScore;
      });
    });

    traits.forEach(t => {
      finalScores[t] = Math.min(Math.round(finalScores[t]), 100);
    });

    return finalScores;
  }
}
