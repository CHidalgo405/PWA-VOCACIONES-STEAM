import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminUser {
  id: string;
  email: string;
  fullname: string;
  role: 'student' | 'admin';
  title?: string;
  level: number;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AdminTestOption {
  id?: string;
  text: string;
  letter: string;
  steamTrait: string;
}

export interface AdminTestQuestion {
  id: string;
  text: string;
  order: number;
  isActive?: boolean;
  status?: string;
  options: AdminTestOption[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);

  // --- ADMINISTRACIÓN DE USUARIOS ---
  getAllUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${environment.apiUrl}/users`);
  }

  updateUser(id: string, data: Partial<AdminUser>): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${environment.apiUrl}/users/${id}`, data);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/users/${id}`);
  }

  // --- ADMINISTRACIÓN DEL TEST VOCACIONAL ---
  getAllQuestions(): Observable<AdminTestQuestion[]> {
    return this.http.get<AdminTestQuestion[]>(`${environment.apiUrl}/tests/questions`);
  }

  createQuestion(question: Partial<AdminTestQuestion>): Observable<AdminTestQuestion> {
    return this.http.post<AdminTestQuestion>(`${environment.apiUrl}/tests/questions`, question);
  }

  updateQuestion(id: string, question: Partial<AdminTestQuestion>): Observable<AdminTestQuestion> {
    return this.http.put<AdminTestQuestion>(`${environment.apiUrl}/tests/questions/${id}`, question);
  }

  deleteQuestion(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/tests/questions/${id}`);
  }
}
