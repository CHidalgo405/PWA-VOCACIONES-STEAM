import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('requests a registration OTP resend without accepting an OTP in the response', () => {
    let response: any;
    service.resendRegistrationOtp('student@example.com').subscribe(value => (response = value));

    const request = httpMock.expectOne(`${environment.apiUrl}/auth/resend-registration-otp`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'student@example.com' });
    request.flush({ message: 'Código enviado.', retryAfterSeconds: 60 });

    expect(response.otpCode).toBeUndefined();
  });

  it('keeps tokens only in sessionStorage when remember me is disabled', () => {
    service.login('student@example.com', 'Password123!', false).subscribe();

    const request = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    request.flush({
      accessToken: 'access-session',
      refreshToken: 'refresh-session',
      user: {
        id: 'user-1',
        fullname: 'Student',
        email: 'student@example.com',
        role: 'student'
      }
    });

    expect(sessionStorage.getItem('steam_pwa_token')).toBe('access-session');
    expect(sessionStorage.getItem('steam_pwa_refresh_token')).toBe('refresh-session');
    expect(sessionStorage.getItem('steam_pwa_user')).toContain('student@example.com');
    expect(localStorage.getItem('steam_pwa_token')).toBeNull();
  });

  it('persists tokens in localStorage when remember me is enabled', () => {
    service.login('student@example.com', 'Password123!', true).subscribe();

    const request = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    request.flush({
      accessToken: 'access-persistent',
      refreshToken: 'refresh-persistent',
      user: {
        id: 'user-1',
        fullname: 'Student',
        email: 'student@example.com',
        role: 'student'
      }
    });

    expect(localStorage.getItem('steam_pwa_token')).toBe('access-persistent');
    expect(localStorage.getItem('steam_pwa_refresh_token')).toBe('refresh-persistent');
    expect(localStorage.getItem('steam_pwa_user')).toContain('student@example.com');
    expect(sessionStorage.getItem('steam_pwa_token')).toBeNull();
  });

  it('keeps refreshed tokens in the original session scope', () => {
    service.login('student@example.com', 'Password123!', false).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({
      accessToken: 'old-access',
      refreshToken: 'old-refresh',
      user: {
        id: 'user-1',
        fullname: 'Student',
        email: 'student@example.com',
        role: 'student'
      }
    });

    service.refreshAccessToken().subscribe();
    const refreshRequest = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(refreshRequest.request.headers.get('Authorization')).toBe(
      'Bearer old-refresh'
    );
    refreshRequest.flush({
      accessToken: 'new-access',
      refreshToken: 'new-refresh'
    });

    expect(sessionStorage.getItem('steam_pwa_token')).toBe('new-access');
    expect(sessionStorage.getItem('steam_pwa_refresh_token')).toBe('new-refresh');
    expect(localStorage.getItem('steam_pwa_token')).toBeNull();
  });
});
