import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, map, catchError, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ThemeService } from './theme.service';

export interface Usuario {
  id?: string;
  nombre: string;
  email: string;
  role: 'admin' | 'student';
  fotoUrl?: string;
  title?: string;
  level?: number;
  darkMode?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USER_KEY = 'steam_pwa_user';
  private readonly TOKEN_KEY = 'steam_pwa_token';

  private http = inject(HttpClient);
  private router = inject(Router);
  private themeService = inject(ThemeService);

  // currentUser subject to react to user changes
  private currentUserSubject = new BehaviorSubject<Usuario | null>(this.getCurrentUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() { 
    // Apply theme from cached user if exists
    const cachedUser = this.getCurrentUser();
    if (cachedUser && cachedUser.darkMode !== undefined) {
      this.themeService.setTheme(cachedUser.darkMode);
    }
  }

  // ---------------------------------------------------------
  // REST API ENDPOINTS
  // ---------------------------------------------------------

  register(email: string, fullname: string, password: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/register`, { email, fullname, password });
  }

  verifyOtp(email: string, code: string, purpose: 'register' | 'recovery'): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/verify-otp`, { email, code, purpose }).pipe(
      tap((res: any) => {
        if (res.accessToken) {
          this.setSession(res.accessToken, res.user);
        }
      })
    );
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap((res: any) => {
        if (res.accessToken) {
          this.setSession(res.accessToken, res.user);
        }
      })
    );
  }

  verifyLogin(email: string, code: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/verify-login`, { email, code }).pipe(
      tap((res: any) => {
        if (res.accessToken) {
          this.setSession(res.accessToken, res.user);
        }
      })
    );
  }

  // Se solicita la recuperación (Reemplazado Firebase por llamada API HTTP Real)
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  // Se restablece la contraseña usando el OTP
  resetPassword(email: string, code: string, newPassword: string): Observable<any> {
    const payload = { email, code, newPassword };
    console.log('[AuthService] Reset Password Payload:', payload);
    return this.http.post(`${environment.apiUrl}/auth/reset-password`, payload);
  }

  loginWithGoogle() {
    window.location.href = 'https://vocacionessteam-api-production.up.railway.app/api/v1/auth/google';
  }

  // Handle Google Callback Token Backup
  handleGoogleCallback(token: string) {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
      this.getProfileFromServer().subscribe({
        next: (user) => {
          this.setCurrentUser(user);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error("Error fetching google profile", err);
          this.logout();
        }
      });
    }
  }

  obtenerPerfil(): Observable<Usuario> {
    return this.getProfileFromServer();
  }

  getProfileFromServer(): Observable<Usuario> {
    return this.http.get<any>(`${environment.apiUrl}/users/profile`).pipe(
      map(res => {
        // Transform incoming data to internal Usuario model
        const user: Usuario = {
           id: res.id,
           nombre: res.fullname || res.nombre,
           email: res.email,
           role: res.role,
           fotoUrl: res.avatarUrl || res.fotoUrl,
           title: res.title,
           level: res.level,
           darkMode: res.settings?.darkMode
        };
        this.setCurrentUser(user);
        return user;
      })
    );
  }

  // ---------------------------------------------------------
  // SESSION MANAGEMENT
  // ---------------------------------------------------------

  private setSession(token: string, user: any, rememberMe: boolean = true) {
    // Standardize user object
    const usuario: Usuario = {
      id: user.id,
      nombre: user.fullname,
      email: user.email,
      role: user.role,
      fotoUrl: user.avatarUrl,
      title: user.title,
      level: user.level,
      darkMode: user.settings?.darkMode
    };

    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(usuario));
    
    this.currentUserSubject.next(usuario);
    if (usuario.darkMode !== undefined) {
      this.themeService.setTheme(usuario.darkMode);
    }
  }

  private setCurrentUser(usuario: Usuario) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(usuario));
    this.currentUserSubject.next(usuario);
    if (usuario.darkMode !== undefined) {
      this.themeService.setTheme(usuario.darkMode);
    }
  }

  logout() {
    sessionStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
    this.themeService.setTheme(false); // Force light mode on logout
    this.router.navigate(['/welcome']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === 'admin' : false;
  }

  getCurrentUser(): Usuario | null {
    const userStr = sessionStorage.getItem(this.USER_KEY) || localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
}
