import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  updateAvatar(avatarUrl: string): Observable<any> {
    return this.http.put(`${environment.apiUrl}/users/avatar`, { avatarUrl });
  }

  updateProfile(data: {
    fullname?: string;
    bio?: string;
    birthDate?: string;
    phone?: string;
    location?: string;
    github?: string;
    linkedin?: string;
  }): Observable<any> {
    return this.http.put(`${environment.apiUrl}/users/profile`, data);
  }

  updatePassword(data: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.put(`${environment.apiUrl}/users/password`, data);
  }

  updateSettings(settings: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/users/settings`, settings);
  }

  /** Registra en la API la aceptación del Aviso de Privacidad y los Términos. */
  acceptTerms(version: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/users/accept-terms`, { version });
  }

  // --- SAVED UNIVERSITIES (FAVORITES) ---

  saveUniversity(data: {
    careerName: string;
    universityName: string;
    location: string;
    relationshipExplanation: string;
    keyDates: string;
    studyPlan: string;
    officialWebsite?: string;
    latitude?: number;
    longitude?: number;
    rating?: number;
  }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/users/saved-universities`, data);
  }

  getSavedUniversities(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/users/saved-universities`);
  }

  deleteSavedUniversity(id: string | number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/users/saved-universities/${id}`);
  }

  // --- SAVED COURSES (FAVORITES) ---

  saveCourse(data: {
    provider: string;
    courseName: string;
    durationHours: number;
    isFree: boolean;
    description: string;
    syllabus: string;
    link: string;
  }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/users/saved-courses`, data);
  }

  getSavedCourses(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/users/saved-courses`);
  }

  deleteSavedCourse(id: string | number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/users/saved-courses/${id}`);
  }
}
