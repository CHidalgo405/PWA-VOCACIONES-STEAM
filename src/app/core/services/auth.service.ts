import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, map, tap, throwError, timer } from 'rxjs';
import { retry } from 'rxjs/operators';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ThemeService } from './theme.service';

export interface CalibrationModule {
  id: string;
  status: 'locked' | 'available' | 'completed';
}

export interface Usuario {
  id?: string;
  nombre: string;
  email: string;
  role: 'admin' | 'student';
  fotoUrl?: string;
  title?: string;
  darkMode?: boolean;
  calibrationModules?: CalibrationModule[];
  /** Preferencias persistidas (tema, idioma, notificaciones). */
  settings?: any;
  /** Versión de los documentos legales que el usuario aceptó. */
  acceptedTermsVersion?: string;
  // Datos de perfil editables por el usuario
  bio?: string;
  birthDate?: string;
  phone?: string;
  location?: string;
  github?: string;
  linkedin?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USER_KEY = 'steam_pwa_user';
  private readonly TOKEN_KEY = 'steam_pwa_token';
  private readonly REFRESH_TOKEN_KEY = 'steam_pwa_refresh_token';
  private readonly OAUTH_REMEMBER_KEY = 'steam_pwa_oauth_remember';

  private http = inject(HttpClient);
  private router = inject(Router);
  private themeService = inject(ThemeService);

  // currentUser subject to react to user changes
  private currentUserSubject = new BehaviorSubject<Usuario | null>(this.getCurrentUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  // State signal for modern Angular reactivity
  public currentUserSig = signal<Usuario | null>(this.getCurrentUser());

  constructor() {
    // Preferencia de tema del servidor: solo se aplica si el usuario aún no
    // eligió tema en este dispositivo (syncFromServer respeta el toggle local).
    const cachedUser = this.getCurrentUser();
    if (cachedUser && cachedUser.darkMode !== undefined) {
      this.themeService.syncFromServer(cachedUser.darkMode);
    }
  }

  // ---------------------------------------------------------
  // REST API ENDPOINTS
  // ---------------------------------------------------------

  register(email: string, fullname: string, password: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/register`, {
      email,
      fullname,
      password
    });
  }

  resendRegistrationOtp(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/resend-registration-otp`, { email });
  }

  verifyOtp(
    email: string,
    code: string,
    purpose: 'register' | 'recovery',
    rememberMe = false
  ): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/verify-otp`, { email, code, purpose }).pipe(
      tap((res: any) => {
        if (res.accessToken) this.setSession(res.accessToken, res.user, res.refreshToken, rememberMe);
      })
    );
  }

  login(email: string, password: string, rememberMe = false): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap((res: any) => {
        if (res.accessToken) this.setSession(res.accessToken, res.user, res.refreshToken, rememberMe);
      })
    );
  }

  verifyLogin(email: string, code: string, rememberMe = false): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/verify-login`, { email, code }).pipe(
      tap((res: any) => {
        if (res.accessToken) this.setSession(res.accessToken, res.user, res.refreshToken, rememberMe);
      })
    );
  }

  // Se solicita la recuperación (Reemplazado Firebase por llamada API HTTP Real)
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/forgot-password`, {
      email
    });
  }

  // Se restablece la contraseña usando el OTP
  resetPassword(email: string, code: string, newPassword: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/reset-password`, {
      email,
      code,
      newPassword
    });
  }

  loginWithGoogle(rememberMe = false) {
    // El redirect de OAuth conserva sessionStorage en la misma pestaña. Así
    // el callback conoce la elección sin exponerla en la URL.
    sessionStorage.setItem(this.OAUTH_REMEMBER_KEY, String(rememberMe));
    window.location.href = `${environment.apiUrl}/auth/google`;
  }

  /**
   * Persiste el par de tokens que llega en el callback de Google OAuth.
   * El perfil de usuario aún no se conoce en este punto: se obtiene justo
   * después con obtenerPerfil(), que ya se encarga de guardarlo.
   */
  persistOAuthTokens(
    accessToken: string,
    refreshToken?: string,
    rememberMe?: boolean
  ): void {
    const shouldRemember =
      rememberMe ?? sessionStorage.getItem(this.OAUTH_REMEMBER_KEY) === 'true';
    sessionStorage.removeItem(this.OAUTH_REMEMBER_KEY);
    const storage = this.prepareSessionStorage(shouldRemember);
    storage.setItem(this.TOKEN_KEY, accessToken);
    if (refreshToken) storage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  obtenerPerfil(): Observable<Usuario> {
    return this.getProfileFromServer();
  }

  getProfileFromServer(): Observable<Usuario> {
    return this.http.get<any>(`${environment.apiUrl}/users/profile`).pipe(
      map(res => {
        const user = this.mapServerUser(res);
        this.setCurrentUser(user);
        return user;
      })
    );
  }

  // ---------------------------------------------------------
  // SESSION MANAGEMENT
  // ---------------------------------------------------------

  private setSession(
    accessToken: string,
    user: any,
    refreshToken?: string,
    rememberMe = false
  ) {
    const usuario = this.mapServerUser(user);
    const storage = this.prepareSessionStorage(rememberMe);

    storage.setItem(this.TOKEN_KEY, accessToken);
    if (refreshToken) storage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    storage.setItem(this.USER_KEY, JSON.stringify(usuario));

    this.currentUserSubject.next(usuario);
    this.currentUserSig.set(usuario);
    if (usuario.darkMode !== undefined) this.themeService.syncFromServer(usuario.darkMode);
  }

  // ---------------------------------------------------------
  // TOKEN REFRESH
  // ---------------------------------------------------------

  getRefreshToken(): string | null {
    return this.getStoredItem(this.REFRESH_TOKEN_KEY);
  }

  getAccessToken(): string | null {
    return this.getStoredItem(this.TOKEN_KEY);
  }

  /**
   * Solicita un nuevo par de tokens usando el refreshToken almacenado.
   * El interceptor llama a este método cuando detecta un 401 o un access
   * token expirado. Conserva el mismo alcance elegido al iniciar sesión:
   * persistente (localStorage) o solo esta pestaña (sessionStorage).
   */
  refreshAccessToken(): Observable<{
    accessToken: string;
    refreshToken?: string;
  }> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return throwError(() => new Error('No hay refresh token disponible.'));

    return this.http
      .post<any>(
        `${environment.apiUrl}/auth/refresh`,
        {},
        {
          headers: new HttpHeaders({ Authorization: `Bearer ${refreshToken}` })
        }
      )
      .pipe(
        // Reintento ante fallos TRANSITORIOS (red caída o servidor reiniciándose):
        // hasta 2 reintentos con backoff. Un 401/403 (refresh token inválido) NO
        // se reintenta: se propaga de inmediato para que el interceptor decida.
        retry({
          count: 2,
          delay: (error: HttpErrorResponse, retryCount: number) => {
            const transient = error.status === 0 || error.status >= 500;
            if (!transient) return throwError(() => error);
            return timer(retryCount * 800);
          }
        }),
        tap((res: any) => {
          const storage = this.getActiveSessionStorage();
          if (res.accessToken) storage.setItem(this.TOKEN_KEY, res.accessToken);
          if (res.refreshToken) storage.setItem(this.REFRESH_TOKEN_KEY, res.refreshToken);
          if (res.user) this.setCurrentUser(this.mapServerUser(res.user));
        }),
        map((res: any) => ({
          accessToken: res.accessToken,
          refreshToken: res.refreshToken
        }))
      );
  }

  /** Convierte la respuesta del servidor al modelo interno Usuario. */
  private mapServerUser(user: any): Usuario {
    return {
      id: user.id,
      nombre: user.fullname || user.nombre,
      email: user.email,
      role: user.role,
      fotoUrl: user.avatarUrl || user.fotoUrl,
      title: user.title,
      darkMode: user.settings?.darkMode,
      settings: user.settings,
      acceptedTermsVersion: user.acceptedTermsVersion,
      calibrationModules: this.resolveCalibrationModules(user.calibrationModules),
      bio: user.bio,
      birthDate: user.birthDate,
      phone: user.phone,
      location: user.location,
      github: user.github,
      linkedin: user.linkedin
    };
  }

  /**
   * El backend aún no persiste calibrationModules: si el servidor no los
   * envía, preservamos el estado local (módulos completados) en lugar de
   * resetear todo a 'available' en cada fetch del perfil.
   */
  private resolveCalibrationModules(serverModules?: CalibrationModule[]): CalibrationModule[] {
    if (serverModules?.length) return serverModules;
    const current = this.getCurrentUser()?.calibrationModules;
    if (current?.length) return current;
    return [
      { id: 'gaming_habits', status: 'available' },
      { id: 'physical_hobbies', status: 'available' },
      { id: 'digital_consumption', status: 'available' },
      { id: 'everyday_mechanics', status: 'available' }
    ];
  }

  /** Marca localmente la versión de términos aceptada y propaga el cambio. */
  setAcceptedTermsVersion(version: string) {
    const user = this.getCurrentUser();
    if (!user) return;
    user.acceptedTermsVersion = version;
    this.setCurrentUser(user);
  }

  private setCurrentUser(usuario: Usuario) {
    const storage = this.getActiveSessionStorage();
    const otherStorage = storage === localStorage ? sessionStorage : localStorage;
    storage.setItem(this.USER_KEY, JSON.stringify(usuario));
    otherStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(usuario);
    this.currentUserSig.set(usuario); // Update signal
    if (usuario.darkMode !== undefined) {
      this.themeService.syncFromServer(usuario.darkMode);
    }
  }

  // ---------------------------------------------------------
  // CALIBRATION MODULE STATE
  // ---------------------------------------------------------
  /** Marca un módulo de calibración como completado en el estado local. */
  completeCalibrationModule(moduleId: string) {
    const user = this.getCurrentUser();
    if (!user) return;

    if (user.calibrationModules) {
      const module = user.calibrationModules.find(m => m.id === moduleId);
      if (module) module.status = 'completed';
    }

    this.setCurrentUser(user);
  }

  logout() {
    this.clearSession();
    // Limpia la preferencia local (no la fuerza a 'light') para que el
    // siguiente usuario herede su propio tema del servidor.
    this.themeService.resetToLight();
    this.router.navigate(['/welcome']);
  }

  /**
   * Limpia el estado de sesión (storage + subjects + signal) SIN navegar.
   * Se usa tanto en logout() como cuando se detecta un token expirado en los
   * guards, donde la redirección la maneja el propio guard (UrlTree).
   */
  clearSession() {
    const outgoingUserId = this.getCurrentUser()?.id;

    sessionStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.OAUTH_REMEMBER_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    if (outgoingUserId) this.clearUserData(outgoingUserId);

    this.currentUserSubject.next(null);
    this.currentUserSig.set(null);
  }

  /**
   * Borra del localStorage todo rastro de datos del usuario que cierra
   * sesión (respuestas de tests, resultados, calibraciones, caché de
   * Explorar, etc.). Todas esas claves siguen la convención `<prefijo>_<userId>`,
   * así que un barrido por sufijo las cubre a todas sin mantener una lista
   * manual. Evita que en un equipo compartido (p. ej. de un aula) el
   * siguiente estudiante pueda leer los datos del anterior desde DevTools.
   */
  private clearUserData(userId: string): void {
    const suffix = `_${userId}`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.endsWith(suffix)) keysToRemove.push(key);
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  isAuthenticated(): boolean {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    // Sin ningún token → no autenticado
    if (!accessToken && !refreshToken) return false;

    // Access token válido → autenticado
    if (accessToken && !this.isTokenExpired(accessToken)) return true;

    // Access token expirado pero refresh token vivo → el interceptor renovará
    // silenciosamente en la primera petición; dejamos pasar al usuario.
    if (refreshToken && !this.isTokenExpired(refreshToken)) return true;

    // Ambos expirados → limpiamos y rechazamos
    this.clearSession();
    return false;
  }

  /**
   * Indica si el token JWT está expirado según su claim `exp`.
   * Fail-closed: si el token no es un JWT decodificable o no trae `exp`,
   * se trata como expirado. Un JWT real emitido por el API siempre trae
   * `exp` (jsonwebtoken lo agrega automáticamente con `expiresIn`); solo
   * un valor corrupto o manipulado cae en este caso, y no debe tratarse
   * como sesión válida.
   */
  isTokenExpired(token?: string | null): boolean {
    const t = token ?? this.getAccessToken();
    if (!t) return true;

    const payload = this.decodeToken(t);
    if (!payload || typeof payload.exp !== 'number') return true;

    // `exp` viene en segundos. Aplicamos 10s de margen para no enviar una
    // petición que va a fallar justo en el límite.
    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp <= nowSec + 10;
  }

  private decodeToken(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === 'admin' : false;
  }

  getCurrentUser(): Usuario | null {
    const userStr = this.getStoredItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  private getStoredItem(key: string): string | null {
    return sessionStorage.getItem(key) ?? localStorage.getItem(key);
  }

  private getActiveSessionStorage(): Storage {
    const hasSessionScopedData =
      sessionStorage.getItem(this.TOKEN_KEY) !== null ||
      sessionStorage.getItem(this.REFRESH_TOKEN_KEY) !== null ||
      sessionStorage.getItem(this.USER_KEY) !== null;
    return hasSessionScopedData ? sessionStorage : localStorage;
  }

  private prepareSessionStorage(rememberMe: boolean): Storage {
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem(this.USER_KEY);
      storage.removeItem(this.TOKEN_KEY);
      storage.removeItem(this.REFRESH_TOKEN_KEY);
    }
    return rememberMe ? localStorage : sessionStorage;
  }
}
