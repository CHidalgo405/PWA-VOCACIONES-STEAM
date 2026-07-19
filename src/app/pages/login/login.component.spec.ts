import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'login',
      'verifyLogin',
      'isAdmin',
      'loginWithGoogle'
    ]);
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        {
          provide: ToastService,
          useValue: { showToast: jasmine.createSpy() }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('passes the remember me choice through the password step', () => {
    authService.login.and.returnValue(of({ message: 'OTP sent' }));
    component.email = 'student@example.com';
    component.password = 'Password123!';
    component.rememberMe = true;

    component.login();

    expect(authService.login).toHaveBeenCalledWith(
      'student@example.com',
      'Password123!',
      true
    );
    expect(component.isVerificationStep).toBeTrue();
  });
});
