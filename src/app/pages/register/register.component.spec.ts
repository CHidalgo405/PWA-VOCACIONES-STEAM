import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['register', 'verifyOtp', 'resendRegistrationOtp', 'loginWithGoogle']);
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        {
          provide: UserService,
          useValue: {
            acceptTerms: jasmine.createSpy().and.returnValue(of({}))
          }
        },
        {
          provide: ToastService,
          useValue: { showToast: jasmine.createSpy() }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('resends a registration OTP and starts the cooldown', fakeAsync(() => {
    authService.resendRegistrationOtp.and.returnValue(of({ retryAfterSeconds: 2 }));
    component.email = 'student@example.com';

    component.resendVerificationCode();

    expect(authService.resendRegistrationOtp).toHaveBeenCalledWith('student@example.com');
    expect(component.resendCooldown).toBe(2);
    tick(1000);
    expect(component.resendCooldown).toBe(1);
    tick(1000);
    expect(component.resendCooldown).toBe(0);
  }));

  it('passes the remember me choice when the registration OTP is verified', () => {
    authService.verifyOtp.and.returnValue(of({ accessToken: 'token' }));
    component.email = 'student@example.com';
    component.verificationCode = '123456';
    component.rememberMe = true;

    component.onVerifyOTP();

    expect(authService.verifyOtp).toHaveBeenCalledWith(
      'student@example.com',
      '123456',
      'register',
      true
    );
  });
});
