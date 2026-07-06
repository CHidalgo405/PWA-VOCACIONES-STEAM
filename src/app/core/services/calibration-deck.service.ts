import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CalibrationCard {
  id: string;
  text: string;
  /** ciencia | tecnologia | ingenieria | artes | matematicas */
  category: string;
}

export interface CalibrationDeck {
  id?: string;
  moduleId: string;
  title: string;
  subtitle: string;
  icon: string;
  order: number;
  status: 'activo' | 'inactivo';
  cards: CalibrationCard[];
}

@Injectable({ providedIn: 'root' })
export class CalibrationDeckService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/calibration-decks`;
  private adminBase = `${environment.apiUrl}/admin/calibration-decks`;

  // --- Público (app del estudiante) ---
  getActiveDecks(): Observable<CalibrationDeck[]> {
    return this.http.get<CalibrationDeck[]>(this.base);
  }

  getDeck(moduleId: string): Observable<CalibrationDeck> {
    return this.http.get<CalibrationDeck>(`${this.base}/${moduleId}`);
  }

  // --- Admin ---
  getAllDecks(): Observable<CalibrationDeck[]> {
    return this.http.get<CalibrationDeck[]>(this.adminBase);
  }

  createDeck(data: Partial<CalibrationDeck>): Observable<CalibrationDeck> {
    return this.http.post<CalibrationDeck>(this.adminBase, data);
  }

  updateDeck(id: string, data: Partial<CalibrationDeck>): Observable<CalibrationDeck> {
    return this.http.put<CalibrationDeck>(`${this.adminBase}/${id}`, data);
  }

  deleteDeck(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.adminBase}/${id}`);
  }
}
