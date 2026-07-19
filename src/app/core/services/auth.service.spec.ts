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
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

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
});
