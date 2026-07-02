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
  status?: string;
  options: AdminTestOption[];
}

export interface RecentLogItem {
  id: string;
  date: string;
  studentName: string;
  detectedProfile: string;
  latency: string;
  status: string;
  prompt?: string;
  response?: string;
}

export interface AiLogsStatsResponse {
  successRate: string;
  averageLatency: string;
  totalTokens: string;
  recentLogs: RecentLogItem[];
}

/** Candidata para el algoritmo A8 (matching de universidades). */
export interface AdminUniversity {
  id?: string;
  name: string;
  address?: string;
  website?: string;
  location?: { latitude: number; longitude: number };
  steamPrograms?: { name: string; area: string }[];
  costTier?: 'public' | 'affordable' | 'private-premium';
  tuitionRange?: string;
  rating?: number;
  modality?: string;
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

  // --- MONITOREO IA ---
  getAiLogsStats(): Observable<AiLogsStatsResponse> {
    return this.http.get<AiLogsStatsResponse>(`${environment.apiUrl}/admin/ai-logs`);
  }

  // --- ADMINISTRACIÓN DE SIMULADORES ---
  public getAdminSimulators(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/career-simulators`);
  }

  public createSimulator(simulator: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/career-simulators`, simulator);
  }

  public updateSimulator(id: string, simulator: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/career-simulators/${id}`, simulator);
  }

  public deleteSimulator(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/career-simulators/${id}`);
  }

  // --- ADMINISTRACIÓN DE UNIVERSIDADES (candidatas de A8) ---
  public getAdminUniversities(): Observable<AdminUniversity[]> {
    return this.http.get<AdminUniversity[]>(`${environment.apiUrl}/universities`);
  }

  public createUniversity(university: Partial<AdminUniversity>): Observable<AdminUniversity> {
    return this.http.post<AdminUniversity>(`${environment.apiUrl}/admin/universities`, university);
  }

  public updateUniversity(id: string, university: Partial<AdminUniversity>): Observable<AdminUniversity> {
    return this.http.put<AdminUniversity>(`${environment.apiUrl}/admin/universities/${id}`, university);
  }

  public deleteUniversity(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/admin/universities/${id}`);
  }
}
