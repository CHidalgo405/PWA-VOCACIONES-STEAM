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

  updateSettings(settings: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/users/settings`, settings);
  }
}
